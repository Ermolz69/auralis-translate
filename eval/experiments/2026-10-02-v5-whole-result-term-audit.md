# Whole-result approved-term form audit

Date: 2 October 2026. Partial `CTX-02` and `EVAL-04` engineering evidence;
follow-up to `REG-045`. This is a deterministic contract check with zero
model calls and zero independent Chinese–Russian ratings. It does not
adjudicate the natural `REG-044` venue-name variants.
Implementation commit: `3fff22f9454a02748e9d1bdee72e1ccd79ddbe70`.

New `audit-terms SOURCE RESULT SCENE_MAP TERMS_LEDGER` reads a complete
exported SRT and frozen v5 inputs. It rejects changed timing, cue identity,
order, layout or protected bytes before auditing. Source, scene map and term
ledger hashes and scopes must agree. Its JSON report pins all four input
hashes, counted segments, lines and scoped term-bearing lines, and each
missing-form segment and line. It has no write path to the source, result or
Translate database. The exit code is zero for a valid report even when
warnings exist; callers must inspect the warning list. The report explicitly
records `human_review=not_performed` and `assessment=form_screen_only`.

The minimal authored three-cue fixture has two missing approved forms and one
accepted inflected form. A second source line with a one-character-different
Chinese venue is a negative control. Changing the result timestamp or giving
the ledger an out-of-scope cue is rejected without a report. A fully covered
result yields zero warnings without upgrading the assessment. The 1,024-cue
authored ladder has the same term at cues 1, 512 and 1024, with similar but
different source spelling at cues 511 and 513 and a scene boundary after cue
512. The command reported exactly three missing-form warnings at 1, 512 and
1024, scanned all 1,024 lines, and left all four inputs byte-identical.
These fixtures are defined in
[`approved_term_audit_cli.rs`](../../crates/auralis-translation-cli/tests/approved_term_audit_cli.rs)
and core validation in
[`approved_term_full_audit.rs`](../../crates/auralis-translation/tests/approved_term_full_audit.rs).
Their committed source is the reproducible fixture; no natural subtitle or
translation is embedded in the public report. CLI test source SHA-256:
`d0efbce4c960b20b8e9ec5e6853c6544712073ab80d97d08eb14e6ea6f1ba457`.

Observed checks: `task fmt:fix`, `task test:approved-terms:audit` (one core
test and two CLI tests passed), `task test:v5-terms` (including that audit),
`task fmt`, `task lint`, `task test:cli:protocol` (seven tests),
`task docs:check` (343 Markdown files), `task plan:check`, `task site:build`
and `task site:check` passed. The built HTML is 1,122,409 bytes, SHA-256
`9c090a59e2f26a4ce6118b56d1d4b63a452533bb1198c9f34ff2c9c2038616a1`.
Publication is recorded separately after deployment. All test targets are authored fixtures;
no model accuracy, full-file semantic consistency or speech quality is
inferred from them.

This closes the old-checkpoint *inspection* gap: saved drafts can be screened
without changing their historical diagnostics. It cannot audit terms that
have not been declared and independently approved. No reviewer-approved
ledger exists for the 263-cue restaurant draft, and its `REG-044` variants
remain unresolved. `CTX-02`, `EVAL-04`, G3–G5 and RELEASE-05 stay open.
