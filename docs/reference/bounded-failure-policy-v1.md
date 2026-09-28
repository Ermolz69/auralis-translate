# Bounded v5 failure and review policy

Status: `CTX-05` contract, 28 September 2026. This defines the policy required
before v5 inference. Existing v1–v4 profiles keep their saved identities and
default one-attempt behavior. The current core accepts `max_block_attempts`
1–3. The implementation now repeats only typed transient provider failures
within that bound. The [v5 CLI inference journal](../architecture/015-inference-request-journal.md)
now retains chat-completion attempts; preflight and host attempt coverage remains open.

## Typed outcomes

| Code | Meaning | Automatic retry |
| --- | --- | --- |
| `unsupported_input` | Parser or declared slot/scene/term admission fails before HTTP | No |
| `incompatible_identity` | Source/model/prompt/tokenizer/terms/run fingerprint differs on resume | No |
| `budget_rejected` | Full rendered input plus reserved output does not fit | No; change policy in a new run |
| `transport_failure` | Local connection/read failed before a complete candidate | Only if explicitly enabled and within limits |
| `timeout` | Declared request deadline expired | Only if explicitly enabled and within limits |
| `malformed_candidate` | Response cannot be parsed as one complete v5 object | No by default |
| `invalid_candidate` | Slot IDs/count/order, protected facts or text contract fail | No by default |
| `resource_failure` | OOM or runtime lease failure | No silent CPU/model/cloud fallback |
| `storage_failure` | Checkpoint or artifact persistence fails | No model retry; recover storage first |
| `paused` | Durable pause takes precedence over model success/error | No new request until explicit resume |
| `accepted_needs_review` | Structurally valid saved text has language warnings | No automatic wording retry |
| `durable_complete` | All target slots validated, committed and separate output verified | Terminal success |

Every HTTP attempt is identified and retained with rendered input/hash, raw
response when present, restored candidate, validation outcome, usage, elapsed
time and error category in the [evidence record](../evaluation/010-comparison-record-v1.md).
Prompt, model, temperature, backend or terms never change inside a retry. Raw
failed candidates are not overwritten by later attempts. Structural rejection
commits no checkpoint and publishes no partial subtitle. A complete but
`needs_review` result remains explicitly unapproved for speech handoff.

## Budget and durable boundaries

The v5 policy is a versioned manifest/run input, including maximum requests per
target, retryable categories, request timeout, total target-stage wall budget,
response bytes/output tokens and run-level stop criteria. Validate positive
bounds before admission. Initial paired quality experiments use one request per
target to avoid selecting lucky samples. A later resilience experiment may
declare at most two total attempts for `transport_failure` or `timeout`, with
the same frozen profile and a measured stage budget. Do not silently apply that
retry setting to language comparisons. Higher budgets require a new plan and
identity. The existing v4 profile's 120-second request timeout is a baseline,
not a measured v5 long-file SLA.

Check pause before and after every provider call and immediately before commit.
After a validated response, commit the block durably before progress reports
that it is accepted. Export only after every declared target has one accepted
checkpoint and source/structure verification passes. On exhaustion retain the
accepted prefix and error diagnostics for compatible resume. Resume refuses
changed source, model, prompt, context/scene, terms or tokenizer. Retry after a
storage failure must inspect committed state first, not regenerate and duplicate
an accepted block. A human correction creates a new immutable result lineage.

`ProviderError` now distinguishes transient from permanent failures. Connection,
timeout, request-send and response-body transport failures, plus local HTTP 502–504, are
transient. HTTP 400 and other statuses, malformed response JSON, invalid slots,
protected-token failures and token-budget rejection are permanent. A non-default
`max_block_attempts` repeats only transient provider failures; the default is one
attempt. The existing pause check retains precedence. This is a coarse retry
classification, not the complete typed outcome taxonomy above. Durable raw
attempts, explicit run-stage wall budgets and resource-failure disposition remain
open under `CTX-02`. No unbounded regenerate-until-reference-match behavior is
permitted.

## Required regression controls

The minimal reproduction is a provider that returns a response with a missing
target slot on its first call and a valid response on its second. Under a
two-attempt policy, the first structural error must stop after one call, with
zero checkpoints and no progress claim. A separate transient-provider control
continues to show the opt-in retry path. [The typed retry regression](../../eval/experiments/2026-09-28-typed-provider-retry.md)
adds a permanent first failure followed by a valid response that must never be
requested, plus HTTP 400/502–504 and malformed-body controls. Additional v5
checks cover truncated JSON, duplicate/extra
IDs, empty text, context-copy instructions, money tokens, source collisions,
timeouts, OOM, pause at commit/export and changed resume identity. Any newly
confirmed failure gets its own minimal case and unseen related controls under
[regression policy 008](../evaluation/008-regression-and-adversarial-checks.md).

## CTX-05 acceptance

The [invalid-slot regression](../../eval/experiments/2026-09-28-invalid-slot-retry.md)
records the concrete core defect, minimal reproduction, three related invalid
shapes, a transient-provider control and pause control. `task fmt:fix` and
`task test:request-cancellation` passed for the changed core path. Typed retry
classification is linked above; durable raw-attempt implementation remains
assigned to `CTX-02`.
