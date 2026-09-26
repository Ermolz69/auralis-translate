use std::{error::Error, path::PathBuf};

pub struct MachineWorkspace(pub PathBuf);

impl MachineWorkspace {
    pub fn new() -> Result<Self, Box<dyn Error>> {
        let root = std::fs::canonicalize(std::env::temp_dir())?
            .join(format!("auralis-machine-cli-{}", uuid::Uuid::new_v4()));
        std::fs::create_dir(&root)?;
        Ok(Self(root))
    }
}

impl Drop for MachineWorkspace {
    fn drop(&mut self) {
        if let (Ok(root), Ok(temporary)) = (
            std::fs::canonicalize(&self.0),
            std::fs::canonicalize(std::env::temp_dir()),
        ) && root.parent() == Some(temporary.as_path())
            && root
                .file_name()
                .is_some_and(|name| name.to_string_lossy().starts_with("auralis-machine-cli-"))
        {
            let _ = std::fs::remove_dir_all(root);
        }
    }
}
