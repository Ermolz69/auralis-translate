use auralis_translation::{ResultId, RunId, RunState, SourceHash};
use auralis_translation_sqlite::{SqliteConfig, TranslateDb};
use std::error::Error;
use std::io::{BufRead, BufReader, Read, Write};
use std::net::TcpListener;
use std::path::Path;
use std::process::{Command, Stdio};
use std::sync::mpsc;
use std::time::{Duration, Instant, SystemTime, UNIX_EPOCH};

const PROFILE: &[u8] =
    include_bytes!("../../../models/manifests/hy_mt2_1_8b_q4_k_m.experimental.json");
const GLOSSARY_PROFILE: &[u8] =
    include_bytes!("../../../models/manifests/hy_mt2_1_8b_q4_k_m.glossary.experimental.json");

#[test]
fn cli_freezes_glossary_for_resume_and_rejects_conflicts() -> Result<(), Box<dyn Error>> {
    let nonce = SystemTime::now().duration_since(UNIX_EPOCH)?.as_nanos();
    let directory = std::env::temp_dir().join(format!(
        "auralis-cli-glossary-{}-{nonce}",
        std::process::id()
    ));
    std::fs::create_dir(&directory)?;
    let source_path = directory.join("original.srt");
    let state_dir = directory.join("state");
    let profile_path = directory.join("profile.json");
    let glossary_path = directory.join("glossary.json");
    let output_path = directory.join("translated.srt");
    let export_path = directory.join("export.srt");
    let source = b"1\n00:00:01,000 --> 00:00:02,000\n\xe4\xbd\xa0\xe5\xa5\xbd\xe3\x80\x82\n";
    let glossary = r#"{"schema_version":1,"entries":[{"source":"你好","target":"Здравствуйте","allowed_forms":[]}]}"#;
    std::fs::write(&source_path, source)?;
    std::fs::write(&profile_path, GLOSSARY_PROFILE)?;
    std::fs::write(&glossary_path, glossary)?;
    let listener = TcpListener::bind("127.0.0.1:0")?;
    let endpoint = format!("http://{}/", listener.local_addr()?);
    let server = std::thread::spawn(move || serve(listener, 1, None, None, "Привет."));
    let output = command(&[
        "translate-glossary",
        path(&source_path)?,
        path(&state_dir)?,
        path(&profile_path)?,
        path(&glossary_path)?,
        &endpoint,
        path(&output_path)?,
    ])?;
    assert!(
        output.status.success(),
        "{}",
        String::from_utf8_lossy(&output.stderr)
    );
    server
        .join()
        .map_err(|_| "glossary mock server panicked")??;
    let stdout = String::from_utf8(output.stdout)?;
    let run_id = stdout
        .split_whitespace()
        .find_map(|item| item.strip_prefix("run_id="))
        .ok_or("missing run ID")?;
    let db = TranslateDb::open(
        &state_dir.join("auralis-translate.sqlite"),
        SqliteConfig::default(),
    )?;
    assert_eq!(
        db.run(RunId::parse(run_id)?)?.glossary_revision,
        Some(SourceHash::digest(glossary.as_bytes()).to_string())
    );
    drop(db);
    std::fs::write(&glossary_path, b"changed external glossary")?;
    let exported = command(&[
        "resume",
        path(&state_dir)?,
        run_id,
        path(&profile_path)?,
        "http://127.0.0.1:1/",
        path(&export_path)?,
    ])?;
    assert!(
        exported.status.success(),
        "{}",
        String::from_utf8_lossy(&exported.stderr)
    );
    assert_eq!(std::fs::read(&output_path)?, std::fs::read(&export_path)?);
    let managed = state_dir
        .join("glossaries")
        .join(format!("{}.json", SourceHash::digest(glossary.as_bytes())));
    std::fs::write(&managed, b"changed managed glossary")?;
    let rejected_path = directory.join("rejected.srt");
    let rejected = command(&[
        "resume",
        path(&state_dir)?,
        run_id,
        path(&profile_path)?,
        "http://127.0.0.1:1/",
        path(&rejected_path)?,
    ])?;
    assert!(!rejected.status.success());
    assert!(!rejected_path.exists());
    let conflict_path = directory.join("conflict.json");
    std::fs::write(
        &conflict_path,
        r#"{"schema_version":1,"entries":[{"source":"你好","target":"Здравствуйте"},{"source":"你好","target":"Привет"}]}"#,
    )?;
    let invalid_state = directory.join("invalid-state");
    let conflict = command(&[
        "translate-glossary",
        path(&source_path)?,
        path(&invalid_state)?,
        path(&profile_path)?,
        path(&conflict_path)?,
        "http://127.0.0.1:1/",
        path(&rejected_path)?,
    ])?;
    assert!(!conflict.status.success());
    assert!(!invalid_state.exists());
    assert_eq!(std::fs::read(&source_path)?, source);
    std::fs::remove_dir_all(directory)?;
    Ok(())
}

