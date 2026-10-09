# Frozen REG-040 count/category relation review

Date: 10 October 2026. Task IDs: `EVAL-04`, `CTX-03`, `LONG-04`.
Experiment ID: `REG-040-COUNT-CATEGORY-2026-10-10-v1`. The
[prior cross-source screen](2026-10-10-source-relation-cross-source-result.md)
recognized no relations outside the Vivo interview. This slice tests one
different source-derived fact: quantities must stay attached to their own
food categories. The known restaurant cue-35 error is already preserved
in [REG-040](../regressions/sethlui-source-facts-v1.json); this is a
new diagnostic for that existing defect, not a new model attempt.

Freeze the private 263-cue Sethlui Chinese SRT SHA-256
`4777e11caa115e893f2328c2a33c25a76c7391ace8ecf0ac4b9436635fc27964`
and its unchanged 1.8B/v6 and 7B/v6 drafts SHA-256
`042c0ffffd67a4ea6f562645655ffe9db823866d7505b4ed64708e0ff829df4d`
and `45f140e201f5a6228a0754e48d1e2b4153a392a7869dc279768339882fa53511`.
They are exposed development artifacts; no sealed holdout or reference text
enters a model request. The 1.8B cue 35 explicitly reverses the source's
30 dim sum / 8 dessert categories. The 7B cue 35 uses a broader Russian
paraphrase and must not be certified correct by a lexical checker.

The [authored development controls](../corpora/reg040-count-category-controls-v1.json)
are frozen before implementation: 18 cases, SHA-256
`3266febf06462eddbd9b605d18c2cd8675f4dd688f473a11f3cad8e391851ce4`.
They vary Chinese/Arabic numerals,
two count values, source order, Russian digits/words, reversed assignments,
negation, partial/generic Russian text, single category, unrelated people
counts and a source claim explicitly negated. A warning means only an
explicit detected contradiction between two supported source pairs and
two recognized target category/count pairs. Unknown forms abstain.

Implement the rule in `eval/` only. Scope its category vocabulary to source
`点心`/`甜品` and conservative Russian `закуск*`/`димсам*`/`десерт*` forms.
Support whole positive counts 1–99 in Chinese or Arabic source notation
and Russian cardinal words or digits. Do not infer approval of other food
words, speaker meaning, or a complete translation from absence of a warning.
No substring match may turn a negated number/category into a positive claim.

Budget: one offline replay of all 263 source cues against both drafts
(526 aligned pairs), zero model/ASR/TTS/network calls and retries, 20-second
wall limit. Hash source/drafts/rule and check all IDs/timing lines first.
Retain the private attempt, including a failure; publish only hashes,
warning IDs/kinds and per-arm denominators, no source or candidate text.
Independently recompute the report under a Taskfile check.

Advance only as an **evaluation-only warning** if every frozen control
agrees, the known 1.8B cue 35 is warned, and every other natural warning
is individually marked for source-aware review. A warning-free 7B draft
is not accepted. A new major false warning or identity mismatch rejects
the candidate. No product profile or G3–G5 decision changes without
independent review and broader natural-source coverage.
