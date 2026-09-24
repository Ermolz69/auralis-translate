use crate::RunProgress;

pub trait ProgressSink {
    fn report(&mut self, progress: RunProgress);
}
