# Temperature zero did not resolve the cross-source JSON-tail failure

Date: 30 September 2026. Partial `CTX-02`/`EVAL-04`/`DECIDE-01` evidence under
the [one-factor plan](2026-09-30-json-tail-temperature-screen-plan.md). The
preflight verified the exact private ASUS and Vivo source/report hashes, four
archived 7B v5 source-only requests, model/runtime/profile/CLI bytes, and the
fact that `temperature` alone changes from `0.7` to `0`. One local server
executed eight chats, two repetitions each for the two failed cues and their
immediately preceding controls, with zero retries. All raw requests,
responses, validated one-cue SRT files and resource samples remain under
`.cache/eval/natural-json-tail-temperature-zero-v1/run-whBpv0/`.
The private report SHA-256 is
`b33c8ba858bba4c5b9957884b7b312ea90997993afee3e32e1394b73c7e19664`;
append-only raw JSONL SHA-256 is
`1d2e9a1fab3d0419ebe074a655b2bc93e19c07114cd944527c73a7eae2f82355`.
`task eval:natural:json-tail:temperature:check` verified all eight exact
request diffs, raw/accepted responses, CLI SRT inspection outcomes, usage,
times and the [redacted summary](../reports/2026-09-30-json-tail-temperature-summary.json).

| Same source window | Archived 0.7 response | Temperature 0, two repetitions |
| --- | --- | --- |
| ASUS cue 226, BIOS control | SRT valid | 2/2 valid |
| ASUS cue 227, 9 W / four cores | Invented `」}]}` tail, rejected; identical-request resume also rejected | 0/2 valid; same tail and CLI `UnsupportedMarkup` twice |
| Vivo cue 275, joint-tuning control | SRT valid | 2/2 valid |
| Vivo cue 276, 36-month planning lead | Invented `」}]}` tail, rejected | 2/2 SRT valid |

Across all eight variant calls, 6/8 were strict-SRT valid. The screen used
2,350 prompt and 428 completion tokens; summed instrumented chat time was
8,088 ms, active wall time 13,960 ms. Only two five-second resource samples
were captured; sampled server working-set peak was 5,061,525,504 B and
whole-device GPU use was 5,744 MiB. This is too sparse to characterize a
tail or isolated model VRAM. The old archived responses were sampled in
separate runs, so their wall/resource values cannot be compared as paired
eight-call totals.

**AI source-aware triage, no human score:** The temperature-zero ASUS cue 227
kept the intended 9-W and four-core condition before the invalid tail but is
not an acceptable subtitle. ASUS cue 226 preserved the missing BIOS choice,
though its Russian term for hyperthreading needs terminology review. Vivo
cue 276 lost the tail, but still shifts the 36-month lead relative to the
earliest stage rather than preserving the source clause that continues into
cue 277 about joint planning. Its structural validity does not repair the
known major planning fact error. These are development-window judgments by
AI, not independent bilingual ratings; no reference was in the request.

Temperature zero is **not promoted** as a v5 release profile. The ASUS
model-output failure persists deterministically in both sampled repetitions,
and the Vivo semantic error remains after structural repair. This screen
cannot prove that a higher-precision quantization or fine-tuning is needed;
it does show that a temperature-only change is insufficient. The frozen
ASUS/Vivo failed and copied-state runs remain unchanged. Human source/audio
review, licensed scene admission, a broader paired quality comparison and
G1–G9/A1–A6 remain open.
