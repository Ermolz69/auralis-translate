# Qwen3 8B local screen on the selected YouTube Chinese scene

Date: 10 October 2026. Partial tasks: `DATA-03`, `CTX-02`, `EVAL-04` and
`DECIDE-01`; no task is completed by this screen. The [frozen plan](2026-10-10-qwen3-8b-local-screen-plan.md)
and [36-request freeze](2026-10-10-qwen3-8b-local-screen-freeze.json)
preceded inference. Source: the [18:36 Geekerwan Vivo/MediaTek YouTube video](https://www.youtube.com/watch?v=_G4e2p1p-is)
with its regular original-platform `zh-CN` SRT. The source SRT SHA-256 was
`b100803367b95fa55fc638b1ff39a0abfa0d5b8183ebe58d58b1a87242d9d8c4`;
the matched private WebM SHA-256 remained
`7ad0484b31a6788c31632616649c51e6aaf6cdcdd7d90083d88e1d5ee66e1507`.
These original files were not changed or published. Only 36 seconds of source
audio have prior AI ASR/topic agreement; no human Chinese listener has
confirmed words or speaker boundaries. Caption and soundtrack rights remain
unresolved beyond the observed YouTube CC Attribution metadata and the
unreviewed Commons import, so this is private development material only.

## Acquisition and bounded run

The official `Qwen/Qwen3-8B-GGUF` Q4_K_M file at revision
`7c41481f57cb95916b40956ab2f0b139b296d974` was downloaded once into
ignored private storage. The 5,027,783,488-byte result matched SHA-256
`d98cdcbd03e17ce47681435b5150e34c1417f50b5c0019dd560e4882c5745785`.
The private `.cache/eval/qwen3-8b-eval-acquisition/attempt.json`
has SHA-256 `e7682dfce627a7603ea39fe659145151357ed20b2d956b1d5f34bdeb56a1babe`;
the download took 107,716 ms. This acquisition is not a product install.

The first probe invocation failed before model start when sandboxed Node could
not spawn `git` (`EPERM`). Its empty request journal and private failure
record SHA-256 `26d5062a11141d91c0c20a2f1eca71c0cebb58fc15729366cfb28e0eb3353382`
remain retained. Re-running the exact committed freeze with child-process
permission made **36/36 real chats and 72/72 template/tokenizer preflights**
structurally valid. There were zero inference retries and zero response or
validation failures. The two sequential model starts used the same local
`llama-server` binary, SHA-256
`6f15be27bd80b6b4d52afefa49094e18fcfab55d5da354d717971f2d2537b2f4`,
on the RTX 3070 8,192 MiB device. The candidate added Qwen's `/no_think`
instruction; that configuration difference is disclosed and prevents a
strict model-only causal claim. The source/context/JSON schema and decoder
parameters were otherwise matched. Candidate ran first, so the short-case
time comparison is order-confounded.

| Arm | Chats | Prompt + completion tokens | Summed chat HTTP time | Sampled max server working set | Sampled max whole-device GPU use |
| --- | ---: | ---: | ---: | ---: | ---: |
| Qwen3 8B Q4 | 18 | 4,587 + 798 | 13,642 ms | 5,110,751,232 bytes | 5,783 MiB |
| Existing Hy-MT2 7B Q4 v8 | 18 | 4,383 + 984 | 15,411 ms | 5,059,825,664 bytes | 5,711 MiB |

Total: 10,752 tokens and 42,871 ms probe wall time. Four five-second
resource samples per arm had no sampler errors. Device memory includes other
processes; these values are not isolated model peaks or full-file SLAs. The
[source-free machine report](../reports/2026-10-10-qwen3-8b-local-screen-v1.json)
SHA-256 `b7928d632474da5e7da2c9272aacc050c444dd4bf17343141df871dce93889c5`
lists every request/raw-reply/accepted-text hash, token count, preflight and
duration. The private raw journal SHA-256 is
`ad58fcff9bdcd169e6b458b5a3b27730b8807f5233ad74ad87d41cb3ca52febb`.
No Russian reference was passed to either model.

## AI source-aware review, not independent adequacy

The [separate AI review](../reports/2026-10-10-qwen3-8b-local-screen-ai-review.json)
compares all 18 pairs with the Chinese source. On two authored contrasts,
Qwen preserved “two/three separate chips, not one multi-core chip” in 6/6
cells; v8 turned the denied concept into multi-processor in 6/6. On the
natural multi-core cue, Qwen retained the core concept in 3/3 while v8
substituted processors in 3/3, though Qwen's wording was awkward.

The candidate newly lost the **big** modifier in the natural all-big-core
cue in 3/3 cells. One matched v8 cell kept that modifier. Qwen also had
Russian agreement errors in 3/3 two-chip replies and 3/3 dual-processor
replies; v8 had grammatical versions of those controls. Manufacturing-process
meaning survived in both arms. [REG-081](../regressions/reg-081-qwen-all-big-core-loss-v1.json)
and [REG-082](../regressions/reg-082-qwen-russian-agreement-v1.json)
retain minimal reproductions plus three new related and three negative
controls each. Those new controls have **zero** model results so far.

The frozen shortlist rule fails because of the new major all-big-core loss.
**Reject Qwen3 for product promotion and any full-file/TTS run; retain the
unchanged v8 profile and previous accepted results.** The candidate weight
and raw replies remain private for repeatable analysis. This is an AI-only
development comparison, with no independent bilingual adequacy score,
approved terminology, listener rating or release admission. G3–G5,
`DATA-03`, `LONG-04`, A1–A6 and `RELEASE-05` remain open.

Executed: `task eval:model:qwen3:acquire:preflight`, `head`, `acquire`,
`freeze`, `preflight`, `probe`, `report` and `check`; `task
eval:model:qwen3:regressions:check`, `task
eval:regression:catalog:v57:check`, `task plan:check` and `task docs:check`
passed. `task site:build` and `task site:check` passed for the current/public
report update. The broad `task eval:regression:catalog:recent:check` passed v41–v44
then stopped at v45 because the historical private Vivo run report is absent
from this isolated checkout; the committed v56-to-v57 chain and new private
Qwen evidence passed the scoped check. The recorded `EPERM` pre-spawn failure
is not counted as a model response. Rollback of experimental use is a fresh
run with existing v8, without deleting the frozen source, SQLite history,
download receipt or failed candidate evidence.
