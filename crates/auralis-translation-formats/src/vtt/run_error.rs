use super::VttError;
use auralis_translation::TranslateRunError;
use std::{error::Error, fmt};

#[derive(Debug)]
pub enum VttRunError<E> {
    Translate(TranslateRunError<E>),
    Render(VttError),
}

impl<E: fmt::Display> fmt::Display for VttRunError<E> {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Self::Translate(error) => error.fmt(f),
            Self::Render(error) => error.fmt(f),
        }
    }
}

impl<E: Error + 'static> Error for VttRunError<E> {}
