# Translate provider organization assignment

Execute proposed ID `MNT-03` on `refactor/translate-provider-modules` after MNT-02
provides any missing check entrypoints. Read the [agent contract](../AGENT_CONTRACT.md).
Own the private provider implementation and relevant llama.cpp crate behavior tests.
Coordinate declarations/re-exports within that crate. Do not change CLI/Auralis,
profile manifests, persisted journal schemas or historical experiment files.

## Sequence

1. Read all of `provider.rs`, `provider_v7.rs`, `local_http.rs`, decoding,
   token-budget and cancellation tests. Map construction/probing, preflight,
   version dispatch, line/batch execution and journal ownership.
2. Capture a model-free matrix through existing public provider APIs: legacy
   prompt families; v5/v6 line shape; v7/v8 batch shape; exact-count versus
   apply-template/tokenize paths; malformed/invalid/truncated output; transport,
   timeout and pause; journal begin/finish failure; diagnostic-aware prefix repair.
   Add missing assertions only where a meaningful public contract needs protection.
3. Extract responsibilities into private modules in small commits. A provider
   facade plus private probing, preflight, line execution and journal helpers is
   a possible split, not a required class hierarchy. Keep module visibility narrow.
4. Share request/journal mechanics only when their exact ordering and failure
   precedence are the same. Keep differing line/batch restoration and validation
   rules explicit. String classifier cleanup may move code, not change outcomes.

## Acceptance

Existing imports and public provider signatures remain source compatible.
Normalized captured requests, headers, version selection, response formats,
context-removal ordering, split behavior, token reserves, diagnostic codes and
returned errors match the base. Journal request IDs and elapsed times vary as
before; event order, raw responses, restored-candidate meaning and outcome
categories remain the same. A failed journal write still fails at the same point.

The 827-line file becomes a small facade with cohesive private owners; do not
achieve that by hiding the body in an equally mixed file. Retain the current
runtime-build guard for one-request token counting and both legacy requests.
Do not alter retry policy, tail repair or source fact validation.

Run the MNT-02 focused provider command, `task test:model-profiles`,
`task test:context-v5`, `task test:context-v6`, `task test:long-batch-v7`,
`task test:long-batch-v8`, `task test:inference-journal`,
`task test:request-cancellation`, `task fmt`, `task lint`, `task test`,
`task docs:check` and `task plan:check`. Verify task definitions before invocation.
Model-dependent checks remain separate; no mock result renews real-model evidence.
Report before/after responsibility and behavior matrices under the common contract.
