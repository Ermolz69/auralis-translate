# Bounded copy-only recovery of the two failed natural v8 runs

Date: 2 October 2026. Partial `LONG-01` / `LONG-02` / `EVAL-04`.
The frozen [first attempts](2026-10-02-v8-asus-natural-long-result.md)
left 216 and 140 durable cues but no full SRT. This follow-up is a
**known-development recovery test**, not a new unbiased sample. The
original failed state, raw response logs, source SRT and paired media
remain immutable. No Russian reference or prior accepted translation is
sent to either model.

Copy each arm's complete state directory to a fresh ignored workspace.
Patch only the copied SQLite `translations.source_locator` to its copied
managed source path, then verify source, scene map, profile fingerprint,
checkpoint count and run ID. This relocation is necessary because the
standalone run stores an absolute managed-source locator. Run exactly one
`resume` command on each copied failed state, 1.8B then 7B, against the
same pinned GGUF, manifest, source, provisional scene map and llama.cpp
binary as the first attempts. The release CLI is rebuilt from the committed
provider fix and its new SHA-256 is recorded before use. The run IDs and
prior raw trace hashes are fixed by the public first-attempt report.

| Limit | Per arm |
| --- | ---: |
| Resume commands | 1 |
| Additional chat requests | 268 |
| Additional template/tokenizer calls | 536 |
| CLI wall time | 15 minutes |
| Server readiness | 3 minutes |
| Model retries/regenerations inside this experiment | 0 |

Total wall budget: 40 minutes. Stop an arm on the first failed response;
retain its raw journal and all new durable checkpoints. A failed arm does
not block the other if shared source/runtime identities and hardware remain
valid. No manual correction of model output is allowed. If a full SRT is
published, verify all 268 IDs, exact timing and protected bytes, original
source hash, beginning/middle/end and every batch seam; record AI risk
findings separately from human acceptance. If either arm fails, retain
its partial checkpoint count and no-output status. The current source is
private development material with unresolved subtitle rights and voice
alignment; never publish source or translation text. Human bilingual review,
independent listening, scene-cut accuracy and release acceptance stay open.

Run `task eval:long:v8:asus:resume:preflight`, then
`task eval:long:v8:asus:resume:probe` once. Use
`task eval:long:v8:asus:resume:report` and
`task eval:long:v8:asus:resume:check` to retain and verify the outcome.
