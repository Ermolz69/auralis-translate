# NAME-01 source name registry: engineering accepted, model extension rejected

Date: 3 October 2026. Scoped acceptance of NAME-01 only. CTX-03, EVAL-04,
LONG-04, G3–G5 and RELEASE-05 remain incomplete. No volunteer was contacted.

The [contract](../../docs/architecture/016-source-name-registry.md) implements
Chinese-source candidate extraction, scene-separated entities, exact UTF-8
occurrences, proposal provenance and immutable SQLite v10 revisions. Similar
names and surname/address variants are not merged. Runs bind a registry revision;
changed heads refuse inference/checkpoint/result continuation. Historical export
uses the bound revision, so editing current proposals cannot invalidate a completed
result. Model proposals remain `needs_review`; this CLI has no human-approval path.

The separately pinned [experimental profile](../../models/manifests/hy_mt2_1_8b_q4_k_m.context_v8_source_names_batch1.experimental.json)
adds proposals only to exact target slots and preflights the rendered token count.
No-name requests keep baseline v8 bytes. Existing v8 templates, manifests and the
parallel REG-061 implementation are preserved. Name extraction is a conservative
lexical development policy with incomplete recall, not a Chinese entity resolver.
Possible aliases have a durable field but are not guessed from matching surnames.

## Observed checks

- `task fmt:fix`: applied formatting before final validation.
- `task test:name-registry`: passed 14 tests across core, formats, SQLite,
  llama.cpp and CLI. Includes 1024-cue beginning/middle/end, similar full names,
  Xiao Wang/Teacher Wang, false compounds, scene boundaries, target-only selection,
  empty-registry revision identity, optimistic rollback, fresh-worker recovery
  after an invalid response and old-result offline export after revision change.
- `task name-registry:check`: passed `task fmt`, `task lint` and `task test` in
  the isolated Cargo target: 275 passed, zero failed, three existing private ASUS
  fixture checks ignored. This is engineering evidence, not their private gates.
  Log SHA-256: `0987252c46775d777a9ca5f26ba2456f97ad845ccd7c9647bd780a16a50cc535`.
- `task eval:name-registry:freeze`, `task eval:name-registry:preflight`,
  `task eval:name-registry:probe`, `task eval:name-registry:report` and
  `task eval:name-registry:check`: passed the bounded real-model attempt and
  retained journal/report verification. The probe's initial sandbox process
  denial happened before model calls; the authorized process execution used the
  same immutable second freeze and one attempt, without a model retry.
- Plan, documentation, site, browser and committed-candidate checks are recorded
  in the publication audit below; no compilation-only language claim is implied.

The initial freeze (`8dfe7063aaf16aed54137ce62772b007e9f64a020e17bd5e2d74fe8d9c49bf8f`)
is retained with zero inference. Full migration validation exposed an owned v5
fixture that reset its schema version without dropping the new v10 tables;
the fixture was corrected to represent v5. A Windows mock accepted socket inherited
nonblocking mode and intermittently failed with OS 10035; explicitly restoring
blocking mode fixed the recovery test. Failed checks/logs remain under
`.cache/name-registry-work/`; they were not erased or counted as passes.

## Frozen real-model decision

The [predeclared plan](2026-10-03-source-name-registry-v1-plan.md) used 14 authored
Chinese development cues, two scenes and seven source-only AI spelling proposals.
Three fresh runs per arm, counterbalanced order, checked Hy-MT2 1.8B Q4_K_M,
unchanged decoding and baseline v8. No reference translation or holdout was read.
RNG seed is unknown; a shared server and unknown cache effects prevent speed claims.

UTC 07:19:42.795–07:29:03.316, local offset +03:00: 560.521 seconds overall.
All six runs completed 14/14 checkpoints and separate full SRTs in `needs_review`.
The original hash stayed identical. There were 84 chat calls, 168 template/tokenizer
requests, 24,723 input and 2,771 output tokens, no retry, no partial result.
The three no-name negative targets in each pair kept identical request bytes.
All observed token counts fit 2048 context with 256 output and 64 safety tokens.

The [full report](../reports/2026-10-03-source-name-registry-v1.json) retains all
84 prompts, original Chinese contexts, raw answers, accepted checkpoint text,
digests, budgets, timestamps, code identities and resources. Its SHA-256 is
`191b9a1af432c95a94f5e415f24e6f71b346eefe65a043aef58a4784f80406c8`.
The [separate AI self-review](../reports/2026-10-03-source-name-registry-v1-ai-review.json)
reads every output and discloses model-visible proposals and zero human ratings.

