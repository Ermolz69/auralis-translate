# RELEASE-05 interim self-audit after real restaurant audio

Date: 1 October 2026. This updates the [previous incomplete self-audit](2026-10-01-release-readiness-after-sethlui-retry.md)
with the [real Auralis TTS and full-media technical result](2026-10-01-sethlui-real-audio-technical-result.md).
It is a **failed readiness audit**, not a final `RELEASE-05` pass. The committed
candidate requirement cannot be met while prerequisite gates remain open.

| Gate | Current evidence and unmet condition |
| --- | --- |
| G1–G2 | The original 263-cue Chinese SRT is preserved and a separate structurally valid Russian SRT exists. No admitted source, reviewed final translation or selected release candidate exists. |
| G3–G5 | Zero eligible holdout cues and zero independent bilingual ratings. AI inspection still flags a dim sum role error and inconsistent venue name (`REG-044`); no approved glossary or whole-scene adequacy verdict exists. |
| G6 | The pinned 7B translation has one 308,207-ms run with 71,212 prompt and 10,259 completion tokens, sampled peak process RAM 5,072,789,504 B and whole-device GPU 6,906 MiB. The final resource/SLA envelope and model selection are unapproved. |
| G7–G8 | Durable 263-cue checkpoints, failed-run retention, copied-state recovery and byte-identical offline export are present. The final candidate crash, upgrade and host-consumer matrix is incomplete. |
| G9 | No clean unseeded Windows install and offline final-endpoint translation. Native desktop remains owner-deferred. |
| A1–A3 | Auralis generated and checked 263 real Russian SAPI WAVs on the same source, but the script is unreviewed; 256 cue overruns and 236 overlaps fail timing fit. Source speech alignment, rights and managed selected-result handoff remain open. |
| A4–A6 | A full 738,056-ms private audio track was assembled, decoded and played by FFplay with no packet gap over 1 ms. No human listened or rated it, no approved three-scene 10–20-minute pilot exists, and no dubbing release candidate is admitted. |

Technical checks and one process playback cannot substitute for human
translation or sound judgments. The final `RELEASE-05` remains blocked by its
explicit prerequisites, and this result does not reclassify `VOICE-02`–`VOICE-07`
as done. Exact hashes, failed attempts and a rollback baseline remain in the
linked records. The private media can be deleted without changing the
preserved Chinese source, Russian candidate, SQLite translation history or
published earlier comparisons; revert only the scoped evidence commits if
the public report must be withdrawn.
