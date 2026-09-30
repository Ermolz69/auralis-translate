# ASUS v6 completed 268 cues structurally; AI review found major errors

Date: 30 September 2026. Partial `CTX-02`, `LONG-04`, `EVAL-04` and
`DECIDE-01` development evidence under the [predeclared one-run plan](2026-09-30-commons-asus-full-v6-slot-plan.md).
The plan and runner were committed as Translate
`4f34f8faa13c942b2cfcbd75e3a2d6c43fc60eb9` before model inference.
`task eval:natural:asus:v6:preflight` verified the same 268-cue Chinese
ASUS source SHA-256
`923aed3991c2308d92b89c45181cea8ec7ece74e9b4d3a3ce0234d95e329913b`
and matching private media SHA-256
`9e4271f8112de2fa65ad67c4cec3390529e916d70363bc5f4c421f4479b97cc1`.
Model GGUF, runtime, CLI and v6 manifest SHA-256 values were respectively
`dc5f44fcf1fa496ee7ad725982c0c8c553a4de00259b53af84c4b89fb0c06699`,
`6f15be27bd80b6b4d52afefa49094e18fcfab55d5da354d717971f2d2537b2f4`,
`82df0fbd0167b9163f945c58d8387a1edf2c6eedfed9f38086f617f74914df1d`
and `b30546f228ba230364ba79edae55456d62e7d7c5010e56fef38464c3531089c5`.
The v6 manifest differs from the failed v5 1.8B manifest only in prompt
version/template identity. It binds target ID and line index in the reply
schema without changing source context, prompt text or sampling settings.

The sole `task eval:natural:asus:v6:probe` run used a fresh SQLite state,
saved 268/268 ordered checkpoints and one validated result in `needs_review`
state. Each of 268 actual chats returned the declared target ID; 807
proxied HTTP calls had no recorded failures. The private candidate SRT is
37,539 bytes, SHA-256
`aa74b20d4255f46c9a23ddfd0865dd2e221e7b08ab3cbceb8665be3b0c7b6e8b`.
Original cue labels, timings and line counts were preserved; an offline
re-export matched byte for byte. `task eval:natural:asus:v6:private:check`
verified all raw target-bound replies, 268 checkpoints, one result and both
SRT hashes. The SQLite SHA-256 is
`76e074663d67d40246aae8e7f1b725918bc4cfd13af1bb81d4b15a80a13ac294`.
The raw private report is
`.cache/eval/commons-asus-full-v6-slot-v1/run-7XjHrR/report.json`, SHA-256
`1d8addf0860cb88f0161ac6eeed3fc45351ab9912aaf0eff2b39a76772a26413`.
Run ID `c5118ed9-eb8a-4cb4-8618-1383e0491153` is retained.

The run used 73,766 prompt and 12,155 completion tokens; summed chat HTTP
time was 113,454 ms and translation command time 186,785 ms. In 171
one-second samples, tracked server working set peaked at 1,579,675,648 B;
whole-device RTX 3070 memory use peaked at 2,306 MiB, including other
applications. These are one-run observations, not a release SLA or a paired
full-file speed result against the failed v5/7B prefixes.

Before inspecting the complete Russian candidate, a [source-only sample
policy](2026-09-30-commons-asus-v6-review-sample-plan.md) and verifier were
committed as `5f60020`. `task eval:natural:asus:v6:review-sample` froze
44/268 cue IDs across beginning, middle, end, the two former failure
locations, numbers, product names, negation and long source lines. The
private source-only sample SHA-256 is
`0e170fc7565291313b148fa7b8d74468ed48d6f1dce94a7ccbd2c745f98a0d83`.
The joined private raw/accepted review packet SHA-256 is
`da15e4cf479513ba1a41fc5e86f7802e6531e7c51c5a855e30f675d533485a6a`;
`task eval:natural:asus:v6:review:check` reverified all 44 source,
candidate, request and raw-response identities. The sample is targeted,
not random; the other 224 cues were not language-reviewed.

| Focus cue/window | Expected Chinese meaning | Actual accepted Russian meaning | AI observation |
| --- | --- | --- | --- |
| 2–3 | ROG handheld gaming device; the brand enters this device category | Calls it a tablet and misreads the brand idiom | Major product-class/scene continuity error; high AI confidence |
| 12 | 7-inch display, 608 g weight, 60 g lighter than Steam Deck | Calls both gram values gigabytes | Critical physical-unit substitution; high AI confidence |
| 19–21 | Direction buttons, crisp shoulder-button feedback, long Hall-trigger travel, good feel like an Xbox Series controller | Technical nouns shift to body thickness, rail and hands | Major controls/continuity loss; high AI confidence on terms, exact phrasing open |
| 91 | Z1 Extreme is essentially a handheld-specialized 7840U | Calls it a smartphone-specialized version | Major product-class substitution; high AI confidence |
| 133 | Battery life remains the area most in need of improvement | Says idle range is the least problematic area | Major polarity and referent shift; high AI confidence |
| 142 | AMD single-core performance trails Intel slightly | Calls AMD a single-chip processor that is worse | Major technical referent loss; high AI confidence |
| 225–227 | BIOS lacks options to disable cores or hyperthreading; at 9 W, four cores would be desirable | Turns hyperthreading into excess counting and 9 W into 9 V | Major control/physical-unit errors; high AI confidence |
| 267 | Mouse pads among the accessories | Says mice | Major item substitution; high AI confidence |

This is **AI source-aware triage, not human scoring**. The above source,
accepted-text, request and raw-response hashes are retained per cue in
the private packet. A Russian reviewer has approved zero of 268 cues.
The completed file is a structural diagnostic, not an accepted translation
or a spoken script. v6 prevented the neighbor-ID defect in this run, but
semantic and factual errors block model/profile promotion. The previous
v5 1.8B 19-checkpoint failure and 7B 226-checkpoint failure stay intact.
Rights, actual source-audio alignment, independent bilingual review,
three-source quality comparison and G1–G9/A1–A6 remain open. No tuning,
precision or desktop decision follows from this single run.
