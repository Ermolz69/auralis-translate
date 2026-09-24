#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub enum RunState {
    Requested,
    Running,
    Paused,
    Failed,
    Validated,
}
