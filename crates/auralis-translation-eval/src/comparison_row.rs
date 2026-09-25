use serde::Serialize;

#[derive(Debug, Serialize)]
pub struct ComparisonRow {
    pub row_id: usize,
    pub source: String,
    pub reference_ru: String,
    pub candidate_ru: String,
    pub elapsed_ms: u128,
}
