# ASUS capacity-warning development and whole-file audit plan

Frozen: 1 October 2026, before implementation or running the new detector.
Partial `EVAL-04` and `LONG-04` fact-protection work on the unchanged ASUS v6
candidate. The [physical-unit whole-file audit](2026-10-01-asus-whole-file-measurement-v3-result.md)
found that cue 83 changes a source `512G` storage capacity to a different
number of Russian gigabytes. This is AI-identified source-fact triage; no
independent bilingual rating is available.

Question: can a conservative, separately typed capacity review warning catch
that numeric change while keeping equivalent memory/storage wording and
ambiguous code/weight lines unflagged? The exact private Chinese SRT and
Russian candidate SRT have SHA-256 values
`923aed3991c2308d92b89c45181cea8ec7ece74e9b4d3a3ce0234d95e329913b`
and `aa74b20d4255f46c9a23ddfd0865dd2e221e7b08ab3cbceb8665be3b0c7b6e8b`.
No reference, corrected line or holdout answer enters a model request; this
experiment sends **zero model requests**.

First add a red authored minimal case and unrelated positive/negative
controls for `GB`, contextual uppercase `G`, decimals, product codes and
mixed weight/capacity. Implement the
[v1 boundary](../../docs/reference/capacity-warning-v1.md) in core and verify
the durable diagnostic path without changing checkpoint acceptance. Then
make exactly one read-only audit of all 268 pinned source/candidate cue pairs,
checking hashes, IDs and timing before reporting warning IDs only. Maximum
one audit attempt, two minutes wall time, zero model tokens and no retries
after success. If the audit reveals a false positive or missed admitted
case, retain that failure and create a new minimal reproduction and controls
before changing the contract. The earlier physical-unit warning counts and
all archived SRT, SQLite and audio artifacts remain unchanged. No automated
warning or AI interpretation is a human translation-quality score.
