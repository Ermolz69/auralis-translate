# Frozen offline postflight with separate identifier quality audit

Experiment ID: `long-v6-postlength-postflight-1024-v2`, 29 September 2026.
The [first offline verifier](2026-09-29-v6-postlength-postflight-plan.md)
exited after `inspect` and `template` because it required every authored
`AUR-####` source identifier to appear unchanged in the Russian text. Its
[failure record](../reports/2026-09-29-long-v6-postflight-v1-failure.json)
retains the first exact omission and a read-only scan count. The translated
file was never published. The source identifier is semantic text inside a
slot, not a byte-protected SRT delimiter. A missing identifier is a confirmed
quality failure and future guard requirement; it must not be relabeled as a
format parser failure or concealed by calling the file accepted for release.

Reuse the same completed private v3 workspace and unchanged output SHA-256
`cc2f4b3c88433cf59223bb35cfc95cdfeeed0c079c068106e7ef485369bd2e2b`.
The only verifier change is to measure and archive all identifier violations
separately from source timing/slot/protected-byte checks, then finish the
offline export and journal-preservation checks. Use new `postflight-v2-*`
private output names and `2026-09-29-long-v6-postlength-v2-*` public report
names, preserving all v1 artifacts. Run `task
eval:cli:long:v6:verify-postlength-v2` once after committing the repaired
checker, with a five-minute budget and no model server or inference requests.
Record missing, localized and wrong/duplicate code cases, their cue positions
and source/candidate text. Keep the initial v3 `ReferenceError` and v1 verifier
failure as independent observations.

Success means only that the 1,024-cue output is structurally complete and
offline-exportable while identifier preservation **fails**; it remains
unreviewed synthetic development output. G3–G5, RELEASE-05 and A1–A6 stay
open. A later core diagnostic and model experiment must address the fact loss
under its own versioned contract; no correction may overwrite this baseline.
