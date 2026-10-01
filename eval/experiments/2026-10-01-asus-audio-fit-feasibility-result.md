# Real ASUS speech duration-fit feasibility

Date: 1 October 2026. Partial `VOICE-03` engineering evidence from the clean
Auralis `feat/real-tts-pilot` worktree. Its plan/check commits are `87544f3`
and `8cf5c31`; they remain local. The frozen one-pass analysis read the
previously retained 268 real `Microsoft Irina Desktop` SAPI WAV measurements,
not a new synthesis or translation. Private TTS report SHA-256 is
`9c1aa881c71613488538cff84720e248199b5e065a4022cfdf2d4af627a1ea2b`;
analysis SHA-256 is
`9c1975d171bdf9f5057343d96e7078bba0b9e4e226f6f1d188918413ffe9af0b`.
The 10-ms private fit report SHA-256 is
`9e6dee74985646c3ece0cfd4a06b55b909141d01cdbad92255a479e8074ff014`.
The byte-identical source-free [summary](../reports/2026-10-01-asus-fit-summary.json)
has SHA-256 `f30abab3b512e9b7b8e9c38e41658f1c09cd5e78c8b68aa81dd80466f31faf4f`.

Each required speed factor is the measured WAV duration divided by the
original subtitle window minus a predeclared 75-ms margin. Cumulative
mathematical fit counts are **4/268 at 1×, 16/268 at 1.25×, 47/268 at 1.5×,
155/268 at 2×**. Median required speed is 1.906×, nearest-rank p95 2.745×
and maximum 4.667×. At most 1.5×, beginning/middle/end thirds cover 28/89,
12/89 and 7/90. No source cue windows overlap, so the next-cue-start cap
agrees with the cue-end cap. The independent Auralis result checker recomputed
the counts and median/p95 directly from the pinned analysis. Previous raw
media still has 264/268 overrun cues and 259 speech-start overlaps.

Even a hypothetical 2× tempo adjustment leaves 113/268 cue windows unfilled.
No speed limit, compressed script or alternate TTS voice was accepted. A
mathematical fit cannot establish intelligibility, naturalness, meaning
preservation or listener approval. The draft Russian SRT has known source-fact
errors and zero independent bilingual review; zero people listened to this
audio. Real media playback remains the earlier technical FFplay process result,
not an A6 listening/delivery acceptance. A1–A6 stay open.

Auralis Taskfile checks: `task voice:natural:asus:fit:test`,
`task voice:natural:asus:fit:screen` (one retained read-only attempt),
`task voice:natural:asus:fit:check`,
`task voice:natural:asus:media:v3:check`,
`task voice:publication:check` and `task docs:check` passed. The first
sandboxed Node test and docs checks failed with child-process `EPERM` before
the tests ran; the fit test was made process-isolation-free, while the existing
docs gate passed with process permission. A first Markdown link to JSON failed
the Markdown-only docs contract and was corrected before the successful
`task docs:check`. The original private WAV/media and all failure records were
preserved.
