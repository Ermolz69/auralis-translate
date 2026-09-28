# Paired v5 terms probe: three authored Chinese scenes

Status: completed **structural** development probe on 28 September 2026;
translation observations are AI-inspected and unreviewed by a person. The
[predeclared v2 plan](2026-09-28-v5-terms-paired-v2-plan.md) used the same
source, scene map, model, profile and decoding settings in both arms. Only
the synthetic, source-scoped terms ledger changed. Proposed references were
retained outside every model request. The [v1 failed run](2026-09-28-v5-terms-paired-plan.md)
is preserved; its undercounted HTTP budget stopped the final arm.

| Case | Source target | No terms | Scoped term | AI inspection of authored source |
| --- | --- | --- | --- | --- |
| `t01` | 小王到了。 | Сяо Ван пришел. | Сяо Ван пришел. | Name already followed the proposed spelling. |
| `t02` | 小王还没到。 | Шао Ван не пришел. | Сяо Ван ещё не пришёл. | Both retain negation; the term arm matches the proposed name spelling. |
| `t03` | 小王付了三元。 | Малай отдал 3 юаня. | Сяо Ван заплатил 3 юаня. | Both retain 3 yuan; the term arm matches the proposed name and payment relation. |

The same term was present in exactly one target request per scene and absent
from every other request. Both arms used the identical term-capable profile,
which avoids a prompt-policy confound. All six SRT outputs passed protected
byte/structure checks and byte-identical offline re-export. The report
contains 18 actual chat responses and 72 loopback calls, within ceilings of
20 and 80; no accepted target was retried. The three synthetic scene maps
and reviewer IDs are **not** independent human approvals. These observations
are too few to estimate translation accuracy or pass `CTX-03`/`CTX-04`.

The no-term arm used 2,122 prompt and 303 completion tokens over nine chats;
the term arm used 2,275 prompt and 312 completion tokens over nine chats.
Observed chat HTTP time sums were 3,728.0 and 4,234.7 ms respectively;
complete file times include profile/weight verification and are in the raw
report. The process working-set sample peak was 1,550,143,488 bytes, and
system-wide GPU memory-used peak was 3,785 MiB across 50 approximately
one-second samples. These are sampled lower bounds; GPU memory is not
model-exclusive. The RTX 3070 reported 8,192 MiB total VRAM.

The [complete raw report](../reports/v5-terms-paired-v2-2026-09-28.json)
has SHA-256
`e62d49623ba970332a0f29141b3204836bca7d3d1598838672be05e709640229`.
It records source/profile/CLI/runtime hashes, exact prompts and raw responses,
token usage, timings, accepted text, file hashes, sampled resources and the
zero-failure structural outcome. The optimized CLI SHA-256 was
`5777fd774d1358c7f6b69dbff97cccde49fbc3d03b8de852c9271ab5b8e04bc3`.
This was run from an uncommitted candidate with hashes in the report; it is
not a final committed release audit.

Next: repeat on independently reviewed licensed scenes, include context-only
term negative controls and scene boundary shifts, test a natural long file,
and obtain blind bilingual adjudication before selecting a profile. The
singular-actor `REG-002` remains open; this name-term probe does not test it.
