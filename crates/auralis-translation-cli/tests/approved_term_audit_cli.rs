#[path = "support/machine_workspace.rs"]
mod machine_workspace;

use auralis_translation::SourceHash;
use machine_workspace::MachineWorkspace;
use serde_json::{Value, json};
use std::{error::Error, path::Path, process::Command};

const SOURCE: &str = "1\n00:00:00,000 --> 00:00:01,000\n海湾餐厅开门了。\n\n2\n00:00:01,000 --> 00:00:03,000\n海湾餐厅又开门了。\n海湾餐馆也开门了。\n\n3\n00:00:03,000 --> 00:00:04,000\n海湾餐厅关门了。\n";
const RESULT: &str = "1\n00:00:00,000 --> 00:00:01,000\nЗаведение открылось.\n\n2\n00:00:01,000 --> 00:00:03,000\nМы у Хайваня.\nДругая столовая открылась.\n\n3\n00:00:03,000 --> 00:00:04,000\nЗаведение закрылось.\n";

fn invoke(request: &Path) -> Result<(std::process::Output, Value), Box<dyn Error>> {
    let output = Command::new(env!("CARGO_BIN_EXE_auralis-translation-cli"))
        .arg("--json")
        .arg("--request")
        .arg(request)
        .output()?;
    let response = serde_json::from_slice(&output.stdout)?;
    Ok((output, response))
}

fn timestamp(milliseconds: usize) -> String {
    let hours = milliseconds / 3_600_000;
    let minutes = milliseconds / 60_000 % 60;
    let seconds = milliseconds / 1_000 % 60;
    let remainder = milliseconds % 1_000;
    format!("{hours:02}:{minutes:02}:{seconds:02},{remainder:03}")
}

#[test]
fn audits_all_result_lines_without_writing_or_claiming_human_review() -> Result<(), Box<dyn Error>>
{
    let workspace = MachineWorkspace::new()?;
    let source = workspace.0.join("source.srt");
    let result = workspace.0.join("result.srt");
    let scene = workspace.0.join("scene.json");
    let terms = workspace.0.join("terms.json");
    let request = workspace.0.join("request.json");
    std::fs::write(&source, SOURCE)?;
    std::fs::write(&result, RESULT)?;
    let scene_bytes = serde_json::to_vec(&json!({
        "schema_version": 1,
        "source_sha256": SourceHash::digest(SOURCE.as_bytes()).to_string(),
        "evidence_id": "authored-scene",
        "scene_end_ids": [3]
    }))?;
    std::fs::write(&scene, &scene_bytes)?;
    let terms_bytes = serde_json::to_vec(&json!({
        "schema_version": 1,
        "source_sha256": SourceHash::digest(SOURCE.as_bytes()).to_string(),
        "scene_map_sha256": SourceHash::digest(&scene_bytes).to_string(),
        "terms": [{
            "source": "海湾餐厅", "target": "Хайвань", "allowed_forms": ["Хайваня"],
            "segment_ids": [1, 2, 3], "reviewer_id": "fixture-reviewer",
            "evidence_id": "fixture-evidence"
        }]
    }))?;
    std::fs::write(&terms, &terms_bytes)?;
    std::fs::write(
        &request,
        serde_json::to_vec(&json!({
            "schema_version": 1,
            "request": {"command": "audit-terms", "source": source, "result": result,
                        "scene_map": scene, "terms_ledger": terms}
        }))?,
    )?;

    let (output, response) = invoke(&request)?;
    assert_eq!(output.status.code(), Some(0));
    let report = &response["report"]["report"];
    assert_eq!(
        report["source_sha256"],
        SourceHash::digest(SOURCE.as_bytes()).to_string()
    );
    assert_eq!(
        report["result_sha256"],
        SourceHash::digest(RESULT.as_bytes()).to_string()
    );
    assert_eq!(report["segments"], 3);
    assert_eq!(report["target_lines"], 4);
    assert_eq!(report["checked_term_lines"], 3);
    assert_eq!(report["human_review"], "not_performed");
    assert_eq!(report["assessment"], "form_screen_only");
    assert_eq!(report["warnings"].as_array().ok_or("warnings")?.len(), 2);
    assert_eq!(report["warnings"][0]["segment_id"], 1);
    assert_eq!(report["warnings"][1]["segment_id"], 3);
    assert_eq!(std::fs::read(&source)?, SOURCE.as_bytes());
    assert_eq!(std::fs::read(&result)?, RESULT.as_bytes());
    assert_eq!(std::fs::read(&scene)?, scene_bytes);
    assert_eq!(std::fs::read(&terms)?, terms_bytes);

    let changed_timing = RESULT.replace(
        "00:00:03,000 --> 00:00:04,000",
        "00:00:03,010 --> 00:00:04,000",
    );
    std::fs::write(&result, changed_timing)?;
    let (invalid, failure) = invoke(&request)?;
    assert_eq!(invalid.status.code(), Some(2));
    assert_eq!(failure["terminal"]["code"], "invalid_source");
    assert!(failure["report"].is_null());

    std::fs::write(&result, RESULT)?;
    let mut bad_terms: Value = serde_json::from_slice(&terms_bytes)?;
    bad_terms["terms"][0]["segment_ids"] = json!([1, 2, 4]);
    std::fs::write(&terms, serde_json::to_vec(&bad_terms)?)?;
    let (invalid, failure) = invoke(&request)?;
    assert_eq!(invalid.status.code(), Some(2));
    assert_eq!(failure["terminal"]["code"], "invalid_input");
    assert!(failure["report"].is_null());

    std::fs::write(&terms, &terms_bytes)?;
    let complete = RESULT
        .replace("Заведение открылось.", "Хайвань открылся.")
        .replace("Заведение закрылось.", "Хайвань закрылся.");
    std::fs::write(&result, complete)?;
    let (valid, response) = invoke(&request)?;
    assert_eq!(valid.status.code(), Some(0));
    assert_eq!(response["report"]["report"]["warnings"], json!([]));
    assert_eq!(
        response["report"]["report"]["human_review"],
        "not_performed"
    );
    Ok(())
}

