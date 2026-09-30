# ASUS copied-state long-file recovery diagnostic

Date: 30 September 2026. Partial tasks: `CTX-02`, `LONG-03`, `LONG-04`,
`EVAL-04`. The [first ASUS run](2026-09-30-commons-asus-full-7b-failure.md)
stopped at cue 227 after 226 durable checkpoints. This separately frozen
diagnostic asks whether a copied state can preserve that exact accepted prefix,
recover without publishing a partial file, and complete all 268 ordered cues.
The first failure, raw candidate, source and model identities remain immutable.

Use run `bf1e6130-6674-4538-ba9f-6243bc164760` from the failed private
workspace `.cache/eval/commons-asus-full-7b-v1/run-nCoZTy/`. Pin its report
SHA-256 `d86f4264ae1c65f3508c3c8539cdcee3fd4fcae9de1fbc14ee0d83e02bc216ba`
and failed SQLite SHA-256
`5251f0900da2858e9c51568d7143c4a3e2b23544949378ce011ba6029119c30a`.
Copy that state into a new private workspace. Verify 226 ordered checkpoints,
zero results, one rejected attempt and the same copied source SHA-256
`923aed3991c2308d92b89c45181cea8ec7ece74e9b4d3a3ce0234d95e329913b`.
Relocate only the source locator inside the copied SQLite file, re-read the
source and compare the run, checkpoint, attempt and result rows before inference.
Do not mutate the original failed state or source.

Use the same 7B Q4_K_M model SHA-256
`9f96256500f3fc1ab4d64336b58f52a949a95ad7516b0c229476eef782f9f77b`,
llama.cpp runtime
`6f15be27bd80b6b4d52afefa49094e18fcfab55d5da354d717971f2d2537b2f4`,
v5 profile
`9b34d86d3b0d872720ee729131efef99281e71a0000d202abea169d625a92e73`
and release CLI
`82df0fbd0167b9163f945c58d8387a1edf2c6eedfed9f38086f617f74914df1d`.
The same provisional one-video scene map ends at cue 268. No approved terms,
speaker labels, reference or expected answer enter the request. One local
server, 2,048 context tokens, 99 GPU layers, one parallel slot and the existing
profile decoding settings. No concurrent TTS or other model process.

Budget: one copied-state inference repetition, no model retry, at most 45 chat
requests and 150 total HTTP requests for the remaining 42 cues, 600,000 ms
model wall time, 180,000 ms server readiness, 600,000 ms `doctor`, and
130,000 ms per-upstream timeout. Run through `task eval:natural:asus:7b:resume`
only after `task eval:regression:asus:private:check` and the Taskfile release
build. Stop on any failure; retain raw responses, copied DB, candidate file if
validated, CLI outputs, request usage and sampled resources. Require exact
preservation of the 226-checkpoint prefix, 268/268 completed source slots,
one validated result, unchanged original source and failed DB, protected
source bytes, and byte-identical offline reexport after stopping the server.
The completed SRT, if any, is a private unreviewed candidate, not a source
rights decision, Chinese adequacy score, approved voice script or release gate.
