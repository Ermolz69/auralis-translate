# Invalid target response must not trigger a model retry

Status: core regression correction for `CTX-05`, 28 September 2026. No real
model or language score is claimed.

## Reproduction and expected contract

The pre-fix planned-run loop matched every batch error with `Err(_)` when a
non-default retry budget remained. Therefore a provider response with a missing
target slot could be followed by another inference attempt that returned a valid
response. The first invalid candidate was not a transient transport failure.
The minimal test uses the existing two-target source batch with one read-only
context cue, `RetryPolicy::new(2)`, and a provider returning an invalid response
on call one and a valid reversed-order response on call two. Expected behavior:
one call, zero saved checkpoints and no accepted-progress event.

The fix returns a core `TranslateBatchError::Contract` immediately. New related
controls cover missing, duplicate and extra context IDs and empty target text.
They all stop at one call. The existing transient-provider control still
exercises a second call under the explicit legacy two-attempt policy, and the
pause control still wins on success/error. A valid reversed response remains
accepted by the shared validator in the support provider; this is not an exact
sampled-Russian-sentence test.

`task fmt:fix` formatted the changed Rust files. `task test:request-cancellation`
passed 5 local HTTP cancellation tests, 4 core retry/pause tests and 2 SRT/VTT
CLI resume tests. The deterministic pre-fix branch was identified by code
inspection; a separate red test run before the change was not recorded.
`task fmt` passed, `task lint` passed with denied warnings across the workspace,
and `task test` passed the full offline workspace suite. Those checks exercise
contract behavior and durable paths, not real language quality.

## Remaining boundary

The provider error type is still a string. Token restoration, JSON decoding,
transport and timeout failures are not yet differentiated at the core port.
The [v5 failure contract](../../docs/reference/bounded-failure-policy-v1.md)
requires typed categories before enabling v5 automatic retries. The default
one-attempt legacy profile is unchanged. This regression does not prove that
all malformed real-model responses or language warnings are handled.
