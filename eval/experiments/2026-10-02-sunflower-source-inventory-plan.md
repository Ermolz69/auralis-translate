# Thirty-minute Mandarin speech source: bounded caption inventory plan

Date: 2 October 2026. Scope: `DATA-03` discovery only. This plan is frozen
before the request. The source group is `sunflower-movement-g0v-2014`; it is
unassigned to development or sealed holdout. No references, expected Russian
meaning, model calls, TTS, media/caption download or public corpus admission
belong to this probe.

The candidate is the [30:19 Commons video](https://commons.wikimedia.org/wiki/File:%E3%80%8E%E5%A4%AA%E9%99%BD%E8%8A%B1%E5%AD%B8%E9%81%8B%E3%80%8F2014-03-22_%E5%8F%8D%E9%BB%91%E7%AE%B1%E6%9C%8D%E8%B2%BF-%E8%A1%97%E9%A0%AD%E6%B0%91%E4%B8%BB%E6%95%99%E5%AE%A4%E5%90%B3%E5%8F%A1%E4%BA%BA.webm),
original YouTube ID `VQyTbi74bmk`, by g0v.tw. Commons categorizes the media as
Standard Mandarin, declares CC BY 3.0 for **the video**, and records Roy17's
14 August 2019 review of the original-platform license. The subtitle track,
its authorship/rights, scene alignment and independent language review remain
unknown. Video rights do not establish subtitle rights.

`task eval:data:youtube:sunflower:inventory` runs pinned `yt-dlp` SHA-256
`52fe3c26dcf71fbdc85b528589020bb0b8e383155cfa81b64dd447bbe35e24b8`
exactly once with `--dump-single-json --skip-download --no-playlist`, zero
retries, 90-second wall limit and 12 MiB combined output limit. It saves raw
stdout, stderr, executable hash, budget and selected metadata under ignored
`.cache/eval/youtube-sunflower/inventory-*`, including failures. Signed URLs
stay private. One failed attempt does not authorize an unplanned retry.

The only decision here is whether the original platform advertises a Chinese
manual timed-text track. A track listing permits a separate bounded acquisition
plan; absence or extractor failure ends this candidate screen. No candidate is
eligible until exact subtitle provenance, syntax, media timing and speech
alignment are checked and the review requirements are met.
