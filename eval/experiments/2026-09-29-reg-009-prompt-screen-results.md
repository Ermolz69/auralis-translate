# REG-009 matched identifier reminder result

The [predeclared screen](2026-09-29-reg-009-prompt-screen-plan.md) ran once on
29 September 2026 against the checked local Tencent Hy-MT2 1.8B Q4_K_M.
It compared the archived v6 prompt with the same prompt plus one explicit
ASCII-code preservation instruction. Four authored development cues at the
beginning, middle and end of the synthetic long file were paired at seeds 101
and 202. The source and context did not change between arms. No proposed
Russian answer or reference was sent to the model.

| Measure | Archived v6 prompt rerun | Identifier reminder |
| --- | ---: | ---: |
| Structurally valid JSON slots | 8/8 | 8/8 |
| Exact source code in accepted target | 2/8 | 2/8 |
| Total prompt tokens | 2,282 | 2,594 |
| Total completion tokens | 294 | 302 |
| Sum of chat HTTP elapsed times | 21,619 ms | 21,801 ms |

The exact-code outcomes matched within every seed/cue pair. Cue 1 retained
`AUR-0001` in both arms and seeds; cues 2, 514 and 1000 omitted their code in
both arms and seeds. For example, cue 2 with seed 101 produced `Не открывайте
эту дверь.` in the baseline and `Не открывай эту дверь.` with the reminder;
neither retained `AUR-0002`. These are raw model observations, not a human
adequacy judgment. The reminder consumed 312 additional prompt tokens over
eight requests and showed **zero measured gain** on this small screen. The
sample does not establish that all prompt variants fail or that 7B behaves the
same way. It does rule out adopting this one-line change as a verified fix.

The run made exactly 16 chat requests, one server start and no retries in
51,991 ms, below the 20-minute cap. No HTTP, structural or sampling errors
were observed. Ten resource samples found peak tracked working set
2,101,719,040 bytes and private memory 1,058,693,120 bytes; the peak 844 MiB
GPU reading covers the whole device and does not prove model offload. The
original v6 profile SHA-256 was
`b30546f228ba230364ba79edae55456d62e7d7c5010e56fef38464c3531089c5`;
the GGUF SHA-256 was
`dc5f44fcf1fa496ee7ad725982c0c8c553a4de00259b53af84c4b89fb0c06699`.
The checked server SHA-256 was
`6f15be27bd80b6b4d52afefa49094e18fcfab55d5da354d717971f2d2537b2f4`.
The tested parent was `c763807`; the only dirty file was the owner's
unrelated architecture edit, which the probe did not read. The reminder had
its own per-request prompt hashes and was not installed as a product profile.

The [summary](../reports/2026-09-29-reg-009-identifier-prompt-summary.json)
pins the [full report](../reports/2026-09-29-reg-009-identifier-prompt-report.json),
[all rendered requests and raw responses](../reports/2026-09-29-reg-009-identifier-prompt-requests.jsonl.gz)
and [resource samples](../reports/2026-09-29-reg-009-identifier-prompt-resources.jsonl.gz).
The local server log is retained in the private run directory and its SHA-256
is in the summary. `task eval:reg009:prompt:probe` exited 0;
`task eval:reg009:prompt:capture` and `task eval:reg009:prompt:check` passed.
The permanent `REG-009` diagnostic still exposes new omissions; it does not
make these outputs acceptable for release. A different versioned protection
strategy must be measured on matched sources before any full-file rerun.
