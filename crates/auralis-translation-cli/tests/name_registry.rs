#[path = "support/machine_workspace.rs"]
mod machine_workspace;
#[path = "support/name_registry_server.rs"]
#[allow(dead_code)]
mod name_registry_server;
use auralis_translation::{RunId, SOURCE_NAME_EXTRACTION_POLICY, SourceHash, TranslationId};
use auralis_translation_llamacpp::name_registry_policy_sha256;
use auralis_translation_sqlite::{SqliteConfig, TranslateDb};
use serde_json::{Value, json};
use std::{error::Error, process::Command};

#[test]
fn fresh_worker_resumes_registry_without_proposals_and_reexports_old_revision()
-> Result<(), Box<dyn Error>> {
    let workspace = machine_workspace::MachineWorkspace::new()?;
    let source = workspace.0.join("source.srt");
    let model = workspace.0.join("mock-model.gguf");
    let profile_path = workspace.0.join("profile.json");
    let scene = workspace.0.join("scene.json");
    let proposals = workspace.0.join("names.json");
    let state = workspace.0.join("state");
    let output = workspace.0.join("result.srt");
    let original = "1\n00:00:01,000 --> 00:00:02,000\n小王，请进。\n\n2\n00:00:02,000 --> 00:00:03,000\n小王，请坐。\n";
    std::fs::write(&source, original)?;
    std::fs::write(&model, b"owned mock model")?;
    let mut profile: Value = serde_json::from_slice(include_bytes!(
        "../../../models/manifests/hy_mt2_7b_q4_k_m.context_v8_target_first_batch1.experimental.json"
    ))?;
    profile["model_file_sha256"] = SourceHash::digest(b"owned mock model").to_string().into();
    profile["model_file_bytes"] = 16.into();
    profile["name_registry_policy_sha256"] = name_registry_policy_sha256().into();
    profile["max_name_proposals_entries"] = 8.into();
    profile["max_name_proposals_bytes"] = 4096.into();
    std::fs::write(&profile_path, serde_json::to_vec(&profile)?)?;
    std::fs::write(
        &scene,
        serde_json::to_vec(
            &json!({"schema_version":1,"source_sha256":SourceHash::digest(original.as_bytes()).to_string(),
        "evidence_id":"owned-name-recovery-fixture","scene_end_ids":[2]}),
        )?,
    )?;
    let mut payload = json!({"schema_version":1,"source_sha256":SourceHash::digest(original.as_bytes()).to_string(),"extraction_policy_id":SOURCE_NAME_EXTRACTION_POLICY,
        "expected_revision":1,"proposals":[]});
    std::fs::write(&proposals, serde_json::to_vec(&payload)?)?;
    let cli = env!("CARGO_BIN_EXE_auralis-translation-cli");
    let listener = std::net::TcpListener::bind("127.0.0.1:0")?;
    let endpoint = format!("http://{}/", listener.local_addr()?);
    let server_model = model.to_str().ok_or("model path")?.to_owned();
    let server =
        std::thread::spawn(move || name_registry_server::serve(listener, server_model, true));
    let first = Command::new(cli)
        .arg("translate-v8-names")
        .arg(&source)
        .arg(&state)
        .arg(&profile_path)
        .arg(&scene)
        .arg(&proposals)
        .arg(endpoint)
        .arg(&output)
        .output()?;
    assert!(!first.status.success());
    assert_eq!(server.join().map_err(|_| "server")??, [1, 2]);
    assert!(!output.exists());
    let stdout = String::from_utf8(first.stdout)?;
    let run_id = RunId::parse(
        stdout
            .split_whitespace()
            .find_map(|p| p.strip_prefix("run_id="))
            .ok_or("run")?,
    )?;
    let db = TranslateDb::open(
        &state.join("auralis-translate.sqlite"),
        SqliteConfig::default(),
    )?;
    let checkpoint = db.checkpoints(run_id)?;
    assert_eq!(checkpoint.len(), 1);
    assert!(
        db.inference_requests(run_id)?
            .iter()
            .any(|r| r.finish.as_ref().is_some_and(|f| f
                .raw_response
                .as_ref()
                .is_some_and(|raw| String::from_utf8_lossy(raw).contains("not valid JSON"))))
    );
    let translation = db.run(run_id)?.translation_id;
    drop(db);
    let listener = std::net::TcpListener::bind("127.0.0.1:0")?;
    let endpoint = format!("http://{}/", listener.local_addr()?);
    let server_model = model.to_str().ok_or("model path")?.to_owned();
    let server =
        std::thread::spawn(move || name_registry_server::serve(listener, server_model, false));
    let resumed = Command::new(cli)
        .arg("resume")
        .arg(&state)
        .arg(run_id.to_string())
        .arg(&profile_path)
        .arg(endpoint)
        .arg(&output)
        .output()?;
    let resumed_server = server.join().map_err(|_| "server")?;
    assert!(
        resumed.status.success(),
        "CLI: {}; server: {resumed_server:?}",
        String::from_utf8_lossy(&resumed.stderr),
    );
    assert_eq!(resumed_server?, [2]);
    let db = TranslateDb::open(
        &state.join("auralis-translate.sqlite"),
        SqliteConfig::default(),
    )?;
    assert_eq!(db.checkpoints(run_id)?[0], checkpoint[0]);
    assert_eq!(db.checkpoints(run_id)?.len(), 2);
    drop(db);
    payload["proposals"] = json!([{"entity_id":1,"chinese":"小王","scene_index":0,
        "russian":"Сяо Вань","origin":"model","evidence_id":"owned-mock-proposal"}]);
    std::fs::write(&proposals, serde_json::to_vec(&payload)?)?;
    let revised = Command::new(cli)
        .arg("revise-name-proposals")
        .arg(&state)
        .arg(translation.to_string())
        .arg(&proposals)
        .output()?;
    assert!(revised.status.success());
    let export = workspace.0.join("old-result-export.srt");
    let exported = Command::new(cli)
        .arg("resume")
        .arg(&state)
        .arg(run_id.to_string())
        .arg(&profile_path)
        .arg("http://127.0.0.1:1/")
        .arg(&export)
        .output()?;
    assert!(
        exported.status.success(),
        "{}",
        String::from_utf8_lossy(&exported.stderr)
    );
    assert_eq!(std::fs::read(&export)?, std::fs::read(&output)?);
    assert_eq!(std::fs::read(&source)?, original.as_bytes());
    Ok(())
}

