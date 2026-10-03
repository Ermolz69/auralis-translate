# NAME-02: fail-closed proposal admission, no quality advancement

Date: 3 October 2026. Scoped safety containment only. Source-aware verification
of arbitrary translated actions is unsupported by the available evidence. Keep
baseline v8; G3–G5, CTX-03, EVAL-04, LONG-04 and RELEASE-05 remain open.

The [nine exact traces](../reports/2026-10-03-name-action-trace-v1.json) preserve
the target, neighboring source context, proposal, request bytes, raw answer,
accepted checkpoint, registry revision and run binding from NAME-01's frozen
84 responses. Repetitions 1–3 at cue 1 change Li to Bai/Bley; cue 6 replaces Li's
arrival-time question with the previous file-transfer request; cue 11 changes
Li to Bai in the Friday meeting. These are AI source-fact findings, with zero
independent human reviews. Every original source, registry/result and report stays
unchanged; the new code does not delete or retroactively correct old checkpoints.

One [predeclared candidate](2026-10-03-name-action-admission-v1-plan.md) changes
only admission. [Contract v1](../../docs/reference/name-proposal-admission-v1.md)
adds a separately pinned profile and nonretryable `name_proposal_review_required`.
After structural decoding, any active target proposal rejects the candidate before
checkpoint; its exact raw and parsed response, usage, elapsed time and error remain
in the existing rejection journal. A plausible sentence is rejected too: matching
a name or valid schema cannot attest the action. No correction, semantic retry,
new SQLite migration, proposal approval or partial result is introduced. Legacy
profiles still load for historical export; active proposals without the admission
pin refuse before HTTP. Empty/neighbor-only proposal selections retain v8 behavior.

The sole screen was **offline**: all 84 frozen answers, their original three paired
repetitions, and 20 source-only development controls unseen by the NAME-01 model.
New inference: **0/120 allowed chats**, zero tokenizer/template calls or tokens,
zero holdout cues. No prompt search or new model comparison. Repeating unchanged
requests cannot establish the missing semantic verifier. Positive and negative
cases include arrival/departure, neighboring actions, negation, similar names,
false compounds, beginning/middle/end IDs and batch/scene seams. The new controls
prove admission/isolation, not their unmeasured translation quality.

The [replay report](../reports/2026-10-03-name-action-admission-v1.json) records
33/33 active-proposal responses blocked, including 9/9 traced failures, and
9/9 old no-name request pairs byte-identical to v8. All 20 new controls pass
deterministic admission assertions, including six unchanged no-name renderings.
The CLI additionally verifies a byte-identical actual neighbor-only request,
retains its accepted prefix, and saves no result when the next named cue is rejected.
Wrong and plausible named responses survive database reopening as rejected raw
and parsed candidates, with one mock chat each and no checkpoint or retry.

Replay UTC 09:16:25–09:16:26, local offset +03:00; observed wall time 314.3338 ms
includes sampling/observer work, not inference latency. The test itself reports
0.06 seconds. One five-second-interval resource sample retained device-wide
1,643 MiB of 8,192 MiB, including other apps. The short process had exited before
a usable process-memory sample; process peak is **null**, not zero. No model was
loaded, and no speed/headroom/offload or hardware-release gate is claimed.

Final freeze SHA-256:
`d949e6412dee0050a0663eccf8b89e08c2f70c52b39a265fd4d6cd2b4d8e6c74`.
Report SHA-256:
`85a39dcaaf8ef728960a80079cef618ba7a4f261db13bffd751c8b3a14ab5d52`.
It pins 442 code/data/asset identities, dirty tested parent `b26092f`, CLI/test
executables, the new manifest, source/context/fact/split fixture and historical
evidence. GGUF remains
`dc5f44fcf1fa496ee7ad725982c0c8c553a4de00259b53af84c4b89fb0c06699`,
runtime remains
`6f15be27bd80b6b4d52afefa49094e18fcfab55d5da354d717971f2d2537b2f4`,
Hy-MT2 revision `a0c709d9fac510f2c807aa3af52872340dc37a4a`, runtime build
`b10977-0ecb159c9`. Node reports Windows 10.0.19045 x64, i7-6900K, 16 logical CPUs,
51,458,560,000 RAM bytes; NVIDIA reports RTX 3070, driver 595.79, 8,192 MiB.
CIM reads were denied and are explicitly replaced by those read-only observations.

**Reject quality advancement and keep v8.** Named accepted-output denominator is
zero. The [separate AI assessment](../reports/2026-10-03-name-action-admission-v1-ai-review.json)
records missing new language judgments as null, zero human review and no natural
file run. No zero-new-semantic-error pass, full-file quality, G3–G5 or RELEASE-05
is inferred from containment or compilation. Catalog v43 supersedes REG-063's
disposition while preserving original v42/v1 bytes and unrun semantic controls.

Integration note: that `v43` was produced in the isolated NAME branch before
TERM-02 independently published a different catalog v43. The original NAME
branch and frozen report retain the local history. The integrated release keeps
TERM-02's published v43 byte-for-byte and records both outcomes in
[catalog v44](../regressions/catalog-v44.json). No prior observation was changed.

## Observed validation

- `task eval:name-action:trace`: nine request/raw/checkpoint/source/revision chains
  verified from all 84 frozen responses, no mutation or inference.
- `task test:name-action`: six focused tests passed, zero failures; includes the
  84-response replay, 20 controls, legacy HTTP refusal and durable CLI rejection.
- `task name-registry:check`: `task fmt`, `task lint` and `task test` passed:
  281 workspace tests, zero failures, three pre-existing private ASUS checks ignored.
- `task name-action:prepare`, `task eval:name-action:freeze`,
  `task eval:name-action:preflight`, `task eval:name-action:probe`: one final frozen
  offline attempt completed, no model calls. First freeze and failed checks remain
  retained; final freeze followed the negative test's interface correction.
- `task eval:name-action:catalog`, `task eval:name-action:check`,
  `task eval:name-registry:check`, `task plan:check`, `task docs:check`,
  `task site:build`, `task site:check`: final results recorded in the publication
  handoff after execution; these are engineering/report checks only.

The initial Node child-process restriction blocked `--list` before any replay
or model call; the same authorized offline operation succeeded with process access.
The first CLI test read the wrong JSON path, and an added negative test attempted
an unavailable machine-mode development command. Corrected tests use the existing
interfaces. All failed logs are retained under `.cache/name-action-work/`.
No approval-review rejection or model retry occurred.

## Rollback and publication

For a new translation select the unchanged baseline v8 profile and a fresh run.
Do not remove proposals from a saved run or combine its checkpoint identity with
another profile. Historical completed results export with their bound revision and
profile, even after current proposals change. Preserve original bytes and accepted
history. The v10 database needs a compatible binary; an older binary rollback
requires a verified compatible backup, never registry-table deletion or downgrade
of a user's database. No user database was migrated, downgraded or copied here.

Requested English commits use the verified primary global author and committer.
An owned publication checkout starts from `9173efd` so the original dirty checkout
and unrelated `014` document remain intact. Commit/checkout identities and final
checks belong to the [publication handoff](2026-10-03-name-action-publication.md).
Remote publication is not inferred from a local site build.
