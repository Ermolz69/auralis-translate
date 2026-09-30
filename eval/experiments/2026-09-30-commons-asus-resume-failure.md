# ASUS copied-state continuation repeated the cue-227 model defect

Date: 30 September 2026. This is the single continuation under the
[predeclared resume plan](2026-09-30-commons-asus-resume-plan.md), partial
`CTX-02`/`LONG-03`/`LONG-04`/`EVAL-04` evidence. The prior [full-file
failure](2026-09-30-commons-asus-full-7b-failure.md) and its original SQLite
SHA-256 `5251f0900da2858e9c51568d7143c4a3e2b23544949378ce011ba6029119c30a`
remain unchanged. The copied state retained all 226 ordered checkpoints and
source bytes before model startup. The new private workspace is
`.cache/eval/commons-asus-full-7b-resume-v1/run-3viEKO/`, report SHA-256
`646d7e6ff5d83c5afa097766db52c267e34d7800c355ff192f7364f01bcb8d7d`.

The same 7B Q4_K_M model, llama.cpp runtime, v5 profile and release CLI
identities were verified against the frozen plan. The first and only resumed
chat used the **identical request SHA-256**
`945dda8849ffbfd948794a01311e94274e4f00b388a214025dfb709c7e226848`
for target cue 227. Its raw response SHA-256 was
`52d0e4dd32a206729e540eb6be913cff10404bea0b34b3bfed1eec553b5402c6`;
the extracted candidate SHA-256 was
`68448035d4a6a70862ef4d88e6899b47445905fc1fb995efd3b146190a6e6ab1`.
The Russian wording changed relative to the first run, but the model again
placed invented `」}]}` closing syntax inside the target string. The reply
used 305 prompt and 65 completion tokens, `finish_reason=stop`, with 1,468 ms
measured HTTP time. It failed strict SRT validation before a new checkpoint.

The copied SQLite SHA-256 after rejection is
`b8c0b64f6e68687766fb06189d0796afe0cd9343a1b9de8b901ecc8e8a770579`.
It has two failed attempts, the exact original 226-checkpoint prefix, zero
complete results and no candidate SRT. `task eval:regression:asus:resume:check`
compared both raw replies and all prior checkpoints. The total copied-state
resume made one chat and six HTTP calls; its translation command lasted
23,324 ms. The one-second sampler recorded 25 samples. This is a second
observation of the [REG-029](../regressions/natural-asus-json-tail-v1.json)
model-output class, not a new root cause or a successful recovery.

The failed continuation stops this experiment's budget. No third same-profile
retry is authorized by the plan. A different decoding profile or conservative
repair policy would need an independently frozen source-only comparison and
new run identity; the old raw failures and prefix remain immutable. ASUS has
no complete translation, source-aware human score or approved dubbing script.