#[test]
fn cli_edits_a_validated_copy_and_reexports_latest_result() -> Result<(), Box<dyn Error>> {
    let nonce = SystemTime::now().duration_since(UNIX_EPOCH)?.as_nanos();
    let directory =
        std::env::temp_dir().join(format!("auralis-cli-edit-{}-{nonce}", std::process::id()));
    std::fs::create_dir(&directory)?;
    let source_path = directory.join("original.srt");
    let state_dir = directory.join("state");
    let profile_path = directory.join("profile.json");
    let edit_path = directory.join("edit.json");
    let initial_path = directory.join("initial.srt");
    let edited_path = directory.join("edited.srt");
    let export_path = directory.join("edited-again.srt");
    let source = b"1\n00:00:01,000 --> 00:00:02,000\n\xe4\xbd\xa0\xe5\xa5\xbd\xe3\x80\x82\n";
    std::fs::write(&source_path, source)?;
    std::fs::write(&profile_path, PROFILE)?;
    let listener = TcpListener::bind("127.0.0.1:0")?;
    let endpoint = format!("http://{}/", listener.local_addr()?);
    let server = std::thread::spawn(move || serve(listener, 1, None, None, "Привет."));
    let translated = command(&[
        "translate",
        path(&source_path)?,
        path(&state_dir)?,
        path(&profile_path)?,
        &endpoint,
        path(&initial_path)?,
    ])?;
    assert!(
        translated.status.success(),
        "{}",
        String::from_utf8_lossy(&translated.stderr)
    );
    server.join().map_err(|_| "mock server panicked")??;
    let stdout = String::from_utf8(translated.stdout)?;
    let run_id = stdout
        .split_whitespace()
        .find_map(|item| item.strip_prefix("run_id="))
        .ok_or("missing run ID")?;
    let base_result_id = stdout
        .split_whitespace()
        .find_map(|item| item.strip_prefix("result_id="))
        .ok_or("missing result ID")?;
    std::fs::write(
        &edit_path,
        r#"{"schema_version":1,"segment_id":1,"lines":["Здравствуйте."]}"#,
    )?;
    let edited = command(&[
        "edit",
        path(&state_dir)?,
        base_result_id,
        path(&profile_path)?,
        path(&edit_path)?,
        path(&edited_path)?,
    ])?;
    assert!(
        edited.status.success(),
        "{}",
        String::from_utf8_lossy(&edited.stderr)
    );
    let edited_stdout = String::from_utf8(edited.stdout)?;
    let edited_result_id = edited_stdout
        .split_whitespace()
        .find_map(|item| item.strip_prefix("result_id="))
        .ok_or("missing edited result ID")?;
    assert_ne!(edited_result_id, base_result_id);
    assert!(String::from_utf8(std::fs::read(&edited_path)?)?.contains("Здравствуйте."));
    assert!(String::from_utf8(std::fs::read(&initial_path)?)?.contains("Привет."));
    assert_eq!(std::fs::read(&source_path)?, source);
    let db = TranslateDb::open(
        &state_dir.join("auralis-translate.sqlite"),
        SqliteConfig::default(),
    )?;
    assert_eq!(db.result(ResultId::parse(base_result_id)?)?.revision, 1);
    assert_eq!(db.result(ResultId::parse(edited_result_id)?)?.revision, 2);
    assert_eq!(
        db.result_edits(ResultId::parse(edited_result_id)?)?.len(),
        1
    );
    drop(db);
    let exported = command(&[
        "resume",
        path(&state_dir)?,
        run_id,
        path(&profile_path)?,
        "http://127.0.0.1:1/",
        path(&export_path)?,
    ])?;
    assert!(
        exported.status.success(),
        "{}",
        String::from_utf8_lossy(&exported.stderr)
    );
    assert_eq!(std::fs::read(&export_path)?, std::fs::read(&edited_path)?);
    let status = command(&["status", path(&state_dir)?, run_id])?;
    let status: serde_json::Value = serde_json::from_slice(&status.stdout)?;
    assert_eq!(status["selected_result_id"], edited_result_id);
    let stale_path = directory.join("stale.srt");
    let stale = command(&[
        "edit",
        path(&state_dir)?,
        base_result_id,
        path(&profile_path)?,
        path(&edit_path)?,
        path(&stale_path)?,
    ])?;
    assert!(!stale.status.success());
    assert!(!stale_path.exists());
    std::fs::remove_dir_all(directory)?;
    Ok(())
}

