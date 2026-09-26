use std::{
    ops::{Deref, DerefMut},
    process::Child,
};

pub struct CliChild(pub Child);

impl Deref for CliChild {
    type Target = Child;
    fn deref(&self) -> &Self::Target {
        &self.0
    }
}
impl DerefMut for CliChild {
    fn deref_mut(&mut self) -> &mut Self::Target {
        &mut self.0
    }
}

impl Drop for CliChild {
    fn drop(&mut self) {
        if !matches!(self.0.try_wait(), Ok(Some(_))) {
            let _ = self.0.kill();
            let _ = self.0.wait();
        }
    }
}
