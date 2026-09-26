use auralis_translation::ProviderError;

pub trait PreparationControl {
    fn check(&self) -> Result<(), ProviderError>;
}

impl<F: Fn() -> Result<(), ProviderError>> PreparationControl for F {
    fn check(&self) -> Result<(), ProviderError> {
        self()
    }
}
