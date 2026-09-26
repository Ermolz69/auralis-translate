# CLI machine protocol v1

Status: implementation contract, 26 September 2026. Machine mode is opt-in with
`--json` or `--jsonl` before the command. The existing unflagged positional CLI
keeps its output and 0/1 exit behavior for the local scripts already using it.

Build with `task build` or `task build:release`, then invoke the compiled CLI
directly from an agent/controller. The wire and exit contracts apply to that
executable; build/task wrappers have their own diagnostics and failure statuses.
Durable translation retains the current fixed Chinese-to-Russian pair.

## Commands and input

Machine mode supports `inspect`, `inspect-vtt`, `doctor`, `status`, `diagnostics`,
`pause`, `translate`, `translate-vtt`, `translate-glossary`, `resume`, `edit`,
`fetch-release`, `fetch-asset`, `install-offline` and `install-online`.
Other development commands return a usage error in machine mode instead of
mixing text with structured output. A CLI-owned translation runtime remains
separate work.

Use existing positional arguments or `--request REQUEST.json` after the output
flag. The UTF-8 request is a versioned object with a `request` object containing
the command and named fields. Unknown fields and unsupported versions are errors.
Path strings and IDs are passed directly to the same command implementation;
there is no shell interpolation. Input requests have a 1 MiB size limit.
Relative paths resolve against the CLI process's working directory, not the
request file's parent. Machine arguments must be Unicode.

```json
{
  "schema_version": 1,
  "request": {
    "command": "translate",
    "source": "source.srt",
    "state_dir": "state",
    "profile": "models/manifests/hy_mt2_1_8b_q4_k_m.checked.experimental.json",
    "endpoint": "http://127.0.0.1:18080/",
    "output": "translated.srt"
  }
}
```

`inspect`/`inspect-vtt`: `source`; `doctor`: `profile`, `model`;
`status`/`diagnostics`/`pause`: `state_dir`, `run_id`;
`resume`: `state_dir`, `run_id`, `profile`, `endpoint`, `output`;
`edit`: `state_dir`, `base_result_id`, `profile`, `edit`, `output`.
`translate-vtt` has the same fields as `translate`; `translate-glossary` also has
`glossary`. Requests are controller inputs, not files to bundle with Auralis.

Package requests use `manifest`, `profile`, and `backend` in every command.
`fetch-release` adds `cache_dir`; `fetch-asset` also adds `filename`;
`install-offline` adds `source_dir` and `install_root`; `install-online` adds
`cache_dir` and `install_root`. Cache, source and installation directories must
be absolute, as required by the existing package adapters. The exact manifest
and profile bytes are frozen once per command, including the two phases of
online installation. These commands do not select a package in Auralis, start
a model server, translate a file, or create translation database records.

### Package events and verification boundaries

This additive v1 extension exposes `package_started`, `asset_cached` and
`package_installed`. Consumers must accept additional event kinds and summary
fields. The extension makes the existing separate-model installation operations
available to controllers without weakening upstream URL, hash, archive, or
overwrite checks.

- `package_started` follows manifest/profile/backend validation and includes
  `release_id`, `backend`, `manifest_sha256` and `profile_sha256`. It does not
  acknowledge installation or model readiness.
- `asset_cached` follows complete length/digest verification and cache-name
  publication (or revalidation of an existing complete entry). Its flattened
  receipt includes `filename`, `path`, `sha256`, `bytes`, `verified_assets` and
  `total_assets`. Counts refer to this invocation's requested asset set, not to
  transferred bytes. `fetch-asset` counts one asset. No byte-level download
  progress or unverified `.part` receipt is emitted.
- `package_installed` follows successful staging, file/archive validation and
  rename to the final package directory. Its flattened receipt contains `root`,
  `executable`, `model_file` and `profile_file`. It is not a runtime or language
  capability claim and does not promise directory-metadata power-loss durability.

