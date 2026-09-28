# Typed provider retry regression

Status: deterministic engineering regression for `CTX-02` and `EVAL-04`,
28 September 2026. No model-quality or long-file gate is claimed.

## Reproduction and invariant

At parent commit `0fa82c7`, `translate_planned_run_with_policy` retried every
provider error whenever a profile allowed more than one block attempt. A provider
that returned a malformed candidate on its first call and a valid candidate on
its second could therefore complete and checkpoint the second answer. The error
category was a string, so the run could not distinguish this from a temporary
connection failure. This violates the bounded failure policy: a malformed
candidate must stop without a hidden wording retry or partial publication.

The minimal test `permanent_provider_failure_is_not_retried_or_checkpointed`
uses exactly that first-failure/second-success sequence with a three-attempt
budget. It now observes one call, a permanent provider failure, zero checkpoints
and only the initial zero-progress event. Related controls check malformed
llama.cpp JSON and HTTP 400 as permanent. Negative controls check HTTP
502, 503 and 504 as transient, and the existing transient-provider test records
two calls and one checkpoint under an explicit two-attempt policy. Pause still
wins after the provider returns, even at the final allowed attempt.

`ProviderError` now carries `Permanent` or `Transient`; only the latter can be
retried within `max_block_attempts`. Request connection, send, timeout and response-body
transport failures, plus local HTTP 502–504, are transient. Other HTTP statuses,
malformed JSON, invalid slot mapping, fact-token failures and budget rejection
are permanent. The default manifest setting remains one attempt. No prompt,
model, source or accepted checkpoint is changed by this classification.

This is a deterministic fixture and loopback-server check. It does not show a
real runtime outage, model recovery, durable raw rejected-attempt storage or a
complete long-file restart. Those remain open under `CTX-02`/`LONG-05`.

The v5 prompt template identity hashes its Rust source file, including error
construction. Although the rendered instruction text is unchanged, this code
change moves the three experimental v5 manifests from template SHA-256
`7eed5a47e3679f8b20113dd2842bf581b9760c56d83c84283b57884c3e4414a1`
to `af6ebaa8af4ff777aeb313c0e4496998c898701df07809c7691d4fe2717b959c`.
Earlier v5 run identities and reports are retained. Resume under the new
manifest must reject the earlier identity; use the earlier checked revision and
manifest for an old run instead of silently changing its prompt identity.

## Verification

- `task fmt:fix`: passed.
- `task test:retry-policy`: passed (7 loopback/provider, 5 core and 1 durable
  CLI check). The CLI control now starts with HTTP 503 and records two attempts
  on its accepted checkpoint.
- `task test`: full offline Rust workspace passed after updating the affected
  experimental v5 manifest hashes. Its first run exposed the old CLI test's
  expectation of repeating a truncated model answer; the next run exposed stale
  v5 template hashes. Both were corrected before the passing run.
- `task lint`: passed with warnings denied.
- `task plan:check`, `task docs:check`, `task site:build` and `task site:check`:
  passed after archiving the measured v5 manifests under `eval/profiles/`.
  Historical reports remain byte-identical and the public page compares them
  with those archived profiles rather than the new active manifests.
