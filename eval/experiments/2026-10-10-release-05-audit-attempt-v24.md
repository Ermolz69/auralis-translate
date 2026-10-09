# RELEASE-05 self-audit v24: scene post-edit rejected

Date: 10 October 2026. This extends the [v23 audit](2026-10-10-release-05-audit-attempt-v23.md)
without changing PLAN-03 scope, accepted source files, v8, or prior results.
The [frozen ten-chat scene post-edit screen](2026-10-10-vivo-scene-post-edit-v1-result.md)
read the same original 467-cue Chinese file and retained 7B/v8 draft.
Its five natural windows and five authored negative controls returned valid
cue mappings, but AI source-aware triage confirmed **zero of three** primary
relation repairs and one new major cross-cue time displacement. The
candidate is rejected. [REG-072 and catalog v51](../regressions/catalog-v51.json)
retain exact private reproducers and six new unrun related/negative cases.
One extra post-edit call per scene is not a full-file quality or speed result.

**RELEASE-05 remains failed/open.** G3–G5 still have zero independent
Chinese–Russian ratings, no approved terminology and no adequately reviewed
long-file quality. The selected YouTube source still lacks verified human
speech/caption alignment and a separate rights decision. Its generated
Russian text is `needs_review`; there is no approved spoken script. The
real Auralis audio work still fails sound fit and lacks independent listening
and accepted-media playback; G9 lacks a clean Windows target. A1–A6 remain
open. Preserve raw post-edit failures, original Chinese and Russian files,
existing SQLite states, prior v23 audit, full-file TTS artifacts and v8
rollback. Do not run another prompt variant against the same exposed ten
cases as though they were a fresh quality set. Next independent work must
expand source families, sample full-file blind spots and resolve source
lineage; this audit supplies no release pass.
