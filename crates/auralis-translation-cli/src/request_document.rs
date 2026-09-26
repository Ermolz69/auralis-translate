use crate::machine_request::MachineRequest;
use crate::read_source::read_bounded;
use crate::reporting::{CliFailure, ErrorCode};
use serde::Deserialize;
use std::{error::Error, ffi::OsString, path::Path};

const REQUEST_VERSION: u32 = 1;
const MAX_REQUEST_BYTES: usize = 1024 * 1024;

#[derive(Deserialize)]
#[serde(deny_unknown_fields)]
struct RequestDocument {
    schema_version: u32,
    request: MachineRequest,
}

pub(crate) fn load(path: &Path) -> Result<Vec<OsString>, Box<dyn Error>> {
    let bytes = read_bounded(path, MAX_REQUEST_BYTES, "request")?;
    let document: RequestDocument = serde_json::from_slice(&bytes)?;
    if document.schema_version != REQUEST_VERSION {
        return Err(CliFailure::boxed(
            ErrorCode::InvalidInput,
            "unsupported CLI request schema version",
        ));
    }
    Ok(document.request.into_args())
}
