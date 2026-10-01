# Opt-in retry for a length-limited JSON wrapper loop

Status: experimental `CTX-05`/`EVAL-04` contract, 1 October 2026. This extends
the [v1 completed-response rule](model-text-json-tail-retry-v1.md) under a new
versioned manifest. The v1 7B full-file probe left 61 durable cues and stopped
at cue 62: llama.cpp returned `finish_reason=length` after 256 completion
tokens of repeated JSON closing characters following an invented `」` marker.
The [raw report](../../eval/experiments/2026-10-01-sethlui-json-tail-retry-result.md)
is retained. The v1 manifest remains unchanged.

Only a checked v6 profile with both `retry_json_tail_once: true` and
`retry_length_json_tail_once: true`, plus `max_block_attempts: 2`, enables this
rule. If and only if a completed HTTP response has one choice,
`finish_reason=length`, a `translations`/`text` JSON-like content prefix and
a last `」` followed solely by a closing quote, braces, brackets or whitespace,
the failure is classified as retryable. The entire raw response remains in the
inference journal as `InvalidCandidate`. No part of the truncated content is
accepted or repaired. A second request uses the identical rendered prompt;
only a normally completed, fully validated answer can create a checkpoint.
Another length-limited loop exhausts the budget without output.

Ordinary length-limit responses, complete-looking JSON with no marker,
quoted CJK text followed by prose, malformed closers, non-JSON text and the
v1 manifest remain permanent failures. Existing transient transport errors
may use the second attempt because this opt-in manifest has two block attempts.
The policy does not modify generation parameters, grammar, model, source,
scene map or references. It does not claim that another stochastic request
will finish or translate correctly. A measured full-file result and
independent bilingual review remain separate gates.