#[test]
fn scans_first_seam_and_final_cues_of_1024_cue_result() -> Result<(), Box<dyn Error>> {
    let workspace = MachineWorkspace::new()?;
    let source_path = workspace.0.join("long-source.srt");
    let result_path = workspace.0.join("long-result.srt");
    let scene_path = workspace.0.join("long-scene.json");
    let terms_path = workspace.0.join("long-terms.json");
    let mut source = String::new();
    let mut result = String::new();
    for cue in 1..=1024 {
        let start = timestamp((cue - 1) * 1_000);
        let end = timestamp((cue - 1) * 1_000 + 800);
        let chinese = match cue {
            1 | 512 | 1024 => "海湾餐厅开门了。",
            511 | 513 => "海湾餐馆开门了。",
            _ => "旁白。",
        };
        source.push_str(&format!("{cue}\n{start} --> {end}\n{chinese}\n\n"));
        result.push_str(&format!("{cue}\n{start} --> {end}\nРассказчик.\n\n"));
    }
    std::fs::write(&source_path, &source)?;
    std::fs::write(&result_path, &result)?;
    let scene = serde_json::to_vec(&json!({
        "schema_version": 1,
        "source_sha256": SourceHash::digest(source.as_bytes()).to_string(),
        "evidence_id": "authored-long-scene",
        "scene_end_ids": [512, 1024]
    }))?;
    std::fs::write(&scene_path, &scene)?;
    let terms = serde_json::to_vec(&json!({
        "schema_version": 1,
        "source_sha256": SourceHash::digest(source.as_bytes()).to_string(),
        "scene_map_sha256": SourceHash::digest(&scene).to_string(),
        "terms": [{
            "source": "海湾餐厅", "target": "Хайвань", "allowed_forms": [],
            "segment_ids": [1, 512, 1024], "reviewer_id": "fixture-reviewer",
            "evidence_id": "fixture-evidence"
        }]
    }))?;
    std::fs::write(&terms_path, &terms)?;
    let output = Command::new(env!("CARGO_BIN_EXE_auralis-translation-cli"))
        .arg("--json")
        .arg("audit-terms")
        .arg(&source_path)
        .arg(&result_path)
        .arg(&scene_path)
        .arg(&terms_path)
        .output()?;
    assert_eq!(output.status.code(), Some(0));
    let response: Value = serde_json::from_slice(&output.stdout)?;
    let report = &response["report"]["report"];
    assert_eq!(report["segments"], 1024);
    assert_eq!(report["target_lines"], 1024);
    assert_eq!(report["checked_term_lines"], 3);
    let warnings = report["warnings"].as_array().ok_or("warnings")?;
    assert_eq!(warnings.len(), 3);
    assert_eq!(
        warnings
            .iter()
            .map(|item| item["segment_id"].as_u64())
            .collect::<Vec<_>>(),
        vec![Some(1), Some(512), Some(1024)]
    );
    assert_eq!(std::fs::read(&source_path)?, source.as_bytes());
    assert_eq!(std::fs::read(&result_path)?, result.as_bytes());
    assert_eq!(std::fs::read(&scene_path)?, scene);
    assert_eq!(std::fs::read(&terms_path)?, terms);
    Ok(())
}