#[test]
fn cli_resumes_checkpointed_srt_and_reexports_validated_result() -> Result<(), Box<dyn Error>> {
    let nonce = SystemTime::now().duration_since(UNIX_EPOCH)?.as_nanos();
    let directory =
        std::env::temp_dir().join(format!("auralis-cli-resume-{}-{nonce}", std::process::id()));
    std::fs::create_dir(&directory)?;
    let source_path = directory.join("original.srt");
    let state_dir = directory.join("state");
    let profile_path = directory.join("profile.json");
    let output_path = directory.join("russian.srt");
    let export_path = directory.join("russian-again.srt");
    let source = source_with_nine_cues();
    std::fs::write(&source_path, &source)?;
    std::fs::write(&profile_path, PROFILE)?;

    let listener = TcpListener::bind("127.0.0.1:0")?;
    let endpoint = format!("http://{}/", listener.local_addr()?);
    let server = std::thread::spawn(move || serve(listener, 9, Some(9), None, "Привет."));
    let first = command(&[
        "translate",
        path(&source_path)?,
        path(&state_dir)?,
        path(&profile_path)?,
        &endpoint,
        path(&output_path)?,
    ])?;
    assert!(!first.status.success());
    assert!(String::from_utf8_lossy(&first.stderr).contains("saved_blocks=1/2"));
    server.join().map_err(|_| "first mock server panicked")??;
    assert!(!output_path.exists());
    let stdout = String::from_utf8(first.stdout)?;
    let run_id = stdout
        .split_whitespace()
        .find_map(|item| item.strip_prefix("run_id="))
        .ok_or("CLI did not report a run ID")?;
    let run_id = RunId::parse(run_id)?;
    let mut db = TranslateDb::open(
        &state_dir.join("auralis-translate.sqlite"),
        SqliteConfig::default(),
    )?;
    assert_eq!(db.run_state(run_id)?, RunState::Failed);
    assert_eq!(db.checkpoints(run_id)?.len(), 1);
    assert_eq!(db.segments(db.run(run_id)?.translation_id)?.len(), 9);
    drop(db);
    let status = command(&["status", path(&state_dir)?, &run_id.to_string()])?;
    assert!(status.status.success());
    let status: serde_json::Value = serde_json::from_slice(&status.stdout)?;
    assert_eq!(status["state"], "failed");
    assert_eq!(status["completed_blocks"], 1);
    assert_eq!(status["total_blocks"], 2);
    assert_eq!(status["warning_count"], 0);
    assert!(status["selected_result_id"].is_null());
    let diagnostics = command(&["diagnostics", path(&state_dir)?, &run_id.to_string()])?;
    assert!(diagnostics.status.success());
    let diagnostics: serde_json::Value = serde_json::from_slice(&diagnostics.stdout)?;
    assert_eq!(diagnostics["warnings"].as_array().map(Vec::len), Some(0));

    let listener = TcpListener::bind("127.0.0.1:0")?;
    let endpoint = format!("http://{}/", listener.local_addr()?);
    let server = std::thread::spawn(move || serve(listener, 1, None, None, "Привет."));
    let resumed = command(&[
        "resume",
        path(&state_dir)?,
        &run_id.to_string(),
        path(&profile_path)?,
        &endpoint,
        path(&output_path)?,
    ])?;
    assert!(
        resumed.status.success(),
        "{}",
        String::from_utf8_lossy(&resumed.stderr)
    );
    assert!(String::from_utf8_lossy(&resumed.stderr).contains("saved_blocks=2/2"));
    server.join().map_err(|_| "second mock server panicked")??;
    assert_eq!(std::fs::read(&source_path)?, source);
    let translated = std::fs::read(&output_path)?;
    assert_eq!(
        translated
            .windows("Привет.".len())
            .filter(|part| *part == "Привет.".as_bytes())
            .count(),
        9
    );
    db = TranslateDb::open(
        &state_dir.join("auralis-translate.sqlite"),
        SqliteConfig::default(),
    )?;
    assert_eq!(db.run_state(run_id)?, RunState::Validated);
    assert_eq!(db.result_for_run(run_id)?.selected.len(), 9);
    let managed_source = db
        .translation(db.run(run_id)?.translation_id)?
        .source_locator
        .ok_or("managed source locator missing")?;
    drop(db);
    let status = command(&["status", path(&state_dir)?, &run_id.to_string()])?;
    assert!(status.status.success());
    let status: serde_json::Value = serde_json::from_slice(&status.stdout)?;
    assert_eq!(status["state"], "validated");
    assert_eq!(status["completed_blocks"], 2);
    assert_eq!(status["warning_count"], 0);
    assert_eq!(status["review_state"], "needs_review");
    assert!(status["selected_result_id"].is_string());

    std::fs::write(&managed_source, b"changed")?;
    let changed_source = command(&[
        "resume",
        path(&state_dir)?,
        &run_id.to_string(),
        path(&profile_path)?,
        "http://127.0.0.1:1/",
        path(&export_path)?,
    ])?;
    assert!(!changed_source.status.success());
    assert!(!export_path.exists());
    std::fs::write(&managed_source, &source)?;

    let mut changed_profile = PROFILE.to_vec();
    changed_profile.push(b' ');
    std::fs::write(&profile_path, changed_profile)?;
    let profile_conflict = command(&[
        "resume",
        path(&state_dir)?,
        &run_id.to_string(),
        path(&profile_path)?,
        "http://127.0.0.1:1/",
        path(&export_path)?,
    ])?;
    assert!(!profile_conflict.status.success());
    assert!(!export_path.exists());
    std::fs::write(&profile_path, PROFILE)?;

    let export = command(&[
        "resume",
        path(&state_dir)?,
        &run_id.to_string(),
        path(&profile_path)?,
        "http://127.0.0.1:1/",
        path(&export_path)?,
    ])?;
    assert!(
        export.status.success(),
        "{}",
        String::from_utf8_lossy(&export.stderr)
    );
    assert_eq!(std::fs::read(&export_path)?, translated);
    let overwrite = command(&[
        "resume",
        path(&state_dir)?,
        &run_id.to_string(),
        path(&profile_path)?,
        "http://127.0.0.1:1/",
        path(&export_path)?,
    ])?;
    assert!(!overwrite.status.success());
    assert_eq!(std::fs::read(&export_path)?, translated);
    std::fs::remove_dir_all(directory)?;
    Ok(())
}

