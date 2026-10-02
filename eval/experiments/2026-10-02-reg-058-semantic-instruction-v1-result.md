# REG-058: a generic meaning instruction did not repair the measured terms

Date: 2 October 2026. Frozen [plan](2026-10-02-reg-058-semantic-instruction-v1-plan.md),
[source-free row report](../reports/2026-10-02-reg-058-semantic-instruction-v1.json),
authored development controls only. The original v8 product profile was not
changed. Code commit at inference: `a9c26a055c5aae50dc21897716476b9042dd62f5`.
Both arms used the same real Hy-MT2 7B Q4_K_M weights, source-only neighbor
context, target IDs, sampling parameters and JSON schema. Only one general
semantic instruction differed. The expected English meanings and prior model
answers were absent from all 36 requests.

The sandboxed first launch failed with `spawn EPERM` before server startup and
zero model requests. Its private report SHA-256 is
`a2a110331c324a181eea0c3306f3f44ab9bd1c51fe5828a827c1ce5a93102d02`.
The one permitted process-launch correction completed 36/36 chats, 72/72
rendered-template/tokenizer checks and zero model retries. Private complete
report SHA-256:
`02fc6ccc82355b6c61542eed92dcf904e5ee4c8fea4a7ea5286959d882beae6a`;
public row report SHA-256:
`531e774df6930db078589cba8b2cdcfb136ec3375bcef86e496a2e6c51e0ed11`.
`task eval:regression:reg058:instruction:check` replays the target-field
replacement and the one instruction insertion from the natural requests,
checks exact raw reply hashes, 2,048-token budget and each response. All
36 had accepted outer structure. This is not a semantic acceptance judgment.

| Same 18 controls | v8 baseline | Generic instruction |
| --- | ---: | ---: |
| Accepted structure | 18/18 | 18/18 |
| Prompt / completion tokens | 5,152 / 829 | 6,016 / 844 |
| Sum of chat HTTP latency | 18,459 ms | 18,951 ms |
| Chat median / nearest-rank p95, N=18 | 1,021 / 1,468 ms | 1,061 / 1,480 ms |

Total wall time was 45,118 ms. Sampled process working-set maximum was
5,065,498,624 bytes and whole-device GPU maximum was 7,352/8,192 MiB.
The GPU sample includes other device users and is not an isolated model peak.
Single sampled replies do not support a reliable tail-latency or population
quality estimate; operating-system cache state was not controlled.

## Separate AI source-aware reading

All 18 pair rows, their authored meanings and both exact Russian candidates
are in the machine report. The following judgments are an AI-only review of
known development controls, not an independent Chinese–Russian score:

| Control | Baseline observation | Instruction observation |
| --- | --- | --- |
| `multicore_positive` | Calls a multi-core test multithreaded | Still calls it multithreaded |
| `mouse_pad_positive` | Calls mouse pads mouse stands | Still calls them mouse stands |
| `mouse_pad_extra` | Produces an unrelated mouse-like noun | Moves to “подкладка для мыши”, still imprecise for a mouse pad |
| `mouse_stand_negative` | Correctly keeps mouse stands | Correctly keeps mouse stands |
| `multiprocessor_negative` | Correctly keeps multiple processors | Correctly keeps multiple processors |
| `single_core_extra` | Nonstandard Russian adjective for single-core | More natural “benchmark of one core” |
| `handheld_positive` / `tablet_negative` | Distinguishes device classes | Distinguishes device classes |
| `chart_axis_negative` | Keeps graph vertical axis | Keeps graph vertical axis |
| `longitudinal_positive` / `longitudinal_extra` | Keeps temporal comparison | Keeps temporal comparison |
| `platform_positive` / `platform_extra` | Renders actions with some paraphrase | Paraphrase remains; no verified platform-specific equivalence |

The remaining single-core, multicore-extra, module, button-press and handheld
extra controls show no clear new material meaning loss in this AI reading.
The variant's added `ROG` in `handheld_extra` comes from the supplied neighbor
context, so it is recorded as context-derived expansion rather than counted
as a proven wrong entity. Automatic line wrapping in a terminal view is not a
Russian spelling error; the exact JSON candidate is authoritative.

The predeclared advancement rule required *both* the multi-core and mouse-pad
positive defects to be corrected with no material regression. Neither was
corrected. **Decision: reject the generic instruction; keep v8 unchanged and
do not spend a full-file model run on this variant.** The six extra controls
remain in the versioned REG-058 development family for later source-scoped
terminology changes. This outcome cannot close G3–G5 or authorize a spoken
script. There are zero independent bilingual ratings and no source-rights or
speech-alignment admission for this natural ASUS material.

The new journal check is part of `task eval:regression:check`. Its first
sandboxed suite run reached and passed the new check, then stopped at an
unrelated Node test child-process `spawn EPERM`. The same suite completed
with exit 0 when process launch was permitted. The failed check and the
successful rerun are both reported; neither is a model retry.

Next measured change: prepare source-scoped *provisional* term evidence for
multi-core and mouse-pad concepts, with explicit positive/negative scope and
an unseen related case. Do not mark a model-suggested term approved. Compare
against the unchanged v8 baseline before deciding whether another full
268-cue development run is warranted. Preserve this failed prompt variant and
its zero-request launch failure.
