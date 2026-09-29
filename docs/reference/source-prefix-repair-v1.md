# Experimental source-prefix identifier insertion v1

Status: opt-in development contract for `CTX-02` and REG-009, 29 September
2026. The [archived screen](../../eval/experiments/2026-09-29-reg-009-prefix-repair-results.md)
measured a narrow exact-code gain on authored development text and left nine
identifier failures and a wrong-content line. This policy is not selected for
release and does not imply adequate Russian meaning.

Only a separate checked v6 manifest may set `source_prefix_repair: true`. It
also requires `strict_source_identifiers: true`. The model prompt, target-bound
JSON schema, token budget, decoding, source bytes and protected money handling
remain identical to v6. The new manifest bytes create a distinct run identity;
v5/v6 manifests without the flag keep their previous behavior and checkpoint
history. A run started under either policy cannot resume under the other.

After decoding the exact target slot and restoring protected money, inspect
only that target's original source line and restored candidate. Insert the
single exact ASCII identifier as `ID: ` before the candidate only if all of
these conditions hold:

1. The source has exactly one identifier under the [v1 grammar](source-identifier-diagnostic-v1.md), and that same identifier occurs in a prefix of at most 80 Unicode characters before the first full-width colon `：`. The prefix contains no line break.
2. The candidate has no ASCII identifier under that grammar and no two-or-more-uppercase-Cyrillic-letter code-like spelling followed by a hyphen and at least two ASCII digits.
3. The candidate contains non-whitespace text and the source/candidate identifier multisets differ.

Any other candidate is left byte-identical. The existing strict guard then
rejects missing, changed, duplicate or extra identifiers before checkpoint
commit. A successful insertion emits a `source_prefix_inserted` diagnostic
through the validated provider channel. The raw HTTP response and restored
pre-insertion candidate stay in the inference journal; the checkpoint holds
the accepted line and review flag. Existing results, raw evidence and source
files are never rewritten. A flagged line remains review-required and must be
checked for meaning, especially because an exact code does not detect the
known wrong-content cue 129.

Fixture acceptance covers REG-009 omission, changed digits, Cyrillic
lookalike, duplicate, two reordered codes, no-code and context-only controls,
plus a candidate with a clock time, amount or negation, source prefix boundary,
non-prefix code, and checkpoint reopen. The contract checks structural fact
preservation, not semantic accuracy. Real same-source model comparison is
separately frozen in the [development plan](../../eval/experiments/2026-09-29-reg-009-live-prefix-repair-plan.md).
The [CLI recovery fixture](../../eval/experiments/2026-09-29-reg-009-cli-recovery-fixture.md)
checks durable raw and accepted evidence, failed-run non-publication and
offline re-export through the SQLite product path.
