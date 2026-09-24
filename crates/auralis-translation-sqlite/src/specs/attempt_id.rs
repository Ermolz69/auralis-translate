#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub struct AttemptId(pub(crate) i64);

impl AttemptId {
    pub fn get(self) -> i64 {
        self.0
    }
}
