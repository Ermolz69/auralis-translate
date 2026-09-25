# Strict plain-WebVTT subset v1

Status: format-adapter, durable CLI, and Auralis application-path contract, 25 September 2026. The parser and verified renderer are implemented in `auralis-translation-formats::vtt`. The CLI supports manual `inspect-vtt`, `template-vtt`, and `render-vtt`, a real-model `translate-vtt-experimental` path, and a durable `translate-vtt`/`resume` path verified with a mock model server and a [three-cue checked-model interruption](../../eval/experiments/2026-09-25-cli-vtt-interruption.md). Auralis has a [two-database import-to-publication test](../../eval/experiments/2026-09-25-auralis-vtt-two-db.md), a [one-cue native checked-model run](../../eval/experiments/2026-09-25-native-vtt-translation.md), and a [two-cue native crash/resume](../../eval/experiments/2026-09-25-native-vtt-crash-resume.md). Wider format coverage and the language-quality gate remain open. No general `.vtt` support is advertised yet.

This subset follows the [W3C WebVTT format](https://www.w3.org/TR/webvtt1/) but deliberately accepts less than the full syntax. Its purpose is to make text extraction and byte-preserving copy generation independently testable before model inference. Unsupported input fails as a whole; the adapter never silently drops a block.

## Accepted source

- UTF-8, with or without an initial BOM. Every line ending in a file is LF or every line ending is CRLF. A terminal newline is optional.
- The first line is exactly `WEBVTT` after the optional BOM, followed by a blank line. Header annotations and metadata are outside v1.
- One or more cues in nondecreasing start-time order. Overlap is allowed. Each cue has an optional unique identifier on its own line, an exact `start --> end` timing line, and one or more nonempty plain-text lines. The spaces around `-->` are exactly one ASCII space on each side; cue settings are outside v1.
- Timestamps use `mm:ss.mmm` or `hh:mm:ss.mmm` with at least two hour digits. Minutes and seconds are in `00..59`, and `end > start`. Arithmetic overflow is rejected.
- `NOTE` comment blocks, including `NOTE ` and `NOTE\t` starts, are permitted between cues and preserved byte-for-byte. A timing line inside a comment without a separator is rejected as an ambiguous missing separator.
- Blank lines between blocks and a trailing blank-line run are preserved. The default parser limits are 16 MiB per document, 100,000 cues, and 16 KiB per line; callers may supply a validated `VttParsePolicy`.

## Rejected before translation

`STYLE` and `REGION` blocks, cue settings, header annotations, cue tags, entities, inline timestamps, ruby, voice/language spans, karaoke, mixed or bare-CR endings, invalid UTF-8, duplicate cue IDs, malformed or decreasing timing, and empty cue text are rejected. For v1, a text line containing `<`, `>`, `&`, or `-->` is unsupported even if a full WebVTT player might accept it as literal text. A generic YouTube WebVTT export is therefore not automatically within scope.

The adapter does not normalise line breaks or infer timing. It does not translate `NOTE`, cue identifiers, or timestamps. Auralis must retain the immutable original source artifact. The standalone CLI retains its own managed original for both strict SRT and WebVTT paths.

## Output and verification

`VttDocument::parse` exposes ordered internal segment IDs, optional external cue IDs, timing, and exact byte ranges for each translatable text line. Internal IDs do not depend on external cue IDs. `source_segments` passes the track snapshot to the format-independent core.

`VttRunPlan` uses the shared block planner and a WebVTT-specific policy fingerprint. Translate SQLite saves an absent external cue ID as an empty `segments.cue_label` value and returns `None` to Rust; the mandatory internal segment ID and source map preserve identity. A two-cue library test saves the source map with one absent ID, fails after a committed block, reopens SQLite, resumes only the missing block, commits the verified result, and regenerates identical output from that result. This establishes library recovery and does not establish language quality.
The [cue identity decision](../architecture/005-optional-webvtt-cue-identity.md) records why this representation preserves the existing SQLite schema.

`render` requires exactly one translated record for every internal ID and exactly the original line count per cue. It rejects empty or unsupported replacement text, assembles a **new** byte buffer by replacing only declared text ranges, reparses it under the same policy, and compares cue order, IDs, timing, line counts, and every protected byte chunk. The source buffer is never mutated. A no-op render is byte-identical to the source, including BOM, comments, separators, and line endings.

```mermaid
flowchart LR
    O["Immutable original WebVTT bytes"] --> P["Strict parse and text-slot map"]
    P --> T["Only cue text lines for translation"]
    O --> C["New output buffer"]
    T --> C
    C --> V["Reparse and protected-byte comparison"]
    V --> R["Verified copy"]
```

The adapter tests cover byte-identical round trips for BOM/LF/CRLF/terminal variants, comments and cue IDs, separate-copy replacement, exact protected bytes, structural rejection cases, ID/line validation, and policy limits. The durable library test covers checkpoint recovery and result reconstruction with a fake provider. The CLI integration test uses a mock HTTP model, fails after one committed block, resumes only the missing block, re-exports without a server, and edits a new result revision without changing the earlier output. It also checks that unsupported `STYLE` input creates no run state. A three-cue real-model CLI process-kill test now retains the first checkpoint and writes a separate copy after resume. Auralis has a two-database application test, a native one-cue checked-model run and a native two-cue checkpoint-preserving crash/resume for WebVTT. Broader corpus and fuzz coverage, long-file interruption, target-player testing, and model-language validation remain open before WebVTT can be part of the Chinese release gate.

## Manual CLI path

From the repository root, for a file inside this subset:

```sh
task cli -- inspect-vtt source.vtt
task cli -- template-vtt source.vtt translations.json
task cli -- render-vtt source.vtt translations.json translated.vtt
```

Edit only `translations[].lines` in the generated schema-v1 JSON. The manifest binds the exact source bytes by SHA-256. `render-vtt` verifies the replacement and creates a new destination without overwriting an existing file. The original is unchanged. This path does not call a model, create a Translate SQLite run, or attach an Auralis project result.

For a separately started local llama-server and a validated profile, `task cli -- translate-vtt-experimental source.vtt PROFILE SERVER_URL translated.vtt` sends the extracted cue text through the shared model contract and verified renderer. A [one-cue real-model smoke](../../eval/experiments/2026-09-24-vtt-model-smoke.md) passed. This command is non-durable: it has no Translate SQLite run or resume and does not attach the output to Auralis.

The durable standalone path is `task cli -- translate-vtt source.vtt STATE_DIR PROFILE SERVER_URL translated.vtt`. The CLI retains a managed immutable source under `STATE_DIR/sources/`, stores segment maps, attempts, checkpoints, and result versions in `STATE_DIR/auralis-translate.sqlite`, and creates the verified output as a separate file. On failure or pause, `task cli -- resume STATE_DIR RUN_ID PROFILE SERVER_URL translated.vtt` continues missing blocks; a validated run can be re-exported without a server. `status`, `diagnostics`, `pause`, and `edit` accept the run/result IDs from this path. The mock-server integration test establishes the state workflow; the [checked-model CLI interruption](../../eval/experiments/2026-09-25-cli-vtt-interruption.md) additionally verifies one three-cue kill/restart boundary.
