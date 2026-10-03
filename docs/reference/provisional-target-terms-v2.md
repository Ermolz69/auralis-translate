# Exact-occurrence provisional terminology development contract v2

Date: 3 October 2026. Backlog TERM-02, REG-062. This is a candidate
development request transform only. The v8 product manifest and rejected
REG-061 transformer are immutable baselines. The prior contract remains
historical evidence and is not retroactively reinterpreted.

Admission inspects each target slot's original source text. It does not inspect
neighbors to activate a term. Every admitted term is listed with the exact
zero-based, half-open Unicode code-point span of every matching occurrence in
that target. For a declared conflicting source noun actually present in that
same target, the request identifies its separate span and source-grounded sense,
without prescribing its Russian wording. The Russian hint applies only to the
marked term occurrences. The request tells the model to preserve distinct
nouns, speakers, polarity, stock state, numbers and relations.

The conservative v1 exclusion policy still withholds a hint when a term is
negated, quoted, mentioned as a name/translation, or unclassified. A repeated
term with any excluded occurrence is wholly withheld. Such cases retain an
explicit `needs_review` decision. No matching eligible target occurrence
means that the whole request remains byte-identical to v8. The target JSON,
context, protected facts, approved terms and decoding parameters are not
changed. This lexical policy does not claim complete Chinese syntax analysis.

No general glossary note, reference translation, model-output replacement or
semantic retry is permitted. Every request and raw model reply belongs to a
frozen model/runtime/manifest/policy/implementation/corpus identity. Structural
validation and source-aware fact review are separate; accepted JSON alone does
not justify a checkpoint or profile promotion. Human bilingual review remains
required before language release claims.
