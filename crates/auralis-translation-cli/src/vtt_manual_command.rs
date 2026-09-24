use crate::manual_manifest::ManualManifest;
use crate::read_source::read_bounded;
use crate::write_new::write_new;
use auralis_translation_formats::vtt::{VttDocument, VttParsePolicy};
use std::error::Error;
use std::ffi::OsStr;
use std::path::Path;

pub(crate) fn template(source_path: &OsStr, manifest_path: &OsStr) -> Result<(), Box<dyn Error>> {
    let source = read_bounded(
        Path::new(source_path),
        VttParsePolicy::default().max_bytes(),
        "source",
    )?;
    let document = VttDocument::parse(&source)?;
    let mut json = serde_json::to_vec_pretty(&ManualManifest::template(
        &source,
        document.original_translations(),
    ))?;
    json.push(b'\n');
    write_new(Path::new(manifest_path), &json)?;
    Ok(())
}

pub(crate) fn render(
    source_path: &OsStr,
    manifest_path: &OsStr,
    output_path: &OsStr,
) -> Result<(), Box<dyn Error>> {
    let source = read_bounded(
        Path::new(source_path),
        VttParsePolicy::default().max_bytes(),
        "source",
    )?;
    let document = VttDocument::parse(&source)?;
    let manifest_bytes = std::fs::read(Path::new(manifest_path))?;
    let manifest: ManualManifest = serde_json::from_slice(&manifest_bytes)?;
    let translations = manifest.validated_translations(&source)?;
    let output = document.render(&translations)?;
    write_new(Path::new(output_path), &output)?;
    Ok(())
}
