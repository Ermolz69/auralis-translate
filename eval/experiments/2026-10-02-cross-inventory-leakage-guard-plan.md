# Cross-inventory source identity guard

Date: 2 October 2026. This is a bounded `DATA-05` pre-admission slice while
`DATA-03` and `DATA-04` remain incomplete. It does not admit a source or change
the sealed holdout. The observed gap is that the current cross-inventory check
only compares declared `group_id`; an alternate subtitle revision can claim a
different group and split even when its exact subtitle bytes or media item are
the same. The already retained Commons and original-platform Kirin tracks are
the positive related-version control.

Before admitting any development or holdout source, reject different groups
that share an exact non-null subtitle SHA-256, a canonical YouTube video ID, or
the same declared non-YouTube media URL. Permit different hashes and revisions
within one group. Add an optional `original_media_url` for a Commons derivative
whose source page establishes its original video. This is an asserted provenance
link, not a license or alignment claim.

Minimal reproductions and related controls use authored in-memory inventories:
same bytes under separate group IDs; YouTube watch/short-link aliases across
different URL fields; identical Commons media URL with different caption bytes;
same group with changed subtitle bytes; unrelated items; and metadata-only null
hashes. The check must also reject an invalid optional origin URL. Use the
existing `task eval:data:check`, then `task plan:check`, `task docs:check`,
`task site:build` and `task site:check`. Budget: one deterministic test cycle,
zero network requests, zero model or TTS calls, zero media downloads. Retain
failing test output before repair. This catches exact identity reuse only;
`DATA-05` still needs near-duplicate, rights, alignment and reviewer audits.
