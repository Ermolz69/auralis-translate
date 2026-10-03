# REG-062 exact-occurrence term candidate rejected

Date: 3 October 2026 (+03:00). Backlog TERM-02 bounded development outcome.
[Predeclared plan](2026-10-03-reg-062-occurrence-terms-v1-plan.md),
[public request freeze](2026-10-03-reg-062-occurrence-terms-v1-freeze.json),
[paired report](../reports/2026-10-03-reg-062-occurrence-terms-v1.json), and
[source-aware AI review](../reports/2026-10-03-reg-062-occurrence-terms-v1-ai-review.json).
The single inference ran from clean commit `c4d1a0df4b4aed3d5499ef12466b7ced265f41a4`;
the candidate implementation was committed at `19a8c07`. Existing v8 and the
rejected REG-061 transformer were not changed.

The REG-061 frozen request gave one slot a broad pad hint. Its raw accepted
response converted the available stand to `коврик-стенд`. The new candidate
instead marked source-character spans for each eligible term and marked a
present contrasting noun as a separate unhinted referent. The target source,
neighbor context, `approved_terms`, protected facts, decoding and v8 base
instruction remained identical. An absent or excluded term retained full v8
request bytes. This changed only the experimental request, not any output by
post-hoc replacement.
In the concrete repro, the new note bound `[0,3)` to `鼠标垫` and separately
identified `[6,10)` as `鼠标支架` (mouse stand). All three raw candidate replies
still rendered both objects as `коврик для мыши`: source-span wording alone did
not make this model obey the referent boundary.

## Paired result and decision

Twenty exposed authored development cues received three counterbalanced
v8/candidate pairs: **120/120 real chats**, **240/240 rendered template and
tokenizer preflights**, and **120/120 structurally accepted JSON replies**.
There was one server/model attempt, zero retries, zero checkpoints and zero
published subtitle results. Twenty-seven candidate requests were byte-identical
to v8 because no eligible target hint applied. All previous fifteen v8 baseline
request hashes match the REG-061 freeze.

The known positive facts improved: six v8 multi-core outputs used multithread
instead of cores, and six v8 pad-sale outputs used stand instead of pad. All
twelve corresponding candidate outputs preserved those source concepts. This
improvement does **not** pass the frozen advancement rule. For the concrete
REG-062 source `鼠标垫缺货，鼠标支架仍有现货。`, all three v8 replies kept the pad
out of stock and a distinct stand available. All three candidate replies made
the available item another `коврик для мыши`, losing the stand referent. In
the two-speaker end-seam control, all three candidate replies likewise turned
speaker B's stand into a generic mouse place. One negated naming control and
one stand-without-pad control each had one further major candidate fact error
and two uncertain candidate meanings. Source-aware AI review totals for the
candidate are **48 pass, 8 major fail, 4 needs review** across 60 replies.
Baseline totals are 35 pass, 18 major fail, 7 needs review. These are paired
visible-case observations, not independent bilingual ratings or a quality
estimate for natural files.

**Decision: reject this candidate and keep product v8.** The repeated
referent failure violates the frozen no-new-major-error stop rule despite the
positive repairs. Do not run the 268-cue file. This bounded TERM-02 screen is
recorded as complete evidence of rejection; actual contrast preservation
remains open under CTX-03/EVAL-04. There is no G5 or RELEASE-05 claim.

## Identities, measurements and provenance

| Single frozen attempt | v8 | Exact-occurrence candidate |
| --- | ---: | ---: |
| Chats | 60 | 60 |
| Prompt tokens | 16,917 | 19,572 |
| Completion tokens | 3,012 | 3,053 |
| Summed chat HTTP latency | 56,093 ms | 57,261 ms |

Model-stage wall time was 127,821 ms. Twenty-five approximately five-second
resource samples reported a maximum server working set of 5,066,539,008 bytes
and maximum whole-device GPU use of 6,587 MiB, with no sampler errors. These
are sampled lower bounds; other device users and observer overhead were not
isolated. The attempt recorded no transport, HTTP or structure errors.

