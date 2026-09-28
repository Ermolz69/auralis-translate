use std::ffi::OsStr;

pub(crate) struct StartInput<'a> {
    pub source_path: &'a OsStr,
    pub state_dir: &'a OsStr,
    pub profile_path: &'a OsStr,
    pub glossary_path: Option<&'a OsStr>,
    pub scene_map_path: Option<&'a OsStr>,
    pub endpoint: &'a OsStr,
    pub output_path: &'a OsStr,
    pub format: &'static str,
}
