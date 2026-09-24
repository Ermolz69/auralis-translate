use crate::read_source::{read_bounded, read_source};
use crate::write_new::write_new;
use auralis_translation::{LanguageCode, LanguagePair, RunId, TranslationId};
use auralis_translation_formats::{
    translate_document, translate_vtt_document, vtt::VttParsePolicy,
};
use auralis_translation_llamacpp::{LlamaCppProvider, ModelProfile};
use std::error::Error;
use std::ffi::OsStr;
use std::path::Path;
use uuid::Uuid;

enum ExperimentalFormat {
    Srt,
    Vtt,
}

pub(crate) fn run(
    source_path: &OsStr,
    profile_path: &OsStr,
    endpoint: &OsStr,
    output_path: &OsStr,
) -> Result<(), Box<dyn Error>> {
    run_inner(
        source_path,
        profile_path,
        endpoint,
        output_path,
        ExperimentalFormat::Srt,
    )
}

pub(crate) fn run_vtt(
    source_path: &OsStr,
    profile_path: &OsStr,
    endpoint: &OsStr,
    output_path: &OsStr,
) -> Result<(), Box<dyn Error>> {
    run_inner(
        source_path,
        profile_path,
        endpoint,
        output_path,
        ExperimentalFormat::Vtt,
    )
}

fn run_inner(
    source_path: &OsStr,
    profile_path: &OsStr,
    endpoint: &OsStr,
    output_path: &OsStr,
    format: ExperimentalFormat,
) -> Result<(), Box<dyn Error>> {
    let source = match format {
        ExperimentalFormat::Srt => read_source(Path::new(source_path))?,
        ExperimentalFormat::Vtt => read_bounded(
            Path::new(source_path),
            VttParsePolicy::default().max_bytes(),
            "source",
        )?,
    };
    let profile = ModelProfile::from_json(&std::fs::read(Path::new(profile_path))?)?;
    let endpoint = endpoint.to_str().ok_or("server URL must be Unicode")?;
    let provider = LlamaCppProvider::new(endpoint, profile)?;
    let translation_id =
        TranslationId::new(Uuid::new_v4()).ok_or("failed to create translation ID")?;
    let run_id = RunId::new(Uuid::new_v4()).ok_or("failed to create run ID")?;
    let pair = LanguagePair::new(LanguageCode::Chinese, LanguageCode::Russian)?;
    let output = match format {
        ExperimentalFormat::Srt => {
            translate_document(&source, translation_id, run_id, pair, &provider)?
        }
        ExperimentalFormat::Vtt => {
            translate_vtt_document(&source, translation_id, run_id, pair, &provider)?
        }
    };
    write_new(Path::new(output_path), &output)?;
    Ok(())
}
