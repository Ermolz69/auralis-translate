use crate::durable_workflow::{DATABASE_FILE, SOURCE_DIRECTORY, execute, load_profile};
use crate::read_source::read_source;
use crate::source_snapshot::source_snapshot;
use crate::write_new::write_new;
use auralis_translation::{LanguageCode, LanguagePair, RunId, TranslationId};
use auralis_translation_formats::srt::{SrtBlockPolicy, SrtRunPlan};
use auralis_translation_sqlite::{RunSpec, SqliteConfig, TranslateDb, TranslationSpec};
use std::error::Error;
use std::ffi::OsStr;
use std::path::Path;
use uuid::Uuid;

const SOURCE_FORMAT: &str = "srt";

pub(crate) fn run(
    source_path: &OsStr,
    state_dir: &OsStr,
    profile_path: &OsStr,
    endpoint: &OsStr,
    output_path: &OsStr,
) -> Result<(), Box<dyn Error>> {
    let output_path = Path::new(output_path);
    if output_path.exists() {
        return Err("output already exists".into());
    }
    let source = read_source(Path::new(source_path))?;
    let (profile, profile_hash) = load_profile(Path::new(profile_path))?;
    let translation_id =
        TranslationId::new(Uuid::new_v4()).ok_or("failed to create translation ID")?;
    let run_id = RunId::new(Uuid::new_v4()).ok_or("failed to create run ID")?;
    let pair = LanguagePair::new(LanguageCode::Chinese, LanguageCode::Russian)?;
    let block_policy = SrtBlockPolicy::default();
    let plan = SrtRunPlan::new(&source, translation_id, run_id, pair, block_policy)?;

    let state_dir = Path::new(state_dir);
    std::fs::create_dir_all(state_dir)?;
    let state_dir = std::fs::canonicalize(state_dir)?;
    let source_dir = state_dir.join(SOURCE_DIRECTORY);
    std::fs::create_dir_all(&source_dir)?;
    let managed_source = source_dir.join(format!("{translation_id}.srt"));
    write_new(&managed_source, &source)?;
    let source_locator = managed_source
        .to_str()
        .ok_or("managed source path must be Unicode")?
        .to_owned();
    let mut db = TranslateDb::open(&state_dir.join(DATABASE_FILE), SqliteConfig::default())?;
    db.ensure_translation(&TranslationSpec {
        translation_id,
        project_id: None,
        source_artifact_id: None,
        source_locator: Some(source_locator),
        source_hash: plan.source_hash(),
        source_format: SOURCE_FORMAT.into(),
        language_pair: pair,
    })?;
    db.ensure_segments(
        translation_id,
        u64::try_from(plan.source_len())?,
        &source_snapshot(&plan)?,
    )?;
    let run = RunSpec {
        run_id,
        translation_id,
        source_hash: plan.source_hash(),
        profile_fingerprint: profile_hash.to_string(),
        parser_version: SrtRunPlan::PARSER_VERSION,
        policy_fingerprint: SrtRunPlan::policy_fingerprint(block_policy).to_string(),
        glossary_revision: None,
        blocks: plan.blocks().to_vec(),
    };
    db.ensure_run(&run)?;
    println!("translation_id={translation_id} run_id={run_id}");
    execute(&mut db, &run, &plan, profile, endpoint, output_path)
}
