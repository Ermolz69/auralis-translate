use crate::RequestControlPolicy;
use auralis_translation::{ProviderError, RunControl, RunId};
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
        control: Option<(&dyn RunControl, RunId)>,
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
                            if let Some((control, run_id)) = control {
                                match control.pause_requested(run_id) {
                                    Ok(false) => {},
                                    Ok(true) => break Err(ProviderError("request paused".into())),
                                    Err(cause) => break Err(error(cause)),
                                }
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
        let mut response = request.send().await.map_err(error)?;
        if !response.status().is_success() {
            return Err(ProviderError(format!(
                "llama.cpp returned HTTP {}",
                response.status()
            )));
        }
        let mut bytes = Vec::new();
        while let Some(chunk) = response.chunk().await.map_err(error)? {
            if chunk.len() > self.response_limit.saturating_sub(bytes.len()) {
                return Err(ProviderError(
                    "llama.cpp response exceeds profile limit".into(),
                ));
            }
            bytes.extend_from_slice(&chunk);
        }
        Ok(bytes)
    }
}

fn error(cause: impl std::fmt::Display) -> ProviderError {
    ProviderError(cause.to_string())
}
