# Ready result history and explicit selection

Status: implemented with supporting SQLite/UI tests and a native checked-model
edit/selection/reopen scenario, 26 September 2026. See [the evidence record](../../eval/experiments/2026-09-26-result-history-selection.md).

## Separate preview, selection and automatic publication

A history page lists ready Auralis publications with ready translated artifacts
for the same project, translation and immutable source. Translate still owns
result content and revision provenance; the host history contains only existing
publication metadata. Order by first publication insertion, newest first, with a
result-ID cursor resolved to its immutable insertion position. Bound pages to
100 entries and reject cursors from another translation. New insertions must not
duplicate entries on the next page.

Previewing a historical ready result uses the existing verified comparison API
and does not change the selected result. Explicit selection uses a new operation;
the automatic `select_ready_result` publication path keeps all its precedence
checks. Selecting a ready historical version verifies the original/frozen run,
reconstructs the immutable Translate result and checks the existing managed output
file's size and digest. No file is rewritten and no subtitle text is copied into
Auralis SQLite.

The artifact port names this shared operation `verify_storage_digest`: it checks
a managed key for staging or an existing ready output. The rename preserves the
adapter's bounded streaming hash and key-resolution rules.

Commit selection in one host write transaction with project/source/artifact
ownership and the caller's expected link revision. Increment the link revision,
preserve its active run, and leave publication provenance/expected revisions
unchanged. A repeated request for the same selected result/artifact is idempotent
after those ownership/readiness checks. A conflicting request cannot replace a
newer user choice.

Reject a different selection while a publication for the current link revision
is pending. This serializes staging with user choice and avoids stranding a
pending copy under an obsolete link revision. A later genuinely new run/result
may still publish normally. Restart recovery must not replay an already ready
latest result over an explicit historical choice.

## UI and editing

Display the attached result separately from the version being previewed. Show
the run and per-run revision, review flag and attachment state. Loading another
history page or preview must not silently select it. The selection button uses
the observed link revision; errors keep the existing project selection and make
refresh/retry available. Discard late reads after project/translation changes.

The ordinary editor appends to the latest Translate result and rejects a stale
base. An older preview must use the separate
[explicit historical edit contract](015-historical-result-edits.md), which
observes that base's current run head and host link revision, journals the request
and appends an immutable branch. Experimental controls now implement that path
with supporting evidence. They retain ordinary stale-base protection by using a
different command, and require verified context before enabling historical save.
The later [native branch/reopening record](../../eval/experiments/2026-09-27-native-historical-branch.md)
passes that completed-save case independently of the original history-selection
slice. Process interruption inside manual-save boundaries remains unverified.

```mermaid
sequenceDiagram
    participant U as Review panel
    participant H as Auralis history use cases
    participant T as Translate result reader
    participant F as Managed artifact store
    participant D as Auralis SQLite
    U->>H: List ready versions with cursor
    H-->>U: Metadata and observed link revision
    U->>H: Preview historical result
    H->>T: Verify source and reconstruct comparison
    T-->>U: Original and translated cues
    U->>H: Explicitly select result at expected revision
    H->>T: Verify immutable result
    H->>F: Check existing output size and digest
    H->>D: Recheck ownership/readiness/pending publication; commit choice
    D-->>U: Updated link; active run preserved
```

## Verification required

Real SQLite tests cover bounded cursor history, new insertions, ownership,
readiness, pending/stale conflicts, idempotence and active-run preservation.
Two-database checks verify old-result comparison, corrupt/missing original or
output rejection, retained immutable bytes and restart recovery after selection.
Frontend tests cover preview versus attachment, paging, selection and stale
responses. A native checked-model workflow must create a later manual version,
preview/select the original result through actual controls and retain that choice
after reopening. Language and clean-machine gates remain separate.
