# Frozen four-scene actor-context screen

Status: predeclared development experiment, 29 September 2026, before the
model requests below. This is an engineering and AI-assisted interpretation
screen, not a bilingual human score or a `CTX-04` acceptance run.

The source is the AI-authored, unreviewed development corpus
`eval/corpora/context-contrasts-v1.json`, SHA-256
`a7b1e8fc1617121db7637f925b913ecafb1a2917dedbb17ee6424c2137a6ba66`.
Select exactly `p01,p02,p03,p04`, in that order: arrival after one older
brother, return after one father, agreement after one younger brother, and
departure after one male teacher. These yield ten source cues. Each case runs
one isolated-file arm and one admitted source-scene arm; both arms use the
same source bytes. The proposed Russian meanings and prohibited facts remain
in the report only, outside model requests. This whole source group is
development, never a sealed holdout.

Run the same checked CLI commit and v5 template against pinned Hy-MT2 1.8B
Q4_K_M and 7B Q4_K_M through llama.cpp `b10977-0ecb159c9` on this Windows
RTX 3070 machine. The 1.8B no-context and scene profile SHA-256 values are
`ff4a94e011ad133244b3c1cb385718cbbfffaa783802502dcc79bdcf6268666a`
and `432a1b064397a96334d777dfa01a2cef58d367b37023f1f9175501969698df4d`.
The corresponding 7B values are
`e69f3710a1038022cf32523fa398247278522dce53c69c5bd7ad206903c5f429`
and `9b34d86d3b0d872720ee729131efef99281e71a0000d202abea169d625a92e73`.
The frozen model digests are in those manifests and must pass `doctor` before
inference. The no-context arm uses one target per request; the scene arm
measures the fully rendered prompt with `/apply-template` and `/tokenize`.

Budget: one repetition per model, four cases, eight complete SRT files and
20 chat responses per model; the script permits at most 22 chat and 92
loopback HTTP requests per model, ten minutes of measured run wall time, and
no adaptive regeneration. A failed run and all requests remain in the
experiment's ignored `.cache/eval/` workspace. Run
`task eval:context:pronouns:1b:probe` and
`task eval:context:pronouns:7b:probe` serially to avoid competing for GPU
memory. Verify structural source/output identity and byte-exact offline
export; retain accepted target text, raw response, token counts, timings,
resource samples, failures and CLI/runtime hashes. Compare actor number,
gender and named referent in the four target cues using only the source.
Report uncertain or unnatural readings rather than forcing the proposed
Russian wording. Neither model can be accepted from this tiny authored set.
