use crate::document_run_plan::DocumentRunPlan;
use crate::durable_workflow::{DATABASE_FILE, SOURCE_DIRECTORY, block_policy, load_profile};
use crate::read_source::{read_source, read_vtt_source};
use crate::source_snapshot::source_snapshot;
use crate::{managed_glossary, scene_map_input, terms_input};
use auralis_translation::{RunId, SourceHash};
use auralis_translation_llamacpp::ModelProfile;
use auralis_translation_sqlite::{RunSpec, SqliteConfig, TranslateDb};
use std::error::Error;
use std::ffi::OsStr;
use std::path::{Path, PathBuf};

pub(crate) struct LoadedRun {
    pub db: TranslateDb,
    pub run: RunSpec,
    pub plan: DocumentRunPlan,
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
        return Err(std::io::Error::new(
            std::io::ErrorKind::NotFound,
            "Translate database does not exist in state directory",
        )
        .into());
    }
    let mut db = TranslateDb::open(&db_path, SqliteConfig::default())?;
    let run = db.run(run_id)?;
    let translation = db.translation(run.translation_id)?;
    if !matches!(
        translation.source_format.as_str(),
        DocumentRunPlan::SRT_FORMAT | DocumentRunPlan::VTT_FORMAT
    ) || translation.source_artifact_id.is_some()
    {
        return Err(crate::reporting::CliFailure::boxed(
            crate::reporting::ErrorCode::InvalidInput,
            "run is not a supported standalone translation",
        ));
    }
    let locator = translation
        .source_locator
        .as_deref()
        .ok_or("standalone run has no managed source")?;
    let managed_root = std::fs::canonicalize(state_dir.join(SOURCE_DIRECTORY))?;
    let source_path = std::fs::canonicalize(locator)?;
    if !source_path.starts_with(&managed_root) {
        return Err(crate::reporting::CliFailure::boxed(
            crate::reporting::ErrorCode::Conflict,
            "managed source lies outside the state directory",
        ));
    }
    let source = match translation.source_format.as_str() {
        DocumentRunPlan::SRT_FORMAT => read_source(&source_path)?,
        DocumentRunPlan::VTT_FORMAT => read_vtt_source(&source_path)?,
        _ => {
            return Err(crate::reporting::CliFailure::boxed(
                crate::reporting::ErrorCode::InvalidInput,
                "unsupported standalone source format",
            ));
        }
    };
    if SourceHash::digest(&source) != translation.source_hash
        || run.source_hash != translation.source_hash
    {
        return Err(crate::reporting::CliFailure::boxed(
            crate::reporting::ErrorCode::Conflict,
            "managed source hash differs from frozen run",
        ));
    }
    let (profile, profile_hash) = load_profile(Path::new(profile_path))?;
    if run.profile_fingerprint != profile_hash.to_string() {
        return Err(crate::reporting::CliFailure::boxed(
            crate::reporting::ErrorCode::Conflict,
            "model profile differs from frozen run",
        ));
    }
    let scene = scene_map_input::load(&state_dir, run_id, &source)?;
    let policy = block_policy(&profile, scene.is_some())?;
    let terms = if matches!(profile.prompt_version, 5..=8) {
        terms_input::load(
            &state_dir,
            run_id,
            run.glossary_revision.as_deref(),
            &source,
            scene.as_ref().map(|map| map.snapshot_hash),
        )?
    } else {
        None
    };
    let glossary = if profile.prompt_version == 3 {
        managed_glossary::load(&state_dir, run.glossary_revision.as_deref())?
    } else {
        None
    };
    if glossary.is_some() && profile.prompt_version != 3 {
        return Err(crate::reporting::CliFailure::boxed(
            crate::reporting::ErrorCode::InvalidInput,
            "frozen glossary requires a glossary-capable profile",
        ));
    }
    let plan = if let Some(scene) = &scene {
        if !matches!(profile.prompt_version, 5..=8) {
            return Err(crate::reporting::CliFailure::boxed(
                crate::reporting::ErrorCode::Conflict,
                "frozen scene map requires a contextual profile",
            ));
        }
        if let Some(terms) = &terms {
            DocumentRunPlan::with_scene_map_and_terms(
                &translation.source_format,
                &source,
                translation.translation_id,
                run_id,
                translation.language_pair,
                policy,
                &scene.end_ids,
                scene.snapshot_hash,
                &terms.terms,
            )?
        } else {
            DocumentRunPlan::with_scene_map(
                &translation.source_format,
                &source,
                translation.translation_id,
                run_id,
                translation.language_pair,
                policy,
                &scene.end_ids,
                scene.snapshot_hash,
            )?
        }
    } else {
        DocumentRunPlan::new(
            &translation.source_format,
            &source,
            translation.translation_id,
            run_id,
            translation.language_pair,
            policy,
            glossary.as_ref(),
        )?
    };
    if plan.blocks() != run.blocks
        || run.parser_version != plan.parser_version()
        || run.policy_fingerprint != plan.policy_fingerprint(policy).to_string()
    {
        return Err(crate::reporting::CliFailure::boxed(
            crate::reporting::ErrorCode::Conflict,
            "source parser or block policy differs from frozen run",
        ));
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
