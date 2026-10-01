# Frozen one-call restaurant YouTube metadata and license screen

Date: 1 October 2026. Partial `DATA-03` rights/provenance triage only. The
[Commons file page](https://commons.wikimedia.org/wiki/File:Inside_One_Of_Singapore%E2%80%99s_Most_Refined_Cantonese_Kitchen_-_Behind_The_Plate_(Turn_on_CC).webm)
names YouTube video `yvCR-EqMhng`, SETHLUI.com, a March 2026 source and an
unreviewed CC BY 3.0 claim whose template explicitly says it applies before
August 2025. The mismatch and absent independent license review prevent
rights admission. The imported Chinese TimedText revision also has no
verified original-caption author/license. Question: does a single metadata-only
query to the named YouTube original expose an explicit license and caption
track that narrows, but cannot by itself clear, these questions?

Use the installed yt-dlp executable SHA-256
`52fe3c26dcf71fbdc85b528589020bb0b8e383155cfa81b64dd447bbe35e24b8`.
Run one `--dump-single-json --skip-download --no-playlist --no-warnings
--retries 0` request for `https://www.youtube.com/watch?v=yvCR-EqMhng` with
90-second wall timeout, 12 MiB bounded output, no video/subtitle download,
no retry and no credentials. Retain exact stdout/stderr, hashes, exit/time,
extractor identity and parsed video ID/uploader/date/duration/license and
caption-language metadata under ignored `.cache/eval/`. Run the Taskfile
preflight first and retain any failure. Do not infer subtitle rights from a
video license field, infer a verified free license from the Commons upload, or
promote source eligibility without license review and human speech alignment.
No model prompt, reference or holdout is involved.
