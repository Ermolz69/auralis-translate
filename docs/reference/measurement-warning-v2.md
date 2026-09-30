# Signed and full-width physical measurement warnings

Date: 1 October 2026. This extends the conservative
[v1 measurement warning](measurement-warning-v1.md) after two deterministic
detector failures in authored development cases. It does not alter the v1
model profile, archived candidates or any checkpoint already written.

For recognized gram, kilogram, watt, watt-hour and volt quantities, the
diagnostic now canonicalizes ASCII and full-width decimal digits, including
point/comma spellings, before comparing source and accepted target multisets.
An adjacent ASCII, Unicode or full-width minus sign and Chinese `负`/`負` or
Russian `минус` denote a negative quantity. A sign directly following an
ASCII product-code character or underscore makes that token ineligible for
measurement extraction; `A-60g` is a code, not an asserted weight. A changed
sign, number, unit, missing quantity or duplicated quantity raises the existing
`measurement_mismatch` review diagnostic. Neither candidate text nor checkpoint
acceptance is changed by a diagnostic.

The initial minimal failures were `减重-60g` → `Масса изменилась на 60 г`,
which v1 did not warn about, and `型号A-60g` → `Модель другая`, which v1
incorrectly warned about. The full-width `重量６０８g` → `Вес 608 гигабайт`
case showed a related omission. The bounded [REG-035 pack](../../eval/regressions/catalog-v20.json)
adds related sign/width losses and equivalent-sign, equivalent-unit and
product-code negative controls. `task test:measurement-diagnostics` exercises
the production detector and the existing durable diagnostic path.

This is a review warning, not semantic adjudication. Worded comparisons such
as “60 g lighter”, numeral conversions, ranges, Chinese numerals without
decimal digits and unrecognized units remain for source-aware review. The
detector does not assert that a warning-free translation is factually sound.
Human G3–G5 review and spoken-script approval remain separate gates.
Saved checkpoints retain the diagnostic set recorded when they were committed.
Resuming a pre-v2 run can therefore contain old and new warning coverage; it
must not be scored as a uniformly v2-audited file. Re-evaluate every accepted
source/target slot in a separate, read-only audit before using these warnings
for a release decision. Do not rewrite historical checkpoints to change their
apparent outcome.
