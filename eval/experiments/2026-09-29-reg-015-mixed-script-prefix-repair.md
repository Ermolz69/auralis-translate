# REG-015: mixed-script identifier bypass in prefix repair

Date: 29 September 2026. Development fixture, not a model comparison or a
release-quality claim. This is a follow-up to the [failed real long CLI
run](2026-09-29-reg-009-long-cli-soak-results.md) and its REG-014 Cyrillic code
transposition. No holdout source or reference was used.

The minimum source is `工程 AUR-0089：列车将在 08:10 出发。`; the candidate is
`АUR-0089: Поезд отправится в 08:10.`. Its initial `А` is Cyrillic U+0410.
Under the v1 checked profile SHA-256
`e80c80b0cf1db26d62ce5f644091f30e42fea752d27a0ce201fcab33f29ecb69`,
the ASCII identifier extractor sees no candidate identifier and the Cyrillic
code-like guard misses a single Cyrillic letter. A loopback-provider test first
asserted rejection; `task test:source-prefix-repair` failed exactly at
`result.is_err()` (9 other adapter tests passed). The observed accepted line was
`AUR-0089: АUR-0089: Поезд отправится в 08:10.` with a review flag. This is
unsafe as an automatic prefix insertion, even though the flag asks for review.

The [v2 contract](../../docs/reference/source-prefix-repair-v2.md) and checked
experimental manifest SHA-256
`f7b355cd265e93c402eb94fc8e444dd92e48a4c9041d61d2e914388ca5b9147f`
add a mixed Latin/Cyrillic code-shape rejection. V1 remains byte-identical and
the two flags cannot be enabled together. V2 retains the raw candidate and
rejects before checkpoint commit. The [REG-015 pack](../regressions/long-v6-mixed-script-code-repair-v1.json)
pins the minimum failure, five related variants and four negative controls,
including a candidate with both the correct ASCII code and an extra
mixed-script code.
`task test:source-prefix-repair` then passed 11 adapter, four core, one SQLite
and one CLI recovery test. The affected real-model and language gates are still
open; no v2 inference, 1,024-cue completion or human Russian review is claimed.

The published [GitHub Pages run 36584519791](https://github.com/Ermolz69/auralis-translate/actions/runs/36584519791)
for `b63aa5f` succeeded. An HTTP GET of the live page returned 200 and SHA-256
`df8afba5865656caff9952203e272b7380a516a28caa5862af66eebbbf5d5a9f`,
identical to the then-committed `site/index.html`. The document includes the
long CLI failure section and `@tailwindcss/browser@4` CDN script. This checks
publication of the earlier failure, not the still-unpublished v2 fixture.
