# ASUS 1.8B full-file comparison stopped at cue 20

Date: 30 September 2026. Partial `CTX-02`, `LONG-04`, `EVAL-04` and
`DECIDE-01` evidence under the [predeclared one-run plan](2026-09-30-commons-asus-full-1_8b-comparison-plan.md).
`task eval:natural:asus:1_8b:preflight` pinned the same 268-cue Chinese ASUS
SRT SHA-256 `923aed3991c2308d92b89c45181cea8ec7ece74e9b4d3a3ce0234d95e329913b`
and matched private 240p video SHA-256
`9e4271f8112de2fa65ad67c4cec3390529e916d70363bc5f4c421f4479b97cc1`.
The 1.8B Q4_K_M GGUF SHA-256 was
`dc5f44fcf1fa496ee7ad725982c0c8c553a4de00259b53af84c4b89fb0c06699`,
v5 scene manifest `432a1b064397a96334d777dfa01a2cef58d367b37023f1f9175501969698df4d`,
llama.cpp runtime `6f15be27bd80b6b4d52afefa49094e18fcfab55d5da354d717971f2d2537b2f4`
and release CLI `82df0fbd0167b9163f945c58d8387a1edf2c6eedfed9f38086f617f74914df1d`.
The model-size comparison kept one target and one neighbor per side, 2,048
context tokens, 0.7 temperature, top-p 0.6, top-k 20 and the same prompt
template. Neither references nor the earlier 7B outputs entered requests.

The sole inference run at committed Translate `2d20f8a` used a fresh SQLite
state. Its private workspace is `.cache/eval/commons-asus-full-1_8b-v1/run-M5lG2W/`,
report SHA-256 `5f606c5f3e66acf4c20a162101cede8f95381145fc6c55a5da98dd5c912a066e`.
Run `b1b22de2-f3c6-431f-889d-bf9fa6300552` saved 19 ordered durable
checkpoints. The 20th model reply was valid JSON, but labelled the requested
cue 20 as following context cue 21. The exact source window 19–21 is pinned
privately by SHA-256 `c1a1eb9346f4120673f524dbfe0d89fb3220a18261db6d4aaaefa2154d3fc83a`.
Request SHA-256 was
`c4fb7132f0ab385aad7d3cef404a9f9fc772169a221d5d492873fffc9378b1c3`,
raw response SHA-256
`b72860ab2dd8fb201fd983b47bd3767e240d0656cb561fa442b0eb063d989459`,
and extracted candidate SHA-256
`99741e4535992e660cb14d1132527cf34a7661a6114e9601c98625e48c7c8b31`.
The v5 identity guard rejected the response before checkpoint 20. The failed
SQLite SHA-256 is
`3281d3dded0ecf87dcee8c68741bd4f005f86ac44969c00a05dfc66f8e8187a1`;
it contains one failed attempt, 19 checkpoints, zero complete results and no
candidate SRT. `task eval:regression:asus:1_8b:private:check` verified these
identities and state. [REG-030](../regressions/natural-asus-target-slot-neighbor-v1.json)
retains the minimal private reproduction and three related plus three negative
authored controls. `task test:context-v5` passed all 16 provider, 10 profile
and three CLI tests, including those six new structural controls.

The run made 20 chats and 63 proxied HTTP calls, using 5,455 prompt and 869
completion tokens. Summed chat HTTP time was 7,946 ms; the failed translation
CLI command lasted 19,519 ms. Twenty one-second resource samples peaked at
1,554,370,560 B server working set and 2,230 MiB whole-device GPU use; the
GPU value includes other applications. The final failed chat used 279 prompt
and 52 completion tokens and 425 ms HTTP time. No complete-file throughput or
language score follows from this prefix.

On the **same ASUS source**, the earlier 7B first pass saved 226/268 cues
before an invented JSON tail; this 1.8B pass saved 19/268 before a neighbor-ID
error. Both runs correctly withheld partial output, and neither is an accepted
translation. This observation supports no claim that 7B is semantically
better across the file or that 1.8B is faster for a complete file. It is a
second natural-source recurrence of the 1.8B [REG-028](../regressions/natural-vivo-target-slot-neighbor-v1.json)
identity class. No same-profile retry is permitted by this plan. Rights,
audio alignment, independent bilingual review and all G1–G9/A1–A6 gates
remain open.
