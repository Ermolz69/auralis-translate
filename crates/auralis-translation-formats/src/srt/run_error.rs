use super::SrtError;
use auralis_translation::TranslateRunError;
use std::error::Error;
use std::fmt;

#[derive(Debug)]
pub enum SrtRunError<E> {
    Translate(TranslateRunError<E>),
    Render(SrtError),
}

impl<E: fmt::Display> fmt::Display for SrtRunError<E> {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Self::Translate(error) => error.fmt(f),
            Self::Render(error) => error.fmt(f),
        }
    }
}

impl<E: Error + 'static> Error for SrtRunError<E> {}
