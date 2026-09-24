use std::fmt;

#[derive(Debug)]
pub enum DbError {
    Sql(rusqlite::Error),
    UnsupportedSchemaVersion(u32),
    InvalidSpec(&'static str),
    Conflict(&'static str),
    CorruptRecord(&'static str),
    Verification(String),
}

impl fmt::Display for DbError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Self::Sql(error) => error.fmt(f),
            Self::UnsupportedSchemaVersion(version) => {
                write!(f, "unsupported Translate SQLite schema version {version}")
            }
            Self::InvalidSpec(reason) => write!(f, "invalid Translate record: {reason}"),
            Self::Conflict(reason) => write!(f, "Translate record conflict: {reason}"),
            Self::CorruptRecord(reason) => write!(f, "corrupt Translate record: {reason}"),
            Self::Verification(reason) => write!(f, "result verification failed: {reason}"),
        }
    }
}

impl From<serde_json::Error> for DbError {
    fn from(value: serde_json::Error) -> Self {
        Self::CorruptRecord(match value.classify() {
            serde_json::error::Category::Io => "JSON I/O error",
            serde_json::error::Category::Syntax => "invalid JSON syntax",
            serde_json::error::Category::Data => "invalid JSON data",
            serde_json::error::Category::Eof => "incomplete JSON",
        })
    }
}

impl std::error::Error for DbError {}

impl From<rusqlite::Error> for DbError {
    fn from(value: rusqlite::Error) -> Self {
        Self::Sql(value)
    }
}
