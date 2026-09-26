use super::CliEvent;
use super::event_envelope::PROTOCOL_VERSION;
use serde::Serialize;

#[derive(Serialize)]
pub(super) struct CliSummary {
    pub schema_version: u32,
    pub command: String,
    pub run: Option<CliEvent>,
    pub model: Option<CliEvent>,
    pub progress: Option<CliEvent>,
    pub result: Option<CliEvent>,
    pub report: Option<CliEvent>,
    pub terminal: Option<CliEvent>,
}

impl CliSummary {
    pub fn new(command: String) -> Self {
        Self {
            schema_version: PROTOCOL_VERSION,
            command,
            run: None,
            model: None,
            progress: None,
            result: None,
            report: None,
            terminal: None,
        }
    }

    pub fn retain(&mut self, event: CliEvent) {
        match event {
            CliEvent::RunStarted { .. } => self.run = Some(event),
            CliEvent::ModelReady { .. } => self.model = Some(event),
            CliEvent::Progress { .. } => self.progress = Some(event),
            CliEvent::Result { .. } => self.result = Some(event),
            CliEvent::Report { .. } | CliEvent::PauseRequested { .. } => self.report = Some(event),
            CliEvent::Completed { .. } | CliEvent::Failed { .. } => self.terminal = Some(event),
        }
    }
}
