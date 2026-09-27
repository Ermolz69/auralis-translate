# Chinese currency protection: real development evidence

Status: experimental source-protection fix, 27 September 2026. This closes the
observed shilling substitution on the authored development price example. It
does not close general Chinese translation quality or desktop release gates.

## Change and contract

The [original report](2026-09-27-public-demo.md) translated 三块五 / 七块 as
shillings and cents in all three prompt-v1 runs. The new [profile contract](../../docs/reference/chinese-fidelity-profile-v1.md)
adds separately fingerprinted prompt v4. Its bounded source parser recognizes
amounts, Chinese minor-unit shorthand and explicit foreign currencies. Only an
inference copy is masked; the provider restores source-derived amounts after
checking every token's exact count and order. Corrupted or invented tokens fail
before a candidate reaches durable persistence. No arbitrary foreign currency
word is replaced in free model output. Original subtitle bytes and v1–v3 profile
bytes remain unchanged; using v4 requires a fresh explicitly selected run.

General Chinese instructions and unscoped unit terminology were insufficient.
The direct exploratory `task eval:currency-prompts` produced 40 responses and
preserved them under ignored `prompt-probe-SeCcYv`. A plain terminology prototype
fixed the original price but distorted some independent fractional amounts.
These prototypes are not released profiles and their caches are not resumable
acceptance evidence. Two initial nested Taskfile wrappers accidentally inherited
the v1 default; their reports explicitly record v1 and are excluded from v4
claims. The wrappers now run the benchmark directly and print the actual profile
and dataset before startup.

## Final real runs

Both datasets use the pinned Hy-MT2-1.8B Q4_K_M model, b10977-0ecb159c9 runtime
and original sampling settings. One persistent server per dataset, three fresh
SQLite states, twenty sequential HTTP model requests per file. There is no cold
OS-cache or isolated-host claim. Raw model responses contain tokens; the report
stores both `candidate` (raw) and `accepted_candidate` (restored). Token timings
describe the raw response. Source/code/CLI/profile/runtime hashes, HTTP request
hashes, complete prompts and monotonic timing records are in the JSON evidence.
Code was measured before its commit; `code_snapshot` hashes identify its actual
implementation rather than assuming the parent Git revision contains the changes.

| Dataset | CLI file times, ms | Startup, ms | Evidence |
| --- | --- | --- | --- |
| Original twenty lines | 10943.426 / 11265.071 / 11162.971 | 1745.229 | [Original-line v4 report](../reports/public-demo-fidelity-2026-09-27.json) |
| Independent twenty controls | 9435.736 / 9264.486 / 9325.252 | 2137.746 | [Currency control report](../reports/currency-controls-2026-09-27.json) |

The original example's accepted result is now, in all three repetitions:
"Эта бутылка воды 3,5 юаня, две бутылки вместе 7 юаней."
Seventeen monetary controls preserve every expected decimal amount and currency
in all three repetitions (51 checked candidates). Three nonmonetary controls
retain stones, chocolate pieces and minutes without adding currency (9 checked
candidates). Named dollars, euros, yen, rubles, shekels, shillings and Hong Kong
dollars remain distinct. Across both sets all 120 HTTP requests succeeded, six
files passed protected-byte checks, sources remained byte-identical, and all six
offline re-exports reproduced the saved output hashes after server shutdown.

## Checks and presentation

- `task eval:currency-controls`: three real files passed, report above.
- `task eval:public-demo:fidelity`: three real files passed, report above.
- `task test:fidelity`: 14 profile/protocol tests passed; includes numerical
  shorthand, explicit currencies, overlapping/repeated source amounts, unsafe
  numeric forms, physical units, source-prefix collisions and corrupted markers.
- `task test`: workspace checks passed; real-asset tests without supplied assets
  retain their existing skip behavior and are not additional model evidence.
- `task fmt`, `task lint`: formatting and workspace lint checks passed.
- `task site:build`, `task site:check`: the single remote-Tailwind HTML contains
  the frozen v1 baseline, both v4 datasets, all 180 requests, before/after results
  and exact measurements. Currency checks validate expected numeric arrays and
  labels without pretending to score the whole translated sentence.
- `task docs:check`: local documentation links passed.

The [HTML report](../../site/index.html) retains every v1 candidate and shows v4
alongside it. Downloads include both new reports, raw model output and accepted
rendered text. The public-site directory still contains only `index.html`.

## Open limitations and next steps

The new controls still expose bad verbs and grammar, e.g. 找你 (giving change)
becomes "Ищу тебя". Currency protection does not repair those words, double
negatives, Chinese-name readings or idioms. Protected quantities use Russian
counting forms; surrounding grammatical cases still require review. The bounded
parser does not promise every monetary expression or classifier context.

Broader defects need scene-aware terminology, explicit name decisions, a larger
model comparison and independent bilingual review on an unseen subtitle set.
The existing glossary/context profiles are experimental and must be measured
before claiming they improve this benchmark. Do not add hardcoded full reference
sentences to a prompt and call that general translation improvement.

The existing desktop installed-package manifest pins prompt v1. It was not
silently rewritten, and the desktop selection remains unchanged. v4 is currently
an explicit standalone CLI profile, not a shipped desktop default. A read-only
GitHub check now reports the repository as public with an existing Pages URL at
`https://ermolz69.github.io/auralis-translate/`. That external state differs from
the earlier private-repository rejection; this fix does not change visibility.
The existing Pages workflow publishes the updated HTML from main.
