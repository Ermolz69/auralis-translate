# Source-only quantity feature for future long-file sampling

Date: 10 October 2026. Tasks: `EVAL-04`, `LONG-04`. The frozen Vivo
blind-spot review found that generic Chinese `一个` triggered two numeric
windows without a meaningful measured quantity. The original v1 selector,
its freeze, packets, report and decisions are immutable. This diagnostic
will define a **new** source-only feature for future samples. It is not a
prompt, translation change, model comparison or re-selection of REG-073.

Use the pinned 467-cue Chinese SRT SHA-256
`b100803367b95fa55fc638b1ff39a0abfa0d5b8183ebe58d58b1a87242d9d8c4`.
Predeclare positives: Arabic or Chinese numerals tied to time, duration,
currency, percentage, physical/computing units or explicit count words;
predeclare negatives: bare `一个`/`一种`, ordinal/product labels such as
`X200`, and numbers appearing only in cue IDs/timings. Author unit
controls for both, including negation and two-to-three-year ranges.
One offline source scan, zero model/ASR/TTS/network calls, at most 467
source cues and 20 seconds. Record matched cue IDs, source-text hashes,
feature identity, count by file third and false-positive/false-negative
limitations, without public Chinese text. Do not read Russian drafts or
alter any existing sample. Promotion is restricted to a future
predeclared selector; no present quality gate changes.
