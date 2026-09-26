use crate::DbError;
use auralis_translation::{RunId, RunState};

#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub struct AttemptStartGuard {
    run_id: RunId,
    state: RunState,
    control_revision: u64,
}

impl AttemptStartGuard {
    pub fn new(run_id: RunId, state: RunState, control_revision: u64) -> Result<Self, DbError> {
        if !matches!(
            state,
            RunState::Requested | RunState::Paused | RunState::Failed
        ) || control_revision >= i64::MAX as u64
        {
            return Err(DbError::InvalidSpec("invalid attempt admission guard"));
        }
        Ok(Self {
            run_id,
            state,
            control_revision,
        })
    }

    pub fn run_id(self) -> RunId {
        self.run_id
    }
    pub fn state(self) -> RunState {
        self.state
    }
    pub fn control_revision(self) -> u64 {
        self.control_revision
    }
}
