use super::AssetDownloadError;
use reqwest::blocking::Response;
use reqwest::header::CONTENT_RANGE;

pub(super) fn verify_partial_range(
    response: &Response,
    offset: u64,
    expected: u64,
) -> Result<(), AssetDownloadError> {
    let value = response
        .headers()
        .get(CONTENT_RANGE)
        .and_then(|value| value.to_str().ok())
        .ok_or(AssetDownloadError::Response(
            "partial response has no Content-Range",
        ))?;
    let fields = value
        .strip_prefix("bytes ")
        .and_then(|value| value.split_once('/'))
        .and_then(|(range, total)| {
            range
                .split_once('-')
                .map(|(start, end)| (start, end, total))
        })
        .ok_or(AssetDownloadError::Response("Content-Range is invalid"))?;
    let (start, end, total) = (
        fields.0.parse::<u64>(),
        fields.1.parse::<u64>(),
        fields.2.parse::<u64>(),
    );
    let (Ok(start), Ok(end), Ok(total)) = (start, end, total) else {
        return Err(AssetDownloadError::Response("Content-Range is invalid"));
    };
    if start != offset || end < start || end.checked_add(1) != Some(expected) || total != expected {
        return Err(AssetDownloadError::Response(
            "partial response range differs from pinned asset length",
        ));
    }
    if response
        .content_length()
        .is_some_and(|length| length != expected - offset)
    {
        return Err(AssetDownloadError::Response(
            "partial response length differs from Content-Range",
        ));
    }
    Ok(())
}
