# Opt-in single retry for a leaked JSON tail

Status: experimental `CTX-05`/`EVAL-04` contract, 1 October 2026. The
[v1 guard](model-text-json-tail-guard-v1.md) remains the default: it rejects
the leaked wrapper suffix before checkpointing. Archived profiles and results
retain their bytes and behavior.

The first real 7B full-file [screen](../../eval/experiments/2026-10-01-sethlui-json-tail-retry-result.md)
stopped on a separate length-limited wrapper loop. A [v2 rule](model-text-json-tail-retry-v2.md)
is versioned independently; this manifest still treats that unfinished answer
as permanent.

Two separate real 7B restaurant requests at cues 62 and 100, and ASUS/Vivo
development requests, emitted a valid outer target-bound JSON object whose
`text` value ended in a wrapper-like `」}]}` tail. Strict SRT validation
rejected the affected lines, leaving durable prefixes and no partial output.
The [temperature-only screen](../../eval/experiments/2026-09-30-json-tail-temperature-screen-result.md)
showed that temperature zero failed twice on the ASUS example and did not
repair a Vivo meaning error. This contract changes retry admission, not
temperature, prompt, schema, model, source, scene map or semantic acceptance.

Only a separate checked v6 manifest may set `retry_json_tail_once: true`
with `max_block_attempts: 2`. A response matching the exact v1 JSON-tail
predicate becomes a retryable invalid candidate. The first raw HTTP response
and failure remain in the inference journal; no checkpoint is committed for
it. The core may make one additional request for that same block. If the
second response passes all normal JSON, source-fact, SRT and checkpoint
checks, its checkpoint records `attempt_count: 2`. If it fails, no output
artifact is published and the accepted prefix remains recoverable. A later
run must not change the profile when resuming an existing identity.

All other malformed JSON, missing/duplicate IDs, protected-token failures,
identifier/time mismatches, unsupported markup, timeout and storage errors
retain their existing classification. Because this manifest raises the block
limit from one to two, pre-existing transient transport failures may also use
the second attempt; permanent and storage failures still stop immediately.
The flag never trims, rewrites or
accepts the leaked characters. The existing `ProviderError::Transient`
classification means retryable for the run policy here; the journal outcome
remains `InvalidCandidate` because the HTTP transport succeeded. The raw
model answer and rejected reason remain distinguishable from the accepted
second answer. The manifest is a development experiment, not a selected
release default or a language-quality claim.

The model probe must use one frozen same-source plan, no hidden retries,
at most two chats per block and a stage wall budget. Compare with the
archived 7B v6 prefix on overlapping cue IDs, report every retry and
regression, and keep source-only expected meanings outside requests. Tests
cover both real suffix shapes, related variants, valid quoted CJK text and
literal closer controls, the flag/profile bound, exhausted retries and
zero partial publication. Human bilingual review remains separate.
