use crate::document_run_plan::DocumentRunPlan;
use crate::durable_workflow::{DATABASE_FILE, load_profile};
use crate::read_source::{read_source, read_vtt_source};
use crate::reporting::{CliFailure, CommandOutput, ErrorCode};
use crate::start_input::StartInput;
use crate::{durable_resume, durable_start};
use auralis_translation::{RunId, RunState, SourceHash};
use auralis_translation_formats::vtt::VttDocument;
use auralis_translation_llamacpp::{LlamaCppProvider, ModelProfile, hash_file, verify_server};
use auralis_translation_sqlite::{SqliteConfig, TranslateDb};
use std::error::Error;
use std::ffi::{OsStr, OsString};
use std::net::TcpListener;
use std::path::Path;
use std::process::{Command, Stdio};
use std::thread;
use std::time::{Duration, Instant};

const LOOPBACK_HOST: &str = "127.0.0.1";
const STARTUP_TIMEOUT: Duration = Duration::from_secs(600);
const READINESS_INTERVAL: Duration = Duration::from_millis(250);
const MAX_GPU_LAYERS: u32 = 512;

pub(crate) struct LocalTranslationInput<'a> {
    pub source: &'a OsStr,
    pub state_dir: &'a OsStr,
    pub profile_path: &'a OsStr,
    pub executable: &'a OsStr,
    pub model_file: &'a OsStr,
    pub gpu_layers: &'a OsStr,
    pub output: &'a OsStr,
    pub format: &'static str,
}

pub(crate) struct LocalResumeInput<'a> {
    pub state_dir: &'a OsStr,
    pub run_id: &'a OsStr,
    pub profile_path: &'a OsStr,
    pub executable: &'a OsStr,
    pub model_file: &'a OsStr,
    pub gpu_layers: &'a OsStr,
    pub output: &'a OsStr,
}

pub(crate) fn translate(
    input: LocalTranslationInput<'_>,
    reporter: &mut CommandOutput,
) -> Result<(), Box<dyn Error>> {
    let LocalTranslationInput {
        source,
        state_dir,
        profile_path,
        executable,
        model_file,
        gpu_layers,
        output,
        format,
    } = input;
    if Path::new(output).exists() {
        return Err(CliFailure::boxed(
            ErrorCode::Conflict,
            "output already exists",
        ));
    }
    let source_bytes = match format {
        DocumentRunPlan::SRT_FORMAT => {
            let bytes = read_source(Path::new(source))?;
            auralis_translation_formats::inspect(&bytes)?;
            bytes
        }
        DocumentRunPlan::VTT_FORMAT => {
            let bytes = read_vtt_source(Path::new(source))?;
            VttDocument::parse(&bytes)?;
            bytes
        }
        _ => return Err("unsupported standalone source format".into()),
    };
    drop(source_bytes);
    let server = LocalModelServer::start(profile_path, executable, model_file, gpu_layers)?;
    durable_start::run(
        StartInput {
            source_path: source,
            state_dir,
            profile_path,
            glossary_path: None,
            scene_map_path: None,
            terms_path: None,
            name_proposals_path: None,
            endpoint: server.endpoint.as_os_str(),
            output_path: output,
            format,
        },
        reporter,
    )
}

pub(crate) fn resume(
    input: LocalResumeInput<'_>,
    reporter: &mut CommandOutput,
) -> Result<(), Box<dyn Error>> {
    let LocalResumeInput {
        state_dir,
        run_id,
        profile_path,
        executable,
        model_file,
        gpu_layers,
        output,
    } = input;
    let parsed_run_id = RunId::parse(run_id.to_str().ok_or("run ID must be Unicode")?)?;
    let state_path = Path::new(state_dir);
    let db = TranslateDb::open(&state_path.join(DATABASE_FILE), SqliteConfig::default())?;
    if db.run_state(parsed_run_id)? == RunState::Validated {
        return durable_resume::run(
            state_dir,
            run_id,
            profile_path,
            OsStr::new("http://127.0.0.1:9/"),
            output,
            reporter,
        );
    }
    drop(db);
    let server = LocalModelServer::start(profile_path, executable, model_file, gpu_layers)?;
    durable_resume::run(
        state_dir,
        run_id,
        profile_path,
        server.endpoint.as_os_str(),
        output,
        reporter,
    )
}

struct LocalModelServer {
    endpoint: OsString,
    child: ServerChild,
}

