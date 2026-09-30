# Conservative storage-capacity review warning

Date: 1 October 2026. The production physical-unit warning deliberately
excludes uppercase ASCII `G` because it can denote storage capacity rather
than grams. A separate `capacity_mismatch` review diagnostic covers numeric
storage/memory capacity only when the source line supplies enough evidence.
This does not change the [physical measurement boundary](measurement-warning-v3.md).

Admit `GB` as an explicit decimal-capacity unit. Admit a lone uppercase `G`
in a Chinese source line only when exactly one such unprefixed quantity is
present, a memory/storage marker is present in that line, and no weight marker
is present. Initial Chinese markers are `内存`, `显存`, `存储`, `储存`, `容量`,
`硬盘`, `固态`, `LPDDR`, `DDR` and `SSD`; weight markers are `重量`, `质量`,
`机重` and `重达`. This conservative line scope leaves mixed memory/weight lines for
human review. `Gb` gigabits and `GB/s` throughput are not capacity claims.
An ASCII letter or underscore immediately before the number
makes it part of a product code, not a capacity claim.

Compare admitted source values with Russian `ГБ`, inflected `гигабайт`, or
explicit `GB` values in the candidate. Normalize ASCII/full-width decimal
digits and point/comma forms. A missing, changed or duplicated quantity
raises `capacity_mismatch`; an unchanged multiset does not. Do not infer
capacity from a bare lowercase `g`, an unmarked `G`, a model number, a Chinese
numeral phrase, `TB`/`ТБ`, or unspecified colloquial speech. Those require a
later measured grammar extension or human review.

The diagnostic is review-only. It never edits model text, rejects an otherwise
structurally valid checkpoint or rewrites historical warnings. A prior saved
result can be audited read-only with this detector, but its original SQLite
checkpoint remains unchanged. An unflagged line has not passed a meaning
review. Independent Chinese–Russian adjudication remains necessary for
G3–G5 and spoken-script approval.
