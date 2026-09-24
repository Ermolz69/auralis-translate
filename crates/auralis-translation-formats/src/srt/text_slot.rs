use std::ops::Range;

#[derive(Clone, Debug, Eq, PartialEq)]
pub struct TextSlot {
    pub text: String,
    pub byte_range: Range<usize>,
}
