# Goal scope v2: translator-only execution

Owner direction: 10 October 2026. This record supersedes the active-work
portion of [PLAN-03 scope v1](2026-09-28-goal-scope-v1.md) without deleting
its evidence or pretending its former audio gates passed.

## Selected work

- Continue the Chinese-source subtitle to Russian translator on Windows,
  preserving original files and v8 accepted history. Strict plain SRT is the
  selected natural-file format. Japanese and subtitle-free ASR remain separate.
- **Do not change Auralis, TTS, voice selection, audio fitting or media export.**
  The owner has removed dubbing from this agent's current assignment after
  rejecting the Windows SAPI audition as understandable but robotic. Existing
  Auralis technical files and failed listening feedback remain historical
  evidence, not an approved voice or unfinished work for this assignment.
- Work through `DATA-03`–`DATA-05`, `CTX-03`–`CTX-05`, `EVAL-01`/`EVAL-04`,
  `LONG-02`/`LONG-04`–`LONG-06`, `DECIDE-01` and translation release checks
  by dependency. `VOICE-01`–`VOICE-07` and A1–A6 are **outside this active
  translator-only scope**, not completed. Native desktop remains deferred;
  a CLI milestone is labeled CLI and does not imply a full desktop release.

## Review route without a recruited auditor

The owner cannot supply a Chinese–Russian auditor and does not want volunteer
recruitment. Find independently published, source-matched Chinese and Russian
translations from identifiable professional/official publishers, preferably
both subtitle tracks on the exact same licensed video. Books and official
parallel texts may supplement domain coverage. Record publisher, translator,
edition, version, rights, source-group identity, text alignment and hashes.
The first [official parallel PDF screen](2026-10-10-official-zh-ru-reference-v2-result.md)
is a small **written-policy development diagnostic**, not a subtitle holdout.

Freeze a Chinese-only source split before inference. Keep the Russian
published side out of model requests, prompt tuning and closed holdouts.
Compare raw/accepted answers with the published rendering and the Chinese
source; distinguish facts, numbers, names, negation, temporal status,
omissions and fluency from acceptable paraphrase. The published translation
is human-produced reference material. Any judgment of our output by this
agent remains AI review; do not call it an independent human rating. Deduplicate
by underlying work and video, not by sentence. Preserve failures and promote
inspected material only to development, acquiring a fresh held-out source.

The original G3–G5 definitions in
[release acceptance](../../docs/RELEASE_ACCEPTANCE.md) remain open. A
published reference alone does not supply independent 4/5 ratings of our
output or approved-term decisions. Before claiming those gates without a
recruited reviewer, freeze a revised reference-based acceptance protocol with
source-matched subtitle groups, eligibility/denominator, objective fact
checks, uncertainty handling and a declared threshold. The owner has already
authorized this route; no volunteer contact is needed. A credible protocol
can be executed autonomously, but must not be retroactively designed around
observed v8 answers or silently lower existing gates.

## Current limits and resource bounds

The original 18:35.570 Chinese Vivo SRT and matched media remain private and
hash-pinned in their source records. They lack an independently published
Russian subtitle track, cleared combined rights and human Chinese-speech
alignment. They can continue as exposed engineering development, not as a
reference holdout. The new 13-page official report is publicly readable but
has no asserted open redistribution license; keep its PDF/text private and
publish only small justified examples and source-free reports.

Local Hy-MT2 7B/v8 and RTX 3070 are measured in the official-reference v2
screen: six chats, 2,202 reported tokens, 33,797 ms wall and a sampled
5,059,604,480-byte tracked-process working-set peak. These are not a
long-file SLA. Experiment budgets and retry rules remain per frozen plan.
Fine-tuning or higher-precision inference still require a measured reason.
Use Taskfile, preserve all unrelated work and commit only scoped files with
the verified primary global Git identity.

`RELEASE-05` can close only after the selected translation-only candidate
passes its applicable G1–G9 contract. The unavailable clean installation
target and deferred desktop endpoint remain explicit release limitations.
This scope record does not mark the Goal complete.
