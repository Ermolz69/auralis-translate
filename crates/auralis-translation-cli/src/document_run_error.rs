use std::error::Error;

pub(crate) enum DocumentRunError {
    Paused(Box<dyn Error>),
    Failed(Box<dyn Error>),
}
