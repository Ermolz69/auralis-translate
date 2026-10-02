use auralis_translation::{
    ApprovedTerm, ApprovedTerms, ContractError, SegmentId, SourceSegment, TargetSegment,
    audit_approved_terms,
};
use std::error::Error;

#[test]
fn audits_complete_saved_result_and_rejects_missing_or_misordered_lines()
-> Result<(), Box<dyn Error>> {
    let id = |value| SegmentId::new(value).ok_or("segment ID");
    let source = vec![
        SourceSegment::new(id(1)?, 0, 1000, vec!["海湾餐厅开门了。".into()])?,
        SourceSegment::new(
            id(2)?,
            1000,
            2000,
            vec!["海湾餐厅又开门了。".into(), "海湾餐馆也开门了。".into()],
        )?,
        SourceSegment::new(id(3)?, 2000, 3000, vec!["海湾餐厅关门了。".into()])?,
    ];
    let terms = ApprovedTerms::new(vec![ApprovedTerm::new(
        "海湾餐厅".into(),
        "Хайвань".into(),
        vec!["Хайваня".into()],
        vec![id(1)?, id(2)?, id(3)?],
        "fixture-reviewer".into(),
        "fixture-evidence".into(),
    )?])?;
    let accepted = vec![
        TargetSegment {
            id: id(1)?,
            lines: vec!["Заведение открылось.".into()],
        },
        TargetSegment {
            id: id(2)?,
            lines: vec!["Мы у Хайваня.".into(), "Другая столовая открылась.".into()],
        },
        TargetSegment {
            id: id(3)?,
            lines: vec!["Заведение закрылось.".into()],
        },
    ];
    let audit = audit_approved_terms(&source, &accepted, &terms)?;
    assert_eq!(audit.checked_term_pairs, 3);
    assert_eq!(
        audit
            .warnings
            .iter()
            .map(|warning| (
                warning.segment_id.get(),
                warning.line_index,
                warning.term_index
            ))
            .collect::<Vec<_>>(),
        [(1, 0, 0), (3, 0, 0)]
    );
    assert_eq!(
        audit_approved_terms(&source, &accepted[..2], &terms),
        Err(ContractError::ResponseIds)
    );
    let mut misordered = accepted.clone();
    misordered.swap(1, 2);
    assert_eq!(
        audit_approved_terms(&source, &misordered, &terms),
        Err(ContractError::ResponseIds)
    );
    let mut shortened = accepted.clone();
    shortened[1].lines.pop();
    assert_eq!(
        audit_approved_terms(&source, &shortened, &terms),
        Err(ContractError::ResponseLines)
    );
    Ok(())
}
