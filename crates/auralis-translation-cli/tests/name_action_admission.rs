#[path = "support/machine_workspace.rs"]
mod machine_workspace;
#[path = "support/name_registry_server.rs"]
#[allow(dead_code)]
mod name_registry_server;
use auralis_translation::{InferenceRequestKind, InferenceRequestOutcome, RunId, SourceHash};
use auralis_translation_llamacpp::name_proposal_admission_sha256;
use auralis_translation_sqlite::{SqliteConfig, TranslateDb};
use serde_json::{Value, json};
use std::{error::Error, process::Command};

#[test]
fn wrong_and_plausible_named_responses_are_durable_rejections_without_retry()
-> Result<(), Box<dyn Error>> {
    for reply in [
        "Пожалуйста, передайте файл мне.",
        "Сяо Ли, во сколько ты сможешь прийти?",
    ] {
        let workspace = machine_workspace::MachineWorkspace::new()?;
        let source = workspace.0.join("source.srt");
        let model = workspace.0.join("mock-model.gguf");
        let profile_path = workspace.0.join("profile.json");
        let scene = workspace.0.join("scene.json");
        let proposals = workspace.0.join("proposals.json");
        let state = workspace.0.join("state");
        let output = workspace.0.join("result.srt");
        let original = "1\n00:00:01,000 --> 00:00:02,000\n小李，你几点能来？\n\n2\n00:00:02,000 --> 00:00:03,000\n请把文件交给我。\n";
        std::fs::write(&source, original)?;
        std::fs::write(&model, b"owned mock model")?;
        let mut profile: Value = serde_json::from_slice(include_bytes!(
            "../../../models/manifests/hy_mt2_1_8b_q4_k_m.context_v8_source_names_batch1.experimental.json"
        ))?;
        profile["model_alias"] = "auralis-hy-mt2-7b-q4".into();
        profile["model_file_sha256"] = SourceHash::digest(b"owned mock model").to_string().into();
        profile["model_file_bytes"] = 16.into();
        profile["name_proposal_admission_sha256"] = name_proposal_admission_sha256().into();
        std::fs::write(&profile_path, serde_json::to_vec(&profile)?)?;
        std::fs::write(
            &scene,
            serde_json::to_vec(&json!({"schema_version":1,
            "source_sha256":SourceHash::digest(original.as_bytes()).to_string(),"evidence_id":"owned-reg063",
            "scene_end_ids":[2]}))?,
        )?;
        std::fs::write(
            &proposals,
            serde_json::to_vec(&json!({"schema_version":1,
            "source_sha256":SourceHash::digest(original.as_bytes()).to_string(),
            "extraction_policy_id":"chinese-explicit-address-v1","expected_revision":1,
            "proposals":[{"entity_id":1,"chinese":"小李","scene_index":0,"russian":"Сяо Ли",
                "origin":"model","evidence_id":"source-only-unreviewed"}]}))?,
        )?;
        let listener = std::net::TcpListener::bind("127.0.0.1:0")?;
        let endpoint = format!("http://{}/", listener.local_addr()?);
        let model_path = model.to_str().ok_or("path")?.to_owned();
        let response = reply.to_owned();
        let server = std::thread::spawn(move || {
            name_registry_server::serve_review_rejection(listener, model_path, response)
        });
        let run = Command::new(env!("CARGO_BIN_EXE_auralis-translation-cli"))
            .arg("--json")
            .arg("translate-v8-names")
            .arg(&source)
            .arg(&state)
            .arg(&profile_path)
            .arg(&scene)
            .arg(&proposals)
            .arg(endpoint)
            .arg(&output)
            .output()?;
        assert!(!run.status.success());
        assert_eq!(server.join().map_err(|_| "server")??, [1]);
        let envelope: Value = serde_json::from_slice(&run.stdout)?;
        assert!(
            String::from_utf8_lossy(&run.stdout).contains("name_proposal_review_required"),
            "{envelope}"
        );
        let db_path = state.join("auralis-translate.sqlite");
        let db = TranslateDb::open(&db_path, SqliteConfig::default())?;
        let run_id = RunId::parse(envelope["run"]["run_id"].as_str().ok_or("run ID")?)?;
        assert!(db.checkpoints(run_id)?.is_empty());
        let requests = db.inference_requests(run_id)?;
        let chats: Vec<_> = requests
            .iter()
            .filter(|r| r.start.kind == InferenceRequestKind::ChatCompletion)
            .collect();
        assert_eq!(chats.len(), 1);
        let finish = chats[0].finish.as_ref().ok_or("finish")?;
        assert_eq!(finish.outcome, InferenceRequestOutcome::InvalidCandidate);
        assert!(
            finish
                .error_detail
                .as_ref()
                .ok_or("reason")?
                .contains("name_proposal_review_required")
        );
        assert!(
            String::from_utf8_lossy(finish.raw_response.as_ref().ok_or("raw")?).contains(reply)
        );
        assert_eq!(
            serde_json::from_str::<Vec<String>>(
                finish.restored_candidate.as_ref().ok_or("candidate")?
            )?,
            [reply]
        );
        let saved = requests.clone();
        let registry = db.name_registry_for_run(run_id)?.ok_or("registry")?;
        assert!(
            registry
                .entries()
                .iter()
                .all(|e| e.status == auralis_translation::NameStatus::NeedsReview)
        );
        drop(db);
        let db = TranslateDb::open(&db_path, SqliteConfig::default())?;
        assert_eq!(db.inference_requests(run_id)?, saved);
        assert_eq!(db.name_registry_for_run(run_id)?, Some(registry));
        assert!(db.checkpoints(run_id)?.is_empty());
        assert!(!output.exists());
        assert_eq!(std::fs::read(&source)?, original.as_bytes());
    }
    Ok(())
}

