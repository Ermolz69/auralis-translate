# Translation quality critical path after the 263-cue screen

Date: 2 October 2026. This execution plan continues the frozen
[PLAN-03 scope](2026-09-28-goal-scope-v1.md); it changes no release threshold,
format, desktop deferral or accepted result. Translate `main` starts at
`397639e5a50e31ba27d6e05c8daa02a38127cbe7`. The unrelated edit in
`docs/architecture/014-result-history-selection.md` is excluded. Auralis's
main checkout has unrelated work in progress; this slice changes no Auralis
file or submodule pin. The local RTX 3070 has 8,192 MiB VRAM, with 917 MiB in
use at this planning check; that sample does not set a resource budget.

## Why this is the deepest remaining translation lane

The paired restaurant experiment produced structurally complete 263-cue SRTs
from 1.8B and 7B, but the source is not admitted and independent bilingual
ratings are zero. AI triage identified wrong role and inconsistent venue naming
in the 7B result. The REG-046 form screen cannot establish semantic adequacy.
Among 11 technical candidates, 2,993 cues were inspected and zero are
eligible. The 880-cue Paywall documentary has recorded subtitle/audio rights,
but the film's speech is English; it may support a separate Chinese-text
development check, not the Chinese-speech dubbing pilot. Three Geekerwan
videos span 12:42–18:36 with 1,039 strict Chinese cues and matched private
media, but their Commons imports await license review and no person has
verified speech alignment. Another unreviewed model run would not resolve
G3–G5. The priority is source admission and source-aware assessment, followed
by a bounded paired model decision on the same admitted cues.

## Ordered work and observable exits

1. **DATA-03 source provenance and alignment.** Start with the 12:42 Kirin
   candidate because its Commons page identifies the original YouTube video
   `73XUeYRFsZU`, the existing SRT has 304 strict cues and the matched
   private media was already acquired. Recheck original-platform license and
   Chinese subtitle track metadata. Compare creator/caption revision evidence;
   keep audio and subtitle rights separate. Retain source, revision and hashes.
   A license field or a Commons badge alone does not prove caption authorship,
   speech alignment or permission for public excerpts. If evidence conflicts,
   keep the candidate unassigned and move to a different rights-cleared source.
2. **DATA-03/DATA-05 scene and speech check.** On a rights-suitable candidate,
   prepare a private beginning/middle/end cue-linked source-audio packet and
   scene/exclusion map. Require a named human to confirm spoken Chinese and
   approximate cue alignment before marking cues eligible. An automatic
   transcript may triage discrepancies but cannot substitute for listening.
   Group related sources before development/holdout allocation; do not move an
   inspected development group into a sealed holdout.
3. **CTX-02/CTX-03/LONG-01 quality and batch controls.** Prepare a blinded
   paired review packet for identical source cues and both model outputs,
   including source-only context, term scope, names, amounts, negations,
   actor roles, first/middle/last cues and batch seams. References and
   expected facts stay out of model requests. Before another inference run,
   freeze model/runtime/profile/source hashes, tokenizer budget, target groups,
   one changed factor, seed/order, maximum requests/tokens/time and stop rules.
   Preserve every raw rejection, accepted result and resource sample.
4. **DATA-04/DATA-05/RELEASE-01.** Reserve distinct source groups for at least
   300 sealed eligible cues and have independent Chinese–Russian reviewers
   score every eligible cue; use a second reviewer for critical/disputed cases.
   Freeze references and rubric before candidate inspection. G3 needs at least
   95% at 4/5, G4 zero unresolved critical errors, G5 at least 98% approved
   term matches. No human reviewer is currently available, so these gates stay
   open while engineering work continues.
5. **LONG-02–LONG-06/DECIDE-01, then VOICE and release.** Only after paired
   source-aware evidence, compare seam shifts, multi-target token budgets,
   recovery, resource SLA and the selected model. Consider adapter training or
   higher-precision weights only if measured residual errors and headroom
   support a bounded hypothesis. Hand Auralis an approved translation and
   separately reviewed spoken script; real TTS, fit, three listened scenes,
   complete media playback and clean Windows delivery remain required. The
   desktop endpoint remains owner-deferred and cannot be claimed from CLI.

## First bounded probe: Kirin original-platform metadata

Identity: `DATA-03-youtube-geekerwan-kirin-license-2026-10-02-v1`; split:
unassigned technical candidate, never holdout. Input: exact YouTube ID
`73XUeYRFsZU` cited by the existing Commons page; baseline SRT revision
`880535591`, SHA-256
`57dfd9feb3bfe6381421c4142820b780af341e195e52ee81d58e8f9f12858feb`;
matched private 240p video SHA-256
`2911c8a14b6da9fa62d46235aa09a1b240ee1409ec8e28336edc7ed90c9af586`.
Use pinned `yt-dlp` 2026.07.04, SHA-256
`52fe3c26dcf71fbdc85b528589020bb0b8e383155cfa81b64dd447bbe35e24b8`.
Preflight with a Taskfile command before network access. Permit one
metadata-only extractor invocation, no media/subtitle download, no retry,
90-second wall cap and 12-MiB output cap. Retain raw stdout/stderr, exit,
timestamps, hashes and extracted license/subtitle keys privately. Stop after
the one attempt whether it succeeds, fails or returns ambiguous metadata.
No model/TTS request, human rating, source-admission state change or public
source bytes are authorized by this probe. A separate record will state its
actual outcome and next decision.

## Missing external inputs and release boundary

An independent Chinese–Russian reviewer plus a second critical-error
adjudicator, listeners for real speech and dubbing, a clean unseeded Windows
x64 target and the owner's later desktop scheduling decision remain external
prerequisites. The user has not identified reviewers. The existing source
search authorization allows bounded local tests and rights-safe metadata
collection, not a fabricated human evaluation. RELEASE-05 and G1–G9/A1–A6
stay open until evidence from the exact committed candidate supports them.
