use super::{CachedAsset, ErrorCode, InstalledPackage};
use serde::Serialize;
use serde_json::Value;

#[derive(Serialize)]
#[serde(tag = "event", rename_all = "snake_case")]
pub(crate) enum CliEvent {
    PackageStarted {
        release_id: String,
        backend: String,
        manifest_sha256: String,
        profile_sha256: String,
    },
    AssetCached {
        #[serde(flatten)]
        receipt: CachedAsset,
    },
    PackageInstalled {
        #[serde(flatten)]
        receipt: InstalledPackage,
    },
    RunStarted {
        translation_id: String,
        run_id: String,
        source_sha256: String,
        format: String,
    },
    ModelReady {
        alias: String,
        build: String,
        context_tokens: u64,
    },
    Progress {
        run_id: String,
        saved_blocks: usize,
        total_blocks: usize,
    },
    Result {
        translation_id: String,
        run_id: String,
        result_id: String,
        revision: u32,
        output_sha256: String,
        output_bytes: usize,
        review_state: &'static str,
        output_path: String,
    },
    Report {
        command: String,
        report: Value,
    },
    PauseRequested {
        run_id: String,
        pause_requested: bool,
    },
    Completed {
        exit_code: u8,
    },
    Failed {
        code: ErrorCode,
        message: String,
        translation_id: Option<String>,
        run_id: Option<String>,
    },
}
