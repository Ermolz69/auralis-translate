# Complete synthetic v6 file after a model failure, with fact loss

Status: structurally complete **development** output with failed identifier
quality, 29 September 2026. The [one-attempt plan](2026-09-29-v6-postlength-resume-plan.md)
and harness were committed at `7729599` before inference. The earlier
[964-block timeout](2026-09-29-long-v6-scene-timeout.md),
[copied-state locator failure](2026-09-29-v6-timeout-continuation-v1-failure.md)
and [982-block model length failure](2026-09-29-long-v6-relocated-continuation-failure.md)
remain independent failed experiments. No model profile, source, seed or
decoding setting changed in the final copied-state attempt.

`task eval:cli:long:v6:resume-postlength` passed the retained timeout check,
`task eval:regression:check`, `task test:context-v6`, `task build:release` and
checked-model `doctor`. It copied the failed 982-block state, relocated only
the copied source locator and resumed the same run ID. The CLI reached
**1,024/1,024** durable checkpoints, four attempts and one `validated` result;
the first 982 checkpoint records remained identical. It wrote a separate
138,225-byte Russian SRT, SHA-256
`cc2f4b3c88433cf59223bb35cfc95cdfeeed0c079c068106e7ef485369bd2e2b`.
The *parent task exited 1*: its postflight helper shadowed the global
`process` binding and raised `ReferenceError` before inspecting the output.
The exact [failure](../reports/2026-09-29-long-v6-postlength-harness-failure.json)
is retained as `REG-008`; neither task exit nor result was retroactively
rewritten.

The first frozen [offline verifier](2026-09-29-v6-postlength-postflight-plan.md)
also exited 1, after finding that many Russian lines lacked the authored
`AUR-####` source identifier. Its [failure](../reports/2026-09-29-long-v6-postflight-v1-failure.json)
and `AUR-0002` omission remain visible. The [second offline plan](2026-09-29-v6-postlength-postflight-v2-plan.md)
predeclared separate format and identifier-quality outcomes. `task
eval:cli:long:v6:verify-postlength-v2` passed without a model server: the
release CLI inspected both SRTs, preserved SRT timing/protected bytes and all
1,280 ordered text slots, and exported the validated result byte-identically
with an unreachable loopback endpoint. The run snapshot and 3,847-request
journal were unchanged after export. Its 5.7-second Taskfile invocation was
not inference time. `task eval:cli:long:v6:postlength:check` verifies the
archived [summary](../reports/2026-09-29-long-v6-postlength-v2-summary.json)
(SHA-256 `8a1007c11133a5da95936e8d794c626b3869295fe3c068f28cb603c658fe9d4b`),
[full row report](../reports/2026-09-29-long-v6-postlength-v2-report.json)
(SHA-256 `2795ce22ee0b87f38fc23723dbd9b2802334a48b584c527d3a00f94a32c14fb8`)
and [raw journal](../reports/2026-09-29-long-v6-postlength-v2-journal.json.gz)
(SHA-256 `4037c071a17ef38ed7b9bc4989601ef8da0784fb39881b9138abb9d008701a8c`).

The resumed attempt added 159 requests: 53 template applications, 53
tokenizations and 53 accepted chats for the remaining 42 cues/53 text slots.
Chats used 16,063 prompt and 2,334 completion tokens with 139,157 ms summed
request time. The 34 resource samples had no sampler errors; peak combined
tracked working set was 2,125,377,536 bytes and private memory was
1,072,365,568 bytes. Device-wide GPU memory peaked at 845 MiB, including
other applications; this does not prove offload. No exact full-run wall time
is claimed from sampler timestamps.

**Quality fails.** Exactly 665 of 1,280 Russian lines do not contain their
source `AUR-####` identifier unchanged: 656 omit it, eight write a Cyrillic
`АУР-####`, and one has a wrong or duplicate ASCII code. Only 453 of 1,024
cues preserve the code in every line. The first failure is source
`工程 AUR-0002：不要打开这扇门。` → accepted candidate
`Не открывайте эту дверь.`; the code is gone. Violations occur near the start,
middle and end. The SRT parser's protected bytes cover cue structure and
timing, while this identifier is source text and needs a separate fact guard.
The archived output is a failing baseline, not a release candidate. The
quality scan is an assistant-authored exact-token audit, not independent
bilingual review; other semantic and grammatical errors remain possible.

The source is project-authored synthetic development material, not a natural
licensed subtitle file or sealed holdout. Complete structural recovery
contributes to `LONG-03` but does not finish its 4,096/10,000-cue ladder,
natural-file G3–G5, clean-install G9, final RELEASE-05 or A1–A6 audio gates.
The frozen 43-cue editorial sample may now be extracted for development
inspection, but cannot substitute for bilingual reviewers. The original
failed runs and SRT remain untouched.
