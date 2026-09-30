# Conservative source measurement warning

Date: 30 September 2026. The private ASUS v6 AI review found two high
confidence physical-unit substitutions: gram weights became gigabytes
at cue 12 and 9 watts became 9 volts at cue 227. These are development
observations, not an independent bilingual score. The existing provider
accepted both structurally. This contract adds a **review diagnostic** to
surface exact unit mismatches in future results; it does not rewrite model
text, reject an otherwise valid checkpoint or claim semantic correctness.

Compare the multiset of Arabic-number-plus-unit tokens in each target
source line and accepted Russian line. Recognize grams, kilograms, watts,
watt-hours and volts from Latin abbreviations and unambiguous Chinese and
Russian unit spellings. Treat optional spacing and Russian inflections of
the full unit name as equivalent. Keep numeric values exact, allowing a
decimal point/comma spelling difference. Prefer no warning if the source
has no recognized measurement, because a partial grammar should not
classify every translated number. Exclude product identifiers and longer
alphanumeric words from unit matches; do not interpret `GB` as grams or
`Wh` as watts. Compare only the target line, never a neighboring context
line. A mismatch emits `measurement_mismatch` with cue and line identity.

Author related controls for changed quantity, changed unit, missing
measurement and duplicated measurement. Negative controls include
equivalent `g`/`граммов`, `W`/`Вт`, `Wh`/`Вт·ч`, unrelated product IDs,
context-only measurements and a source with no recognized unit. These
controls protect the conservative boundary; they do not train the model
or establish quality on unseen scenes. Human adjudication remains needed
for conversion, idiom, technical terminology and all release gates.