`install-online` emits the cache receipts before the installation receipt.
If a later asset or installation fails, earlier verified cache files remain
usable and their JSONL receipts precede `failed`; no installation receipt is
emitted. JSON retains only the latest asset receipt. Use JSONL for the complete
asset list. A disconnected output reader can prevent a receipt after a file
was committed; inspect/retry the operation rather than infer its absence.
No committed package/cache file is removed because reporting failed.

## Output and durability

`--jsonl` writes one compact JSON object per stdout line and flushes every event.
Each has `schema_version: 1`, a monotonically increasing `sequence` beginning at
one and an `event` discriminator. There is no terminal token stream. IDs are UUID
strings; byte offsets, millisecond times and counts are integers. Messages on
stderr are human diagnostics; stdout has only protocol objects.

Events are `run_started`, `model_ready`, `progress`, `result`, `report`,
`pause_requested`, the package events above, `completed` and `failed`. Started run IDs are emitted only
after durable registration, before model preflight. The same `run_started` event
identifies an existing run selected for resume or
edit; it does not promise a new model attempt. Edit failures after result commit
retain these IDs so a controller can query status and resume the newest result.
`progress` reports accepted saved blocks, including already retained blocks on
resume. `result` is emitted
only after the validated result and complete separate output are persisted; it
includes IDs, revision, output hash/bytes, review label and output path. A result
committed before an export failure remains recoverable through `resume`, without
a successful `result` event for the failed export. No partial output is published.

`pause_requested` acknowledges a durable request, not a stopped worker. Query
`status` until state is `paused` and `pause_requested` is false. A paused
translation process ends with `failed`, code `paused`; its saved blocks remain
available. A complete review-required output ends with `completed`, exit code 3.

`report` wraps each read command's structured payload. Status retains its current
payload schema version 3; diagnostics and doctor retain theirs. Inspect reports
cue IDs, timing, source text slots/byte ranges and protected ranges. Inspection
intentionally includes source text; ordinary lifecycle events do not.

`--json` writes one final object instead of intermediate stdout events. Its
`schema_version`, `command`, `run`, `model`, `progress`, `result`, `report` and
`terminal` fields contain the latest applicable event or null. The additive
`package`, `asset` and `installation` fields retain their latest package event
or null. Progress is bounded
to the latest counter rather than accumulating a whole event history in memory.
Use JSONL when IDs/progress are needed before a process exits.

Exactly one terminal event is attempted on normal completion/failure. Process
termination or a broken output pipe can prevent delivery. The database remains
authoritative; a consumer must not infer absence of a run/result from missing
stdout. A failed progress write is reported at the next fallible output boundary;
committed checkpoints are never rolled back because a reader disconnected.

## Exit status and errors

| Exit | Meaning                                                                    |
| ---- | -------------------------------------------------------------------------- |
| 0    | Command succeeded without a newly exported review-required result.         |
| 1    | Unclassified/internal operation failure.                                   |
| 2    | Usage, invalid request/source/ID/profile.                                  |
| 3    | A complete output was exported with `needs_review`; this is usable output. |
| 4    | Runtime/provider failure or download transport/HTTP/protocol failure.      |
| 5    | Translation acknowledged a pause.                                          |
| 6    | Storage or filesystem I/O failure.                                         |
| 7    | Input/output conflict, busy cache, existing package, or identity mismatch. |

The stable `failed.code` values are `usage`, `invalid_input`, `invalid_source`,
`runtime_failure`, `paused`, `storage_failure`, `io_failure`, `conflict`,
`model_mismatch`, `download_failure`, `asset_mismatch`, `invalid_package` and
`internal_failure`. Package manifest/profile/backend errors use `invalid_input`;
unsupported/unsafe package contents use `invalid_package` (exit 2); verified
asset length/digest mismatches use `asset_mismatch` (exit 7). Cache ownership and
an existing final package use `conflict`. Download transport, response-range and
HTTP failures use `download_failure` (exit 4); local file/read/write failures
use `io_failure` (exit 6). `message` is explanatory and may change;
clients must use codes and typed fields. Classification uses explicit boundaries
and error types, never English-message matching. This first protocol does not
distinguish all provider timeout/OOM/truncation reasons; those still share
`runtime_failure` until the provider exports typed reasons.
