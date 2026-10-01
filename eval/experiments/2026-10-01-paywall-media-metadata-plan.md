# Frozen Paywall matching-media metadata request

Date: 1 October 2026. Task: partial `DATA-03`. The [Internet Archive item](https://archive.org/details/PaywallTheBusinessOfScholarshipFinalMovieMastered)
credits Jason Schmitt and marks the movie CC BY 4.0. Its [file listing](https://archive.org/download/PaywallTheBusinessOfScholarshipFinalMovieMastered)
shows the original 7.2-GiB MP4 and an approximately 280.7-MiB OGV derivative.
The retained 880-cue Chinese SRT spans 10,000–3,745,164 ms; the exact video
duration and OGV hash/bytes are still unknown.

Fetch the Internet Archive JSON metadata for this exact item once, with no
retry, HTTPS only, a 45-second timeout and a 2-MiB response cap. Retain raw
response and report in a unique ignored workspace. Extract only matching OGV
name, declared size/checksums if present, title, creator, license and source
identity. A future media acquisition must get its own bounded plan and command.
Do not infer speech/caption alignment or Russian/audio quality from metadata.
