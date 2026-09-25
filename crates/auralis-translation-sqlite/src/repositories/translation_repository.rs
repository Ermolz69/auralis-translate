use crate::{DbError, TranslationSpec};
use auralis_translation::{LanguageCode, LanguagePair, SourceHash, TranslationId};
use rusqlite::{Connection, OptionalExtension, params};

struct StoredTranslationRow {
    project_id: Option<String>,
    source_artifact_id: Option<String>,
    source_locator: Option<String>,
    hash: String,
    format: String,
    source: String,
    target: String,
}

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
    let deleted: Option<String> = transaction
        .query_row(
            "SELECT project_id FROM deleted_translations WHERE translation_id = ?1",
            [spec.translation_id.to_string()],
            |row| row.get(0),
        )
        .optional()?;
    if deleted.is_some() {
        return Err(DbError::Conflict(
            "translation was deleted with its project",
        ));
    }
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

pub(crate) fn load(
    connection: &Connection,
    translation_id: TranslationId,
) -> Result<TranslationSpec, DbError> {
    let row: Option<StoredTranslationRow> = connection
            .query_row(
                "SELECT project_id, source_artifact_id, source_locator, source_sha256, source_format, source_language, target_language
                 FROM translations WHERE translation_id = ?1",
                [translation_id.to_string()],
                |row| {
                    Ok(StoredTranslationRow {
                        project_id: row.get(0)?,
                        source_artifact_id: row.get(1)?,
                        source_locator: row.get(2)?,
                        hash: row.get(3)?,
                        format: row.get(4)?,
                        source: row.get(5)?,
                        target: row.get(6)?,
                    })
                },
            )
            .optional()?;
    let row = row.ok_or(DbError::Conflict("translation does not exist"))?;
    let source = parse_language(&row.source)?;
    let target = parse_language(&row.target)?;
    let language_pair = LanguagePair::new(source, target)
        .map_err(|_| DbError::CorruptRecord("invalid stored language pair"))?;
    Ok(TranslationSpec {
        translation_id,
        project_id: row.project_id,
        source_artifact_id: row.source_artifact_id,
        source_locator: row.source_locator,
        source_hash: SourceHash::parse_hex(&row.hash)
            .ok_or(DbError::CorruptRecord("invalid source hash"))?,
        source_format: row.format,
        language_pair,
    })
}

fn parse_language(value: &str) -> Result<LanguageCode, DbError> {
    match value {
        "zh" => Ok(LanguageCode::Chinese),
        "ja" => Ok(LanguageCode::Japanese),
        "ru" => Ok(LanguageCode::Russian),
        _ => Err(DbError::CorruptRecord("unknown language code")),
    }
}
