# Restaurant full-file v6 model comparison: one complete candidate, one rejected prefix

Date: 1 October 2026. Follows the [frozen screen](2026-10-01-sethlui-full-v6-model-comparison-plan.md).
This is partial `CTX-02`, `LONG-04`, `EVAL-04` and `DECIDE-01` development
evidence. The 263-cue source is a private, in-duration derivative of the
unaltered 271-cue Chinese original. Both the source and its 12:18 media are
rights-unreviewed; caption alignment was checked by cue timing, not listening.
No subtitle text or unreviewed Russian artifact is published here.

## Frozen identities and comparison

The private source SHA-256 is
`4777e11caa115e893f2328c2a33c25a76c7391ace8ecf0ac4b9436635fc27964`;
its preserved parent is
`077aef6a49aa7128f5ddd349f38ffc84dd669f5e4bbfae6d692efa2d78304967`,
and the matched media is
`6e29f1512a76f553bdfc1678f458a69cf010e4653ac3f1cdfc4c45742bfb39d6`.
The release CLI, llama-server and model/profile hashes are frozen in the
[plan](2026-10-01-sethlui-full-v6-model-comparison-plan.md). The measured host
was Windows 10, i7-6900K, RTX 3070 8,192 MiB, driver 595.79. Sampling seed
is unknown because the CLI did not set one. The paired first 61 chat requests
were byte-equivalent after removal of the model alias. Both arms used the same
one-target, one-neighbor-per-side, 2,048-token-context profile with no approved
terms or references in the prompt. One attempt per arm was allowed and used.

| Observed metric | 1.8B Q4_K_M | 7B Q4_K_M |
| --- | ---: | ---: |
| Chats / rendered-template / tokenizer calls | 263 / 263 / 263 | 62 / 62 / 62 |
| Prompt / completion tokens | 67,934 / 9,794 | 16,248 / 2,281 |
| Summed chat HTTP time | 91.304 s | 38.787 s |
| CLI translation command | 165.453 s | 79.408 s before failure |
| Model doctor | 5.866 s | 28.490 s |
| Peak sampled server working set | 1,559,789,568 B | 5,071,233,024 B |
| Peak sampled GPU allocation | 2,392 MiB | 5,895 MiB |
| Resource samples | 156 | 75 |
| Durable checkpoints / result rows | 263 / 1 | 61 / 0 |
| Outcome | Complete structural candidate, `needs_review` | Failed at cue 62, no output SRT |

The 1.8B raw report is SHA-256
`f0f70079038380a4de9e39bd0408d422c62c1236ed85352cf121dbfb6ca9258e`
in the ignored private workspace
`.cache/eval/commons-sethlui-full-v6-1b-v1/run-Hp7iM7/`. Its run ID is
`391f20d1-1c2b-45d8-b4fe-4ac3725fd3e4`, durable SQLite SHA-256
`84090f6ac6824d0ce1162fbe5ff823d895749e7c4a7986cfb545f21ca345e40e`
and separate Russian output SHA-256
`042c0ffffd67a4ea6f562645655ffe9db823866d7505b4ed64708e0ff829df4d`.
All 263 cue identities/timings and line counts matched the source; offline
re-export was byte-identical. This establishes structure, not adequacy.

The 7B raw failed report is SHA-256
`81f5ece3871a6ce8b141a2022cee8218cb804274ab97c142f90e58d943bcb1dc`
in `.cache/eval/commons-sethlui-full-v6-7b-v1/run-6Pa9oA/`. Its run ID is
`ef5f83be-05ab-4410-90ff-ddeb0c4a9c89`, durable SQLite SHA-256
`fdffbaf9f85ac971731f9b5785b4130a4130d54edbd3e00b02864b2df11262be`.
The 62nd request SHA-256 is
`3d0abf06162144d4b64da48633340020c2670b7b08904747b3252d434a9a1e7c`.
Its JSON envelope parsed and named cue 62, but the translated text ended in
invented `」}]}`. The existing SRT grammar guard rejected the line. SQLite
retains exactly the 61 accepted preceding checkpoints, no result row, and no
partial Russian file. This recurs after `REG-024`, `REG-029` and `REG-034` on
other real sources. No retry or post-hoc cleanup was performed.
The failed private report omits the run ID and elapsed command field even
though its CLI stderr and SQLite retain them. The future probe harness now
captures both fields in its `finally` path; a parser test and the archived
failed stderr verify the fix. The archived report itself remains immutable.

## Source-aware AI triage, separate from human review

The predeclared first-window checks found that 1.8B cue 11 omits the speaker's
name and borrows the next cue's chef role; cue 35 swaps thirty dim sum dishes
and eight desserts; cue 122 substitutes an earlier chef-skill statement for a
lunch reservation. These are pinned as `REG-040` with exact private line hashes,
three related and three negative authored controls. Cue 130 also changes an
afternoon greeting to morning; cue 125 invents an animal adjective and changes
a person's name. The 7B prefix keeps the name at cue 11 and the two quantities
at cue 35 associated more faithfully, but its cue 32 renders the dim sum role
as dessert work. It cannot be judged across the later-file controls because it
has no output past cue 61. `REG-041` pins its exact format recurrence, three
related markup controls and three negative punctuation controls. The controls
have zero model runs so far. The first authored negative control containing
literal `}]}` was rejected by the existing guard during its test; it was
corrected to ordinary punctuation, while that failed test outcome is retained
here. The structural Rust guard was then rerun against the revised controls.

The 1.8B sample also preserved about 50 kitchen staff at cue 22, 2006 at cue
215, more than 120 wines at cue 219 and 2,500 metres at cue 223. These
observations do not produce a quality percentage: sample coverage is selected
and incomplete, and no independent bilingual rater has evaluated any cue.
No candidate is selected for publication, dubbing or training. The known
development defects are kept outside a sealed holdout and will not be used as
prompts or as tuning labels for an undisclosed holdout.

The later [CLI provenance audit](2026-10-01-sethlui-cli-provenance-audit.md)
found that this pinned executable predates the provider-level JSON-tail guard
in current source. The observed SRT grammar rejection is real; this run does
not verify the newer provider check.

Run `task eval:natural:sethlui:v6:result:check` to reconcile every raw
request/response, source slot, prompt-token preflight, state prefix and output
hash. Run `task eval:regression:sethlui:private:check`,
`task test:srt-checkpoint-guard` and `task eval:regression:catalog:check` for the
new source-specific regressions. These checks read the private records and do
not generate another model sample. Human source/media rights, Chinese speech
alignment, independent translation review and listener results remain missing.
