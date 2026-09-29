# Provider review diagnostic v1

Status: implementation contract for `CTX-02` and `EVAL-04`, 29 September 2026.
The [REG-009 prefix screen](../../eval/experiments/2026-09-29-reg-009-prefix-repair-results.md)
found that deterministic insertion could restore the exact source code in 656
archived development lines. It did not establish that the Russian meanings were
correct. Any future opt-in insertion must remain visible after checkpoint
reopen, even when the resulting identifier multiset is exact.

`TranslationProvider::translate_with_control_and_diagnostics` may return
review diagnostics alongside a response. The default implementation returns
the existing response and no diagnostics, preserving legacy providers and
profiles. The core validates translated segment/line coverage first. It accepts
only the `source_prefix_inserted` diagnostic from this provider channel, with
an in-range target segment and line, no duplicates, and a target line whose
nonempty source and translated identifier multisets match exactly. Invalid provider
metadata rejects the whole block before checkpoint commit. Core-derived
warnings remain independent and are combined with accepted provider warnings.
Resume validates the same prefix flag against the saved source and accepted
line, rejecting a corrupted flag or changed accepted text.

The new diagnostic is durable in Translate SQLite. The current CLI already
marks every model result `needs_review`; this flag identifies the specific
line requiring attention. It is not a language-quality score or a claim that the model
generated the inserted code. The inference journal must keep the raw response
and restored pre-insertion candidate; the checkpoint keeps the accepted line
and `source_prefix_inserted` flag. Reopening both records permits an audit of
raw versus accepted text. Historical checkpoint codes and behavior remain
unchanged.

Acceptance for this slice: a valid mock provider insertion produces one saved
review flag that survives SQLite reopen, while an out-of-target or duplicate
flag saves no checkpoint. A legacy provider still saves its original result.
Run `task test:provider-review-diagnostics`, then affected core and SQLite
checks. These tests establish metadata integrity only; real model and human
evaluation remain separate gates.

Observed checks: `task test:provider-review-diagnostics` passed four core and
one SQLite test. `task test:identifier-diagnostics` passed two core and one
SQLite test, `task test:time-diagnostics` passed two core and one SQLite test,
and `task test:identifier-guard` passed three adapter tests. `task test` passed
the complete offline Rust workspace, including resume and legacy profile
regressions. `task lint`, `task fmt`, `task docs:check` and `task plan:check`
passed after the change. One initial Clippy failure in the new test used an
unnecessary clone; the corrected test passed. No model or audio was run for
this metadata change.
