# REG-061 target isolation passes; the terminology candidate is rejected

Date: 3 October 2026 (+03:00). [Frozen plan](2026-10-03-reg-061-target-terms-v1-plan.md),
[request/identity freeze](2026-10-03-reg-061-target-terms-v1-freeze.json),
[all authored candidates and raw replies](../reports/2026-10-03-reg-061-target-terms-v1.json),
[separate AI reading](../reports/2026-10-03-reg-061-target-terms-v1-ai-review.json).
Inference candidate: committed `b26092fd6949c25e18765eba0349fd7ebebbce21`.
The only dirty paths at inference were unrelated architecture documents; the
frozen harness/policy were committed. The source-only context remains private.

One attempt completed 30/30 structurally valid real 7B answers and 60/60 rendered
template/tokenizer preflights on the unchanged ten controls plus all five REG-061
cases. Zero retries, zero checkpoints and zero published subtitle results.
All ten baseline request hashes match the previous screen. Eight excluded-term
pairs have byte-identical v8 requests, including processor count, stand-only,
negated pad and naming mentions. Identical requests can yield different sampled
answers; request equality does not assert deterministic model decoding.

The target selector never uses neighbors or cue numbers. It separately admits
each term, leaves original JSON/protected facts/approved_terms unchanged, and
records needs_review for negated, metalinguistic or unclassified usage. The
ASUS hints remain provisional, with zero human approval. This is an experimental
JavaScript transformer only; it was not integrated into a selectable Rust/product
profile because the advancement criterion failed.

## Separate AI source-aware decision

Both original positive concepts were repaired: multi-core testing with ten
thousand points and sale of a mouse pad. Both original known negatives preserved
multiple processors and sale of a mouse stand. The eight-core/one-processor
case, core/thread two-point comparison and twenty-yuan price contrast also kept
their facts. This is visible-case AI reading of disclosed terms, not independent
adequacy or approved-terminology scoring.

| Five new REG-061 cases | Scoped arm AI fact decision |
| --- | --- |
| Two processors, eight cores each | Pass: count and per-processor attribution survive |
| Box has only a stand, no pad | Needs review: absence survives, but the nonstandard mouse-pillow term does not confidently identify the pad |
| Pad out of stock, stand still available | Fail: the available stand becomes `коврик-стенд`, a hybrid pad/stand referent |
| Multi-core score ten thousand | Pass: cores and amount survive |
| Mouse pad sale | Pass: the pad referent survives |

The earlier do-not-call-a-stand-a-pad control also remains needs_review because
the output calls the excluded pad a mouse pillow. The scope warning existed
before inference; AI meaning uncertainty is recorded separately after inference.
Scoped observations: twelve fact passes, one failure, two needs_review outcomes.
These are neither human ratings nor a population accuracy estimate.

The frozen rule requires both positive repairs **and** preservation of all
negative/related cases, all five new cases and valid structure. It failed.
**Reject this candidate, keep product v8 unchanged and do not run the 268-cue file.**
No alternative prompt, retry, new product profile or full-file inference was run.
[Catalog v41](../regressions/catalog-v41.json) retains the REG-061 follow-up and
new REG-062 contrast contamination, with three additional unrun authored controls.
Earlier catalog/pack/report versions remain immutable.

## Measurements and identities

| This single paired attempt | Baseline v8 | Target-scoped hints |
| --- | ---: | ---: |
| Chats / structural observations | 15 / 15 | 15 / 15 |
| Prompt / completion tokens | 4,351 / 756 | 4,749 / 752 |
| Summed chat HTTP latency | 13,808 ms | 13,724 ms |

Model-stage wall time: 40,081 ms. Six five-second resource samples had no sampler
errors. Maximum sampled server working set: 5,066,006,528 bytes. Maximum sampled
whole-device GPU use: 5,884 MiB. These are lower-bound samples, include other
device users and unmeasured observer overhead; one paired run cannot establish
headroom, a hardware SLA, a latency tail or a quality percentage. The model-stage
timer excludes preflight file hashing. Logs, resource samples, exact requests,
all raw replies and errors remain under the private attempt directory linked in
the machine report. Authored replies are also retained in the public JSON.

