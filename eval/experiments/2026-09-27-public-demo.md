# Twenty authored dialogue examples and public report

Date: 27 September 2026. Scope: three actual optimized CLI runs on twenty
independent authored Chinese lines. The [HTML report](../../site/index.html)
contains all candidates, proposed Russian references, Google observations,
editorial notes and downloadable raw evidence. Proposed references and notes are
AI-authored, not independently human-reviewed. This is not a subtitle holdout or
a language-release gate.

## Recorded execution

- `task eval:public-demo`: optimized build and three real translations passed.
  The initial sandbox invocation failed before runtime startup with Node `EPERM`;
  it issued zero model requests. The authorized rerun passed.
- `task site:capture`: froze the successful local benchmark and generated the
  single HTML report from that evidence.
- `task site:build`: regenerates from the frozen evidence without inference.
- `task site:check`: validates the embedded data, source hash, three candidate
  sets, sixty request records, script syntax and single-file public directory.
- `task docs:check`: validates local documentation links.

Browser verification passed the rendered desktop layout, the 390-pixel mobile
layout, switching to repeats 2 and 3, and the absence of browser console errors.
The source SRT downloaded through the actual report button has SHA-256
`ddb98a4d3f5a3fffd924c7f1594448b17960ee660bb2120a399c779c11d239a9`,
matching the benchmark input. The browser download-event observer timed out,
but the downloaded file itself was independently verified.

The exact [authored dataset](../corpora/public-demo-v1.json), [Google observations](../corpora/public-demo-google-v1.json),
[proposed editorial review](../corpora/public-demo-review-v1.json) and [raw benchmark](../reports/public-demo-2026-09-27.json)
are versioned. No weights, executable, SQLite state or private process logs are
included in the public directory. Sources and references were authored for this
report; no third-party corpus or copyrighted subtitle excerpt was used.

## Measurements and verification

| Measurement | Actual result |
| --- | --- |
| Server launch through observed readiness | 12,655.434 ms |
| File translation, repeats 1 / 2 / 3 | 10,483.343 / 9,643.995 / 11,255.359 ms |
| Sum of model HTTP calls, repeats 1 / 2 / 3 | 3,716.137 / 3,169.406 / 3,471.743 ms |
| Offline re-export, repeats 1 / 2 / 3 | 68.124 / 95.704 / 85.237 ms |
| Actual model requests | 60/60 HTTP 200; one request per example per run |
| Durable state | 3/3 committed blocks per run, validated, needs_review, zero heuristic warnings |
| File structure | Cue IDs, order, timing, line slots and protected bytes verified in all runs |
| Source and offline results | Original unchanged; all offline outputs byte-identical |

Hardware: Intel Core i7-6900K, 16 logical CPUs, 51,458,560,000 bytes visible RAM;
NVIDIA RTX 3070, 8192 MiB, driver 595.79; Windows 10.0.19045 x64. Runtime
`b10977-0ecb159c9`, Hy-MT2-1.8B Q4_K_M with the unchanged checked prompt-v1
profile. GPU layers 99, one server slot, context 2048, RAM cache zero. Exact
hashes, arguments, token counts and process-resource samples are in the evidence.

Durations use Node's monotonic `performance.now()`. Full CLI time includes model
file verification and durable persistence; the proxy time measures each model
HTTP request through the complete response body. Their difference is not a
separate measurement of hashing or persistence. llama.cpp's own prompt/generation
timings are also retained, with cache-token counts. One server remains loaded
through all runs; no cold OS cache or isolated host is claimed. Browser collection
of Google translations overlapped the local runs. Resource sampling starts after
readiness and gives approximate one-second peaks, not a model-loading peak.
The proxy clock starts after receiving the CLI request body and ends after reading
and decoding the upstream response; it includes proxy bookkeeping but excludes
delivery back to the CLI. It is not an instrumented timer inside the model.

Google translations were obtained individually from the actual rendered browser
interface with explicit Simplified Chinese and Russian selection. Each observation
has a UTC timestamp. Google does not expose a model version there; its latency
was not measured and is not compared with local file throughput.

## Quality observations and remaining gates

The report preserves every candidate, including defects. Notable repeated
issues include yuan changed to shillings, an incorrect double negative, a
Japanese reading of an assumed Chinese name, literal/awkward idioms, and
"do not abandon halfway" changed to "do not postpone". Zero heuristic warnings
do not establish semantic correctness. Editorial issue counts are proposed review
leads, not human accuracy scores. Gender, politeness and word choice require
scene context; multiple reference phrasings can be valid.

Only Chinese was tested: the current durable CLI freezes Chinese-to-Russian runs.
Japanese, context/glossary profiles, actual timed scenes, independent bilingual
review and language/release gates remain open. The existing product profile was
not changed.

## Publication

GitHub Pages uploads only `site/`, which contains `index.html`; Tailwind is
imported from its remote CDN. The HTML embeds all report data and scripts, so
it can also be opened directly. The [Pages workflow](../../.github/workflows/pages.yml)
validates the frozen report before uploading. GitHub rejected Pages creation
while the repository was private because the account plan did not support it;
publication requires an explicitly authorized visibility change or a supported
private-repository plan. The generated report does not itself change repository
visibility.
