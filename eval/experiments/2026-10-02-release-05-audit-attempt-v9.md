# RELEASE-05 self-audit v9: the generic meaning fix failed

Date: 2 October 2026. The committed Translate candidate under audit is
`b8985d4064d7a79a59c588b3608bcf218f7aa2c6` on `main`.
[PLAN-03](2026-09-28-goal-scope-v1.md), the
[G1–G9/A1–A6 gates](../../docs/RELEASE_ACCEPTANCE.md) and
[regression policy 008](../../docs/evaluation/008-regression-and-adversarial-checks.md)
are unchanged. This is an agent **self-audit**, not an independent language
or listening assessment. The owner rejected volunteer outreach and no
messages were sent. The unrelated local edit to
`docs/architecture/014-result-history-selection.md` and Auralis's unrelated
dirty checkout were excluded; no Auralis file or project link was changed.

## Measured candidate and decisions

The retained v8 7B Q4_K_M development run produced 268/268 durable cues in
336,757 ms and a separate `needs_review` SRT. The matched 1.8B run retained
79 checkpoints and published no SRT. The natural source SHA-256 is
`923aed3991c2308d92b89c45181cea8ec7ece74e9b4d3a3ce0234d95e329913b`;
the unapproved 7B draft SHA-256 is
`746495ba8bfc9c7c3cee0b5021fea87c10605b1d8e07be6dc316907138ea48ee`.
The 43-cue selected AI audit found six high-confidence meaning/term risks;
there are zero independent ratings. Model GGUF SHA-256 is
`9f96256500f3fc1ab4d64336b58f52a949a95ad7516b0c229476eef782f9f77b`,
v8 manifest SHA-256 is
`a748572cea20fc46c53ced5c39c5b8e3fb85887c2e90d559a27fd41ea818f2bc`,
Windows CUDA runtime SHA-256 is
`6f15be27bd80b6b4d52afefa49094e18fcfab55d5da354d717971f2d2537b2f4`.
The actual development hardware is an 8,192-MiB RTX 3070 and
Intel i7-6900K; the 7B model is experimental, not a selected release package.

The [new frozen REG-058 comparison](2026-10-02-reg-058-semantic-instruction-v1-result.md)
used the same source-context requests on 18 authored controls, comparing
unchanged v8 against one generic semantic instruction. It completed 36 real
7B responses and 72 tokenizer preflights. All outer responses passed structural
checks; both variants still translated the multi-core test as multithreaded
and mouse pads as mouse stands. The predeclared advancement rule failed, so
the experimental instruction was **not** added to the product and no new
268-cue run was spent. The zero-request sandbox `spawn EPERM` launch and the
successful complete attempt are both retained. The public report SHA-256 is
`531e774df6930db078589cba8b2cdcfb136ec3375bcef86e496a2e6c51e0ed11`;
complete private report SHA-256 is
`02fc6ccc82355b6c61542eed92dcf904e5ee4c8fea4a7ea5286959d882beae6a`.
Expected meanings were absent from every request. These are development
controls and AI-only judgments; they do not satisfy a human gate.

The 12 inspected subtitle tracks span 11 media groups and 3,280 technical
cue slots, with **zero eligible** Chinese–Russian evaluation cues. The new
37-cue Commons source has a verified separate strict derivative and matched
239,000-ms media, but separate subtitle rights, spoken Chinese alignment and
independent review are unverified. Its 3:59 duration cannot satisfy A4.
The Kirin original-caption/media discrepancy and all earlier failed source
acquisitions remain recorded. No natural source or final endpoint is selected.

| Gate | Observation on this scope | Decision |
| --- | --- | --- |
| G1–G2 structure/coverage | 7B development SRT 268/268; original intact; no final admitted same-candidate file | Partial engineering evidence; open |
| G3 adequacy | 0 eligible independently reviewed holdout cues; ≥300 and ≥95% at ≥4/5 required, unmeasured | Fail/open |
| G4 critical errors | Six natural AI risks and paired term errors; zero independent adjudications | Fail/open |
| G5 terminology | No human-approved source ledger or ≥98% same-candidate term result | Fail/open |
| G6 resources | 336,757-ms long development run and 7,352-MiB whole-device control-screen sample; no selected hardware SLA | Fail/open |
| G7 recovery | Prior copy-resume evidence; final same-candidate fault matrix absent | Fail/open |
| G8 export | Development SRT structurally checked; final declared consumer and lineage acceptance absent | Fail/open |
| G9 installation | No unseeded Windows install through the final endpoint; desktop owner-deferred | Fail/open |
| A1–A6 audio | Prior 263 real SAPI WAV and played technical media, but 256 cue overruns, no approved script, no listened 10–20-minute scenes or final media lineage | Fail/open |

