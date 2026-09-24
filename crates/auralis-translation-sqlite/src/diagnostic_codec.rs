use crate::DbError;
use auralis_translation::{DiagnosticCode, SegmentId, TranslationDiagnostic};
use serde::{Deserialize, Serialize};

#[derive(Deserialize, Serialize)]
#[serde(deny_unknown_fields)]
struct StoredDiagnostic {
    code: String,
    segment_id: u32,
    line_index: u32,
}

pub(crate) fn encode(diagnostics: &[TranslationDiagnostic]) -> Result<String, DbError> {
    let stored = diagnostics
        .iter()
        .map(|diagnostic| StoredDiagnostic {
            code: diagnostic.code.as_str().to_owned(),
            segment_id: diagnostic.segment_id.get(),
            line_index: diagnostic.line_index,
        })
        .collect::<Vec<_>>();
    Ok(serde_json::to_string(&stored)?)
}

pub(crate) fn decode(json: &str) -> Result<Vec<TranslationDiagnostic>, DbError> {
    let stored: Vec<StoredDiagnostic> = serde_json::from_str(json)
        .map_err(|_| DbError::CorruptRecord("invalid checkpoint diagnostics"))?;
    stored
        .into_iter()
        .map(|item| {
            Ok(TranslationDiagnostic {
                code: DiagnosticCode::parse(&item.code)
                    .ok_or(DbError::CorruptRecord("unknown diagnostic code"))?,
                segment_id: SegmentId::new(item.segment_id)
                    .ok_or(DbError::CorruptRecord("zero diagnostic segment ID"))?,
                line_index: item.line_index,
            })
        })
        .collect()
}
