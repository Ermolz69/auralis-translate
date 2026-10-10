# Frozen official Chinese–Russian reference screen

Date: 10 October 2026. Partial `EVAL-04`/`CTX-03` development evidence only.
Experiment ID: `OFFICIAL-ZH-RU-REFERENCE-2026-v1`.

The user has ruled out a recruited bilingual auditor and has narrowed this
work to the translator. This experiment compares the existing Hy-MT2 7B/v8
profile with a published Chinese–Russian parallel document. It does not
change voice code, accepted subtitle files, the product profile or any sealed
holdout.

## Source and separation

The [2026 Government Work Report summary, Chinese–Russian parallel PDF](https://russian.shanghai.gov.cn/cmsres/48/4855cd1c48564d2989afe7a96a6a7fd1/a238e3cbc8f237ac6d8fa6a9572406d0.pdf)
is hosted by the Shanghai municipal Russian-language site and credits the
Institute of Party History and Literature as translator. The acquired private
PDF has 13 pages, 356,728 bytes and SHA-256
`dc029d7ebc4b43d599348943dca8229108df81d3c932df2ccbb72df43da82ea8`.
This is an openly readable official publication, not an asserted open-content
license. Keep the PDF and source/reference text in ignored private storage;
publish only short examples, identities, metrics and links.

The private Chinese-only selection at
`.cache/eval/official-zh-ru-reference-2026/source-cases.json` has SHA-256
`99db71f3c76546e9e8e7aeb8dc6a049adb49a9698dc71fb366786695ce843d52`.
It contains ten source excerpts from pages 1, 2, 3, 4, 5, 8, 9, 11 and 13.
Every excerpt was checked against its pinned PDF page after dropping only
spaces and punctuation; all ten matched. The sample includes policy actors,
20 indicators, 7% research growth, 17% carbon reduction and a Chinese
negative construction. Selection is exposed development material, not a
sealed holdout. The published Russian side must remain outside model requests
and be opened for assessment only after the raw outputs are retained.

Each case receives one synthetic SRT target slot, with only Chinese source
text and no Russian reference, no approved term and no scene context. The
synthetic timing is a harness device; these are written policy sentences, not
subtitles from spoken media. Use the unchanged v8 request prefix from the
retained baseline request, `Hy-MT2-7B-Q4_K_M.gguf` SHA-256
`9f96256500f3fc1ab4d64336b58f52a949a95ad7516b0c229476eef782f9f77b`,
`llama-server.exe` SHA-256
`6f15be27bd80b6b4d52afefa49094e18fcfab55d5da354d717971f2d2537b2f4`,
and v8 batch-four manifest SHA-256
`c287c53efbb4ce78471b64648ea3dd2f521363df0e168b7a61df1fdd6ae0479a`.
The retained complete v8 baseline request journal is
`.cache/eval/vivo-technical-senses-v2/attempt-WN2KN8/requests.jsonl`, SHA-256
`b9c0951807157c832c42ec1d8d5ab3ec0ebd8498fa2cb01ccf3ce1f2b65e8210`.
Use the same seed and decoding parameters as that request. The only
envelope change is one target slot and its one-item output schema.

## Frozen budget and decision

Preflight hashes the PDF, Chinese-only selection, model, runtime, manifest and
template; freezes exact request hashes before inference and asserts that no
Russian reference text enters a request. Then run at most one local server,
ten chats, twenty template/tokenizer preflights, 24,000 total reported tokens,
120 seconds per chat and ten minutes wall; zero retries, network, ASR or TTS
requests. Save each raw request, raw reply, accepted text, token count, elapsed
time, memory samples, status and any failure before reviewing references.
Never overwrite a failed attempt.

After the run, compare each Chinese source, raw/accepted answer and the
published Russian rendering. Record factual adequacy, numbers, polarity,
actors, missing content and Russian grammar separately from lexical overlap.
The published reference is a human-produced text but is **not** a human
review of our model output. AI adjudication and uncertainty must be labeled.
Differences in style or unit conversion are not automatic errors. Every
confirmed major error needs a minimal reproduction and related/negative
controls before a product fix. This screen cannot satisfy conversational
subtitle, human-review, G3–G5 or RELEASE-05 gates by itself.

If structural validation fails or a budget is exceeded, stop, retain the
attempt and do not replace it with a silent retry. Keep v8 and all existing
source/translation evidence unchanged. Rollback is to omit this evaluation
screen; it is not connected to the product.

Preparation note: the first `freeze` command was interrupted after more than
eight minutes while reading the 4.6-GB weight with Node's default 64-KiB
stream buffer. It created no freeze manifest and made zero model requests.
The hash reader was changed to an 8-MiB buffer and now announces each file
being read; the pinned expected digest and all model settings are unchanged.