#[test]
fn cli_resumes_checkpointed_vtt_and_reexports_verified_copy() -> Result<(), Box<dyn Error>> {
    let nonce = SystemTime::now().duration_since(UNIX_EPOCH)?.as_nanos();
    let directory = std::env::temp_dir().join(format!(
        "auralis-cli-vtt-resume-{}-{nonce}",
        std::process::id()
    ));
    std::fs::create_dir(&directory)?;
    let source_path = directory.join("original.vtt");
    let state_dir = directory.join("state");
    let profile_path = directory.join("profile.json");
    let output_path = directory.join("russian.vtt");
    let export_path = directory.join("russian-again.vtt");
    let edit_path = directory.join("edit.json");
    let edited_path = directory.join("edited.vtt");
    let edited_export_path = directory.join("edited-again.vtt");
    let source = source_with_nine_vtt_cues();
    std::fs::write(&source_path, &source)?;
    std::fs::write(&profile_path, PROFILE)?;

    let listener = TcpListener::bind("127.0.0.1:0")?;
    let endpoint = format!("http://{}/", listener.local_addr()?);
    let server = std::thread::spawn(move || serve(listener, 9, Some(9), None, "Привет."));
    let first = command(&[
        "translate-vtt",
        path(&source_path)?,
        path(&state_dir)?,
        path(&profile_path)?,
        &endpoint,
        path(&output_path)?,
    ])?;
    assert!(!first.status.success());
    assert!(String::from_utf8_lossy(&first.stderr).contains("saved_blocks=1/2"));
    server
        .join()
        .map_err(|_| "first VTT mock server panicked")??;
    assert!(!output_path.exists());
    let stdout = String::from_utf8(first.stdout)?;
    let run_id = stdout
        .split_whitespace()
        .find_map(|item| item.strip_prefix("run_id="))
        .ok_or("CLI did not report a VTT run ID")?;
    let run_id = RunId::parse(run_id)?;
    let db = TranslateDb::open(
        &state_dir.join("auralis-translate.sqlite"),
        SqliteConfig::default(),
    )?;
    assert_eq!(db.run_state(run_id)?, RunState::Failed);
    assert_eq!(db.checkpoints(run_id)?.len(), 1);
    let translation = db.translation(db.run(run_id)?.translation_id)?;
    assert_eq!(translation.source_format, "vtt");
    let segments = db.segments(translation.translation_id)?;
    assert_eq!(segments.len(), 9);
    assert_eq!(segments[0].cue_label, None);
    assert_eq!(segments[1].cue_label.as_deref(), Some("cue-two"));
    drop(db);

    let listener = TcpListener::bind("127.0.0.1:0")?;
    let endpoint = format!("http://{}/", listener.local_addr()?);
    let server = std::thread::spawn(move || serve(listener, 1, None, None, "Привет."));
    let resumed = command(&[
        "resume",
        path(&state_dir)?,
        &run_id.to_string(),
        path(&profile_path)?,
        &endpoint,
        path(&output_path)?,
    ])?;
    assert!(
        resumed.status.success(),
        "{}",
        String::from_utf8_lossy(&resumed.stderr)
    );
    server
        .join()
        .map_err(|_| "second VTT mock server panicked")??;
    assert_eq!(std::fs::read(&source_path)?, source);
    let translated = std::fs::read(&output_path)?;
    assert!(translated.starts_with(b"WEBVTT\r\n\r\nNOTE provenance\r\n"));
    assert!(
        translated
            .windows(b"cue-two".len())
            .any(|part| part == b"cue-two")
    );
    assert_eq!(
        translated
            .windows("Привет.".len())
            .filter(|part| *part == "Привет.".as_bytes())
            .count(),
        9
    );
    let db = TranslateDb::open(
        &state_dir.join("auralis-translate.sqlite"),
        SqliteConfig::default(),
    )?;
    assert_eq!(db.run_state(run_id)?, RunState::Validated);
    let base_result = db.result_for_run(run_id)?;
    assert_eq!(base_result.selected.len(), 9);
    drop(db);

    let export = command(&[
        "resume",
        path(&state_dir)?,
        &run_id.to_string(),
        path(&profile_path)?,
        "http://127.0.0.1:1/",
        path(&export_path)?,
    ])?;
    assert!(
        export.status.success(),
        "{}",
        String::from_utf8_lossy(&export.stderr)
    );
    assert_eq!(std::fs::read(&export_path)?, translated);
    std::fs::write(
        &edit_path,
        r#"{"schema_version":1,"segment_id":1,"lines":["Здравствуйте."]}"#,
    )?;
    let edited = command(&[
        "edit",
        path(&state_dir)?,
        &base_result.result_id.to_string(),
        path(&profile_path)?,
        path(&edit_path)?,
        path(&edited_path)?,
    ])?;
    assert!(
        edited.status.success(),
        "{}",
        String::from_utf8_lossy(&edited.stderr)
    );
    let edited_output = std::fs::read(&edited_path)?;
    assert!(String::from_utf8(edited_output.clone())?.contains("Здравствуйте."));
    assert_eq!(std::fs::read(&output_path)?, translated);
    let edited_export = command(&[
        "resume",
        path(&state_dir)?,
        &run_id.to_string(),
        path(&profile_path)?,
        "http://127.0.0.1:1/",
        path(&edited_export_path)?,
    ])?;
    assert!(
        edited_export.status.success(),
        "{}",
        String::from_utf8_lossy(&edited_export.stderr)
    );
    assert_eq!(std::fs::read(&edited_export_path)?, edited_output);
    std::fs::remove_dir_all(directory)?;
    Ok(())
}

