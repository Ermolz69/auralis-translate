use crate::{AttemptStartGuard, DbError, TranslateDb};
use std::{
    cell::Cell,
    time::{Duration, Instant},
};

pub struct AttemptStartControl<'a> {
    database: &'a TranslateDb,
    guard: AttemptStartGuard,
    poll_interval: Duration,
    last_check: Cell<Option<Instant>>,
}

impl<'a> AttemptStartControl<'a> {
    pub fn new(
        database: &'a TranslateDb,
        guard: AttemptStartGuard,
        poll_interval: Duration,
    ) -> Result<Self, DbError> {
        if poll_interval.is_zero() || poll_interval > Duration::from_secs(1) {
            return Err(DbError::InvalidSpec("invalid admission control interval"));
        }
        Ok(Self {
            database,
            guard,
            poll_interval,
            last_check: Cell::new(None),
        })
    }

    pub fn check(&self) -> Result<(), DbError> {
        if self
            .last_check
            .get()
            .is_some_and(|checked| checked.elapsed() < self.poll_interval)
        {
            return Ok(());
        }
        self.database.check_attempt_start(self.guard)?;
        self.last_check.set(Some(Instant::now()));
        Ok(())
    }
}
