# Experimental source-prefix identifier insertion v2

Status: opt-in development contract for `CTX-02` and REG-015, 29 September
2026. The [v1 policy](source-prefix-repair-v1.md) remains reproducible for
historical runs. This revision addresses a deterministic v1 safety gap; it is
not selected for release and has no real-model quality claim.

The checked v6 manifest sets `source_prefix_repair_v2: true` and leaves
`source_prefix_repair: false`. Both flags together are invalid. Strict source
identifiers and the checked model/runtime identity remain required. The prompt,
source, decoder, token budget, money restoration and journal format are unchanged.
The manifest bytes distinguish new runs from v1 and prevent cross-policy resume.

Apply all [v1 insertion conditions](source-prefix-repair-v1.md). If the source
contains an ASCII identifier, reject a candidate containing a code-like sequence of at least
two uppercase letters drawn from ASCII Latin and Cyrillic, with at least one
Cyrillic letter, followed by a hyphen and at least two ASCII digits. This
includes fully Cyrillic and mixed-script spellings such as `АРУ-0089`,
`АUR-0089` and `AUР-0089`. The strict exact-ASCII identifier guard then rejects
the candidate before checkpoint commit, including when it also contains the
correct ASCII identifier. Preserve its raw/restored response in
the inference journal and publish no partial result. The rule does not
transliterate, edit, retry or infer the intended code.

The minimum REG-015 reproduction is source `工程 AUR-0089：列车将在 08:10 出发。`
and candidate `АUR-0089: Поезд отправится в 08:10.` (initial `А` is Cyrillic).
V1 can insert `AUR-0089: ` before this candidate and accept a misleading line;
v2 must reject it. Related controls cover a Cyrillic final letter, fully
Cyrillic spelling, changed digits, another source code and a correct ASCII
identifier alongside the mixed-script one. Negative controls
cover an exact ASCII code, an omitted code with a review flag, no source code,
and ordinary Cyrillic uppercase text without a code shape. This is structural
protection only: human meaning, names, money and fluent Russian remain open.
