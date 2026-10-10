# Translate desktop goal scope v3

Frozen: 10 October 2026. Canonical planning task: `PLAN-03`. This supersedes
the evidence route in the [desktop goal scope v2](2026-10-10-translate-desktop-goal-scope-v2.md)
after the owner ruled out recruiting a Chinese/Russian reviewer and the fetched
Translate `origin/main` at `22b0a3a` adopted [published-reference protocol v2](../../docs/evaluation/011-published-reference-review-v2.md).
The earlier scope and all measured results remain historical. This record
changes no acceptance threshold or supported product behavior.

## Endpoint and authority

The active goal still requires Chinese-to-Russian plain-SRT and strict
plain-WebVTT through the reusable Translate Rust libraries, the standalone CLI
and Auralis's native Windows x64 desktop. It includes `INT-TR01`–`INT-TR05`
and G1–G9, immutable originals, separate durable results, two-database
recovery, explicit digest-bound review, offline export and a clean installed
Windows endpoint. Model/profile/backend/resource SLA remain unselected.
Japanese, further grammars, ASR, TTS/audio A1–A6, Marker and WPF remain out
of scope.

The [translator-only scope v3](2026-10-10-translation-only-scope-v3.md) governs
a separate CLI workstream and defers desktop changes in that workstream. The
owner's explicit desktop scheduling request in this goal authorizes the
defined Auralis integration here. Neither workstream's narrow probes certify
the other's release endpoint. No local debug build or native two-cue result
is a clean installation claim.

## Changed language evidence route

G3–G5 use protocol v2's source-matched published Chinese/Russian translations,
with a sealed holdout of at least 300 eligible cues, work-level split,
source-only inference and all uncertain cues counted against acceptance.
The thresholds remain at least 95% source/reference-supported adequacy at
least 4/5, zero unresolved detected critical source-fact errors plus the
predeclared controls, and at least 98% applicable pre-frozen term matches.
AI assessment is identified separately and is never called an independent
human rating. A published Russian reference is not a person reviewing our
output. The unavailable bilingual reviewer is no longer a prerequisite;
eligible same-work subtitle pairs, provenance, rights, alignment and sealed
assessment are still missing. Earlier exposed development material cannot be
promoted into the holdout.

All other G1–G2 and G6–G9 definitions, their canonical backlog bindings and
the `INT-TR01`–`INT-TR05` observations remain as frozen in desktop scope v2
and [release acceptance](../../docs/RELEASE_ACCEPTANCE.md). G8 still needs
declared target-consumer behavior, and G9 still needs an unseeded Windows x64
installation of one committed candidate. The owner's Ubuntu VM can provide
extra Linux smoke evidence but cannot satisfy that Windows gate. `RELEASE-05`
must audit one exact candidate, its package/pin and all gate evidence; it
cannot combine unrelated passing slices into a release pass.
