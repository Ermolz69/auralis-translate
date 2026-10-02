# RELEASE-05 committed-candidate self-audit 5: release withheld

Date: 2 October 2026. Audited the committed Translate engineering candidate
`aefe805a79f5039f65453d73451404d0a5b2d4dd` against the frozen
[PLAN-03 scope](2026-09-28-goal-scope-v1.md), the
[G1–G9/A1–A6 criteria](../../docs/RELEASE_ACCEPTANCE.md) and the
[canonical backlog](../../docs/IMPLEMENTATION_BACKLOG.md). This is a
self-audit, not independent Chinese–Russian or audio review. The
[preceding audit](2026-10-02-release-05-audit-attempt-v4.md) and every failed
model/source attempt remain retained. No threshold or selected source changed.

Translate candidate commits: `217dfa1` (SQLite v9 journal), `30eae08`
(experimental v7 multi-slot implementation) and `82e2a40` (frozen real-model
failure/REG-051), with public report `aefe805`. Author and committer of all
four commits are the checked primary global identity
`Ermolz <00ermzahar@gmail.com>`. The unrelated local edit to
`docs/architecture/014-result-history-selection.md` remains outside all four
commits. The Auralis real-SAPI engineering branch stays local and unreleased
at `9e25b648f15b0ebe6afde2aa42dbd27461964fe8`; the parent Auralis checkout
was not modified in this slice.

## Gate ledger for this candidate

| Gate | Observed evidence | Audit decision |
| --- | --- | --- |
| G1–G2 | The earlier v6 restaurant SRT has 263/263 structural checkpoints and an immutable original. V7 maps multiple slots in deterministic tests, journals raw requests and rejects the repeated wrong first cue before checkpoint; [real screen](2026-10-02-v7-authored-batch-result.md) stopped at 0/4 and published no result. | Partial engineering evidence. V7 has no complete natural-file candidate or release coverage. |
| G3–G5 | Current inventory: 11 tracks, 10 media groups, 3,243 inspected cue slots, **zero eligible**. No independent Chinese–Russian reviewer or approved term denominator. The 1.8B v7 model copied a ticket price into a neighboring Wang cue under the correct ID; REG-051 catches only the explicit currency. | Fail. No valid 95% adequacy, zero-critical-error, or 98% terminology score. Semantic context leakage remains open. |
| G6–G8 | The v6 7B restaurant run measured 308,207 ms, 71,212 prompt and 10,259 completion tokens. V7's two permitted real attempts stopped at the first or second cue; the 1-vs-4 batch comparison never reached its second arm. V8→v9 migration and old-result tests passed. | Open. No selected-profile SLA, full fault matrix, target-consumer matrix or final export. |
| G9 | No unseeded clean Windows installation through a selected package and real delivery endpoint. Windows Sandbox executable was absent on this host and optional-feature inspection lacked elevation; this is not a clean target. Desktop remains owner-deferred. | Fail. No substitute with CLI/mocks. |
| A1–A3 | Earlier private real-SAPI 263-WAV/738,056-ms MKV technical pilot exists. All WAVs decoded; 256 cue overruns and 236 overlapping starts remain. The 36,904-packet continuity check passed with a 1-ms maximum internal gap. | Fail on reviewed translation/script lineage, duration fit and voice approval. Packet continuity is narrower. |
| A4–A6 | Full FFplay process playback and six paired clips covering 49 cues were technically completed. There are zero human listening forms, zero approved 10–20-minute scenes, and no verified Chinese speech alignment/rights for that source. | Fail. No perceptual or delivery acceptance. |

## Exact checks and experiment disposition

After the v9/v7 changes, `task test:long-batch-v7`, `task
test:result-edits`, `task test:admission`, `task test:cli:protocol`, `task
fmt`, `task lint` and full `task test` passed. `task
eval:regression:catalog:check` verified REG-001–051 and its controls. `task
eval:long:v7:authored:check` verified all three frozen attempts against their
private report hashes. `task plan:check`, `task docs:check`, `task site:build`
and `task site:check` passed. The last deterministic v7 change added a
duplicate-ID response case and was followed by `task test:long-batch-v7`.

The first authored v7 attempt was sandbox-blocked before chat. The second ran
on the pinned 1.8B Q4_K_M model SHA
`dc5f44fcf1fa496ee7ad725982c0c8c553a4de00259b53af84c4b89fb0c06699`
and llama.cpp runtime SHA
`6f15be27bd80b6b4d52afefa49094e18fcfab55d5da354d717971f2d2537b2f4`:
its first cue was wrongly accepted, its second rejected, and no output file
published. The one predeclared repeat with new template SHA
`ce656a9de73244909c200f0f40e2e4fe2b8eb8c278d371fcc790677e50bf0c05`
returned the same wrong first text and was rejected before any checkpoint.
Each first request used 240 prompt and 49 completion tokens. Raw response,
rendered input, accepted candidate, elapsed time, source/model/runtime/binary
hash and sampled memory are in the private reports; the public summary
exposes their hashes. These two stopped runs are **not** a batch efficiency
comparison or semantic approval. The model was not retrained and quantization
precision was not changed because reviewed residual-error measurements are
still missing.

[Pages run 37034806768](https://github.com/Ermolz69/auralis-translate/actions/runs/37034806768)
published commit `aefe805` successfully. `task site:live:check` verified the
[current page](https://ermolz69.github.io/auralis-translate/?revision=aefe805a79f5039f65453d73451404d0a5b2d4dd)
byte-identical at 33,723 bytes, SHA-256
`f6d1e5178b820fabc54ce3b5fecf39e51be5f61d69fdb38c24b3a3e7cd6db64e`;
the [history](https://ermolz69.github.io/auralis-translate/history.html?revision=aefe805a79f5039f65453d73451404d0a5b2d4dd)
was byte-identical at 1,131,286 bytes, SHA-256
`52d740a633983366d6c6a06491ea81c4a6ed7dd6ba4f6ab09fc782ad6638aa04`.
The live current page was also inspected through the browser accessibility
tree and narrow viewport screenshot; it displayed REG-051 and the open gate
status. No release package hash, final reviewed model/profile, approved spoken
script or three-scene listener score exists.

## Unblock and rollback

Do not contact volunteers: the owner explicitly declined outreach, and none
was sent. Continue independent diagnostic work on context salience, natural
source acquisition/alignment and audio fit without representing it as release
acceptance. A complete Goal would still need an authorized independent
Chinese–Russian reviewer/adjudicator, Russian listeners for voice quality,
an eligible rights/alignment-checked natural source, a clean Windows target,
and the owner's scheduling decision for the deferred desktop endpoint.
Japanese and subtitle-free ASR remain separate. If those external resources
remain unavailable, keep the gates failed rather than lowering them.

For rollback, retain the earlier verified v6 profile and model/runtime assets;
start a new compatible run or restore an owned database backup and offline
export. Never downgrade the only live SQLite copy or overwrite originals.
The Translate report can be restored from the previous verified Pages commit
`e4bc99d4fc12b0310c1cf035adc6c6d14c1f7f4d` on a new branch and
republished, preserving this failed evidence and the unrelated local edit.

**RELEASE-05 fails and remains planned. The Goal is incomplete.**
