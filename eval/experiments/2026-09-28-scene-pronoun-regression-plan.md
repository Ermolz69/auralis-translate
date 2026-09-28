# Predeclared scene pronoun regression probe

Status: predeclared after the first two-scene smoke exposed `p01`'s
singular-to-plural error, before running these new controls. The source is
AI-authored development data and no human has scored it.

`r01` reproduces the exact three-cue Chinese `p01` scene. `r02` changes the
actor to a singular older sister, `r03` to a singular younger brother, and
`r04` explicitly names two older brothers as a negative plural control.
References and expected facts are held outside all model requests. Each
case uses identical complete SRT source bytes in the no-context and
scene-context arms, one repetition each.

The model, GGUF, runtime, v5 template, decoding settings and 2,048-token
context are the same as the
[initial predeclared smoke](2026-09-28-scene-context-smoke-plan.md).
The scene arm reserves 256 output and 64 safety tokens and measures the
rendered chat template before inference. Budget: eight files, at most 26
chat requests and 80 total loopback requests, ten minutes after readiness,
one model startup, no paid compute. Stop and retain failures on structure,
tokenization, immutable source, resume or resource failure. The task is
`task eval:context:scene:regression`.

This probe checks whether the observed semantic problem repeats and whether
related actors also drift. It does not pass a model on its own; independent
bilingual review and broader, blinded scenes remain required.
