# Frozen complete-clause official reference follow-up

Date: 10 October 2026. Partial `EVAL-04`/`CTX-03` evidence. Experiment ID:
`OFFICIAL-ZH-RU-REFERENCE-2026-v2`. The [v1 screen](2026-10-10-official-zh-ru-reference-v1-result.md)
is rejected as a semantic score because three source selections omitted their
modality context. Preserve its ten raw model replies, the PDF and all failures.

Use the **same** private official 13-page Chinese–Russian PDF SHA-256
`dc029d7ebc4b43d599348943dca8229108df81d3c932df2ccbb72df43da82ea8`,
same 7B weight/runtime/manifest/baseline request identities from the v1 plan,
seed and decoding. Freeze six Chinese-only inputs in private
`.cache/eval/official-zh-ru-reference-2026/source-cases-v2.json`, SHA-256
`026b7189bea819b0b4ccdcde8480cb1da4483305207ac5c5f6e4554ead2e00fa`.
All six target excerpts match their PDF pages after ignoring whitespace and
punctuation; the section heading used as context is present in the PDF.

Four cases re-test the v1 temporal concerns: the policy-action case now has
the 2025 retrospective heading as source context; the 20-indicator case is
unchanged; the research-growth and carbon-target cases now include their full
Chinese paragraphs with `提出`. Two new 2025 retrospective achievement
sentences are completed-action controls. Synthetic context and timing only
exercise the v8 request format; they do not claim the prose came from video.
The Russian PDF side and all v1 accepted outputs are withheld from requests.
Do not use them to alter the prompt, model or selection after the freeze.

Preflight exact source-only request hashes before inference. Budget: one
local server, six chats, twelve template/tokenizer preflights, 16,000 total
reported tokens, 120 seconds per chat, ten minutes total, zero inference
retries, network, ASR or TTS calls. Save raw requests, replies, validation,
tokens, wall time and memory. Retain any startup/validation failure. Compare
only the same four v1/v2 source topics plus two controls; the full source
paragraphs contain additional facts, so review those as well. The official
Russian rendering is a published human reference, but source-aware judgments
of our answers are AI review and must be labeled. Penalize neither valid
paraphrases nor correct unit changes; any remaining temporal or factual
error needs a minimal reproduction and new related/negative controls.

This written-policy diagnostic cannot certify conversational subtitles,
independent review, G3–G5 or RELEASE-05. Product v8 and retained translations
stay unchanged. Rollback is to omit the v2 evaluation-only screen.
