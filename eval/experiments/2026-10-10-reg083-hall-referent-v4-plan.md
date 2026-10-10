# REG-083 Hall-stick referent warning: frozen v4 screen

Date: 10 October 2026. Partial `EVAL-04`/`CTX-03` development screen. The
known [v3 miss](2026-10-10-asus-source-relations-v3-result.md) is exposed
development material, not a sealed holdout. The question is whether a
source-scoped *warning* for a missing Hall sensor or stick referent catches
that miss without warning on related source-negative cases. This cannot
approve a translation or replace bilingual review.

## Frozen inputs and one factor

- Same 268-cue ASUS Chinese SRT SHA-256
  `923aed3991c2308d92b89c45181cea8ec7ece74e9b4d3a3ce0234d95e329913b`
  and saved 7B/v8 Russian SRT SHA-256
  `746495ba8bfc9c7c3cee0b5021fea87c10605b1d8e07be6dc316907138ea48ee`.
  Keep both private, read-only and separate. Match all IDs and timing rows.
- Baseline: immutable `source-relation-review-v3.mjs` SHA-256
  `bd1f9926b52150f21d398895237b69ea9e1d4c4698bbc9392e3c52c58604eb03`
  and its zero-warning replay SHA-256
  `8d3eb1020f660fb3c72aa4cc369cc8ca57b394e2089f63e3d7715686f4db8468`.
- Candidate changes one factor: for a source cue that explicitly connects
  `摇杆`/`操纵杆` with `霍尔`, warn when the corresponding Russian cue lacks
  either a Hall term or a stick/joystick referent. Chinese punctuation or an
  intervening trigger/button mention ends the relation. The warning must be
  scoped to the target cue, carry a reason code, never edit text or checkpoint,
  and leave v3 warnings unchanged. Hall-only trigger descriptions, ordinary
  sticks, and the neighboring RGB-ring cue must abstain.
- Unit cases include all six unrun [REG-083 controls](../regressions/reg-083-asus-hall-stick-substitution-v1.json)
  plus variants with negation, positive Hall sticks, `霍尔式`, a separated
  trigger reference, Russian Hall-only, stick-only, correct joint referents
  and the exact observed substitution. The check is lexical and may miss
  paraphrases; its alerts require source-aware review.

## Budget and decision

Freeze the plan, candidate code, Taskfile commands and controls before one
offline replay. One source-only preflight and one full 268-pair replay,
30-second maximum, no retries, no model/ASR/TTS/network requests and no
GPU. Preserve timestamps, source/draft/rule hashes, all warnings and the
failed v3 baseline. Public records contain IDs/kinds/counts only; private
subtitle and draft text are not republished.

An engineering pass requires the known cue 24 warning, no warnings on source
negative/neighbor controls, and no unexplained additional warning in the
268-cue replay. Unit cases must include both positive and negative source
polarity. Even a pass is **not** product admission: another natural source
with an applicable Hall-stick relation, false-warning review and independent
bilingual assessment remain necessary. `DATA-03`, `CTX-03`, `EVAL-04`, G3–G5
and RELEASE-05 stay open. Rollback is to omit v4 and continue unchanged v8.
