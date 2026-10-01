# Frozen same-source restaurant full-file model screen

Date: 1 October 2026. Partial `CTX-02`, `LONG-04`, `EVAL-04` and `DECIDE-01`
diagnostic evidence. The question is whether the existing v6 one-target
Chinese-to-Russian profile can complete the same 263-cue, 12:18 restaurant
file with 1.8B and 7B Q4_K_M models, and which source-fact failures need
review. This is an **unassigned, rights-unreviewed development screen**, not
the sealed holdout, model selection, an approved script or a language score.

The private 263-cue Chinese SRT SHA-256 is
`4777e11caa115e893f2328c2a33c25a76c7391ace8ecf0ac4b9436635fc27964`.
Its immutable 271-cue parent SHA-256 is
`077aef6a49aa7128f5ddd349f38ffc84dd669f5e4bbfae6d692efa2d78304967`;
the parent-to-derivative mapping report SHA-256 is
`da63dec61c03ccbfcc307aa028e9499b8ba9a65de41c1df6b0daab5a629a9a4f`.
The matched 240p media SHA-256 is
`6e29f1512a76f553bdfc1678f458a69cf010e4653ac3f1cdfc4c45742bfb39d6`.
The video-to-SRT match is timing containment only, not human speech review.

Use the same release CLI SHA-256
`82df0fbd0167b9163f945c58d8387a1edf2c6eedfed9f38086f617f74914df1d`,
llama-server SHA-256
`6f15be27bd80b6b4d52afefa49094e18fcfab55d5da354d717971f2d2537b2f4`
and current Windows RTX 3070 (8,192 MiB, driver 595.79). The two arms are:

| Arm | GGUF SHA-256 | v6 manifest SHA-256 |
| --- | --- | --- |
| Hy-MT2 1.8B Q4_K_M | `dc5f44fcf1fa496ee7ad725982c0c8c553a4de00259b53af84c4b89fb0c06699` | `b30546f228ba230364ba79edae55456d62e7d7c5010e56fef38464c3531089c5` |
| Hy-MT2 7B Q4_K_M | `9f96256500f3fc1ab4d64336b58f52a949a95ad7516b0c229476eef782f9f77b` | `e7e2d7745cb283a88984da202eb511f0144b2bc51bc6eb01727515a51e7aa06f` |

Run 1.8B then 7B **sequentially**, one fresh SQLite state and one server
per arm. Profile v6 uses one target slot, one source cue before/after,
one provisional whole-video scene, no approved terms, 2,048 context tokens,
temperature 0.7, top-p 0.6, top-k 20, repeat penalty 1.05 and 256 maximum
output tokens. All settings, prompt template, source bytes and scene map are
identical across arms except the versioned model-specific manifest identity.
The CLI does not set a reproducible sampling seed, so the runtime default is
**unknown**; this single exploratory run per arm cannot estimate variability.
No Russian reference, expected answer, earlier output or reviewer label enters
the prompts. The later review questions below remain outside model requests.

Budget per arm: at most 280 chats, 850 proxied HTTP calls, one server start,
20 minutes of model-stage wall time, 130 seconds per upstream request,
180 seconds server readiness, 600 seconds model doctor and one attempt for
the whole run. No inference retry, fallback, concurrent TTS or partial SRT
publication. A zero-chat infrastructure launch failure can be repeated once
only with its failed report retained and unchanged bytes; model failures do
not permit a same-profile regeneration. Stop on identity, budget, validation,
wall-time or persistence failure, retain every attempted raw input/output and
checkpoint prefix. If one arm fails, report its actual prefix; compare only
same-source overlapping outcomes and do not invent a full-file score.

The first source-aware AI triage should inspect file beginning, middle and
end; cue/scene seams; name and place continuity (11–12, 32, 130, 262);
quantities and units (22, 35, 123–129, 215, 219, 223); negations (70, 80,
119, 233, 254); and possible copied-neighbor facts. Expected source meanings
include about 50 kitchen staff (22), 30 dim sum and 8 desserts (35), two
private rooms and about 80 guests (123–124), one pig/three chickens/eight
ducks across a dialogue (125–129), over 120 wines (219), and 2,500 m
altitude (223). These expected meanings are reviewer notes, never prompt
material. AI interpretation is explicitly separate from independent bilingual
review; no word-level or audio gate follows from structural completion.

Retain one private report/workspace per arm under ignored `.cache/eval/` with
source/model/runtime/profile/CLI hashes, request and response bodies, rendered
token preflights, usage, times, sampled RAM/VRAM, errors, accepted checkpoints,
output hash and byte-identical offline re-export if complete. Publish only
source-free aggregate measurements and labelled review; preserve prior ASUS
and other comparisons and every failed attempt.
