# Translate SQLite writer-contention recovery: bounded fault plan

Date: 10 October 2026. Partial `LONG-05` engineering evidence under the
unfinished `LONG-03` dependency, not G7 acceptance. The question is whether
a failed checkpoint write leaves the previous durable prefix intact, creates
no partial result, and permits exact resume after a simulated worker death.

Use one owned two-cue strict-SRT fixture in a temporary directory, never a
user/project database. A second SQLite connection holds `BEGIN IMMEDIATE`
through one next-checkpoint attempt, with a 50 ms busy timeout. Freeze the
source, plan, profile and segment IDs before the fault. Permit one injected
lock failure and one restart/resume; no model, network, media, TTS or retry
loop. Compare checkpoint rows, run state and result absence before and after
the failure, then verify the complete rendered output and immutable source
hash after release of the lock. Add a negative first-block case so zero
committed work cannot be mistaken for a saved prefix.

Taskfile command: `task test:sqlite:writer-fault`. The test uses the current
Rust crates and offline Cargo lockfile; the result record must state exact
pass/fail and boundaries. This is a storage-lock surrogate, **not** a real
disk-full/OOM/power-loss or full 10,000-cue soak. `LONG-05`, G7 and
`RELEASE-05` remain open until their complete matrices run on the selected
candidate and endpoint.