| Identity | SHA-256 |
| --- | --- |
| Model GGUF | `9f96256500f3fc1ab4d64336b58f52a949a95ad7516b0c229476eef782f9f77b` |
| CUDA runtime executable | `6f15be27bd80b6b4d52afefa49094e18fcfab55d5da354d717971f2d2537b2f4` |
| Unchanged v8 manifest | `a748572cea20fc46c53ced5c39c5b8e3fb85887c2e90d559a27fd41ea818f2bc` |
| Experimental policy | `025a822db1de5b91ce455236324876b5a4314328861241420016bc0adfc217cc` |
| Selector implementation | `6e55f6d1a5b2826a63284d6e7cd334e31ab06b72743ff16fcfd1284601dff0f4` |
| Exact private frozen requests | `4c6ccd046f2c9053bfd1f9581055bc297ec3ec765a2e6384443814d2ecd1837b` |
| Private raw report | `fb30997468ca7e71fcafb7d2f97658849618d807a0558249449cbae568fd5423` |
| Public paired report | `85b37138c805b8bfc164e552bac8d8d24df68b377dc298aa8a127b5a4dc70844` |
| Separate AI review | `41e626de96901cbf717d487c42fe8ffe4e1c03571dd6b82b760ab1909579a71a` |

Every request and source/helper hash, exact decoding and budget identity is in
the freeze. Rendered tokens matched actual server usage on all thirty chats;
256 response and 64 safety tokens fit the 2,048 context limit without truncating
any target. Version changes alter development resume fingerprints; the one-attempt
experiment guard disallows retry/resume into a new sampling attempt.

## Checks, publication and rollback

Observed checks before inference:

- `task test:target-terms`: seven passed after switching the Node runner to
  `--test-isolation=none`. The first invocation failed with `Error: spawn EPERM`
  before any test/model child ran; it is a local runner failure, not a model attempt.
- `task eval:regression:reg061:freeze`: passed; exact requests written before
  model calls and committed with the plan.
- `task eval:regression:reg061:preflight`: passed as the probe prerequisite.
- `task test:long-batch-v8`: 8 provider, 16 profile and 5 CLI admission tests
  passed, including raw invalid output retention, token-budget rejection and
  legacy resume identity refusal. These remain deterministic engineering evidence.
- `task test:inference-journal`: 4 request, 9 migration and 16 provider tests
  passed; rejected raw candidates survive reopen without becoming accepted lines.
- `task plan:check` and `task docs:check`: passed before the first commit.

Observed model/evidence checks:

- `task eval:regression:reg061:probe`: one completed attempt, 30 chats,
  60 tokenizer/template calls, no model/HTTP failures and no retries.
- `task eval:regression:reg061:report`: passed; pending AI report first retained,
  then regenerated with the separate review and rejection decision.
- `task eval:regression:reg061:check`: seven scope tests and all frozen request,
  response, tokenizer, identity and review-hash checks passed.

Final isolated candidate checks passed:

- `task eval:regression:check`: the full catalog through v41, retained raw
  failures, deterministic scope checks and existing guards passed. The first
  isolated invocation stopped on an older frozen harness raw-byte hash because
  Git checkout line-ending conversion changed its on-disk representation. Exact
  unchanged archived evaluation bytes were restored from the original checkout,
  without changing canonical Git content or hash expectations, and the complete
  command passed on rerun. No model was called by this command.
- `task eval:long:v8:asus:single:check`: existing 1.8B failed and 7B completed
  268-cue archives verified; no new full-file inference.
- `task plan:check`: 50 stable backlog tasks verified.
- `task docs:check`: repository Markdown links verified.
- `task site:build` and `task site:check`: generated current/history pages and
  pinned paired evidence passed. Local desktop/mobile inspection retained all
  15 pairs and previous measurements without document-width overflow.

The original shared checkout acquired unrelated NAME-01 changes during this
turn; its plan/site checks stopped on the unrecognized foreign task phase.
Publication was isolated at `feat/reg-061-target-terms` from the committed
inference candidate, copying only this slice. No foreign code, Taskfile task,
backlog task or architecture edit is included. The original
`014-result-history-selection.md` raw hash remains
`28e1d12c1afb4f1640128a2183564f26e119797e9b7f187134f0fd4f2f215aec`.

Observed publication identity, committed hashes, live-page checks and rollback
are in the [publication handoff](2026-10-03-reg-061-publication-handoff.md).
Current Pages show rejection; previous measurements and all paired candidates
stay on history.html.

Rollback needs no runtime/model/database action: keep the original v8 manifest
and compatible saved runs. The rejected transformer is isolated under eval and
never becomes a product default. To undo the development slice, revert its scoped
implementation/publication commits; retain frozen evidence and original source.
Do not reset or include unrelated architecture edits. The primary global Git
identity was verified and used for both author and committer.

No independent Chinese–Russian review exists. No contact was made. Source rights,
human adequacy/term review, clean installation, real listened audio and approved
spoken script remain open. EVAL-05 can close this bounded screen only; EVAL-04,
CTX-03, RELEASE-05, G3–G9, A1–A6 and the full Goal remain incomplete.
