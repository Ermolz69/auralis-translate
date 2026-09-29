# YouTube Mandarin source: bounded caption inventory

Date: 29 September 2026. Task: DATA-03. This is source discovery for private
development testing, not corpus admission, holdout creation or permission to
redistribute media. The user explicitly allowed finding a YouTube source and
extracting its Chinese subtitles for tests on the current machine.

One candidate is [Mingfay Chinese's residential walk](https://www.youtube.com/watch?v=0hoTgJKET7Q).
The creator's public description says Chinese, Pinyin and English subtitle
tracks were added. That statement does not establish which track is manually
authored, speech alignment, standard Mandarin, license or usable length. The
candidate ID is frozen as `0hoTgJKET7Q`; no alternate ID or translated caption
track may be substituted in this inventory.

The installed `yt-dlp` executable at
`C:\Users\Ermolz\AppData\Local\Programs\yt-dlp\yt-dlp.exe` reports version
`2026.07.04` and SHA-256
`52FE3C26DCF71FBDC85B528589020BB0B8E383155CFA81B64DD447BBE35E24B8`.
Use `task eval:data:youtube:mingfay:inventory`. The task checks this hash,
then allows one `--dump-single-json --skip-download --no-playlist` request with
a 90-second wall cap. It records the raw extractor response or failure in a
fresh ignored `.cache/eval/youtube-mingfay/` directory, including executable
identity, UTC timing, exit status, stderr, metadata SHA-256, duration, license,
language and subtitle versus automatic-caption track keys. No video or subtitle
bytes are downloaded in this step. There are no retries; a failed inventory is
retained and reported before planning any caption acquisition.

If a genuine Chinese track exists, the next separately bounded step must pin
its language key, format, URL, file digest and cue syntax, then privately check
sampled speech/subtitle alignment and provenance. Use only a development split.
No Russian reference or sealed holdout is inferred from English subtitles.
If the platform license is absent or restrictive, keep media and text out of
the public report and publish only permitted metadata and hashes. Full audio
acceptance still needs rights, independent review and listening.
