use auralis_translation::TranslationDiagnostic;

#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub struct RunDiagnostic {
    pub block_index: u32,
    pub diagnostic: TranslationDiagnostic,
}
