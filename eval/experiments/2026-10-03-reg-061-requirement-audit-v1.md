# REG-061 requirement-by-requirement self-audit v1

Date: 3 October 2026. The previous turn was progress: committed implementation,
completed the single paired screen, retained its rejection and deployed Pages.
This continuation inspects the current committed candidate and adds missing
pre-inference provenance and actual artifact-inventory checks. It does not change
admission/prompt policy, model, output, ratings or promotion criteria, and does
not call a model. This is a self-audit, not independent Chinese–Russian review.

Candidate inspected: `d8387e155391e616a3e1732b7744c2fb3677e2e6`, in the attached
`feat/reg-061-target-terms` worktree. The original shared checkout is still at
`b26092fd...` with foreign NAME-01 work; it was only read. Remote main matched the
inspected candidate. The already published Pages deployment
[37104891277](https://github.com/Ermolz69/auralis-translate/actions/runs/37104891277)
remained successful for the identical HTML at `2604524...`.

[Machine audit snapshot](../reports/2026-10-03-reg-061-evidence-audit-v1.json),
SHA-256 `91ab189acd3d203440d13eac50a194362510541128c79d135f924a7a18802daf`, records the tested parent and new audit script hash. The
Taskfile/audit implementation was uncommitted at snapshot creation and is committed
with this record; the model-run files remain the immutable pre-inference version.
The read-only `task eval:regression:reg061:audit` also audits the final commit.

| Explicit requirement | Current authoritative evidence | Disposition |
| --- | --- | --- |
| Read the required contracts, prior plan/result and REG-061 v1; inspect real HEAD and worktrees | Terminal reads of AGENTS, backlog/workflow/release/008, prior REG-058 plan/result, REG-061 v1 and current Git/worktree state; immutable links in the [frozen plan](2026-10-03-reg-061-target-terms-v1-plan.md) | Inspected; no assumption that a newer foreign checkout is this candidate |
| Preserve foreign edits, especially architecture 014 | Audit reads the primary checkout through Git's common directory; raw 014 SHA-256 remains `28e1d12c1afb4f1640128a2183564f26e119797e9b7f187134f0fd4f2f215aec`; slice diff excludes every architecture/Rust/model path | Preserved and excluded from commits |
| Scope hints to original target Chinese, never adjacent context | [Selector](../scripts/target-term-scope.mjs), [scope tests](../scripts/tests/target-term-scope.test.mjs) and reconstruction of all 30 frozen requests | Deterministic admission passes; arbitrary Chinese interpretation is not certified |
| No matching/eligible target term means exact unchanged v8 request bytes | Actual eight excluded pairs compare equal; every previous-ten baseline hash matches the earlier screen | Byte identity verified; sampled replies can still differ |
| Separately handle negation, contrasts and do-not-call mentions; uncertain use is needs_review | Clause/mention/negation/contrast policy, exclusion fixtures and journal scope decisions; Chinese target/context bytes remain unchanged | Deterministic scope passes; one real contrast answer fails and is retained as REG-062 |
| Keep provisional ASUS evidence separate from approved_terms | Every frozen envelope has empty approved_terms; selected notes explicitly say provisional, not human-approved | Verified; disclosed terms are not an independent terminology score |
| No patch for cue numbers | Selector does not use cue IDs for admission; the same source fixtures are tested under IDs 1/23/268/999 | Verified for the selector; experimental sampling still retains declared slot identities |
| Deterministic scope/neighbor/type/number/resume/budget checks | Seven scope tests plus the [reported v8/provider and journal checks](2026-10-03-reg-061-publication-handoff.md); source numbers remain byte-identical and resume fingerprints change with all bound identities | Engineering checks pass; sampled numerical meaning is reviewed separately by AI, not inferred from request integrity |
| Retain wrong raw answers without checkpoint or partial output | Reopened private journal hashes match; all 30 checkpoint_accepted fields are false; actual attempt inventory is only report, journal, resource samples and two server logs | Zero checkpoint/database/subtitle artifacts in this experiment; no product persistence path is exercised by the JS screen |
| Freeze one pair on the same ten cases and all five new cases before inference | Freeze/request reconstruction checks all control sources; plan/public freeze and source code canonical Git blobs equal implementation commit `b26092f...` | All 15 pairs retained; commit timestamp precedes inference start |
| Fix source/model/runtime/profile/exact requests and limits before calling model | [Freeze](2026-10-03-reg-061-target-terms-v1-freeze.json), exact private requests and implementation commit; per-entry tokenizer, latency and completion checks | Exactly 30 chats / 60 preflights / one attempt, no retries; 256 output + 64 safety within 2048, request/stage times within declared bounds |
| Do not send full reference translations; no closed holdout or tuning on it | Requests are reconstructed from authored development Chinese/context; only selected disclosed term forms are added; expected full-sentence meanings are absent | Development-only evidence; no new prompt search or holdout access in this continuation |
| Retain all raw failures, tokens, time and memory | [Public raw replies](../reports/2026-10-03-reg-061-target-terms-v1.json), private fsynced journal/logs/resources and five-file hashed inventory | Retained; six resource samples include CPU, working set/private memory and whole-device GPU; overhead is unmeasured null |
| Keep AI interpretation distinct from human evaluation | [Separate AI review](../reports/2026-10-03-reg-061-target-terms-v1-ai-review.json) pins raw reply hashes; reviewer type is AI, human count 0 | Verified; not independent language evidence |
| Promote only when every declared structural and fact criterion passes | 30 valid structures, scoped AI verdicts 12 pass / 1 fail / 2 needs_review; [fixed decision](2026-10-03-reg-061-target-terms-v1-result.md) is reject_keep_product_v8 | Advancement fails; both original positives are repaired and original negatives preserved, but new controls do not all pass |
| On failure retain negative outcome, leave v8 unchanged and do not run full file | REG-061 v2 / REG-062 v1 in [catalog v41](../regressions/catalog-v41.json); zero product/model diff and one bounded private attempt | Failure branch fulfilled; no new selectable product profile or 268-cue inference |
| On success version a profile and inspect all 268 cues, seams/scenes/names/amounts/negation | The predeclared prerequisite is false | Conditional branch forbidden after rejection, not omitted or claimed as passed |
| Update backlog, regression evidence, current Pages and historical measurements | EVAL-05 only is done; current page states rejection; history contains all 15 new pairs and previous 10; pinned catalogs/raw versions retained | Published; CTX-03/EVAL-04 remain incomplete |
| Verify published pages | Live 200/byte checks and actual desktop/mobile text, 15/10-row tables and both transitions; [publication proof](2026-10-03-reg-061-publication-handoff.md) | Verified; local build alone is not used as proof |
| Small English own-file commits with primary global author and committer | Audit checks all three prior slice commits against verified global identity; no forbidden foreign/product paths in initial-to-candidate diff | Verified; this audit is another own-file commit with scoped identity |
| Report exact task commands, results, hashes, commits, limitations and rollback | [Complete handoff](2026-10-03-reg-061-publication-handoff.md), result identity table and this linked audit snapshot | Recorded; runtime rollback requires no action because v8 did not change |
| No volunteer/person contact; do not close overall Goal, RELEASE-05 or audio gates | No outreach action in this slice; human fields remain 0 and all release/audio/Goal status claims stay incomplete | No contact; gates remain open |

## Additional checks and retained verifier failure

`task eval:regression:reg061:audit:record` completed after a local audit-reader
failure, `spawnSync git ENOBUFS`: Node's default output buffer was smaller than the
1,154,069-byte historical HTML. The reader now uses the already declared two-MiB
live-page budget. The failed audit made no model call and wrote no snapshot;
subsequent success retained the single snapshot. Existing model responses, freeze,
ratings, request count and product files were not regenerated or changed.

The audit checks Git provenance, exact persisted inventory, all actual timing and
token boundaries, original subtitle bytes, protected foreign-edit bytes, primary
commit identities, and committed/current HTML agreement with the retained live
proof. These close evidence-check gaps; they do not repair the REG-062 meaning
failure or grant promotion. `task docs:check` verifies the new links;
`task plan:check` verifies the unchanged scoped task status; site live checking
continues to use the existing Taskfile command without model access.

The original experiment is exhausted under its one-attempt rule. A different
prompt/policy and another semantic screen would require a separately declared
experiment and authorized budget, with the rejected baseline kept immutable.
Independent human review and audio/installation prerequisites remain absent;
therefore the broader active Goal remains incomplete.

Observed continuation checks: `task eval:regression:reg061:audit:record`,
`task eval:regression:reg061:audit`, `task plan:check`, `task docs:check`
and `task site:live:check` all passed. Backlog count remains 50; documentation
count is 414. The fresh two-page HTTP 200/byte check at
`2026-10-03T07:20:39.391Z` targets `d8387e1...` and retained unchanged HTML hashes.
Private proof: `.cache/eval/live-pages-check/attempt-066c353e-68e6-4785-ad43-1a92ba4378e3/report.json`, SHA-256
`c8fb890ee8fc0489d13024ac50c004e2d6003e9637a176fe564d6db29cf26b58`.
