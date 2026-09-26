use crate::reporting::{CliEvent, CommandOutput};
use auralis_translation::ReviewState;
use auralis_translation_sqlite::{ResultRecord, RunSpec};
use std::{error::Error, path::Path};

pub(crate) fn report_result(
    reporter: &mut CommandOutput,
    run: &RunSpec,
    result: &ResultRecord,
    bytes: &[u8],
    path: &Path,
) -> Result<(), Box<dyn Error>> {
    let review = match result.review_state {
        ReviewState::Ready => "ready",
        ReviewState::NeedsReview => "needs_review",
    };
    if reporter.is_machine() {
        reporter.emit(CliEvent::Result {
            translation_id: run.translation_id.to_string(),
            run_id: run.run_id.to_string(),
            result_id: result.result_id.to_string(),
            revision: result.revision,
            output_sha256: result.output_hash.to_string(),
            output_bytes: bytes.len(),
            review_state: review,
            output_path: path.to_string_lossy().into_owned(),
        })?;
    } else {
        println!("result_id={} review={review}", result.result_id);
    }
    Ok(())
}