#[test]
fn cli_rejects_unsupported_vtt_before_creating_run_state() -> Result<(), Box<dyn Error>> {
    let nonce = SystemTime::now().duration_since(UNIX_EPOCH)?.as_nanos();
    let directory = std::env::temp_dir().join(format!(
        "auralis-cli-vtt-invalid-{}-{nonce}",
        std::process::id()
    ));
    std::fs::create_dir(&directory)?;
    let source_path = directory.join("unsupported.vtt");
    let state_dir = directory.join("state");
    let profile_path = directory.join("profile.json");
    let output_path = directory.join("russian.vtt");
    let source = b"WEBVTT\n\nSTYLE\n::cue { color: red }\n\n00:01.000 --> 00:02.000\nhello\n";
    std::fs::write(&source_path, source)?;
    std::fs::write(&profile_path, PROFILE)?;
    let result = command(&[
        "translate-vtt",
        path(&source_path)?,
        path(&state_dir)?,
        path(&profile_path)?,
        "http://127.0.0.1:1/",
        path(&output_path)?,
    ])?;
    assert!(!result.status.success());
    assert!(!state_dir.exists());
    assert!(!output_path.exists());
    assert_eq!(std::fs::read(&source_path)?, source);
    std::fs::remove_dir_all(directory)?;
    Ok(())
}

