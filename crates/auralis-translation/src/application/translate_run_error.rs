use super::TranslateBatchError;
use std::error::Error;
use std::fmt;

#[derive(Debug)]
pub enum TranslateRunError<E> {
    InvalidPlan(&'static str),
    InvalidCheckpoint(&'static str),
    Paused,
    Control(Box<dyn Error>),
    Store(E),
    Batch(TranslateBatchError),
}

impl<E: fmt::Display> fmt::Display for TranslateRunError<E> {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Self::InvalidPlan(reason) => write!(f, "invalid run plan: {reason}"),
            Self::InvalidCheckpoint(reason) => write!(f, "invalid saved checkpoint: {reason}"),
            Self::Paused => write!(f, "pause requested"),
            Self::Control(error) => write!(f, "run control: {error}"),
            Self::Store(error) => write!(f, "checkpoint store: {error}"),
            Self::Batch(error) => error.fmt(f),
        }
    }
}

impl<E: Error + 'static> Error for TranslateRunError<E> {}
