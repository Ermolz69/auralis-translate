# Case-sensitive physical measurement warning boundary

Date: 1 October 2026. This extends the
[v2 signed/full-width warning](measurement-warning-v2.md) after a read-only
audit of the retained ASUS v6 translation found two false positives in memory
and storage capacity text. The v1/v2 contracts and archived results remain
available.

The short ASCII `g` is admitted as grams. Uppercase ASCII `G` is ambiguous in
Chinese product specifications, where it can abbreviate gigabytes, and is no
longer admitted as grams. Explicit `克`, Russian `грамм` and `г` remain gram
quantities. Other recognized units, signed values and
full-width decimal digits retain their v2 behavior. Case must be preserved
through quantity extraction; a lowercased view is used only to match an
otherwise admitted unit spelling and the Russian word for minus.

The minimal false positives were `内存16G` → `Память 16 ГБ` and
`硬盘512G` → `Накопитель 512 ГБ`. The production detector warned because it
classified the source `G` as grams. The bounded
[REG-036 pack](../../eval/regressions/catalog-v21.json) tests these, lowercase
gram losses, explicit Chinese grams, watts, equivalent controls and the
memory context. A capital `G` in a genuine weight remains outside this
conservative warning's coverage until contextual disambiguation is validated.
Storage capacity `G`/`GB` errors also remain outside this physical-unit
diagnostic. A warning-free candidate can still be factually wrong.

`measurement_mismatch` remains a review-only diagnostic; this change neither
rewrites candidate text nor changes checkpoint acceptance. Historical
checkpoints retain their original warnings. Before using a resumed or older
file as evidence, run the new diagnostic over every accepted source/target
slot without modifying the saved result. Source-aware human review remains
necessary for G3–G5 and spoken-script approval.
