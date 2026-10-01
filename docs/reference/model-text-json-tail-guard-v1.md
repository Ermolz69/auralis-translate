# Model text JSON-tail guard v1

The [paired ASUS v6 fact screen](../../eval/experiments/2026-09-30-asus-v6-fact-model-screen-result.md)
found two 7B responses with valid outer JSON and target IDs but with
wrapper-like `」}]}` or `」}]}]}` characters inside the `text` value.
The existing slot and SRT checks accepted those strings. Such a line is
not a publishable subtitle and must stop before an inference checkpoint.

For contextual v5/v6 responses, reject a translated text value when its
last `」` is followed only by optional whitespace and a sequence of at
least three `}`/`]` closers, beginning with `}` and including `]`.
This narrow structural check covers the observed suffixes and spacing
variants. It does not rewrite the raw response, try another translation,
or change prompt/model identities. The inference journal retains the raw
response with an invalid-candidate outcome; no checkpoint is saved for
that target and no partial SRT is published. A quoted Japanese phrase or
a literal JSON closer without this suffix remains admissible. A genuine
subtitle that intentionally ends in the rejected pattern needs explicit
review rather than silent acceptance.

REG-034 pins both real failed responses, a minimal synthetic reproduction,
related suffix variants and negative controls. This is a syntax boundary,
not a semantic-quality judgement. The already archived 268-cue ASUS
candidate and 64-request screen remain unchanged. A later full-file run
must demonstrate durable rejection/recovery under the final profile;
contract tests alone cannot satisfy the long-file or release gates.

An [opt-in experimental retry contract](model-text-json-tail-retry-v1.md)
may classify only this guarded suffix as retryable for one additional model
call. It does not change this default rejection rule or repair model text.
