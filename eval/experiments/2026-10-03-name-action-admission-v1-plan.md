# NAME-02 frozen fail-closed admission screen v1

Date: 3 October 2026. One candidate, one factor: post-decode admission. No prompt,
model, source, decoding or proposal change; no sentence correction or semantic retry.
Read NAME-01's complete 84 observations and trace the nine new source-fact errors
before selecting this candidate. Retain originals, revisions, results and failures.

No evidence supports a general source-aware action verifier. Therefore the
[admission contract](../../docs/reference/name-proposal-admission-v1.md) refuses
all active proposals before checkpoint. This candidate intentionally cannot pass
the language-improvement threshold or advance to a natural long file. Baseline
v8 remains the usable fallback, itself unapproved for G3–G5. Historic NAME-01 raw
outputs and checkpoint receipts remain immutable. Human reviewers: zero.

The single permitted screen is **offline replay**, not a new real-model comparison.
Replaying the same bytes proves a deterministic containment rule; new sampling
of unchanged prompts cannot prove its missing semantic verifier. Use all 84 frozen
answers (three prior paired runs per arm), plus exactly 20 source-only authored
development controls from [fixture v1](../corpora/name-action-admission-development-v1.json).
The controls are unseen by the NAME-01 model, not sealed holdout, and have no new
model outputs. Source facts, names, contexts, conceptual positions and batch/scene
seams are frozen in the fixture. Include similar Chinese names with coincident
Russian proposals, negation, arrival/departure, neighboring actions, false name
substrings and no-name targets. Separate semantic AI judgments from automated
admission assertions. No claim of new unseen-control language adequacy.

Arms: historic structural acceptance versus admission v1, applied to each *same*
frozen observation. Do not rerender the frozen request, regenerate an answer,
edit a checkpoint or tune on a failure. Original three repetitions are reused,
not relabelled as new paired model runs. Both prompts and proposed spelling
review state stay unchanged. Independently compare all nine no-name request pairs
with baseline v8, and compare the new no-name control renderings byte-for-byte.

Before the replay, `task name-action:prepare` writes a new immutable manifest;
`task eval:name-action:freeze` builds the CLI and retains code, Rust test binary,
CLI, manifest, plan, corpus/split/context/fact, trace, parent report, GGUF, runtime
and runtime-DLL hashes. Hardware is read from Node OS and NVIDIA tools; denied
CIM reads are retained as limitations. Model stays Hy-MT2 1.8B Q4_K_M, immutable
revision `a0c709d9fac510f2c807aa3af52872340dc37a4a`; runtime stays
`b10977-0ecb159c9`. No server is started. Parent runtime/token settings are carried
as historical identity, not current offload evidence.

Budget: one replay attempt; **zero new chat/template/tokenizer calls and tokens**
(inside the owner's ceiling of 120 chats, 20 cues and three paired runs per arm).
At most 120 seconds replay wall time, 2 GiB sampled process working set. Retain
five-second samples, observer failures/overhead and unknown peaks. Zero retries,
no holdout, no natural long file. Stop on changed frozen bytes, binary/code/hash
mismatch, missing raw/checkpoint trace, request mutation, exception, time/memory
budget, or any active proposal escaping the barrier. No fresh inference is
authorized by this plan. A later inference candidate requires a separate decision.

Retention: raw and parsed answers and historic accepted checkpoints stay in the
trace/replay, while new accepted checkpoints remain null. Store error, observed
elapsed time, token counts (historic versus new), resources, AI judgment and human
counts separately. Do not invent replay inference duration or memory. Structural
pass means all nine failures and all other active proposals are blocked, no-name
bytes stay identical, and a mock wrong *and plausible* answer survive reopening
in the rejection journal without checkpoint/result, retry or source mutation.

Advancement still requires zero new critical/major meaning/name/action errors
across positives and unseen controls with actual eligible outputs. This barrier
has no eligible named outputs and cannot establish that threshold; reject quality
advancement and keep v8. G3–G5, RELEASE-05, human review and full-file quality remain
open. NAME-02 may close only its documented safety containment acceptance.

Freeze history: the first frozen code receipt preceded the additional negative
CLI assertion. That assertion initially used an unavailable machine-mode command;
use its existing legacy interface instead. Retain failed logs and the first freeze
as `freeze-pre-test-fix.json`, with zero replay attempts or inference. Freeze final
test code again before the sole replay; this changes no candidate factor, prompt,
source fact, model, budget or acceptance threshold.
