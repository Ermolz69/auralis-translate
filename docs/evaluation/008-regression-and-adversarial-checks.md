# Regression maintenance and adversarial checks

Updated: 28 September 2026. Planned implementation under `EVAL-04`, `CTX-05`,
`DATA-05`, `HOST-04` and `VOICE-07` in the
[backlog](../IMPLEMENTATION_BACKLOG.md). No new model, fuzz, migration or audio
probe is claimed by this policy document.

## Test layers and change-triggered execution

| Layer | Purpose | Trigger and required evidence |
| --- | --- | --- |
| Contract/fixture | Admission, protected bytes, slot mapping, prompt versions, identity and errors | Every affected parser/core/provider/persistence slice; deterministic behavior checks |
| Generative/property | Supported document round-trip and unsupported rejection over varied inputs | Parser/renderer/admission changes; seed, generator version and minimized failures |
| Known real-model regression | Frozen authored money/meaning/name controls, raw accepted output and failures | Prompt/model/context/tokenizer/fidelity/decoding change; declared repetitions and budget |
| Context/seam | Paired scenarios, irrelevant context, slot isolation and batch boundaries | Context/term/planner changes; source-aware facts and blind review for semantic claims |
| Long/fault/migration | Full-file resource behavior, restart, upgrade/rollback and legacy export | Planner/storage/runtime/package changes; real selected candidate plus fault fixtures |
| Language/audio release | Sealed human-reviewed data and real listening/consumer/installation evidence | New release candidate or invalidation of an applicable gate; exact final identities |

Add executable Taskfile commands in each implementation slice. Do not advertise
planned commands as available. Fast tests run in CI; resource-intensive GPU,
full-file, clean-target and human checks are explicit gates with published outcomes.
Prefer deterministic assertions for structure. Model sampling and human judgments
require disclosed repeated results; avoid brittle tests asserting one exact Russian
sentence where several translations are valid. No network/model dependency in an
otherwise deterministic parser unit test. Quarantined flaky tests have a tracked
cause, owner and re-enable task; quarantine does not waive a release gate.

## Required stress/control families

- Empty/unsupported documents, huge single cues, many short cues, multi-line
  supported cues, repeated external labels, timing edges and permitted NOTE blocks.
- CJK/Russian punctuation, quotes, Unicode combining characters, BOM/CRLF/LF,
  mixed scripts, control/bidirectional characters and source-like marker strings.
  The admitted grammar determines acceptance; never silently normalize protected bytes.
- Text that asks a model to ignore instructions, reveal context, output a different
  language, repeat another cue or fabricate IDs. Source/context/glossary text remains
  data, without tool execution, access to secrets or authority over the contract.
- Truncated output, missing/duplicate/extra slot IDs, empty required target text,
  copied context, repeated money tokens, wrong token order and output-length limits.
- Mixed/nonnumeric money and units, percentages, dates, yuan and explicitly foreign
  currencies, change/refunds, nonmonetary pieces and matched negative controls.
- Speaker/gender/register ambiguity, Chinese names and approved transliteration,
  split clauses/negation, delayed callbacks, scene changes and term-scope expiration.
- Bounded HTTP/runtime failures, pause at each persistence/publication boundary,
  stale identities, competing starts, disk exhaustion and cancellation cleanup.
- Package corruption, unsafe extraction/path inputs and interrupted update tested
  only in owned fixtures; compatible backup restore and old-result offline export.

Archive checks reuse the existing package admission boundary. New rules must not
silently broaden format/model support. Unknown unsupported forms stay explicit.
Where malformed or ambiguous input is accepted as literal text, expected behavior
must be written before tests; tests do not invent semantic certainty.

## Metamorphic and paired assertions

Change one source fact while retaining the scene, then check that the corresponding
approved target fact changes and unrelated facts remain. Translate two equivalent
source scenarios with shifted timing or renamed external labels and check mapping/
supported protected bytes, rather than exact sampled wording. Insert an unrelated
context cue and check that target content does not acquire its facts. Shift batch
boundaries and check slot coverage, actor/amount/name preservation and seam errors.
Do not claim a metamorphic equivalence when a changed speaker/context actually
changes the intended meaning. Each pair needs a documented source interpretation.

## Failure, retry and review contract

`CTX-05` defines typed outcomes: unsupported input, incompatible identity, transport
failure, malformed/invalid candidate, accepted but needs language review, and durable
complete result. Structural validation rejects invented/missing slots; language
warnings cannot silently become acceptance of a corrected fact.

Configure and version maximum attempts per target, request timeout, total stage
budget and retryable categories. Retry transient failures only under that declared
policy. Rejected attempts retain diagnostics/raw evidence. No infinite regeneration
until a preferred answer appears, silent profile/temperature change, reference-led
retry or fabricated success. Model-output repair, if admitted, is a distinct policy
and recorded attempt requiring validation; it cannot overwrite a raw observation.

An exhausted target leaves the run recoverable with an explicit failure/review
outcome and no partial published subtitle. Resuming requires the same compatible
identity and preserves accepted checkpoints. Human corrections create immutable
edit descendants; editing must not poison a sealed evaluation or mutate the source.
Expose reason codes and review needs through the existing CLI/host contracts.

## Keep future checks useful

Every confirmed critical/major bug gets a minimal reproduction, source provenance,
expected fact/contract, negative control, affected profile/scope and linked backlog
fix. Add it to a versioned development regression pack. Include unseen related
cases so a per-sentence patch cannot pass by memorizing the visible failure.
Maintain language adequacy/grammar and structural checks separately.

`DATA-05` audits duplicate/source-group leakage, alignment, reference type, missing
rights/reviewer coverage and category balance before candidate review. Rotate an
inspected-for-tuning holdout into development and acquire a new sealed set; never
erase previously failing examples to improve a score. Freeze reviewer thresholds
and extraction/admission before observing candidate results.

Reports identify the corpus version and all attempted variants. Compare paired
cases with the same denominator; disclose exclusions, uncertain judgments and
run-to-run variation. Any uncertainty analysis must respect correlated scenes
rather than treating neighboring cues as independent observations. Accuracy on
300 eligible reviewed cues is an observed gate result, not proof for all future media.

Retain a machine-readable regression index with IDs, source family/split, category,
severity, applicable profiles, expected invariant, evidence link and last outcome.
The backlog remains the canonical implementation queue. Updating expected output
needs a source/contract-based reason; a new model answer alone is not that reason.
A change that fixes one category and creates a critical error in another is not
accepted solely because its average score rises.
