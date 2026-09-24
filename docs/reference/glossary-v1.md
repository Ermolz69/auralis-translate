# Glossary input v1

Status: experimental CLI contract, 24 September 2026. This file describes the first confirmed-terminology input used by the prompt-v3 Hy-MT2 profile. It is not evidence that the model follows every term or that the profile passes language review.

## JSON shape

```json
{
  "schema_version": 1,
  "entries": [
    {
      "source": "阿明",
      "target": "Амин",
      "allowed_forms": ["Амина"],
      "segment_ids": [1, 2]
    }
  ]
}
```

`source` and `target` are required, nonempty, trimmed strings with at least one letter and no control characters. `allowed_forms` is optional and defaults to an empty array. Its values follow the same validation rule and may not repeat. `segment_ids` is optional: omit it for a global term, or provide a nonempty list of unique positive internal segment IDs reported by `inspect`. These IDs are not SRT cue labels. Unknown JSON fields and unsupported schema versions are rejected.

Two entries with the same exact source text conflict when their scopes overlap. A global entry conflicts with any scoped entry for that source. A scoped ID that does not exist in the inspected source is rejected before inference. The current matching rule is an exact, case-sensitive substring search in target or neighboring context text. Matching is only a selection rule for the prompt; it does not replace text in the output. A scoped entry is sent only when its scope includes the target segment. At the provider boundary, terms are filtered again for each target line.

The experimental profile limits the number and serialized JSON bytes of selected terms per block. An oversized applicable glossary fails before the model request. A term can be relevant in more than one block; each block fingerprint includes the terms actually sent. The model still chooses Russian grammatical forms. If a source term occurs in a target line and neither its target nor any allowed form occurs in the accepted Russian line, the checker stores one `glossary_term_missing` warning for that line. This is a case-insensitive substring heuristic on the Russian side; it cannot recognize every inflection or prove meaning. A term seen only in neighboring context does not trigger a target-line warning. Human review remains necessary.

## Start and resume

```sh
task cli -- translate-glossary source.srt state-dir models/manifests/hy_mt2_1_8b_q4_k_m.glossary.experimental.json glossary.json http://127.0.0.1:18080/ translated.srt
task cli -- resume state-dir RUN_ID models/manifests/hy_mt2_1_8b_q4_k_m.glossary.experimental.json http://127.0.0.1:18080/ resumed.srt
```

The CLI validates the glossary before creating run state. It copies the exact JSON bytes to `STATE_DIR/glossaries/<sha256>.json` and records that SHA-256 as the run's `glossary_revision` in Translate SQLite. Resume and manual edit load this managed snapshot and verify its digest; editing the external `glossary.json` does not change an existing run. A missing or modified managed snapshot blocks resume and export. To use changed terminology, start a new run with a new revision; never rewrite a committed run's glossary.

This snapshot is CLI-owned working state. In an embedded Auralis workflow, the host must supply an immutable glossary revision through its own artifact or configuration boundary while keeping detailed run references in Translate SQLite. No Auralis glossary UI or synchronization exists yet.
