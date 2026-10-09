# Source quantity feature v2 bounded correction

Date: 10 October 2026. Tasks: `EVAL-04`, `LONG-04`. The retained v1
report made 20 source-only marks and exposed five false positives.
This v2 screen uses the **same pinned Chinese source** solely as an open
development replay, not a holdout. The original v1 code and report must
stay unchanged. No translation output, model, ASR, TTS or network call.

Before the scan, add deterministic controls for the five source cue
families: ordinal discussion labels, ordinary `一点`, and two adjacent
chip model names. Add positive countercases for a real first item count,
an explicit one o'clock time, 30–36 months, 2–3 years and 4 nm.
The v2 classifier may strip ordinal labels, require an explicit clock
context for bare one o'clock, and forbid joining digits to a Chinese
unit across whitespace. One offline 467-cue replay, no retry of this
identity, at most 20 seconds. Retain exact v1/v2 IDs and source-text
hashes in public reports without Chinese text. Admission only to a
*future* source-only sampler requires all authored controls and all five
known v1 false positives to behave as expected. It cannot establish
precision, recall, a model winner or full-file quality. Preserve any new
false positives and reject v2 if found; do not alter REG-073 retroactively.
