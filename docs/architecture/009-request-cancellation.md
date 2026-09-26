# Cancellation of an active model request

Status: implementation contract, 26 September 2026. This implements the existing
pause requirement in product plan section 11. Verification results are recorded
separately; the polling interval is not a measured end-to-end latency guarantee.

## Ownership

`RunControl` stays a synchronous, format-independent core port. The planned-run
engine supplies it to `TranslationProvider::translate_with_control`, checks it
before each attempt and immediately after every provider return, and discards the
unfinished block before checkpointing or retrying. A pause wins over a simultaneous
provider error even on the final retry. A control-read failure fails closed.

The default provider method delegates to `translate` for deterministic or legacy
providers. That compatibility path alone does not promise mid-request cancellation.
The llama.cpp adapter overrides it and observes control during both HTTP headers
and response-body reads. No SQLite, Tokio, HTTP, or filesystem dependency enters
the core. Response validation is shared by controlled and uncontrolled calls.

## Transport and scheduling

The adapter owns a single-thread Tokio runtime and an asynchronous reqwest client.
The synchronous API is called from a CLI thread or Auralis's existing blocking
executor. One HTTP future remains pinned across control ticks; ticks do not restart
the request or create additional inference workers. When control requests pause,
the adapter drops the HTTP future and its partial response, drives connection
cleanup, and returns. The profile timeout and response-byte bound still apply.

Idle HTTP connection pooling is disabled because this runtime does not poll
connections between synchronous calls, notably during checked model hashing.
A real-model probe exposed failure to send the first translation after preflight
with an unpolled pooled connection. Separate local connections avoid retaining
that state; a keep-alive regression checks that each completed call disconnects.
The subsequent checked-model probe supplies the implementation evidence.

`RequestControlPolicy` supplies a validated polling interval of 10–1000 ms, with a
250 ms default. It is an operational transport policy, not a model prompt setting
or a change to the frozen profile fingerprint. Database lock waits and scheduling
can increase acknowledgment latency beyond this interval. Checked-server preflight
and model-file hashing precede the attempt and are not covered by this request
cancellation contract.

## Durable lifecycle

```mermaid
sequenceDiagram
    participant UI as CLI / Auralis
    participant DB as Translate SQLite
    participant Engine as Planned-run engine
    participant HTTP as llama.cpp HTTP adapter
    UI->>DB: Persist pause_requested
    HTTP->>DB: Poll RunControl while awaiting response
    DB-->>HTTP: Pause requested
    HTTP->>HTTP: Drop request and incomplete body
    HTTP-->>Engine: Provider returns
    Engine->>DB: Recheck pause; discard unfinished block
    Engine-->>UI: Paused
    UI->>DB: Stop current attempt as paused
    Note over DB: Earlier checkpoints and frozen run identity retained
    Note over UI: Host job ends; managed runtime lease is released
```

The composition root acknowledges `Paused` through its existing attempt-stop
transaction. It keeps the project link and previously committed blocks. Resume
starts a new attempt on the same frozen run and requests only missing blocks.
There is no partial result or output artifact. Auralis's worker awaits this durable
acknowledgment before releasing its runtime lease and completing cancellation;
dropping its outer future alone would leave a blocking worker alive.

An acknowledged executor cancellation also completes the host runtime task as
`Cancelled`, even when the UI wrote only the durable pause flag and did not cancel
the in-memory runtime token. It must not become an application-failure outcome.

Disconnecting a caller-supplied server request is not a promise that an arbitrary
server stops computation. Auralis additionally owns and releases the managed child.
Process ownership, concurrent command interleavings, and power-loss durability
require their own evidence.

The implementation follows Tokio's documented future cancellation and biased
selection behavior: [Tokio select](https://docs.rs/tokio/1.53.1/tokio/macro.select.html).
