# Native historical journal-only interruption protocol

Date: 27 September 2026. Status: probe implemented, execution pending. This extends
[core commit interruption](2026-09-27-native-historical-result-gap.md). No passed
stage or release gate is claimed before actual execution finishes successfully.

## Expected behavior

Run `task desktop:e2e:native:translation:history:journal-gap` in Auralis with the
existing separate checked model/runtime assets. Actual review controls first save
a second-cue edit, then request a first-cue branch from the original model version.
The native-only hold occurs immediately after the metadata-only host intent
commits, before any Translate result/edit/provenance transaction. The harness
requires two model checkpoints, one completed inference attempt, two existing
results, two ready outputs and two host edit intents; the pending request must
have no core result, edit selection, provenance or publication.

While the request is held, the user-facing history controls select the original
model version. The external harness checks both databases and existing files and
kills the native desktop. After restarting, the actual UI must still expose only
the two ready versions and retain the selected model result. The harness checks
the unchanged durable snapshot before allowing any retry. Startup must not invent
the missing edit or rerun inference from a metadata-only digest.

The test command boundary captures the original request in a temporary JSON
fixture, including its caller ID, observations and lines. It is outside both
product databases and is removed with the isolated sandbox. After verification,
the harness releases that exact fixture to the native driver, which invokes the
ordinary typed edit/publication APIs twice. It must create exactly one third
result and one artifact, preserve the first admission time and digest, and retain
the newer project choice with the branch available as ready history. Independent
final checks verify ancestry, byte-preserving outputs and unchanged model state.

The fixture simulates a client retaining and retrying its request. It does not
establish automatic recovery of unsaved draft text in the production desktop:
a request digest cannot reconstruct missing text. The fault hook, request capture
and release observer are guarded by Rust `native-e2e`; native frontend scenarios
are excluded from production delivery. No weights or external corpus are added.

## Remaining scope

```mermaid
sequenceDiagram
    participant UI as Review controls / retained client request
    participant H as Auralis metadata-only intent
    participant T as Translate results
    participant E as Native harness
    UI->>H: Admit exact request at link revision 3
    H-->>E: Test-only hold before core transaction
    UI->>H: Select original model result; link revision 4
    E->>E: Verify absent result; kill and restart desktop
    H->>T: Startup checks pending intent; result absent
    E->>E: Verify unchanged snapshot before retry
    E-->>UI: Release original temporary request fixture
    loop Identical request twice
        UI->>H: Same result ID, guards and lines
        H->>T: Idempotent branch commit
        T-->>UI: Same result ID
    end
    UI->>H: Publish twice; same artifact
    H-->>UI: Ready history; explicit choice retained
```

Staged-file/outbox interruption, unfinished-run and broader command interleavings,
CLI branch delivery, language quality and clean-machine installation remain
separate gates. Automatic restoration of production drafts is outside this probe.
