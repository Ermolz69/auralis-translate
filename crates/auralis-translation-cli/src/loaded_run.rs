use crate::durable_workflow::{DATABASE_FILE, SOURCE_DIRECTORY, block_policy, load_profile};
use crate::managed_glossary;
use crate::read_source::read_source;
use crate::source_snapshot::source_snapshot;
use auralis_translation::{RunId, SourceHash};
use auralis_translation_formats::srt::SrtRunPlan;
use auralis_translation_llamacpp::ModelProfile;
use auralis_translation_sqlite::{RunSpec, SqliteConfig, TranslateDb};
use std::error::Error;
use std::ffi::OsStr;
use std::path::{Path, PathBuf};

pub(crate) struct LoadedRun {
    pub db: TranslateDb,
    pub run: RunSpec,
    pub plan: SrtRunPlan,
    pub profile: ModelProfile,
    pub state_dir: PathBuf,
}

pub(crate) fn load(
    state_dir: &OsStr,
    run_id: RunId,
    profile_path: &OsStr,
) -> Result<LoadedRun, Box<dyn Error>> {
    let state_dir = std::fs::canonicalize(Path::new(state_dir))?;
    let db_path = state_dir.join(DATABASE_FILE);
    if !db_path.is_file() {
        return Err("Translate database does not exist in state directory".into());
    }
    let mut db = TranslateDb::open(&db_path, SqliteConfig::default())?;
    let run = db.run(run_id)?;
    let translation = db.translation(run.translation_id)?;
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
        || run.source_hash != translation.source_hash
    {
        return Err("managed source hash differs from frozen run".into());
    }
    let (profile, profile_hash) = load_profile(Path::new(profile_path))?;
    if run.profile_fingerprint != profile_hash.to_string() {
        return Err("model profile differs from frozen run".into());
    }
    let policy = block_policy(&profile)?;
    let glossary = managed_glossary::load(&state_dir, run.glossary_revision.as_deref())?;
    if glossary.is_some() && profile.prompt_version != 3 {
        return Err("frozen glossary requires a glossary-capable profile".into());
    }
    let plan = SrtRunPlan::with_glossary(
        &source,
        translation.translation_id,
        run_id,
        translation.language_pair,
        policy,
        glossary.as_ref(),
    )?;
    if plan.blocks() != run.blocks
        || run.parser_version != SrtRunPlan::PARSER_VERSION
        || run.policy_fingerprint != SrtRunPlan::policy_fingerprint(policy).to_string()
    {
        return Err("source parser or block policy differs from frozen run".into());
    }
    db.ensure_segments(
        translation.translation_id,
        u64::try_from(plan.source_len())?,
        &source_snapshot(&plan)?,
    )?;
    Ok(LoadedRun {
        db,
        run,
        plan,
        profile,
        state_dir,
    })
}
