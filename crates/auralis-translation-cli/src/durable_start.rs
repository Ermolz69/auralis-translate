use crate::document_run_plan::DocumentRunPlan;
use crate::durable_workflow::{
    DATABASE_FILE, ExecutionConfig, SOURCE_DIRECTORY, block_policy, execute, load_profile,
};
use crate::read_source::{read_source, read_vtt_source};
use crate::reporting::{CliEvent, CommandOutput};
use crate::source_snapshot::source_snapshot;
use crate::start_input::StartInput;
use crate::write_new::write_new;
use crate::{glossary_input, managed_glossary, scene_map_input, terms_input};
use auralis_translation::{LanguageCode, LanguagePair, RunId, TranslationId};
use auralis_translation_sqlite::{RunSpec, SqliteConfig, TranslateDb, TranslationSpec};
use std::error::Error;

use std::path::Path;
use uuid::Uuid;

pub(crate) fn run(
    input: StartInput<'_>,
    reporter: &mut CommandOutput,
) -> Result<(), Box<dyn Error>> {
    let StartInput {
        source_path,
        state_dir,
        profile_path,
        glossary_path,
        scene_map_path,
        terms_path,
        endpoint,
        output_path,
        format,
    } = input;
    let output_path = Path::new(output_path);
    if output_path.exists() {
        return Err(crate::reporting::CliFailure::boxed(
            crate::reporting::ErrorCode::Conflict,
            "output already exists",
        ));
    }
    let source = match format {
        DocumentRunPlan::SRT_FORMAT => read_source(Path::new(source_path))?,
        DocumentRunPlan::VTT_FORMAT => read_vtt_source(Path::new(source_path))?,
        _ => {
            return Err(crate::reporting::CliFailure::boxed(
                crate::reporting::ErrorCode::InvalidInput,
                "unsupported standalone source format",
            ));
        }
    };
    let (profile, profile_hash) = load_profile(Path::new(profile_path))?;
    let glossary_snapshot = glossary_path
        .map(|path| glossary_input::read(Path::new(path)))
        .transpose()?;
    let scene_snapshot = scene_map_path
        .map(|path| scene_map_input::read(Path::new(path), &source))
        .transpose()?;
    let terms_snapshot = terms_path
        .map(|path| {
            let scene = scene_snapshot
                .as_ref()
                .ok_or("terms ledger requires scene map")?;
            terms_input::read(Path::new(path), &source, scene.snapshot_hash)
        })
        .transpose()?;
    if scene_snapshot.is_some()
        && (profile.prompt_version != 5 || format != DocumentRunPlan::SRT_FORMAT)
    {
        return Err(crate::reporting::CliFailure::boxed(
            crate::reporting::ErrorCode::InvalidInput,
            "scene maps require an SRT v5 profile",
        ));
    }
    if glossary_snapshot.is_some() && profile.prompt_version != 3 {
        return Err(crate::reporting::CliFailure::boxed(
            crate::reporting::ErrorCode::InvalidInput,
            "model profile does not support glossary prompts",
        ));
    }
    if terms_snapshot.is_some()
        && (profile.prompt_version != 5
            || profile.max_approved_terms_bytes == 0
            || profile.max_approved_terms_entries == 0)
    {
        return Err(crate::reporting::CliFailure::boxed(
            crate::reporting::ErrorCode::InvalidInput,
            "model profile does not support approved terms",
        ));
    }
    let translation_id =
        TranslationId::new(Uuid::new_v4()).ok_or("failed to create translation ID")?;
    let run_id = RunId::new(Uuid::new_v4()).ok_or("failed to create run ID")?;
    let pair = LanguagePair::new(LanguageCode::Chinese, LanguageCode::Russian)?;
    let block_policy = block_policy(&profile, scene_snapshot.is_some())?;
    let plan = if let (Some(scene), Some(terms)) = (&scene_snapshot, &terms_snapshot) {
        DocumentRunPlan::with_scene_map_and_terms(
            format,
            &source,
            translation_id,
            run_id,
            pair,
            block_policy,
            &scene.end_ids,
            scene.snapshot_hash,
            &terms.terms,
        )?
    } else if let Some(scene) = &scene_snapshot {
        DocumentRunPlan::with_scene_map(
            format,
            &source,
            translation_id,
            run_id,
            pair,
            block_policy,
            &scene.end_ids,
            scene.snapshot_hash,
        )?
    } else {
        DocumentRunPlan::new(
            format,
            &source,
            translation_id,
            run_id,
            pair,
            block_policy,
            glossary_snapshot.as_ref().map(|(glossary, _, _)| glossary),
        )?
    };

    let state_dir = Path::new(state_dir);
    std::fs::create_dir_all(state_dir)?;
    let state_dir = std::fs::canonicalize(state_dir)?;
    if let Some((_, hash, bytes)) = &glossary_snapshot {
        managed_glossary::store(&state_dir, *hash, bytes)?;
    }
    if let Some(scene) = &scene_snapshot {
        scene_map_input::store(&state_dir, run_id, scene)?;
    }
    if let Some(terms) = &terms_snapshot {
        terms_input::store(&state_dir, run_id, terms)?;
    }
    let source_dir = state_dir.join(SOURCE_DIRECTORY);
    std::fs::create_dir_all(&source_dir)?;
    let managed_source = source_dir.join(format!("{translation_id}.{}", plan.source_format()));
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
        source_format: plan.source_format().into(),
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
        parser_version: plan.parser_version(),
        policy_fingerprint: plan.policy_fingerprint(block_policy).to_string(),
        glossary_revision: glossary_snapshot
            .as_ref()
            .map(|(_, hash, _)| hash.to_string())
            .or_else(|| {
                terms_snapshot
                    .as_ref()
                    .map(|terms| terms.snapshot_hash.to_string())
            }),
        blocks: plan.blocks().to_vec(),
    };
    db.ensure_run(&run)?;
    if reporter.is_machine() {
        reporter.emit(CliEvent::RunStarted {
            translation_id: translation_id.to_string(),
            run_id: run_id.to_string(),
            source_sha256: plan.source_hash().to_string(),
            format: plan.source_format().into(),
        })?;
    } else {
        println!("translation_id={translation_id} run_id={run_id}");
        std::io::Write::flush(&mut std::io::stdout())?;
    }
    execute(
        &mut db,
        &run,
        &plan,
        profile,
        ExecutionConfig {
            endpoint,
            output_path,
            state_dir: &state_dir,
            initial_attempt: true,
        },
        reporter,
    )
}
