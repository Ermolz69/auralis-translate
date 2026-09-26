use super::event_envelope::{EventEnvelope, PROTOCOL_VERSION};
use super::summary::CliSummary;
use super::{CliEvent, ErrorCode, OutputFormat};
use auralis_translation::{ProgressSink, RunProgress};
use std::io::{self, Write};

pub(crate) struct CommandOutput {
    pub format: OutputFormat,
    summary: CliSummary,
    sequence: u64,
    progress_error: Option<io::Error>,
    review_required: bool,
    translation_id: Option<String>,
    run_id: Option<String>,
}

impl CommandOutput {
    pub fn new(format: OutputFormat, command: String) -> Self {
        Self {
            format,
            summary: CliSummary::new(command),
            sequence: 0,
            progress_error: None,
            review_required: false,
            translation_id: None,
            run_id: None,
        }
    }

    pub fn is_machine(&self) -> bool {
        self.format != OutputFormat::Legacy
    }
    pub fn set_command(&mut self, command: &str) {
        self.summary.command = command.into();
    }

    pub fn emit(&mut self, event: CliEvent) -> io::Result<()> {
        if let Some(error) = self.progress_error.take() {
            return Err(error);
        }
        if let CliEvent::RunStarted {
            translation_id,
            run_id,
            ..
        } = &event
        {
            self.translation_id = Some(translation_id.clone());
            self.run_id = Some(run_id.clone());
        }
        if let CliEvent::Result { review_state, .. } = &event {
            self.review_required = *review_state == "needs_review";
        }
        if self.format == OutputFormat::Jsonl {
            self.sequence += 1;
            let envelope = EventEnvelope {
                schema_version: PROTOCOL_VERSION,
                sequence: self.sequence,
                event: &event,
            };
            let mut stdout = io::stdout().lock();
            serde_json::to_writer(&mut stdout, &envelope)?;
            writeln!(stdout)?;
            stdout.flush()?;
        }
        self.summary.retain(event);
        Ok(())
    }

    pub fn report<T: serde::Serialize>(
        &mut self,
        command: &str,
        report: &T,
    ) -> Result<(), Box<dyn std::error::Error>> {
        if self.is_machine() {
            self.emit(CliEvent::Report {
                command: command.into(),
                report: serde_json::to_value(report)?,
            })?;
        } else {
            println!("{}", serde_json::to_string_pretty(report)?);
        }
        Ok(())
    }

    pub fn finish(&mut self, failure: Option<(ErrorCode, String)>) -> io::Result<u8> {
        let exit = failure
            .as_ref()
            .map_or(if self.review_required { 3 } else { 0 }, |(code, _)| {
                code.exit_code()
            });
        let event = match failure {
            Some((code, message)) => CliEvent::Failed {
                code,
                message,
                translation_id: self.translation_id.clone(),
                run_id: self.run_id.clone(),
            },
            None => CliEvent::Completed { exit_code: exit },
        };
        self.emit(event)?;
        if self.format == OutputFormat::Json {
            let mut stdout = io::stdout().lock();
            serde_json::to_writer(&mut stdout, &self.summary)?;
            writeln!(stdout)?;
            stdout.flush()?;
        }
        Ok(exit)
    }
}

impl ProgressSink for CommandOutput {
    fn report(&mut self, progress: RunProgress) {
        if self.is_machine() {
            if self.progress_error.is_none() {
                self.progress_error = self
                    .emit(CliEvent::Progress {
                        run_id: progress.run_id.to_string(),
                        saved_blocks: progress.committed_blocks,
                        total_blocks: progress.total_blocks,
                    })
                    .err();
            }
        } else {
            eprintln!(
                "run_id={} saved_blocks={}/{}",
                progress.run_id, progress.committed_blocks, progress.total_blocks
            );
        }
    }
}
