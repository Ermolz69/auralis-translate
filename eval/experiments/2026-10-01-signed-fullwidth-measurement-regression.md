# REG-035: signed and full-width measurement warning boundaries

Date: 1 October 2026. This is a deterministic engineering regression on
authored development text, extending the previously accepted
[REG-031 physical-unit screen](../regressions/catalog-v18.json). It does not
run a model, modify the private ASUS v6 result or estimate human translation
quality. The [v2 contract](../../docs/reference/measurement-warning-v2.md)
defines the admitted syntax and review-only outcome.

Before the fix, `task test:measurement-diagnostics` failed two new tests:
`减重-60g` / `Масса изменилась на 60 г` returned no warning, while
`型号A-60g` / `Модель другая` raised a false warning. The same implementation
also ignored source full-width `６０８g` before unit comparison. The red run
finished with three passed and two failed tests; no inference was attempted.

The revised detector canonicalizes full-width decimal digits and decimal
marks, preserves an explicit negative sign across admitted Chinese/Russian
spellings, and excludes adjacent ASCII product-code prefixes. Related
controls change sign, unit and quantity; negative controls preserve the
signed value through Russian `минус`, keep equivalent full-width quantities,
and exclude `A-60g`/`A－60g` codes. The retained
[REG-035 pack](../regressions/catalog-v20.json) lists the exact cases.

After the fix, `task test:measurement-diagnostics` passed all five core
tests, including both new loops, and the SQLite reopening test passed.
The prior gram/watt mismatch and equivalent-unit controls still pass. This
warns on a narrower family of errors before later human review; it does not
repair the already saved ASUS translation, prove source rights or pass G3–G5.
Existing checkpoints keep their original warning coverage; a resumed run
would need a whole-file read-only v2 audit before any uniform fact-warning
claim. This test does not supply that audit.

`task eval:regression:catalog:check` verified 35 pinned packs through
REG-035 and unchanged predecessor hashes. The permitted-process
`task eval:regression:check` passed its affected suite. A first restricted
run had stopped at Node test-runner `spawn EPERM` before the long-budget
test executed; no regression outcome was inferred from that failed launch.
`task eval:regression:asus:v6:units:private` then re-read the exact retained
44-cue ASUS packet without inference and still flagged only cue IDs 12 and
227. The original candidate and review packet were not edited.

`task check` passed formatting, Clippy with warnings denied and all Rust
workspace tests in the permitted process environment. Its first restricted
run stopped when the CLI retry fixture's loopback server refused a
connection; the exact `task test:retry-policy` passed separately before the
permitted full rerun. This does not change the archived model outcome.
`task site:build` generated a 1,066,172-byte report; `task site:check`
confirmed the new redacted section and previous measurements.
`task docs:check` verified 284 Markdown links and `task plan:check` verified
49 canonical tasks. Live Pages deployment is a separate publication check.