#[test]
fn neighbor_only_name_keeps_actual_request_bytes_and_accepted_prefix() -> Result<(), Box<dyn Error>>
{
    let mut first_requests = Vec::new();
    for guarded in [false, true] {
        let workspace = machine_workspace::MachineWorkspace::new()?;
        let source = workspace.0.join("source.srt");
        let model = workspace.0.join("model.gguf");
        let profile_path = workspace.0.join("profile.json");
        let scene = workspace.0.join("scene.json");
        let proposals = workspace.0.join("names.json");
        let state = workspace.0.join("state");
        let output = workspace.0.join("result.srt");
        let original = "1\n00:00:01,000 --> 00:00:02,000\n你几点能来？\n\n2\n00:00:02,000 --> 00:00:03,000\n小李，请进。\n";
        std::fs::write(&source, original)?;
        std::fs::write(&model, b"owned mock model")?;
        let mut profile: Value = serde_json::from_slice(include_bytes!(
            "../../../models/manifests/hy_mt2_1_8b_q4_k_m.context_v8_target_first_batch1.experimental.json"
        ))?;
        profile["model_alias"] = "auralis-hy-mt2-7b-q4".into();
        profile["model_file_sha256"] = SourceHash::digest(b"owned mock model").to_string().into();
        profile["model_file_bytes"] = 16.into();
        if guarded {
            profile["name_registry_policy_sha256"] =
                auralis_translation_llamacpp::name_registry_policy_sha256().into();
            profile["max_name_proposals_entries"] = 8.into();
            profile["max_name_proposals_bytes"] = 4096.into();
            profile["name_proposal_admission_sha256"] = name_proposal_admission_sha256().into();
        }
        std::fs::write(&profile_path, serde_json::to_vec(&profile)?)?;
        std::fs::write(
            &scene,
            serde_json::to_vec(
                &json!({"schema_version":1,"source_sha256":SourceHash::digest(original.as_bytes()).to_string(),"evidence_id":"owned-neighbor-only-name","scene_end_ids":[2]}),
            )?,
        )?;
        std::fs::write(
            &proposals,
            serde_json::to_vec(
                &json!({"schema_version":1,"source_sha256":SourceHash::digest(original.as_bytes()).to_string(),"extraction_policy_id":"chinese-explicit-address-v1","expected_revision":1,
            "proposals":[{"entity_id":1,"chinese":"小李","scene_index":0,"russian":"Сяо Ли","origin":"model","evidence_id":"unreviewed"}]}),
            )?,
        )?;
        let listener = std::net::TcpListener::bind("127.0.0.1:0")?;
        let endpoint = format!("http://{}/", listener.local_addr()?);
        let model_path = model.to_str().ok_or("model")?.to_owned();
        let server = std::thread::spawn(move || {
            name_registry_server::serve_two_targets(listener, model_path)
        });
        let mut command = Command::new(env!("CARGO_BIN_EXE_auralis-translation-cli"));
        if guarded {
            command.arg("--json");
        }
        command
            .arg(if guarded {
                "translate-v8-names"
            } else {
                "translate-v5-scene"
            })
            .arg(&source)
            .arg(&state)
            .arg(&profile_path)
            .arg(&scene);
        if guarded {
            command.arg(&proposals);
        }
        let run = command.arg(endpoint).arg(&output).output()?;
        let server_result = server.join().map_err(|_| "server")?;
        assert!(
            server_result.is_ok(),
            "server: {server_result:?}; CLI stdout: {}; stderr: {}",
            String::from_utf8_lossy(&run.stdout),
            String::from_utf8_lossy(&run.stderr)
        );
        assert_eq!(server_result?, [1, 2]);
        assert_eq!(run.status.success(), !guarded);
        let stdout = String::from_utf8(run.stdout)?;
        let run_id = if guarded {
            let summary: Value = serde_json::from_str(&stdout)?;
            RunId::parse(summary["run"]["run_id"].as_str().ok_or("run")?)?
        } else {
            RunId::parse(
                stdout
                    .split_whitespace()
                    .find_map(|word| word.strip_prefix("run_id="))
                    .ok_or("run")?,
            )?
        };
        let db = TranslateDb::open(
            &state.join("auralis-translate.sqlite"),
            SqliteConfig::default(),
        )?;
        let checkpoints = db.checkpoints(run_id)?;
        assert_eq!(checkpoints.len(), if guarded { 1 } else { 2 });
        let chats: Vec<_> = db
            .inference_requests(run_id)?
            .into_iter()
            .filter(|r| r.start.kind == InferenceRequestKind::ChatCompletion)
            .collect();
        first_requests.push(chats[0].start.rendered_request.clone());
        assert_eq!(
            chats[0].finish.as_ref().ok_or("finish")?.outcome,
            InferenceRequestOutcome::ValidatedBatch
        );
        if guarded {
            assert_eq!(
                chats[1].finish.as_ref().ok_or("finish")?.outcome,
                InferenceRequestOutcome::InvalidCandidate
            );
            assert!(!output.exists());
            drop(db);
            let db = TranslateDb::open(
                &state.join("auralis-translate.sqlite"),
                SqliteConfig::default(),
            )?;
            assert_eq!(db.checkpoints(run_id)?, checkpoints);
        }
        assert_eq!(std::fs::read(&source)?, original.as_bytes());
    }
    assert_eq!(first_requests[0], first_requests[1]);
    Ok(())
}
