# Vivo focus-slot v1: candidate rejected

Date: 10 October 2026. This is the result of the
[frozen 20-chat plan](2026-10-10-vivo-focus-slot-v1-plan.md) and
[request schedule](2026-10-10-vivo-focus-slot-v1-freeze.json), SHA-256
`f9783e5df2e62d260995d771427747846422cab7fc3a3f99ab7a8dccd59349d6`.
The source, model, manifest and runtime identities are pinned there. All
cases are exposed development, not sealed holdout or independent reference.
Neither arm received a Russian reference or a prior model answer.

## Real paired result

The local 7B answered **20/20 chats** with the requested target IDs and
passed **40/40** template/tokenizer preflights. All 10 Chinese source
inventories matched across batch and focus requests. One seed 101, no retry,
9,606 combined tokens and 58,407 ms total wall time stayed below the
declared caps. Batch arm: 4,102 prompt / 1,466 completion tokens and 35,276
ms summed chat time. Focus arm: 3,553 / 485 tokens and 12,886 ms. Focus
returns one target instead of three/four, so these figures do **not**
establish a whole-file speed gain. Eleven resource samples found peak tracked
working set 5,063,168,000 bytes; device-wide GPU use peaked at 7,767 MiB
and includes other processes; no sampler error was recorded.

The complete private report SHA-256 is
`9f6fb7b80962cd664888e0463ca2177e9cf9f32af528ebc536c1d48e55f32436`;
the private 20-reply journal is
`bc6508be55d9e9862a54a60102b36de4db427c3281eb5ff9fb2ba12ee32f4de7`.
Their exact request/reply and focus-text hashes, tokens and times are in the
[source-free machine report](../reports/2026-10-10-vivo-focus-slot-v1.json),
SHA-256 `d779f08043e3410f78f25613ed7bf3ed1ef6c15d75019ed3494b9860e6dd2b75`.
The [separate AI source-aware triage](../reports/2026-10-10-vivo-focus-slot-v1-ai-review.json),
SHA-256 `c35520b4214f7ca64c2525bc6d63a94eeaba865f063a9932bb8f5a6bc2d18064`,
is not a human rating; independent Chinese–Russian ratings remain **zero**.

The focus arm kept all five authored contrast facts. It did not repair any
of the three primary relations: both arms still reversed the 36-month
planning anchor, treated the thousand-person development team as monetary
investment, and asserted already-existing better products rather than a
future hope. At cue 328, focus changed a wrong late-evening 11–12 rendering
to approximately 1–2 after midnight, but the Russian hour phrase was
ungrammatical. Cue 60 kept the current 9400 generation while the focus
Russian was a fragment. The cue-466 focus answer also exposed a new false
negative in the v1 post-answer warning; [REG-071](../regressions/reg-071-future-product-shorthand-review-v1.json)
retains its minimal reproducer and new controls.

**Reject the focus-slot candidate.** The predeclared shortlist rule needed
at least two of three relation repairs without new major errors; observed
repairs were **0/3**. The one clock improvement and lower per-request token
count do not justify a new profile. Product v8, complete SRTs, checkpoints,
source media and all previous failed results remain unchanged. The private
attempt is `.cache/eval/vivo-focus-slot-v1/attempt-Q1EDOt/` in this worktree.
`task eval:focus-slot:unit`, `freeze`, `preflight`, `probe`, `report` and
`check` ran; the checked capture reproduced every raw request/reply hash.
`task eval:regression:catalog:v50:check` and
`task eval:regression:catalog:portable:check` passed. The broader
`task eval:regression:catalog:recent:check` stopped at archived v45 because
this clean worktree lacks its ignored private long-run report; the public
v41–v44 and v47–v50 lineage was checked separately. That archive gap does
not turn a model-quality failure into a pass.
Human review, another source family, full-file quality and RELEASE-05 stay
open. Rollback is simply the existing v8 profile and old stored runs.