#[test]
fn cli_pause_preserves_committed_blocks_and_resume_finishes() -> Result<(), Box<dyn Error>> {
    let nonce = SystemTime::now().duration_since(UNIX_EPOCH)?.as_nanos();
    let directory =
        std::env::temp_dir().join(format!("auralis-cli-pause-{}-{nonce}", std::process::id()));
    std::fs::create_dir(&directory)?;
    let source_path = directory.join("original.srt");
    let state_dir = directory.join("state");
    let profile_path = directory.join("profile.json");
    let output_path = directory.join("russian.srt");
    std::fs::write(&source_path, source_with_nine_cues())?;
    std::fs::write(&profile_path, PROFILE)?;

    let listener = TcpListener::bind("127.0.0.1:0")?;
    let endpoint = format!("http://{}/", listener.local_addr()?);
    let (ready_sender, ready_receiver) = mpsc::channel();
    let (release_sender, release_receiver) = mpsc::channel();
    let server = std::thread::spawn(move || {
        serve(
            listener,
            9,
            None,
            Some((ready_sender, release_receiver)),
            "Привет.",
        )
    });
    let mut child = Command::new(env!("CARGO_BIN_EXE_auralis-translation-cli"))
        .args([
            "translate",
            path(&source_path)?,
            path(&state_dir)?,
            path(&profile_path)?,
            &endpoint,
            path(&output_path)?,
        ])
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .spawn()?;
    let mut stdout = BufReader::new(child.stdout.take().ok_or("missing CLI stdout")?);
    let mut first_line = String::new();
    stdout.read_line(&mut first_line)?;
    let run_id = first_line
        .split_whitespace()
        .find_map(|item| item.strip_prefix("run_id="))
        .ok_or("CLI did not announce its run ID")?;
    let run_id = RunId::parse(run_id)?;
    ready_receiver.recv_timeout(Duration::from_secs(20))?;
    let pause = command(&["pause", path(&state_dir)?, &run_id.to_string()])?;
    assert!(
        pause.status.success(),
        "{}",
        String::from_utf8_lossy(&pause.stderr)
    );
    let status = command(&["status", path(&state_dir)?, &run_id.to_string()])?;
    let status: serde_json::Value = serde_json::from_slice(&status.stdout)?;
    assert_eq!(status["state"], "running");
    assert_eq!(status["pause_requested"], true);
    release_sender.send(())?;
    let output = child.wait_with_output()?;
    assert!(!output.status.success());
    assert!(String::from_utf8_lossy(&output.stderr).contains("pause requested"));
    server.join().map_err(|_| "pause mock server panicked")??;
    assert!(!output_path.exists());

    let db = TranslateDb::open(
        &state_dir.join("auralis-translate.sqlite"),
        SqliteConfig::default(),
    )?;
    assert_eq!(db.run_state(run_id)?, RunState::Paused);
    assert_eq!(db.checkpoints(run_id)?.len(), 1);
    assert!(!db.pause_requested(run_id)?);
    drop(db);
    let status = command(&["status", path(&state_dir)?, &run_id.to_string()])?;
    let status: serde_json::Value = serde_json::from_slice(&status.stdout)?;
    assert_eq!(status["state"], "paused");
    assert_eq!(status["pause_requested"], false);

    let listener = TcpListener::bind("127.0.0.1:0")?;
    let endpoint = format!("http://{}/", listener.local_addr()?);
    let server = std::thread::spawn(move || serve(listener, 1, None, None, "Привет."));
    let resumed = command(&[
        "resume",
        path(&state_dir)?,
        &run_id.to_string(),
        path(&profile_path)?,
        &endpoint,
        path(&output_path)?,
    ])?;
    assert!(
        resumed.status.success(),
        "{}",
        String::from_utf8_lossy(&resumed.stderr)
    );
    server.join().map_err(|_| "resume mock server panicked")??;
    assert!(output_path.exists());
    std::fs::remove_dir_all(directory)?;
    Ok(())
}

