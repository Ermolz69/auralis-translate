# Qwen3-8B local translation screen

Date: 10 October 2026. Tasks: `CTX-02`, `DECIDE-01`, `EVAL-04`.
The [version-matched 18:36 Vivo source](2026-10-09-youtube-chinese-scene-selection-result.md)
is private, unreviewed development material. The [REG-077 v4 result](2026-10-10-reg-077-referent-v4-result.md)
rejected another instruction-only repair. This screen asks whether a different
locally runnable model merits a same-source quality comparison. It does not
replace v8 or claim the YouTube caption text is independently licensed.

The sole candidate weight is the official `Qwen/Qwen3-8B-GGUF` `Q4_K_M`
at repository revision `7c41481f57cb95916b40956ab2f0b139b296d974`:
`Qwen3-8B-Q4_K_M.gguf`, 5,027,783,488 bytes, SHA-256
`d98cdcbd03e17ce47681435b5150e34c1417f50b5c0019dd560e4882c5745785`.
The official model card advertises Apache-2.0, multilingual translation and
the `/no_think` mode. Those are vendor claims, not observed suitability on
this computer. The local baseline is Hy-MT2 7B Q4_K_M under v8; its weight
SHA-256 is `9f96256500f3fc1ab4d64336b58f52a949a95ad7516b0c229476eef782f9f77b`.
Keep the current runtime, source, context slots and answer schema fixed where
compatible. Any Qwen-specific chat-template or non-thinking change must be
identified as part of the candidate configuration, not hidden as a one-factor
model result.

First acquire only the pinned official weight to ignored local storage. One
HTTP GET attempt, at most 5,027,783,488 bytes and ten minutes wall; stream
to a `.part` file, hash as received, retain a failure record and any partial
bytes, and rename only after exact length and SHA-256 match. No paid service,
inference or change to model selection occurs in acquisition. Do not run a
second attempt under this identity.

After acquisition, freeze source-only case selection and matched request
identities before inference: natural Vivo cues 172, 232 and 393, the
`REG-077` minimal contrast `not_multicore_but_separate_chips`, its related
`three_independent_not_one_multicore` control and the negative
`real_dual_processor_single_core` control. Use seeds 101/202/303, at most
36 chats (18 per model), 72 template/tokenizer preflights, one start per
model, no retries, 30,000 combined tokens and ten minutes of inference wall
time. Run the candidate server first and the baseline second; this order is
a confound for timing, so do not claim a performance win from it. Use the original
Chinese source without a Russian reference in any prompt. Retain every raw
reply, validation outcome, token count, duration, resource sample and error.
An AI source-aware review may reject obvious facts or grammar, but it is not
an independent G3/G4 adequacy score. A shortlist requires no new major errors
against the v8 arm and consistent preservation of the negated chip/core
referent across all seeds. A shortlist only permits a later cross-source
screen; failure retains v8 and stops before a full-file or TTS run.
