use crate::{DbError, TranslationSpec};
use auralis_translation::LanguageCode;
use rusqlite::{Connection, params};

pub(crate) fn ensure(connection: &mut Connection, spec: &TranslationSpec) -> Result<(), DbError> {
    if spec.source_artifact_id.is_some() == spec.source_locator.is_some() {
        return Err(DbError::InvalidSpec(
            "exactly one source locator is required",
        ));
    }
    if spec.project_id.as_deref().is_some_and(str::is_empty)
        || spec
            .source_artifact_id
            .as_deref()
            .is_some_and(str::is_empty)
        || spec.source_locator.as_deref().is_some_and(str::is_empty)
        || spec.source_format.is_empty()
    {
        return Err(DbError::InvalidSpec("empty source or project identity"));
    }
    let hash = spec.source_hash.to_string();
    let source_language = language_code(spec.language_pair.source());
    let target_language = language_code(spec.language_pair.target());
    let transaction = connection.transaction()?;
    transaction.execute(
        "INSERT INTO translations (translation_id, project_id, source_artifact_id, source_locator, source_sha256, source_format, source_language, target_language)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)
         ON CONFLICT(translation_id) DO NOTHING",
        params![
            spec.translation_id.to_string(),
            spec.project_id,
            spec.source_artifact_id,
            spec.source_locator,
            hash,
            spec.source_format,
            source_language,
            target_language,
        ],
    )?;
    let stored: (Option<String>, Option<String>, Option<String>, String, String, String, String) =
        transaction.query_row(
            "SELECT project_id, source_artifact_id, source_locator, source_sha256, source_format, source_language, target_language
             FROM translations WHERE translation_id = ?1",
            [spec.translation_id.to_string()],
            |row| {
                Ok((row.get(0)?, row.get(1)?, row.get(2)?, row.get(3)?, row.get(4)?, row.get(5)?, row.get(6)?))
            },
        )?;
    if stored
        != (
            spec.project_id.clone(),
            spec.source_artifact_id.clone(),
            spec.source_locator.clone(),
            hash,
            spec.source_format.clone(),
            source_language.to_owned(),
            target_language.to_owned(),
        )
    {
        return Err(DbError::Conflict(
            "translation ID refers to different source metadata",
        ));
    }
    transaction.commit()?;
    Ok(())
}

fn language_code(language: LanguageCode) -> &'static str {
    match language {
        LanguageCode::Chinese => "zh",
        LanguageCode::Japanese => "ja",
        LanguageCode::Russian => "ru",
    }
}