| Identity / evidence | SHA-256 |
| --- | --- |
| Unchanged Hy-MT2 7B Q4_K_M GGUF | `9f96256500f3fc1ab4d64336b58f52a949a95ad7516b0c229476eef782f9f77b` |
| CUDA llama-server executable | `6f15be27bd80b6b4d52afefa49094e18fcfab55d5da354d717971f2d2537b2f4` |
| Unchanged v8 batch-one manifest | `a748572cea20fc46c53ced5c39c5b8e3fb85887c2e90d559a27fd41ea818f2bc` |
| Occurrence policy | `c2118394db2bb3b19eb4a2a7f9c2521f81fef23c9ecbe8a39fccbb3926ea15bd` |
| Candidate selector | `c2d18412b62cb127f40dc2d8caf49a78ca7943d2c29b5b3d56021f88b83c0b53` |
| Exact private frozen requests | `6f8dec03c1eadd090bc72899522e0809cbf5d709967f830aaa1da7ba67187477` |
| Private raw attempt report | `bfa0ef2cbe4b49853792eec173838542ca0777ae15297e812c2ac183b110569a` |
| Private request/raw-response journal | `25a0112eff64790192d9f6025e46495c0e818b62f1ffbf2bd3acb781ab20e579` |
| Public paired report | `d04f040ea82495dfa65f66f6f0250b213f4224ce98c1e97edca44cb8c1cde4c0` |
| Separate AI review | `df5983ea46cf3030db4e7bfea19db3407521bc393d58570a3fc0b22f62ae6a31` |

The private attempt directory is `.cache/eval/reg-062-occurrence-terms-v1/attempt-Xe29Gu/`.
It contains exact requests, full raw HTTP replies, rejected outputs, preflight
replies, usage/timing, resource samples and server logs. The public report
links each visible candidate to request and raw-response hashes. The
private attempt was also copied with matching raw report and journal hashes to
the original repository's ignored `.cache/eval/` store, so the isolated
checkout need not remain mounted to retain it. The AI
review read every Chinese source and Russian candidate against the frozen
source-fact rubric. It is a Codex self-review, **not independent human review**;
human bilingual review count is zero. No volunteer was contacted and no
sealed holdout was opened.

## Checks, limitations and rollback

Observed before inference: `task test:target-terms` (7 passed),
`task eval:regression:reg062:plan-check` (9 scope tests and 120-request plan
passed), `task plan:check`, `task docs:check`,
`task eval:regression:reg062:freeze`, and
`task eval:regression:reg062:preflight` all passed. The one
`task eval:regression:reg062:probe` completed 120 chats. Afterwards
`task eval:regression:reg062:review:record`, `:report` and `:check` passed;
the latter rechecked exact frozen requests, every raw response hash, all 240
preflights and the separate review hashes. Final
`task eval:regression:catalog:recent:check` (v41–v43), `task plan:check`,
`task docs:check`, `task eval:report:check`, `task site:build` and
`task site:check` passed. The broader `task eval:regression:catalog:check`
could not finish in the isolated checkout: its historical v19 check requires
an ignored private journal not copied there. The historical
`task eval:regression:reg061:check` passed in the original checkout. It failed
in the isolated checkout solely on a source-file byte hash because Git checked
out its unchanged content with CRLF instead of the original LF; the old code
and committed blob were not edited. These environment limits do not change
the v43 and new-attempt checks.

Product rollback requires no model, database, source-file or runtime change:
continue using the pinned v8 manifest. The rejected candidate remains only
under `eval/` and is never selectable by the product. If experimental code
must be removed later, revert its scoped commits in reverse order in a new
reviewed change while retaining the failed report and Git history. Do not
reset the unrelated NAME work or delete raw evidence. Source admission,
independent term/meaning review, natural long-file quality, G5/RELEASE-05 and
audio gates remain open.
