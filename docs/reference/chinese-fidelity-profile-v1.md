# Chinese fidelity profile v1

Status: experimental correction protocol, 27 September 2026. The public dialogue
probe observed repeatable currency substitution, negation, idiom and grammar
errors with prompt v1. A separately fingerprinted prompt-v4 profile protects
recognized monetary amounts in the inference input. It does not claim to solve
negation, idioms, names or general grammar.

The new profile is Chinese-to-Russian only, without neighbor context or glossary.
It retains the existing decoding settings and model identity to isolate the
provider change. The adapter recognizes bounded monetary expressions and places
unique ordered `__AURALIS_MONEY_N__` tokens in a transient inference copy. The
model must preserve them exactly. Before returning a candidate, the adapter
checks token counts, order and unknown tokens, then restores each source-derived
amount with its Russian currency label. Missing, duplicated, reordered or invented
tokens fail the provider call; they cannot become a saved checkpoint. Source
text containing the reserved prefix is rejected before HTTP. This is typed source
protection, not replacement of words such as "shilling" in arbitrary model output.

Supported numeric notation is nonnegative Arabic integers/decimals with at most
two fractional digits, and explicit Chinese numerals through 千 (0–9999), including
零/〇/两. Ambiguous forms such as 一百五, negatives, 万 and scientific notation
are not normalized. Yuan expressions support 元/人民币/块钱, price-context 块,
角/毛/毛钱 (tenths) and 分 (hundredths). Major-unit expressions can include one
digit of shorthand tenths or explicit 角/毛 and 分. Fractions are expressed as a
decimal in yuan; this is unit normalization, not exchange-rate conversion.
Explicit 美元/欧元/日元/卢布/谢克尔/先令/港元 retain their currencies. Units such
as 分钟 and physical 块 followed by a noun are not monetary expressions.

The 块/毛/角/分 context heuristic requires a price clue in the same clause and a
bounded suffix. It is deliberately limited and does not resolve arbitrary scenes
or every classifier use. Unrecognized expressions receive the unchanged plain
translation prompt and remain subject to model errors. Restored currency forms
use nominative counting forms; surrounding Russian case and grammar still need
review. The model can preserve every token and still mistranslate nearby words.
This profile does not claim perfect financial translation or a language gate.

Prompt versions 1–3 and their profile bytes remain unchanged. Saved runs retain
their old fingerprints and outputs. A new run must explicitly use
`models/manifests/hy_mt2_1_8b_q4_k_m.fidelity.experimental.json`; it cannot resume
an older profile's partial run. Existing desktop installed-package selection is
not silently changed, because its release manifest pins the old profile hash.

Acceptance requires actual repeated file translation of the original development
examples plus independent monetary controls: other yuan prices, fractional
units, named dollars/euros/rubles/yen/shekel/shillings, and physical pieces. Record
all candidates, including failures, and preserve structural/offline-export checks.
Compilation and mock protocol checks do not prove currency or language quality.
Independent bilingual review and full language release gates remain open.

Start a fresh standalone run with:

```powershell
task cli -- translate source.srt state-v4 models/manifests/hy_mt2_1_8b_q4_k_m.fidelity.experimental.json http://127.0.0.1:18080/ translated.ru.srt
```

The runtime/model installation requirements are unchanged. Prompt versions 1–3
retain their request bodies; the local HTTP adapter additionally supplies an
`x-auralis-source-sha256` diagnostic header for exact benchmark row mapping.
Raw protected model responses and restored accepted candidates are separate
fields in new benchmark records.
