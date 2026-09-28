# Paired experiment record v1

Status: `EVAL-02` evidence contract, 28 September 2026. The executable
validator is `task eval:report:check`. Its [example](../../eval/reports/experiment-record-example-v1.json)
is marked `fixture_only`, stopped with zero requests and no review. Its all-zero
hashes are schema sentinels and are rejected in real reports. This example does
not add a model result to the existing public 420 measured requests.

## Freeze before execution

`plan.frozen_at` must precede the first request. The plan fixes task IDs, one
question, corpus/split hash, cases with source/scene/target IDs, source/reference
hashes, expected meaning and prohibited facts; variant model/profile/prompt/
runtime/tokenizer/context/term hashes and decoding; repetitions; maximum
requests/tokens/wall time; and stop criteria. A real report uses full actual
hashes and one source case set across variants. Context may differ as the
declared factor. A changed plan gets a new experiment ID; old failures remain.
References and expected facts are plan/review fields, never model-input fields.
`reference_excluded_from_prompt` is an auditable assertion, not a substitute for
inspecting the retained rendered input.

The environment records the tested Git commit, dirty-code hash when applicable,
OS/hardware and resource sampling interval. A real report cannot omit this
environment; an unused schema fixture may. Versions, executable build identity
and model/backend launch arguments belong in the linked experiment narrative or
an extended version of this schema before a gate claim. A declared profile hash
is not proof of the loaded model: use checked runtime preflight and model-file
hash evidence.

## Retain every attempt

Each attempt has variant/case/repetition/retry identity, context IDs, batch
position (`single`, `seam` or `interior`), rendered input/hash, raw model output,
or a controlled storage reference when the prompt cannot be published, raw model
output, restored candidate, accepted persisted output/checkpoint digest,
outcome/error, token usage,
elapsed monotonic request time and sampled process/device memory. Invalid output
retains its raw bytes and cannot have accepted text. A transport failure may have
no response body but records its typed error. An accepted attempt requires raw,
restored and accepted fields. Unknown usage or resource values are `null` with
a reason. Retried attempts have new IDs and attempt numbers; they do not erase
earlier failures.

At file level, `measurements.file_elapsed_ms` covers admission to validated
publication or termination. Separate stage fields are admission, hash/load,
prompt evaluation, decode, validation, checkpoint and export. Uninstrumented
stages are `null` with a reason; their exact time is not inferred as a residual.
The resource series has ordered monotonic sample offsets, process RSS and whole
device GPU usage, which is not model-exclusive. Peaks from sampling are lower
bounds. The numeric sampling interval and observer limitations belong in the
environment/narrative. A missing sample requires a reason.

The validator checks unique IDs, known case/variant references, declared budgets,
source-paired cell coverage for a complete report, retained rejected candidates,
accepted evidence, summary counts and nearest-rank p50/p95 from raw request
durations. `stopped` retains a reason and may have incomplete cells. `complete`
means the declared matrix was attempted, not that every candidate was accepted
or linguistically correct. The HTML report must show accepted/rejected and
unreviewed coverage separately. The model-side reference exclusion attestation,
external rights and human scores need independent audit; the validator cannot
prove them from field shape.

`review.kind` distinguishes `none`, `ai` and `human`, with reviewer ID, eligible
and reviewed counts, critical unresolved count and source awareness. A no-review
report cannot claim reviewed cues. Human release scoring follows the separate
[blind rubric](009-blind-source-review.md) and its private immutable score
sheets; this summary field does not itself pass G3–G5. An AI review can help
triage but is never counted as independent human coverage.

## EVAL-02 acceptance

`task eval:report:check` validates the schema fixture and seven behavioral tests:
paired coverage, budgets, raw/accepted separation, provenance, quantiles,
duplicate retry IDs, sentinel hashes and explained measurement gaps. No new
real-model, human or long-file result is claimed by these schema tests.
`task plan:check` passed all 49 task IDs and dependencies;
`task docs:check` passed 104 local Markdown files. `task site:build` and
`task site:check` passed while retaining 180 historical and 240
model-comparison requests in the single HTML report.
