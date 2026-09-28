# Predeclared 7B v5 scene screen

Frozen before inference on 29 September 2026. Tasks: `CTX-02` and `EVAL-04`
(development observation only). Command: `task eval:context:7b:probe` once. It
uses the complete three-cue authored Chinese SRT for development case `p01`
from `context-contrasts-v1`, corpus SHA-256
`a7b1e8fc1617121db7637f925b913ecafb1a2917dedbb17ee6424c2137a6ba66`.
The baseline arm has no source context; the scene arm has one neighboring source
cue on either side. Arm order is baseline then scene. The proposed Russian
reference is report-only and must never enter the model request. This is not a
licensed natural subtitle sample, sealed holdout or human-scored comparison.

Model: Tencent Hy-MT2 7B Q4_K_M, pinned revision
`ab8472660ac61fac25f1af43fac2599d52a8a775`, GGUF size 4,624,648,896
bytes and SHA-256
`9f96256500f3fc1ab4d64336b58f52a949a95ad7516b0c229476eef782f9f77b`.
Baseline profile SHA-256
`e69f3710a1038022cf32523fa398247278522dce53c69c5bd7ad206903c5f429`;
scene profile SHA-256
`9b34d86d3b0d872720ee729131efef99281e71a0000d202abea169d625a92e73`.
Only model identity differs from the pinned 1.8B v5 profiles; decoding,
template, 2,048-token runtime context, 256 output tokens and scene window are
the same. The script and profile contract test enforce this relation. Runtime:
existing llama.cpp `b10977-0ecb159c9`, executable SHA-256
`6f15be27bd80b6b4d52afefa49094e18fcfab55d5da354d717971f2d2537b2f4`;
one slot, Jinja, requested 99 GPU layers, RAM cache zero. Candidate Git and
CLI hashes are recorded by the harness. Hardware is the current Windows/i7-6900K
and RTX 3070 8 GiB desktop; exact observed device and process samples belong
in the result, not this plan. Stop if the 7B model cannot fit without changing
backend or offload policy.

Budget: one baseline and one scene file, one repetition, at most eight chat
requests and 32 total loopback requests, ten minutes after server readiness.
Stop and retain the report on any command failure, source-byte change,
candidate/slot rejection, re-export mismatch or budget breach. No reference-led
retry or prompt/decoding change after observing output. This is a screen:
compare the observed 7B target and all failures with the already retained 1.8B
`p01` run, then declare a separate repeated paired plan if the variant is worth
advancing. Do not infer an error rate, release quality or quantization loss from
one generated target per arm.