Repeated-name entity-runs with variation or omitted forms fell from 9/9 to 5/9
(three repeated entities × three runs; 21 repeated occurrences per arm). Teacher
Wang improves, but this does not establish correct transliteration. Nine registry
observations newly break a name or action fact preserved by the paired baseline:
previously correct Li becomes Bai/Bley at cues 1/11, and all three arrival-time
questions at cue 6 become the neighboring request to pass a file. Baseline errors,
including its copied book cue and lost names/actions, remain visible. The identical
no-hint cue 9 differs under sampling and is not credited as a registry effect.

**Reject advancement.** Partial consistency improvement fails the predeclared
no-new-semantic-error rule. No complete natural-file run was authorized by that
condition, and none was started. The extension remains opt-in experimental; no
product profile, 7B default, human approval or release gate was promoted.
[Catalog v42](../regressions/catalog-v42.json) retains REG-063's accepted wrong
action with exact raw/request hashes and unrun related/negative cases. REG-064
(NAME-BUG-001) retains the fixed false-substring extractor defect and related
compound controls. CTX-03/EVAL-04 remain the backlog for the next reviewed candidate.

Frozen identities: source `bdbe07b8784c3b3f2fda427c5f717818a22eeabc8aaa395d6baac67cc39b4ebb`,
registry policy `37875e49b7837e73dff226c17da638ca89f2cb93719b9b9b6473cfdc41f15e80`,
registry manifest `c2b8a5995f92fbc0f57cfd55b0ce8e9a150dc4bad7fa6fb649ee05dcb59216a1`,
CLI `0900325063c7e746319e8209a3204365c4dbaa0d2f22af53678aca92f5a2f085`,
GGUF `dc5f44fcf1fa496ee7ad725982c0c8c553a4de00259b53af84c4b89fb0c06699`,
runtime `6f15be27bd80b6b4d52afefa49094e18fcfab55d5da354d717971f2d2537b2f4`.
The tested parent was `b26092f` plus the report's 373 frozen code hashes.
Second freeze: `41f0b240223b1bfbb5bca520594e855894207250804ea8da37ff3dc30d26e419`.
Owned attempt: `.cache/eval/source-name-registry-v1/freeze-02/attempt-AOTQ0C/`.

112 five-second resource samples: maximum tracked process working set 1,555,759,104
bytes; maximum entire RTX 3070 device use 2,746 MiB of 8,192 MiB. Sampling is an
approximate lower bound, includes other GPU applications and is not a hardware gate.
The server requested 99 offload layers; exact loaded layer/backend allocation is
not exposed by this log and remains unverified. CPU threadpool log says eight
threads, one slot, 2048 context. CLI model hashing occupies most fresh-run wall time.

## Publication and rollback

Publication is prepared in an owned checkout based on REG-061's published
`9173efd`; the original checkout and its foreign `014` document remain untouched.
Both `index.html` and `history.html` keep REG-061 and earlier evidence. Current
state reports the rejected experimental name proposal; history includes all pairs.
Commit/deployment identities and observed browser checks are recorded after push.

To stop using proposals, select an unchanged baseline v8 profile for a fresh run.
Do not mix its identity with an old registry checkpoint. Existing completed results
can be exported with the exact bound profile/revision. Retain original source and
SQLite snapshots. An old binary is not compatible with the new v10 database: code
rollback requires an independently preserved compatible database backup, not
deleting registry tables or overwriting the new database. No user data is downgraded
or rewritten by this experiment; originals and earlier results stay immutable.

Candidate audit before publication: implementation commits `282d049` and
`297f0df`, primary global identity verified for both author and committer.
`task name-registry:check` passed again in the owned checkout (275 passed,
three private fixtures ignored); `task test:name-registry` passed all 14 after
code commit. `task eval:name-registry:audit` verifies 373 frozen files, zero
content differences and 326 LF/CRLF-only checkout differences, without inference.
`task plan:check` verified 51 tasks; `task docs:check` verified 417 Markdown files.
`task site:build` and `task site:check` passed, retaining both pages and all older
sections. Browser screenshots/DOM inspected at 1440×900 and 390×844: name decision
is visible, history has all 14 paired rows, table overflow stays inside its wrapper
and the document has no horizontal overflow. Temporary viewport override reset.

Automatic approval denied a coordination message to the other chat (explicit
message authorization was absent) and a later combined command that would have
built in the shared original checkout. Neither rejected action ran. No message
was retried; all publication mutations/builds use the owned candidate checkout.
The original checkout's unrelated 014 file and the REG-061 worktree are excluded.
Remote push, Pages workflow and two live byte hashes remain pending below.

Historical catalog validation: `task eval:regression:catalog:check` in the owned
checkout stopped at v19 because an older private ASUS request journal was not
copied there. Its failure is retained in `catalog-check.log`. The same read-only
command passed through v41 and REG-060 in the original evidence checkout; no
shared build or publication occurred. The new v42 check passes independently in
`task eval:name-registry:check`. Earlier catalog packs are unchanged.
