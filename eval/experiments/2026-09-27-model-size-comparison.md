# Hy-MT2-1.8B and 7B: matched Q4 fidelity comparison

Status: experimental local CLI model integration and development comparison,
27 September 2026. No desktop UI/default, broad language gate or quantization
ablation is claimed.

## Integration

The owner requested the second model, real comparison and conclusions at the top
of the existing public HTML report, explicitly deferring desktop UI changes.
The separate [7B profile](../../models/manifests/hy_mt2_7b_q4_k_m.fidelity.experimental.json)
and [package manifest](../../models/releases/hy_mt2_7b_q4_k_m.windows_x64_cpu.experimental.json)
reuse the existing provider, verification, downloader and installer APIs. Core
production Rust did not require a model-specific rewrite. Identity is versioned;
the existing 1.8B profiles and desktop catalog were not overwritten.

Upstream model: [Tencent pinned Q4_K_M](https://huggingface.co/tencent/Hy-MT2-7B-GGUF/tree/ab8472660ac61fac25f1af43fac2599d52a8a775).
Actual downloaded size: 4,624,648,896 bytes. SHA-256:
`9f96256500f3fc1ab4d64336b58f52a949a95ad7516b0c229476eef782f9f77b`.
The source license was retained and hashed. Initial curl metadata acquisition
hit the sandbox's unavailable proxy before any download; authorized network
execution then acquired the pinned file. No inference failure is hidden by this
environment retry. Download duration was not instrumented and is not estimated.

`task model:7b:fetch` verified all four local assets through the existing cache
path. `task model:7b:install` installed the separate CPU package into ignored
`.cache/installed-models`. That is installation evidence, not CPU performance
evidence. Actual comparison inference used the existing supplied CUDA runtime;
the [CLI usage contract](../../docs/reference/hy-mt2-7b-cli-v1.md) distinguishes
the CPU package from that GPU prerequisite.

## Protocol and evidence

`task eval:models:compare` ran at 20:43:17.141–20:47:56.479 UTC. Local workspace:
ignored `.cache/eval/model-size/run-9e5EZM`. The frozen
[complete report](../reports/model-size-comparison-2026-09-27.json) has SHA-256
`efe0130f0a6c076945a6844348d963a161650458bb97d21cd6b672b89b69f554`.
Four sequential cases used model order 1.8B/7B for the twenty original lines,
then 7B/1.8B for twenty currency and physical controls. Three fresh SQLite states
per case, one persistent server per case, one model request per line. References
and review notes were not sent to the model. All 240 requests returned HTTP 200;
all twelve files passed protected-byte checks, preserved their source and
re-exported byte-identically after the server stopped. All results still require
review.

Only model identity fields differ between profiles. Prompt v4, sampling,
256-token limit, 2048-token context, one slot, Jinja, requested GPU layers 99,
cache RAM 0, runtime build and CLI binary are matched. Reports retain exact
prompts, raw responses, restored candidates, usage, model/runtime/CLI/source/code
hashes, run/result identity and resource samples. Runtime verbosity did not emit
an exact layer-offload count; GPU activity and successful real inference are
observed, while GPU layers 99 is the requested configuration.

Hardware: RTX 3070, 8192 MiB VRAM; i7-6900K, sixteen logical CPUs, approximately
48 GiB system RAM, Windows 10. This is an active desktop, not an isolated host.
Sampling is stochastic; OS disk cache is not controlled and prompt reuse may
affect later requests. Server startup includes initial CUDA costs, so its first
1.8B value is not evidence that larger weights intrinsically load faster.

| Case | Startup, ms | File times, ms | Median HTTP / p95, ms | Peak total GPU, MiB |
| --- | --- | --- | --- | --- |
| Original lines, 1.8B | 11650.818 | 10958.878 / 10131.915 / 10231.301 | 172.845 / 248.794 | 4052 |
| Original lines, 7B | 4271.459 | 35816.649 / 34763.698 / 32770.900 | 514.185 / 675.278 | 7593 |
| Controls, 7B | 4231.547 | 30357.094 / 29623.819 / 29824.744 | 311.319 / 493.311 | 7631 |
| Controls, 1.8B | 1660.050 | 9778.179 / 8627.002 / 8981.458 | 110.091 / 187.882 | 4072 |

Quantiles use nearest rank, `ceil(p * 60)`. File clock is monotonic
`performance.now()`; loopback HTTP is timed through the complete response body.
File time includes model hashing, preparation, SQLite, validation and export;
the difference from HTTP sum is not a separate hash-stage measurement. Resource
samples start after process spawn, approximately every second: GPU includes
other apps, working set is not private memory, and sampled peaks can miss spikes.
Observed peak working sets were about 1.434 GiB (small) and 4.710 GiB (large).
No standalone VRAM allocation or unlimited-context support claim follows.

## Editorial findings

The [AI-authored review](../corpora/model-size-review-v1.json) inspects all three
candidates per model for all forty inputs and is bound to the evidence hash.
It is not independent human review or a blind language score. On the original
twenty inputs, 7B is preferred in eight, 1.8B in one, two are mixed and nine are
comparable. Several preferences are style improvements, not corrected semantic
failures. On the controls, eight prefer 7B, two are mixed and ten comparable.

7B correctly handles the observed double negative, the conversational idiom
about speaking directly and the prohibition against abandoning work halfway.
It also improves several Russian constructions. However, both models choose the
unconfirmed Japanese reading of the Chinese name and translate the change-giving
line incorrectly under v4. 7B introduces "ты меня напомнил" in all three
repetitions, and two direction responses specify travel by vehicle without source
support. Irony remains literal. Currency identity and numeric preservation come
from the shared source-protection adapter and are not credited to larger weights.

Recommendation for this setup: explicitly use 7B when drafting with quality
priority and retain 1.8B for faster drafts. The original-file median is about
3.40 times longer with 7B, and total observed GPU occupancy reaches 7631/8192 MiB.
Neither configuration is ready for unattended subtitle translation. This is not
evidence that Q4 quantization has no cost; no higher-precision weights were run.

## Checks and publication

The HTML retains the 180 historical requests and adds the 240 matched requests,
all forty comparisons, three selectable repeats, exact measurements, provenance,
model identities and conclusions at the top. The public directory contains only
the remote-Tailwind `index.html`; model weights, runtime and databases stay ignored.
The normal GitHub Pages workflow verifies the evidence before deployment.

Checks completed:

- `task model:7b:doctor`: actual file size and SHA-256 matched.
- `task model:7b:fetch`: four assets verified in the existing cache.
- `task model:7b:install`: separate CPU package installed successfully.
- `task model:7b:smoke`: the actual CUDA launcher reached readiness and stopped
  its child after the check; this is additional startup evidence, not another
  translation benchmark.
- `task eval:models:compare`: all four cases passed, 240 requests and twelve
  protected-byte/offline-export checks as recorded above.
- `task test:model-profiles`: twelve profile/release tests passed; cross-model
  package identity rejected, policy matched and the larger file size admitted.
- `task fmt`, `task lint`: workspace formatting and all-target lint passed.
- `task docs:check`: 91 Markdown files passed local-link validation.
- `task site:build`, `task site:check`: single-file report and all embedded
  evidence passed; prompts and policy matched between sizes, both profile hashes
  were checked, and all 420 historical/current requests remained available.
- Chrome on the existing loopback preview: all forty displayed comparison rows
  matched their saved results when switching to each of repeats 1, 2 and 3;
  console errors were absent. The page was also inspected visually. A new
  `task site:preview` encountered the already occupied preview port; the existing
  report server was reused and served the updated file.

The code was measured before its commit; profile and code-snapshot hashes identify
the actual inputs. Broader language, precision and desktop release gates remain
open. Deployment completion is verified separately after pushing main.
