# Frozen offline verification of the completed post-length run

Experiment ID: `long-v6-postlength-postflight-1024-v1`, declared 29 September
2026 after the single [v3 resume](2026-09-29-v6-postlength-resume-plan.md)
exited with a harness `ReferenceError`. The v3 child CLI reached a validated
1,024-block run with one result and a private 138,225-byte Russian SRT before
the postflight `callCli` scope bug stopped the parent. Its output SHA-256 is
`cc2f4b3c88433cf59223bb35cfc95cdfeeed0c079c068106e7ef485369bd2e2b`;
this document does not infer structural
acceptance from that hash alone. `REG-008` records the minimal reproduction
and three process controls. Preserve the failed v3 workspace and report its
nonzero task exit even if offline verification succeeds.

Run `task eval:cli:long:v6:verify-postlength` once, with a five-minute wall
budget and **zero model server starts or model requests**. Inspect the exact
existing workspace `.cache/eval/long-v6-postlength-resume-runs/postlength-MvMUOK`.
Require 1,024 contiguous checkpoints with the preceding 982 unchanged, four
attempts, one validated result, source/profile/model/CLI identities, source
timing and protected bytes, all 1,280 text slots, and complete request
provenance. Use the release CLI only for `inspect`, `template` and a validated
run's offline export with an unreachable loopback endpoint; assert the request
journal and run snapshot are unchanged. Compare the regenerated SRT byte for
byte. Archive the original v3 `ReferenceError`, raw request/response journal,
resources, full row report, expected-source reference kept outside prompts,
and output. Keep the v2 failure and its 982-block state intact.

The verifier may establish structural recovery only. The project-authored
synthetic source and all model output are unreviewed; no natural-file G3–G5,
language release, or real-audio A1–A6 gate follows. If verification fails,
preserve the workspace and do not reinterpret the v3 exit as success.
