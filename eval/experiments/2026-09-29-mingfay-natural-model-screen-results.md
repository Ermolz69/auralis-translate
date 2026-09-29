# Matched natural Mandarin caption screen: 1.8B and 7B

Date: 29 September 2026. Exploratory `DATA-03` / `CTX-02` / `EVAL-04`
evidence under the [frozen plan](2026-09-29-mingfay-natural-model-screen-plan.md).
This uses one real creator caption, but the source remains **unadmitted**:
the media download [failed](2026-09-29-mingfay-media-download-failure.md),
rights and speech alignment are unknown, and no independent bilingual
reference or reviewer exists. This is not G3/G4 evidence or a model selection.

The immutable private Chinese-only SRT has SHA-256
`42109FC054CBA93B0EF343853628B6A248B31664786D579BDEFA415CCAACF9EE`.
Both models translated the same four exact 4-cue SRT windows: source IDs
`1–4`, `114–117`, `209–212` and `227–230` (start, middle, repaired boundary,
end). Each window retained creator timings and one source-only v5 scene map.
The [redacted machine summary](../reports/2026-09-29-mingfay-natural-summary.json)
has SHA-256
`37A604DEB8C8A25E478097123E9E844EAA23A47D1EB9F4F76CEE9B5182D6EFB5`.
It includes four paired window hashes, eight result hashes, model/profile/CLI/
runtime revisions and exact measurements. Full raw requests/responses,
accepted lines, SQLite, source text and output subtitles remain private in
`.cache/eval/mingfay-natural-1b-v1/run-k4OIzL/` and
`.cache/eval/mingfay-natural-7b-v1/run-XAVHeo/`. Their complete report
SHA-256 values are
`7F5D5FFA72584E689CE432508EFB2044AAD24C7E8ACF18C67279DD46E9646F0F`
and `F1662DFC239068F5ECBB56C8C53765E1851C26D43437ADEE6D368A66BB26284B`.
The raw source and outputs are not published.

| Observed measure | 1.8B Q4_K_M | 7B Q4_K_M |
| --- | ---: | ---: |
| Structurally accepted cues / selected cues | 16/16 | 16/16 |
| Saved chats / preflight requests / all proxied requests | 16 / 32 / 60 | 16 / 32 / 60 |
| Prompt / completion tokens | 3,837 / 584 | 3,877 / 582 |
| Sum of chat HTTP times | 7,908 ms | 17,064 ms |
| Full script wall time including startup and checks | 50,971 ms | 156,106 ms |
| Sampled server working-set peak | 1,545,809,920 bytes | 5,060,448,256 bytes |
| Sampled device-wide GPU-used peak | 3,953 MiB | 7,434 MiB |
| Failed requests; offline output mismatch | 0; 0 | 0; 0 |

The checked GGUF digests were
`DC5F44FCF1FA496EE7AD725982C0C8C553A4DE00259B53AF84C4B89FB0C06699`
and `9F96256500F3FC1AB4D64336B58F52A949A95AD7516B0C229476EEF782F9F77B`.
The respective v5 scene profiles were
`432A1B064397A96334D777DFA01A2CEF58D367B37023F1F9175501969698DF4D`
and `9B34D86D3B0D872720EE729131EFEF99281E71A0000D202ABEA169D625A92E73`.
Both used the same release CLI
`F20C72F538F28C4BE19F77BE653E795E6EAA26B78AD58817897418B921CD5666`
and llama.cpp runtime
`6F15BE27BD80B6B4D52AFEFA49094E18FCFAB55D5DA354D717971F2D2537B2F4`.
The prompt check found zero matches for the source track's excluded Pinyin
and English side-lines. Full wall time includes different model startup and
does not establish isolated throughput; GPU used includes other applications.

**AI source-aware triage, targeted and non-exhaustive:** In source cue 114,
the 1.8B accepted line changed the delivery courier into a taxi driver and
replaced the upstairs delivery with a lock claim. In cue 230, it added a
bookmaker addressee to the presenter's farewell. Both are major source-fact
errors under [REG-018](../regressions/natural-courier-substitution-v1.json)
and [REG-019](../regressions/natural-farewell-invention-v1.json). The matched
7B lines preserved those two meanings in this one run. This does not certify
the other 14 lines, grammar, names, scene continuity or cue fit. A bilingual
reviewer has scored **0/16**; a source-aware release denominator is zero.
The private exact reproductions and three new related plus three negative
authored controls per error are executable through `task
eval:regression:mingfay:private:check`. The first private checker attempt
exposed a mistyped expected digest for cue 230; correcting that test value
passed without a model rerun or rewriting the accepted output.

`task eval:natural:mingfay:1b:probe` and
`task eval:natural:mingfay:7b:probe` passed. Each created four distinct
durable SQLite runs and four separate SRT outputs, passed strict cue/timing/
protected-byte comparison and reproduced each output byte-identically after
the model server stopped. `task eval:natural:mingfay:journal:check` matched
all 32 saved chats and 64 preflights against the proxy traces and SQLite.
`task eval:natural:mingfay:compare:check` confirmed paired source hashes,
exact output and runtime identities, token/resource totals and zero excluded
side-line matches; `task eval:natural:mingfay:capture` archived only redacted
metrics. These are 16 sampled cues, **not a complete 230-cue translation**.
Natural long-file quality, human G3/G4, full media and audio A1–A6 remain
open.
