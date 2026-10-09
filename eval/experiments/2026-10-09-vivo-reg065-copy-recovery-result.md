# REG-065 Vivo copy recovery: structurally complete, language rejected for promotion

Date: 9 October 2026. The [frozen plan](2026-10-09-vivo-reg065-copy-recovery-plan.md)
and harness were committed at `4002aec` before inference. The source is the
same [original-platform Vivo interview](https://www.youtube.com/watch?v=_G4e2p1p-is)
and 467-cue Chinese SRT as the [first v8 long-file screen](2026-10-09-vivo-original-v8-long-result.md).
Neither model request included Russian references or proposed translations.

The stopped 1.8B SQLite state was copied with its managed source. Only the
copy's source locator was relocated; the original database SHA-256
`9b631a1edf5e9e3fa6e1b660a35c414d8b34b2f35f522ea2def4a8d4705666b1`
and original full report SHA-256
`84a737e1cc8c7b468ea66718f2507882929344f259d7824d9071953d24c1a5b5`
remained unchanged. The new CLI SHA-256 was
`0a5620b6f2b733dafe5a6d5c58771a6bfffc8f6f2069d01ce8d93d66ab04213f`;
the 1.8B model, runtime, v8 manifest and Chinese source hashes are in the
[source-free report](../reports/2026-10-09-reg065-vivo-copy-recovery.json).
Its SHA-256 is
`1b8c1f0d7761386aef4a5039af94e3092eacbc86bcc30fdb0bfe02eca63b69cd`.
The private report with every raw request/reply, resource sample and checkpoint
is `attempt-mVbgXB/report.json`, SHA-256
`b2cee86b74b0e60a9316c3ef27d0a599113972a6862fbae9d7560583952cf54b`.

| Observation | Before copy recovery | After one copy recovery |
| --- | ---: | ---: |
| Durable four-cue batches | 28/117 | 117/117 |
| Covered cues | 112/467 | 467/467 |
| New chats / template-token preflights | — | 89 / 178 |
| New prompt / completion tokens | — | 39,391 / 12,901 |
| Resume CLI / whole experiment | — | 180,718 / 183,426 ms |
| Complete SRT / review state | none | one / `needs_review` |
| Sampled process working set | — | 1,589,817,344 B |
| Sampled whole-device GPU maximum | — | 4,257 MiB |

The completed separate Russian SRT SHA-256 is
`32d96fe75eb0f5c90a67e2f6606d3d6ace27f79e67352a12b065efe91a08d3fc`.
Offline checks rehashed all 117 checkpoints, 118 total chats including the
old rejected reply, every prompt's Chinese source slots, source IDs and timing
through cue 467, the copied result, original immutability and experiment
budgets. The resource samples are not isolated peaks. No partial SRT was
published from the failed original run.

The fresh reply for cues 113–116 had **no** terminal line breaks, whereas the
retained original failed reply did. This natural retry therefore shows that
resume can cross the old stopping point, but does not itself isolate the
normalization as the cause. The provider tests exercise one/all terminal LF
and CRLF cases and still reject leading/internal controls and leaked JSON.
The v8 prompt hash is unchanged.

## Source-aware AI triage of the two full drafts

The original 7B run and copied 1.8B continuation use the same 467-cue Chinese
source, v8 prompt and batch size. They are one stochastic run per model, with
different execution histories and CLI versions. This is a diagnostic comparison,
not a latency benchmark or blinded Chinese-Russian score.

The 1.8B draft at cue 60 mixes French lettering into a Russian word. At cues
113–116 it makes grammatical errors around cooperation; 7B reads more naturally.
At cue 276, both drafts distort the 36-month planning relationship. At cues
280–281, neither cleanly retains the jointly committed 1,000-plus-person
development-team meaning across the two subtitle lines. At cue 328, both
turn work until 1–2 a.m. into 11–12 at night. At cue 466, both risk changing
a hope for better future products into present availability. These are
AI-identified review priorities, not human-adjudicated error rates. The
[REG-025–027 source-aware controls](../regressions/natural-vivo-numeric-time-v1.json)
remain open for a new bounded model recheck with related and negative cases.
The new [REG-066 pack](../regressions/reg-066-vivo-v8-cross-model-facts-v1.json)
pins five exact paired v8 request/response reproductions and adds five
related and five negative authored controls. All ten new controls are pending
model inference, with no hidden holdout used in prompts.
Scene coherence, speaker identity and the remaining cues are unscored.

Structural recovery is accepted. **Neither 1.8B nor 7B is promoted as the
translation-quality candidate.** Source media/caption rights and human speech
alignment still have zero admitted cues; independent bilingual review is
unavailable by owner decision, and no spoken script is approved. This closes
no G3–G5, audio gate or RELEASE-05 requirement. Next: freeze a source-fact
screen for these recurrent faults, carry its failures into regression controls,
then review a full candidate before starting the Auralis voice pilot.
