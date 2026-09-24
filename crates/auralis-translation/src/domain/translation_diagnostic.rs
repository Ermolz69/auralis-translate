use super::{DiagnosticCode, SegmentId};

#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub struct TranslationDiagnostic {
    pub code: DiagnosticCode,
    pub segment_id: SegmentId,
    pub line_index: u32,
}
