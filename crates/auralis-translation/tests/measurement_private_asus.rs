use auralis_translation::source_measurement_mismatch;
use serde_json::Value;
use sha2::{Digest, Sha256};
use std::{env, error::Error, fs};

#[test]
#[ignore = "requires the pinned private natural-source review packet"]
fn archived_asus_units_raise_review_warnings() -> Result<(), Box<dyn Error>> {
    let path = env::var_os("AURALIS_PRIVATE_ASUS_V6_PACKET")
        .ok_or("AURALIS_PRIVATE_ASUS_V6_PACKET is required")?;
    let bytes = fs::read(path)?;
    assert_eq!(
        format!("{:x}", Sha256::digest(&bytes)),
        "da15e4cf479513ba1a41fc5e86f7802e6531e7c51c5a855e30f675d533485a6a"
    );
    let packet: Value = serde_json::from_slice(&bytes)?;
    assert_eq!(packet["sample_count"], 44);
    assert_eq!(packet["human_review_count"], 0);
    let rows = packet["rows"].as_array().ok_or("missing rows")?;
    let flagged = rows
        .iter()
        .filter_map(|row| {
            let source = row["source_text"].as_str()?;
            let candidate = row["accepted_text"].as_str()?;
            source_measurement_mismatch(source, candidate).then(|| row["id"].as_u64())?
        })
        .collect::<Vec<_>>();
    assert!(flagged.contains(&12));
    assert!(flagged.contains(&227));
    println!("Pinned ASUS v6 source-selected measurement warning IDs: {flagged:?}");
    Ok(())
}
