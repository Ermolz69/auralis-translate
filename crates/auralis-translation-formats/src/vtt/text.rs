use super::VttErrorCode;

pub(crate) fn validate(text: &str) -> Result<(), VttErrorCode> {
    if text.is_empty() || text.contains('\r') || text.contains('\n') {
        return Err(VttErrorCode::TranslationLines);
    }
    if text.contains(['<', '>', '&']) || text.contains("-->") {
        return Err(VttErrorCode::UnsupportedFeature);
    }
    if text.chars().any(char::is_control) || text.contains('\u{feff}') {
        return Err(VttErrorCode::UnsupportedControl);
    }
    Ok(())
}