impl LocalModelServer {
    fn start(
        profile_path: &OsStr,
        executable: &OsStr,
        model_file: &OsStr,
        gpu_layers: &OsStr,
    ) -> Result<Self, Box<dyn Error>> {
        let (profile, _) = load_profile(Path::new(profile_path))?;
        let expected_bytes = profile.model_file_bytes.ok_or_else(|| {
            CliFailure::boxed(
                ErrorCode::InvalidInput,
                "local execution requires a checked model profile",
            )
        })?;
        let context = profile.min_context_tokens.ok_or_else(|| {
            CliFailure::boxed(
                ErrorCode::InvalidInput,
                "checked model profile has no minimum context",
            )
        })?;
        let layers = gpu_layers
            .to_str()
            .ok_or_else(|| {
                CliFailure::boxed(ErrorCode::InvalidInput, "GPU layers must be Unicode")
            })?
            .parse::<u32>()
            .map_err(|_| {
                CliFailure::boxed(ErrorCode::InvalidInput, "GPU layers must be an integer")
            })?;
        if layers > MAX_GPU_LAYERS {
            return Err(CliFailure::boxed(
                ErrorCode::InvalidInput,
                "GPU layer count exceeds the configured limit",
            ));
        }
        let executable = std::fs::canonicalize(executable)?;
        let model_file = std::fs::canonicalize(model_file)?;
        if !executable.is_file() || !model_file.is_file() {
            return Err("local server executable and model must be files".into());
        }
        let expected_hash = SourceHash::parse_hex(&profile.model_file_sha256).ok_or_else(|| {
            CliFailure::boxed(ErrorCode::InvalidInput, "checked model SHA-256 is invalid")
        })?;
        let (observed_hash, observed_bytes) = hash_file(&model_file)?;
        if observed_bytes != expected_bytes || observed_hash != expected_hash {
            return Err(CliFailure::boxed(
                ErrorCode::ModelMismatch,
                "local model bytes differ from the checked profile",
            ));
        }
        let listener = TcpListener::bind((LOOPBACK_HOST, 0))?;
        let port = listener.local_addr()?.port();
        drop(listener);
        let mut command = Command::new(executable);
        command
            .arg("--model")
            .arg(&model_file)
            .arg("--alias")
            .arg(&profile.model_alias)
            .arg("--host")
            .arg(LOOPBACK_HOST)
            .arg("--port")
            .arg(port.to_string())
            .arg("-c")
            .arg(context.to_string())
            .arg("-ngl")
            .arg(layers.to_string())
            .arg("--cache-ram")
            .arg("0")
            .arg("--parallel")
            .arg("1")
            .arg("--jinja")
            .stdin(Stdio::null())
            .stdout(Stdio::null())
            .stderr(Stdio::null());
        let child = ServerChild::spawn(command)?;
        let endpoint = OsString::from(format!("http://{LOOPBACK_HOST}:{port}/"));
        let mut server = Self { endpoint, child };
        server.wait_ready(&profile, &model_file)?;
        Ok(server)
    }

    fn wait_ready(
        &mut self,
        profile: &ModelProfile,
        expected_model_path: &Path,
    ) -> Result<(), Box<dyn Error>> {
        let endpoint = self.endpoint.to_str().ok_or("endpoint must be Unicode")?;
        let provider = LlamaCppProvider::new(endpoint, profile.clone())?;
        let deadline = Instant::now() + STARTUP_TIMEOUT;
        loop {
            if self.child.exited()? {
                return Err(CliFailure::boxed(
                    ErrorCode::RuntimeFailure,
                    "local model server exited before readiness",
                ));
            }
            if let Ok(report) = provider.probe_server() {
                if std::fs::canonicalize(&report.model_path)? != expected_model_path {
                    return Err(CliFailure::boxed(
                        ErrorCode::ModelMismatch,
                        "local server loaded a different model path",
                    ));
                }
                verify_server(&provider, profile).map_err(|error| {
                    CliFailure::boxed(ErrorCode::ModelMismatch, error.to_string())
                })?;
                if self.child.exited()? {
                    return Err(CliFailure::boxed(
                        ErrorCode::RuntimeFailure,
                        "local model server exited during preflight",
                    ));
                }
                return Ok(());
            }
            if Instant::now() >= deadline {
                return Err(CliFailure::boxed(
                    ErrorCode::RuntimeFailure,
                    "local model server did not become ready in time",
                ));
            }
            thread::sleep(READINESS_INTERVAL);
        }
    }
}

#[cfg(windows)]
struct ServerChild(Box<dyn process_wrap::std::ChildWrapper>);

#[cfg(windows)]
impl ServerChild {
    fn spawn(command: Command) -> std::io::Result<Self> {
        use process_wrap::std::{CommandWrap, JobObject};
        Ok(Self(CommandWrap::from(command).wrap(JobObject).spawn()?))
    }

    fn exited(&mut self) -> std::io::Result<bool> {
        Ok(self.0.try_wait()?.is_some())
    }
}

#[cfg(windows)]
impl Drop for ServerChild {
    fn drop(&mut self) {
        if self.0.try_wait().ok().flatten().is_none() {
            let _ = self.0.start_kill();
        }
        let _ = self.0.wait();
    }
}

#[cfg(not(windows))]
struct ServerChild(std::process::Child);

#[cfg(not(windows))]
impl ServerChild {
    fn spawn(mut command: Command) -> std::io::Result<Self> {
        Ok(Self(command.spawn()?))
    }

    fn exited(&mut self) -> std::io::Result<bool> {
        Ok(self.0.try_wait()?.is_some())
    }
}

#[cfg(not(windows))]
impl Drop for ServerChild {
    fn drop(&mut self) {
        if self.0.try_wait().ok().flatten().is_none() {
            let _ = self.0.kill();
        }
        let _ = self.0.wait();
    }
}
