# Experimental v5 terms admission

Status: engineering evidence, 28 September 2026. Task slices: `CTX-02`
and preparatory `CTX-03`. This does not establish a human-approved ledger or
improved Russian translation quality.

The v5 CLI accepts a separate JSON terms ledger only with a checked SRT source,
frozen full-coverage scene map and a profile that declares term limits. The
ledger binds raw source and scene-map SHA-256; each term carries a source
spelling, target form, explicit cue scope, reviewer ID and evidence ID. The
planner checks that the source spelling actually occurs in each scoped cue.
Only a matching target line receives the term. Neighboring context cannot
grant term authority. The managed ledger bytes and block fingerprints bind
resume; a changed reviewer claim also changes identity. The CLI cannot verify
that a declared reviewer actually reviewed the term, so fixture IDs in tests
are never treated as release approval.

`task test:v5-terms` covers overlapping scopes, absent source spelling,
context-only nonapplication, changed reviewer fingerprints, SRT block
coverage, provider payload/limits, admission before state creation and
tampered-ledger resume rejection. `task test:context-v5` checks the affected
legacy v5 behavior. `task lint` covers all workspace targets. The term-capable
profile is `models/manifests/hy_mt2_1_8b_q4_k_m.context_v5_scene_terms.experimental.json`;
it retains the pinned 1.8B Q4 model and 2,048-token rendered-template budget.
All v5 manifests record template SHA-256
`7eed5a47e3679f8b20113dd2842bf581b9760c56d83c84283b57884c3e4414a1`.
The previous v5 template and real observations remain in Git/report history.

The subsequent [real paired probe](2026-09-28-v5-terms-paired-results.md)
compares three same-source authored scenes and retains an earlier failed
budget attempt. Open: externally reviewed term provenance, broader semantic
controls, long-file token/quality evidence, and the singular-actor `REG-002`
failure. No deterministic test claims that a model obeyed the term or that
synthetic provenance represents a person.
