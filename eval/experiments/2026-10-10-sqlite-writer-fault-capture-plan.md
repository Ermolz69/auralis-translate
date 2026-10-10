# SQLite writer-fault evidence capture

Date: 10 October 2026. This supplements the already published bounded
[fault plan](2026-10-10-sqlite-writer-fault-plan.md) without changing its
two deterministic cases or expanding `LONG-05` acceptance. The earlier
development and acceptance test invocations were not timestamped or retained
as machine-readable process records. Their reported 2/2 result is preserved;
this follow-up captures one fresh final verification run.

Freeze the committed test source SHA-256
`c9dea2b2beb6e26e5249c058b65fbcf1ee63da2f19de76769c2e127a0628f0a9`.
The runner requires a clean committed worktree, invokes exactly one
`task test:sqlite:writer-fault`, sets a 120-second process timeout, and retains
stdout, stderr and a JSON record in ignored private storage even on failure.
No retry, model, network, media or TTS call is allowed. Publish the JSON only
after checking the outcome, source hash and absence of private content.
The public checker verifies the captured command, two named cases, result,
commit, duration and source hash; it cannot substitute for the actual test.

The observation remains a database-only two-cue fixture. CLI/host failure,
disk full, OOM, long-file behavior and G7 remain open regardless of this
capture result.
