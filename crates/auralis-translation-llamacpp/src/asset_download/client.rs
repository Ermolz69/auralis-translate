use super::AssetDownloadError;
use reqwest::Url;
use reqwest::blocking::Client;
use reqwest::redirect::Policy;
use std::io;
use std::time::Duration;

const CONNECT_TIMEOUT: Duration = Duration::from_secs(20);
const TRANSFER_TIMEOUT: Duration = Duration::from_secs(1800);
const MAX_REDIRECTS: usize = 6;
const REDIRECT_HOSTS: &[&str] = &[
    "github.com",
    "raw.githubusercontent.com",
    "release-assets.githubusercontent.com",
    "objects.githubusercontent.com",
];

pub fn release_download_client() -> Result<Client, AssetDownloadError> {
    Ok(Client::builder()
        .connect_timeout(CONNECT_TIMEOUT)
        .timeout(TRANSFER_TIMEOUT)
        .no_gzip()
        .no_brotli()
        .no_zstd()
        .no_deflate()
        .redirect(Policy::custom(|attempt| {
            if attempt.previous().len() >= MAX_REDIRECTS || !allowed_redirect(attempt.url()) {
                return attempt.error(io::Error::other("untrusted or excessive asset redirect"));
            }
            attempt.follow()
        }))
        .build()?)
}

fn allowed_redirect(url: &Url) -> bool {
    url.scheme() == "https"
        && url.username().is_empty()
        && url.password().is_none()
        && url.port().is_none()
        && url.host_str().is_some_and(|host| {
            REDIRECT_HOSTS.contains(&host)
                || host == "huggingface.co"
                || host.ends_with(".huggingface.co")
                || host == "hf.co"
                || host.ends_with(".hf.co")
        })
}