Higher-precision quantization and adapter training remain conditional: this
screen isolates semantic confusion without evidence that weight precision or
training would improve it within measured resources. Neither was run or
claimed. Japanese and no-subtitle ASR remain separate scopes. Desktop work
awaits the owner's scheduling decision; the CLI development result cannot
close the full-release endpoint.

## Checks, publication and recovery

On this committed code candidate, `task check` passed Rust formatting,
Clippy and workspace tests. `task eval:regression:reg058:instruction:check`
verified all 36 exact requests, raw response hashes, target fields and
72 preflights. `task eval:regression:check` passed the full applicable
regression suite after a sandboxed Node child-process `spawn EPERM` stopped
the first suite attempt; the new REG-058 check had passed in both. Also passed:
`task docs:check`, `task plan:check`, `task site:build`,
`task site:check`, and `task site:live:check`. The
[Pages workflow for `b8985d4`](https://github.com/Ermolz69/auralis-translate/actions/runs/37061818095)
completed successfully. Its [current page](https://ermolz69.github.io/auralis-translate/?revision=b8985d4064d7a79a59c588b3608bcf218f7aa2c6)
returned HTTP 200 and exactly matched `site/index.html`: 54,426 bytes,
SHA-256 `b237ededa1871f6d6a42165b0feba688d10e5923fed14274db15a74023ea2fc2`.
The [history page](https://ermolz69.github.io/auralis-translate/history.html?revision=b8985d4064d7a79a59c588b3608bcf218f7aa2c6)
also matched: 1,132,560 bytes, SHA-256
`4949ce9b0885bfcd09b32aaa22b7577d36d9e0fe339ccbda0329c1b029ebbd9f`.
The private live-check report SHA-256 is
`877d0fbb6b8221a36a3db77f9909c0916cb7568a6a8aeb2df73fe98e36d01151`.
The page was inspected visually at the default narrow width and at 1,280 px.
Historical measurement objects remained unchanged; only the embedded backlog
document hash changed when rebuilding history. This verifies publication and
layout, not Chinese meaning or sound.

All four new commits through `b8985d4` have both author and committer set to
the verified primary global Git identity `Ermolz <00ermzahar@gmail.com>`.
The last pre-screen published baseline is
`cc4c345680f52d4b6a8cfcc934332a4d63f290e7`. Product v8 behavior is
unchanged; recovery can deploy that baseline's `site/` pair from a separate
clean checkout while retaining both experiments, raw failures and current
private source/media. No database migration, selected package or Auralis
artifact was changed.

**Decision: RELEASE-05 failed/open.** Next bounded engineering work is a
source-scoped *provisional* term correction with positive, negative and unseen
controls, followed by another full natural development run only if the
predeclared screen passes. Source rights and spoken alignment, independent
Chinese–Russian review, approved dubbing script and real listening, a clean
Windows target and the owner's desktop decision remain required. No online
volunteer contact will be attempted.

## Publication addendum

The audit link and refreshed backlog were published in site commit
`cbe3e812472aae97e258f1cd41af63c74edc773a`, which changed no model,
runtime or product behavior. Its
[Pages workflow](https://github.com/Ermolz69/auralis-translate/actions/runs/37062634969)
completed successfully. A second `task site:live:check` confirmed both
HTTP-200 pages byte-for-byte against the committed HTML: [current](https://ermolz69.github.io/auralis-translate/?revision=cbe3e812472aae97e258f1cd41af63c74edc773a)
54,426 bytes, SHA-256
`673ee6c64a7a7072e569607ce17e3609f6982e0f4cf85d81c8ec852f4c022740`;
[history](https://ermolz69.github.io/auralis-translate/history.html?revision=cbe3e812472aae97e258f1cd41af63c74edc773a)
1,132,560 bytes, SHA-256
`62f3004c545a096dab4b2347c010e93503995803aa6537322be10e99c81c9326`.
The private second live-check report SHA-256 is
`bfbcb08ca2ec491fcb7731a9801691cadf5b79df34c20c0011762a251416621d`.
The public current page now links this v9 self-audit, and the historical
measurement objects remain unchanged. This addendum does not alter the
failed/open RELEASE-05 decision.
