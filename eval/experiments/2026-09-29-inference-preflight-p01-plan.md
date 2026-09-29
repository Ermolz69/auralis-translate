# Predeclared real v5 token-preflight journal probe

Frozen before inference on 29 September 2026. Scope: `CTX-02` engineering
observation, one repetition of `task eval:journal:preflight:probe`. The complete
three-cue authored Chinese SRT for development case `p01` comes from
`context-contrasts-v1.json` SHA-256
`a7b1e8fc1617121db7637f925b913ecafb1a2917dedbb17ee6424c2137a6ba66`.
The baseline arm has no source context. The scene arm has one same-scene
source cue on either side and actual `/apply-template` plus `/tokenize`
preflight before each chat. Source bytes, target slots, runtime, decoding and
model are the same across arms; context and its token preflight are the intended
factor. The proposed Russian reference is report-only and forbidden in HTTP
requests. This is development data, not natural licensed media, holdout or
human-reviewed quality evidence.

Model: Tencent Hy-MT2 1.8B Q4_K_M, revision
`a0c709d9fac510f2c807aa3af52872340dc37a4a`, GGUF SHA-256
`dc5f44fcf1fa496ee7ad725982c0c8c553a4de00259b53af84c4b89fb0c06699`.
Baseline/scene profile SHA-256:
`ff4a94e011ad133244b3c1cb385718cbbfffaa783802502dcc79bdcf6268666a`
and `432a1b064397a96334d777dfa01a2cef58d367b37023f1f9175501969698df4d`.
The scene profile reserves 256 completion and 64 safety tokens in a checked
2,048-token context. Runtime is pinned llama.cpp `b10977-0ecb159c9`, one
slot, Jinja, 99 requested GPU layers and zero RAM prompt cache on the current
Windows/i7-6900K/RTX 3070 8 GiB desktop. The harness records exact current
CLI/runtime hashes, Git status, device/process samples and source/map hashes.

Budget: two files, six expected chat requests, at most eight chat requests and
32 total loopback requests; one repetition, ten minutes after server readiness.
No prompt or decoding tuning after observing responses. Stop and retain the
failed report on any command error, source-byte change, rejected slot,
re-export mismatch, journal/proxy disagreement or budget breach. The checker
must match each scene preflight's exact body hash, raw parsed response, token
count and order, and preserve v7 chat-only report compatibility. It must find
no proposed reference in chat input. Outputs are inspected as observations,
not scored as translation quality.
