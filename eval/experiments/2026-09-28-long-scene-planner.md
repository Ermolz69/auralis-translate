# Owned long scene-planner ladder

Status: partial `LONG-01` deterministic engineering evidence, 28 September
2026. This is an authored in-memory planner test, not a complete subtitle
translation, tokenizer benchmark, recovery run, natural-file test or G6 SLA.

`task test:long-scene-plan` constructs 1,024, 4,096 and 10,000 unique Chinese
source targets with consecutive timing, fixed 1,000-cue scene boundaries,
one target per durable block and two allowed context cues on each side. It
verifies every target ID appears exactly once and in order, that every
context cue belongs to the same scene, and that the first, middle, seam and
last positions map correctly. This control addresses planner coverage and
boundary regressions before larger real-model probes.

Observed: all three sizes passed in one Rust integration test; the test
process reported 0.19 seconds for the case. `task fmt` and `task lint` passed
after the change. This timing is for in-memory planning only and is not a
translation-throughput or memory measurement.

`LONG-01` still needs measured target and multi-target block sizing under
the rendered-token limit, persistent long-file identity and a source-aware
quality check. `LONG-03` requires actual model-backed 1,024/4,096/10,000-cue
soaks with retained resource, error and recovery evidence; this fixture does
not satisfy that gate. The earlier real 1,024-cue interruption baseline is
recorded separately in [long-file recovery](2026-09-26-long-file-recovery.md).