#[test]
fn persisted_names_survive_failed_start_and_changed_revision_refuses_resume()
-> Result<(), Box<dyn Error>> {
    let workspace = machine_workspace::MachineWorkspace::new()?;
    let source = workspace.0.join("source.srt");
    let profile_path = workspace.0.join("profile.json");
    let scene = workspace.0.join("scene.json");
    let proposals = workspace.0.join("names.json");
    let state = workspace.0.join("state");
    let output = workspace.0.join("output.srt");
    let original = "1\n00:00:01,000 --> 00:00:02,000\n小王，请进。\n\n2\n00:00:02,000 --> 00:00:03,000\n明天见。\n";
    std::fs::write(&source, original)?;
    let mut profile: Value = serde_json::from_slice(include_bytes!(
        "../../../models/manifests/hy_mt2_7b_q4_k_m.context_v8_target_first_batch1.experimental.json"
    ))?;
    profile["name_registry_policy_sha256"] = name_registry_policy_sha256().into();
    profile["max_name_proposals_entries"] = 8.into();
    profile["max_name_proposals_bytes"] = 4096.into();
    std::fs::write(&profile_path, serde_json::to_vec(&profile)?)?;
    std::fs::write(
        &scene,
        serde_json::to_vec(&json!({"schema_version":1,
        "source_sha256":SourceHash::digest(original.as_bytes()).to_string(),"evidence_id":"authored-name-scene","scene_end_ids":[2]}))?,
    )?;
    let mut payload = json!({"schema_version":1,"source_sha256":SourceHash::digest(original.as_bytes()).to_string(),
        "extraction_policy_id":SOURCE_NAME_EXTRACTION_POLICY,"expected_revision":1,"proposals":[{"entity_id":1,"chinese":"小王","scene_index":0,
            "russian":"Сяо Ван","origin":"model","evidence_id":"source-only-ai-proposal"}]});
    std::fs::write(&proposals, serde_json::to_vec(&payload)?)?;
    let cli = env!("CARGO_BIN_EXE_auralis-translation-cli");
    let start = Command::new(cli)
        .arg("translate-v8-names")
        .arg(&source)
        .arg(&state)
        .arg(&profile_path)
        .arg(&scene)
        .arg(&proposals)
        .arg("http://127.0.0.1:1/")
        .arg(&output)
        .output()?;
    assert!(!start.status.success());
    let stdout = String::from_utf8(start.stdout)?;
    let run_id = RunId::parse(
        stdout
            .split_whitespace()
            .find_map(|part| part.strip_prefix("run_id="))
            .ok_or("run")?,
    )?;
    let translation_id = TranslationId::parse(
        stdout
            .split_whitespace()
            .find_map(|part| part.strip_prefix("translation_id="))
            .ok_or("translation")?,
    )?;
    let db = TranslateDb::open(
        &state.join("auralis-translate.sqlite"),
        SqliteConfig::default(),
    )?;
    let saved = db.name_registry_for_run(run_id)?.ok_or("registry")?;
    assert_eq!(
        saved.entries()[0]
            .proposal
            .as_ref()
            .ok_or("proposal")?
            .russian,
        "Сяо Ван"
    );
    assert!(db.checkpoints(run_id)?.is_empty());
    drop(db);
    std::fs::write(&proposals, b"external file is no longer consulted")?;
    let resume = || {
        Command::new(cli)
            .arg("resume")
            .arg(&state)
            .arg(run_id.to_string())
            .arg(&profile_path)
            .arg("http://127.0.0.1:1/")
            .arg(&output)
            .output()
    };
    let before = resume()?;
    assert!(!before.status.success());
    assert!(!String::from_utf8_lossy(&before.stderr).contains("name registry changed"));
    payload["proposals"][0]["russian"] = "Сяо Ваня".into();
    std::fs::write(&proposals, serde_json::to_vec(&payload)?)?;
    let revise = Command::new(cli)
        .arg("revise-name-proposals")
        .arg(&state)
        .arg(translation_id.to_string())
        .arg(&proposals)
        .output()?;
    assert!(
        revise.status.success(),
        "{}",
        String::from_utf8_lossy(&revise.stderr)
    );
    let after = resume()?;
    assert!(!after.status.success());
    assert!(
        String::from_utf8_lossy(&after.stderr).contains("name registry changed; start a fresh run")
    );
    assert_eq!(std::fs::read(&source)?, original.as_bytes());
    assert!(!output.exists());
    Ok(())
}
