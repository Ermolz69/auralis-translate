use crate::manual_translation::ManualTranslation;
use auralis_translation::{SegmentId, SourceHash};
use auralis_translation_formats::srt::{SegmentTranslation, SrtDocument};
use serde::{Deserialize, Serialize};
use std::error::Error;

const SCHEMA_VERSION: u32 = 1;

#[derive(Deserialize, Serialize)]
#[serde(deny_unknown_fields)]
pub(crate) struct ManualManifest {
    schema_version: u32,
    source_sha256: String,
    translations: Vec<ManualTranslation>,
}

impl ManualManifest {
    pub(crate) fn template(document: &SrtDocument) -> Self {
        Self {
            schema_version: SCHEMA_VERSION,
            source_sha256: digest(document.source_bytes()),
            translations: document
                .original_translations()
                .into_iter()
                .map(|item| ManualTranslation {
                    id: item.id.get(),
                    lines: item.lines,
                })
                .collect(),
        }
    }

    pub(crate) fn validated_translations(
        self,
        source: &[u8],
    ) -> Result<Vec<SegmentTranslation>, Box<dyn Error>> {
        if self.schema_version != SCHEMA_VERSION {
            return Err("unsupported manual manifest schema version".into());
        }
        if self.source_sha256 != digest(source) {
            return Err("manifest source hash differs from the current source".into());
        }
        self.translations
            .into_iter()
            .map(|item| {
                Ok(SegmentTranslation {
                    id: SegmentId::new(item.id).ok_or("segment ID must be nonzero")?,
                    lines: item.lines,
                })
            })
            .collect()
    }
}

fn digest(bytes: &[u8]) -> String {
    SourceHash::digest(bytes).to_string()
}
