# Predeclared real v5 journal comparison

Frozen before inference on 29 September 2026. Task: `CTX-02` incremental
real-runtime check. Command: `task eval:journal:paired` once. The experiment
uses development case `p01` from the unchanged authored Chinese SRT corpus
`context-contrasts-v1`, corpus SHA-256
`a7b1e8fc1617121db7637f925b913ecafb1a2917dedbb17ee6424c2137a6ba66`.
It runs the same complete three-cue source in baseline then scene-context
order, one repetition, one response per target line. The proposed Russian
reference remains in the report and never enters the model request. No
holdout or human score is involved.

Frozen local identities: implementation `64d9c54`; Hy-MT2 1.8B Q4_K_M
revision `a0c709d9fac510f2c807aa3af52872340dc37a4`, GGUF SHA-256
`dc5f44fcf1fa496ee7ad725982c0c8c553a4de00259b53af84c4b89fb0c06699`;
llama.cpp executable SHA-256
`6f15be27bd80b6b4d52afefa49094e18fcfab55d5da354d717971f2d2537b2f4`.
Baseline profile SHA-256
`ff4a94e011ad133244b3c1cb385718cbbffaa783802502dcc79bdcf6268666a`;
scene profile SHA-256
`432a1b064397a96334d777dfa01a2cef58d367b37023f1f9175501969698df4d`.
Both profiles fix the same model and decoding; scene context is the changed
factor. The executable is rebuilt and its exact hash recorded by the harness.

Budget: two complete files, at most eight chat requests and 32 total loopback
requests (including readiness/tokenization and spare capacity), ten minutes
after readiness, one repetition, 2,048-token runtime context with the profile's
output reserve. Stop on any failed command, source mutation, mismatched offline
export, journal/body/hash/raw-response mismatch or exceeded budget; retain the
failure report. No prompt, profile, source or budget edits after observing output.
The checker requires one immutable SQLite row for every actual chat request and
compares raw bytes, usage and accepted text. Token preflights are a stated
coverage gap. This run establishes trace integrity and paired observations,
not translation adequacy or a release gate.
