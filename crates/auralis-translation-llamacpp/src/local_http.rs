use crate::PreparationControl;
use crate::RequestControlPolicy;
use auralis_translation::ProviderError;
use reqwest::{Client, RequestBuilder};
use std::time::Duration;
use tokio::runtime::Runtime;

pub(crate) struct LocalHttp {
    client: Client,
    runtime: Runtime,
    control_policy: RequestControlPolicy,
    response_limit: usize,
}

impl LocalHttp {
    pub(crate) fn new(
        timeout: Duration,
        response_limit: usize,
        control_policy: RequestControlPolicy,
    ) -> Result<Self, ProviderError> {
        let runtime = tokio::runtime::Builder::new_current_thread()
            .enable_all()
            .build()
            .map_err(error)?;
        let client = Client::builder()
            .no_proxy()
            // The current-thread runtime is idle during hashing and checkpoint writes.
            .pool_max_idle_per_host(0)
            .timeout(timeout)
            .build()
            .map_err(error)?;
        Ok(Self {
            client,
            runtime,
            control_policy,
            response_limit,
        })
    }

    pub(crate) fn client(&self) -> &Client {
        &self.client
    }

    pub(crate) fn request(
        &self,
        request: RequestBuilder,
        control: Option<&dyn PreparationControl>,
    ) -> Result<Vec<u8>, ProviderError> {
        self.runtime.block_on(async {
            let result = {
                let response = self.read_response(request);
                tokio::pin!(response);
                let mut poll = tokio::time::interval(self.control_policy.poll_interval());
                poll.set_missed_tick_behavior(tokio::time::MissedTickBehavior::Skip);
                loop {
                    tokio::select! {
                        biased;
                        _ = poll.tick(), if control.is_some() => {
                            if let Some(control) = control && let Err(cause) = control.check() {
                                break Err(cause);
                            }
                        }
                        result = &mut response => break result,
                    }
                }
            };
            // Drive the connection after dropping a cancelled response future.
            tokio::task::yield_now().await;
            result
        })
    }

    async fn read_response(&self, request: RequestBuilder) -> Result<Vec<u8>, ProviderError> {
        let mut response = request.send().await.map_err(transport_error)?;
        if !response.status().is_success() {
            let message = format!("llama.cpp returned HTTP {}", response.status());
            return Err(if matches!(response.status().as_u16(), 502..=504) {
                ProviderError::Transient(message)
            } else {
                ProviderError::Permanent(message)
            });
        }
        let mut bytes = Vec::new();
        while let Some(chunk) = response.chunk().await.map_err(transport_error)? {
            if chunk.len() > self.response_limit.saturating_sub(bytes.len()) {
                return Err(ProviderError::Permanent(
                    "llama.cpp response exceeds profile limit".into(),
                ));
            }
            bytes.extend_from_slice(&chunk);
        }
        Ok(bytes)
    }
}

fn error(cause: impl std::fmt::Display) -> ProviderError {
    ProviderError::Permanent(cause.to_string())
}

fn transport_error(cause: reqwest::Error) -> ProviderError {
    use std::error::Error;
    let mut message = cause.to_string();
    let mut source = cause.source();
    while let Some(cause) = source {
        message.push_str(": ");
        message.push_str(&cause.to_string());
        source = cause.source();
    }
    if cause.is_connect() || cause.is_timeout() || cause.is_body() || cause.is_request() {
        ProviderError::Transient(message)
    } else {
        ProviderError::Permanent(message)
    }
}
