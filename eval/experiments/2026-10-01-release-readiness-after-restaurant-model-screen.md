# RELEASE-05 interim self-audit: matched restaurant model screen

Date: 1 October 2026. This is an incomplete self-audit after the
[same-source restaurant comparison](2026-10-01-sethlui-full-v6-model-comparison-result.md),
not final `RELEASE-05` acceptance. The [PLAN-03 scope](2026-09-28-goal-scope-v1.md)
and G1–G9/A1–A6 criteria remain unchanged. Prior source/audio findings and
the [earlier audit](2026-10-01-release-readiness-after-restaurant-stream.md)
remain valid. Japanese and subtitle-free ASR remain separate; desktop remains
owner-deferred. Training and higher precision remain measurement-dependent.

| Gate | Observed status and missing acceptance |
| --- | --- |
| G1–G2 | The 1.8B development derivative exported all 263 cue IDs and timings with byte-identical offline re-export. Its semantic defects prevent candidate selection. The 7B run rejected cue 62 and published no partial output. No final candidate was audited. |
| G3–G5 | Zero eligible development or sealed holdout cues and zero independent bilingual reviews. Three 1.8B source-fact errors are AI triage, not an adjudicated score; no approved term denominator or zero-critical-error claim exists. |
| G6 | One exploratory run per arm measured time and sampled memory on RTX 3070. No selected model, frozen release SLA or repeated resource distribution exists. |
| G7–G8 | The 7B failure preserved 61 durable checkpoints, but no complete real-file 7B recovery or target-consumer export was checked. The 1.8B output is not an approved script. |
| G9 | No unseeded clean Windows installation through the selected delivery endpoint. |
| A1–A3 | Earlier Auralis SAPI builds produced real WAVs and a technical ASUS media draft. No approved restaurant Russian script/speakers, audio-fit limit or accepted complete natural scene exists. |
| A4–A6 | Zero human listeners, no three accepted 10–20-minute scenes, no full durable approved dub or accepted media-consumer playback/rights record. |

The source inventory remains ten technical candidates, 2,113 inspected cues
and zero eligible. The original 271-cue restaurant caption is preserved; the
263-cue derivative only passes media-duration containment, not speech or
rights review. A 7B continuation may be evaluated under a new frozen budget
and retained copied state, without rewriting the failed report. Even a full
structural 7B output would require independent translation review before an
approved Auralis handoff. The exact original regression controls and private
raw journals are retained under `REG-040/041`.

The changed checks for this slice passed: `task eval:natural:sethlui:v6:result:check`,
`task eval:regression:sethlui:private:check`,
`task eval:natural:sethlui:v6:harness:check`,
`task test:srt-checkpoint-guard`, `task eval:regression:catalog:check`,
`task fmt`, `task docs:check`, `task plan:check`, `task site:build` and
`task site:check`. The first authored punctuation negative control failed the
Rust guard and was corrected with the failure recorded in the experiment;
the first Node test invocation also encountered sandbox `spawn EPERM`, then
the Taskfile used `--test-isolation=none` and the three parser cases passed.
No human review, speech listening, newly selected TTS scene, clean-machine
install or final `RELEASE-05` audit is claimed. An independent bilingual
reviewer, listeners, rights/speech-alignment decision and an unseeded Windows
target are concrete external needs. Existing private audio samples can be
provided for human review without waiting for new inference.
