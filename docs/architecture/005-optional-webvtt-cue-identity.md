# Decision: optional external WebVTT cue identity

Status: accepted for the strict WebVTT subset, 24 September 2026.

## Context

The SRT source map stored a mandatory cue label. WebVTT permits a cue without an external identifier. A durable WebVTT run still needs a stable internal segment ID, exact text ranges, and an idempotent source snapshot. Requiring a synthesized external label would misrepresent the original document and could conceal a source-map mismatch.

## Decision

`SegmentSpec.cue_label` is `Option<String>`. The parser-assigned `segment_id` remains mandatory and independent of the external cue ID. For a WebVTT translation, `None` is encoded as the empty string in the existing SQLite `segments.cue_label TEXT NOT NULL` column, then decoded back to `None`. Real external cue IDs are nonempty and round-trip unchanged. `ensure_segments` rejects `None` for an SRT translation. The full segment snapshot is compared on repeat writes and resume.

This encoding retains the v3 schema and all previously stored SRT rows. A schema migration to nullable storage is unnecessary for this subset; a future format that needs a meaningful empty cue ID must choose a different representation. Tests cover the absent WebVTT ID across database reopen and reject an absent SRT label.

## Consequences

The CLI can preserve an original WebVTT cue with no ID while using internal IDs for checkpoints and results. The source and published output retain exact protected bytes. External cue IDs must never serve as the unique durable segment key.
