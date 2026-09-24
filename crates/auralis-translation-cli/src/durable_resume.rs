use crate::durable_workflow::{
    DATABASE_FILE, ExecutionConfig, SOURCE_DIRECTORY, execute, export_validated, load_profile,
};
use crate::read_source::read_source;
use crate::source_snapshot::source_snapshot;
use auralis_translation::{RunId, RunState, SourceHash};
use auralis_translation_formats::srt::{SrtBlockPolicy, SrtRunPlan};
use auralis_translation_sqlite::{SqliteConfig, TranslateDb};
use std::error::Error;
use std::ffi::OsStr;
use std::io::Write;
use std::path::Path;

pub(crate) fn run(
    state_dir: &OsStr,
    run_id: &OsStr,
    profile_path: &OsStr,
    endpoint: &OsStr,
    output_path: &OsStr,
) -> Result<(), Box<dyn Error>> {
    let state_dir = std::fs::canonicalize(Path::new(state_dir))?;
    let db_path = state_dir.join(DATABASE_FILE);
    if !db_path.is_file() {
        return Err("Translate database does not exist in state directory".into());
    }
    let run_id = RunId::parse(run_id.to_str().ok_or("run ID must be Unicode")?)?;
    let mut db = TranslateDb::open(&db_path, SqliteConfig::default())?;
    let stored_run = db.run(run_id)?;
    let translation = db.translation(stored_run.translation_id)?;
    if translation.source_format != "srt" || translation.source_artifact_id.is_some() {
        return Err("run is not a standalone SRT translation".into());
    }
    let locator = translation
        .source_locator
        .as_deref()
        .ok_or("standalone run has no managed source")?;
    let managed_root = std::fs::canonicalize(state_dir.join(SOURCE_DIRECTORY))?;
    let source_path = std::fs::canonicalize(locator)?;
    if !source_path.starts_with(&managed_root) {
        return Err("managed source lies outside the state directory".into());
    }
    let source = read_source(&source_path)?;
    if SourceHash::digest(&source) != translation.source_hash
        || stored_run.source_hash != translation.source_hash
    {
        return Err("managed source hash differs from frozen run".into());
    }
    let (profile, profile_hash) = load_profile(Path::new(profile_path))?;
    if stored_run.profile_fingerprint != profile_hash.to_string() {
        return Err("model profile differs from frozen run".into());
    }
    let block_policy = SrtBlockPolicy::default();
    let plan = SrtRunPlan::new(
        &source,
        translation.translation_id,
        run_id,
        translation.language_pair,
        block_policy,
    )?;
    if plan.blocks() != stored_run.blocks
        || stored_run.parser_version != SrtRunPlan::PARSER_VERSION
        || stored_run.policy_fingerprint != SrtRunPlan::policy_fingerprint(block_policy).to_string()
    {
        return Err("source parser or block policy differs from frozen run".into());
    }
    db.ensure_segments(
        translation.translation_id,
        u64::try_from(plan.source_len())?,
        &source_snapshot(&plan)?,
    )?;
    let output_path = Path::new(output_path);
    println!(
        "translation_id={} run_id={run_id}",
        translation.translation_id
    );
    std::io::stdout().flush()?;
    if db.run_state(run_id)? == RunState::Validated {
        return export_validated(&db, &stored_run, &plan, output_path);
    }
    db.recover_interrupted(run_id)?;
    execute(
        &mut db,
        &stored_run,
        &plan,
        profile,
        ExecutionConfig {
            endpoint,
            output_path,
            state_dir: &state_dir,
            initial_attempt: false,
        },
    )
}