#[test]
fn cli_profile_retry_limit_is_recorded_in_checkpoint() -> Result<(), Box<dyn Error>> {
    let nonce = SystemTime::now().duration_since(UNIX_EPOCH)?.as_nanos();
    let directory =
        std::env::temp_dir().join(format!("auralis-cli-retry-{}-{nonce}", std::process::id()));
    std::fs::create_dir(&directory)?;
    let source_path = directory.join("original.srt");
    let state_dir = directory.join("state");
    let profile_path = directory.join("profile.json");
    let output_path = directory.join("russian.srt");
    std::fs::write(
        &source_path,
        b"1\n00:00:01,000 --> 00:00:02,000\n\xe4\xbd\xa0\xe5\xa5\xbd\xe3\x80\x82\n",
    )?;
    let mut profile: serde_json::Value = serde_json::from_slice(PROFILE)?;
    profile["max_block_attempts"] = serde_json::json!(2);
    std::fs::write(&profile_path, serde_json::to_vec(&profile)?)?;

    let listener = TcpListener::bind("127.0.0.1:0")?;
    let endpoint = format!("http://{}/", listener.local_addr()?);
    let server = std::thread::spawn(move || serve(listener, 2, Some(1), None, "Привет."));
    let output = command(&[
        "translate",
        path(&source_path)?,
        path(&state_dir)?,
        path(&profile_path)?,
        &endpoint,
        path(&output_path)?,
    ])?;
    assert!(
        output.status.success(),
        "{}",
        String::from_utf8_lossy(&output.stderr)
    );
    server.join().map_err(|_| "retry mock server panicked")??;
    let stdout = String::from_utf8(output.stdout)?;
    let run_id = stdout
        .split_whitespace()
        .find_map(|item| item.strip_prefix("run_id="))
        .ok_or("CLI did not announce its run ID")?;
    let run_id = RunId::parse(run_id)?;
    let db = TranslateDb::open(
        &state_dir.join("auralis-translate.sqlite"),
        SqliteConfig::default(),
    )?;
    assert_eq!(db.run_state(run_id)?, RunState::Validated);
    assert_eq!(db.checkpoints(run_id)?[0].attempt_count, 2);
    assert!(output_path.exists());
    drop(db);
    std::fs::remove_dir_all(directory)?;
    Ok(())
}

#[test]
fn cli_keeps_structural_result_and_reports_quality_warnings() -> Result<(), Box<dyn Error>> {
    let nonce = SystemTime::now().duration_since(UNIX_EPOCH)?.as_nanos();
    let directory = std::env::temp_dir().join(format!(
        "auralis-cli-warning-{}-{nonce}",
        std::process::id()
    ));
    std::fs::create_dir(&directory)?;
    let source_path = directory.join("original.srt");
    let state_dir = directory.join("state");
    let profile_path = directory.join("profile.json");
    let output_path = directory.join("russian.srt");
    let source = b"1\n00:00:01,000 --> 00:00:02,000\n\xe4\xbd\xa0\xe5\xa5\xbd\xe3\x80\x82\n";
    std::fs::write(&source_path, source)?;
    std::fs::write(&profile_path, PROFILE)?;

    let listener = TcpListener::bind("127.0.0.1:0")?;
    let endpoint = format!("http://{}/", listener.local_addr()?);
    let server = std::thread::spawn(move || serve(listener, 1, None, None, "你好。"));
    let output = command(&[
        "translate",
        path(&source_path)?,
        path(&state_dir)?,
        path(&profile_path)?,
        &endpoint,
        path(&output_path)?,
    ])?;
    assert!(
        output.status.success(),
        "{}",
        String::from_utf8_lossy(&output.stderr)
    );
    server
        .join()
        .map_err(|_| "warning mock server panicked")??;
    assert_eq!(std::fs::read(&source_path)?, source);
    assert_eq!(std::fs::read(&output_path)?, source);
    let stdout = String::from_utf8(output.stdout)?;
    let run_id = stdout
        .split_whitespace()
        .find_map(|item| item.strip_prefix("run_id="))
        .ok_or("CLI did not announce its run ID")?;
    let run_id = RunId::parse(run_id)?;

    let status = command(&["status", path(&state_dir)?, &run_id.to_string()])?;
    let status: serde_json::Value = serde_json::from_slice(&status.stdout)?;
    assert_eq!(status["state"], "validated");
    assert_eq!(status["review_state"], "needs_review");
    assert_eq!(status["warning_count"], 2);
    let report = command(&["diagnostics", path(&state_dir)?, &run_id.to_string()])?;
    let report: serde_json::Value = serde_json::from_slice(&report.stdout)?;
    assert_eq!(report["warnings"][0]["code"], "unchanged_source");
    assert_eq!(report["warnings"][1]["code"], "no_cyrillic");
    assert_eq!(report["warnings"][0]["segment_id"], 1);
    std::fs::remove_dir_all(directory)?;
    Ok(())
}

