use auralis_translation::source_capacity_mismatch;
use sha2::{Digest, Sha256};
use std::{env, error::Error, fs};

#[test]
#[ignore = "requires pinned private full ASUS source and candidate files"]
fn archived_asus_whole_file_capacity_warning_ids() -> Result<(), Box<dyn Error>> {
    let source = read_pinned(
        "AURALIS_PRIVATE_ASUS_SOURCE",
        "923aed3991c2308d92b89c45181cea8ec7ece74e9b4d3a3ce0234d95e329913b",
    )?;
    let candidate = read_pinned(
        "AURALIS_PRIVATE_ASUS_CANDIDATE",
        "aa74b20d4255f46c9a23ddfd0865dd2e221e7b08ab3cbceb8665be3b0c7b6e8b",
    )?;
    let original_cues = cues(&source);
    let translated_cues = cues(&candidate);
    assert_eq!(original_cues.len(), 268);
    assert_eq!(translated_cues.len(), original_cues.len());
    let mut flagged = Vec::new();
    for (index, (original, translated)) in
        original_cues.iter().zip(translated_cues.iter()).enumerate()
    {
        let original = cue_lines(original);
        let translated = cue_lines(translated);
        let cue_id = index + 1;
        assert_eq!(original.len(), 3, "source cue {cue_id} shape changed");
        assert_eq!(
            translated.len(),
            original.len(),
            "cue {cue_id} line count changed"
        );
        assert_eq!(original[0], cue_id.to_string(), "source cue order changed");
        assert_eq!(translated[0], original[0], "cue {cue_id} identity changed");
        assert_eq!(translated[1], original[1], "cue {cue_id} timing changed");
        if source_capacity_mismatch(original[2], translated[2]) {
            flagged.push(cue_id);
        }
    }
    println!(
        "Pinned ASUS v6 whole-file capacity review warnings: {} of 268 cues; IDs {flagged:?}",
        flagged.len()
    );
    assert!(flagged.contains(&83));
    Ok(())
}

fn read_pinned(variable: &str, expected_sha256: &str) -> Result<String, Box<dyn Error>> {
    let path = env::var_os(variable).ok_or("private ASUS path is required")?;
    let bytes = fs::read(path)?;
    assert_eq!(format!("{:x}", Sha256::digest(&bytes)), expected_sha256);
    Ok(String::from_utf8(bytes)?)
}

fn cues(text: &str) -> Vec<&str> {
    text.trim_end_matches('\n').split("\n\n").collect()
}

fn cue_lines(cue: &str) -> Vec<&str> {
    cue.split('\n').collect()
}