fn source_with_nine_cues() -> Vec<u8> {
    let mut text = String::new();
    for index in 1..=9 {
        text.push_str(&format!(
            "{index}\n00:00:{index:02},000 --> 00:00:{:02},000\n你好。\n\n",
            index + 1
        ));
    }
    text.into_bytes()
}

fn source_with_nine_vtt_cues() -> Vec<u8> {
    let mut text = String::from("WEBVTT\r\n\r\nNOTE provenance\r\nsynthetic\r\n\r\n");
    for index in 1..=9 {
        if index == 2 {
            text.push_str("cue-two\r\n");
        }
        text.push_str(&format!(
            "00:{index:02}.000 --> 00:{:02}.000\r\n你好。\r\n\r\n",
            index + 1
        ));
    }
    text.into_bytes()
}

fn command(args: &[&str]) -> Result<std::process::Output, Box<dyn Error>> {
    Ok(Command::new(env!("CARGO_BIN_EXE_auralis-translation-cli"))
        .args(args)
        .output()?)
}

fn path(path: &Path) -> Result<&str, Box<dyn Error>> {
    Ok(path.to_str().ok_or("test path must be Unicode")?)
}

fn serve(
    listener: TcpListener,
    count: usize,
    fail_on: Option<usize>,
    pause_handshake: Option<(mpsc::Sender<()>, mpsc::Receiver<()>)>,
    translated_text: &str,
) -> Result<(), String> {
    listener
        .set_nonblocking(true)
        .map_err(|error| error.to_string())?;
    let started = Instant::now();
    for request_index in 1..=count {
        let mut stream = loop {
            match listener.accept() {
                Ok((stream, _)) => break stream,
                Err(error) if error.kind() == std::io::ErrorKind::WouldBlock => {
                    if started.elapsed() > Duration::from_secs(20) {
                        return Err(format!("timed out waiting for request {request_index}"));
                    }
                    std::thread::sleep(Duration::from_millis(10));
                }
                Err(error) => return Err(error.to_string()),
            }
        };
        stream
            .set_nonblocking(false)
            .map_err(|error| error.to_string())?;
        stream
            .set_read_timeout(Some(Duration::from_secs(5)))
            .map_err(|error| error.to_string())?;
        read_request(&mut stream)?;
        if request_index == count
            && let Some((ready, release)) = &pause_handshake
        {
            ready.send(()).map_err(|error| error.to_string())?;
            release
                .recv_timeout(Duration::from_secs(20))
                .map_err(|error| error.to_string())?;
        }
        let finish = if fail_on == Some(request_index) {
            "length"
        } else {
            "stop"
        };
        let body = serde_json::json!({
            "choices": [{"message": {"content": translated_text}, "finish_reason": finish}]
        })
        .to_string();
        let response = format!(
            "HTTP/1.1 200 OK\r\nContent-Type: application/json\r\nContent-Length: {}\r\nConnection: close\r\n\r\n{body}",
            body.len()
        );
        stream
            .write_all(response.as_bytes())
            .map_err(|error| error.to_string())?;
    }
    Ok(())
}

fn read_request(stream: &mut std::net::TcpStream) -> Result<(), String> {
    let mut raw = Vec::new();
    let mut buffer = [0_u8; 4096];
    loop {
        let count = stream
            .read(&mut buffer)
            .map_err(|error| error.to_string())?;
        if count == 0 {
            return Err("request ended early".into());
        }
        raw.extend_from_slice(&buffer[..count]);
        if let Some(header_end) = raw.windows(4).position(|part| part == b"\r\n\r\n") {
            let header =
                std::str::from_utf8(&raw[..header_end]).map_err(|error| error.to_string())?;
            let length = header
                .lines()
                .find_map(|line| {
                    line.to_ascii_lowercase()
                        .strip_prefix("content-length: ")
                        .and_then(|value| value.parse::<usize>().ok())
                })
                .ok_or("missing request length")?;
            if raw.len() >= header_end + 4 + length {
                return Ok(());
            }
        }
    }
}
