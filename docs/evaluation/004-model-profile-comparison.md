# Local model profile comparison

Status: development comparison protocol, 26 September 2026. This supports S5 investigation; it does not supply bilingual subtitle release scores or select a production profile.

## Question and controls

The [publisher's pinned model card](https://huggingface.co/tencent/Hy-MT2-1.8B-GGUF/blob/a0c709d9fac510f2c807aa3af52872340dc37a4a/README.md) supplies a simple translation instruction and sampling guidance. The current prompt-v1 profile follows that instruction. Prompt-v3 adds our JSON target/context/glossary wrapper. The experiment asks whether zero-temperature decoding changes the Russian result and whether the JSON wrapper itself affects target extraction when no context or terms are supplied. Neither change is assumed to improve quality.

The [matrix](../../eval/profiles/hy-mt2-dev-decoding-v1.json) pins the existing checked profile bytes and the [ten-row development sample](../../eval/corpora/flores200-file-probe-v1.json). Every variant uses the same GGUF, runtime, source, Russian reference, backend and one-target block planning. No neighbouring article sentence is passed as subtitle context.

| Variant | Prompt | Temperature | Context / glossary |
| --- | --- | --- | --- |
| `plain-sampling` | Existing v1 plain text | 0.7 | None |
| `plain-greedy` | Existing v1 plain text | 0 | None |
| `json-greedy` | Existing v3 JSON wrapper | 0 | Empty; glossary budgets remain declared |

Other decoding settings are unchanged. Sampling is unseeded. Zero temperature does not guarantee identical results across execution backends, versions or hardware. The one-target block setting differs from the earlier two-block ten-row file probe, so those wall times are not directly comparable.

These are auxiliary FLORES-200 `dev` sentences with synthetic SRT timing. They are not real dialogue scenes, not an untouched holdout and not representative subtitle coverage. No term-adherence or context-quality conclusion is possible from empty context/glossary input. There is one run per variant, so this does not measure stochastic error rates. A separate scene-based test must exercise those capabilities.

## Run locally

Supply the separately installed checked assets. The task never downloads weights or uploads data:

```powershell
$env:AURALIS_TEST_LLAMA_SERVER = 'C:\absolute\runtime\llama-server.exe'
$env:AURALIS_TEST_GGUF = 'C:\absolute\models\Hy-MT2-1.8B-Q4_K_M.gguf'
$env:AURALIS_TEST_GPU_LAYERS = '0'
task eval:cli:flores:profiles
```

The current runner targets Windows. A GPU run additionally needs compatible DLLs on `PATH`; using a different backend requires its own evidence. The task runs `task build` and `task eval:file:checks` before sequential inference. All derived profiles, state, complete source/reference/candidate texts, attribution, logs and reports stay in ignored `.cache/eval/profile-runs/` storage.

Each variant verifies the official corpus, invokes the shared checked-model CLI path, checks complete durable progress, unchanged source bytes, exact protected bytes/cue metadata, output overwrite rejection and byte-identical re-export after the server stops. Each keeps its own SQLite file and immutable result. No current desktop profile or earlier run is rewritten.

With the pinned corpus cache still present, `task eval:profiles:verify REPORT_DIR=ABSOLUTE_LOCAL_REPORT_DIRECTORY` verifies completed reports without inference. It rechecks selected source/reference file digests, official row identity, derived profile bytes, separate run/result identities and retained source/reference/output/re-export artifacts. This verifies provenance and transport evidence, not linguistic quality.

## Failure and report rules

- The matrix rejects changed pinned inputs, duplicate variant IDs, holdout tuning and overrides to model/runtime identity.
- The combined report rejects mismatched source/reference rows, corpus/model/runtime/backend identity and missing transport checks.
- A failed variant remains in the total and has no accepted candidate. The task continues other variants, writes a report, and exits nonzero if any variant fails. Local logs are retained; failures are not silently removed from comparison.
- Exact reference matches, unchanged-source text and different wording are textual diagnostics. They do not establish adequacy or fluency. Zero structural warnings does not imply correct Russian.
- The combined report always records `quality_verdict: unreviewed` and `winner: null`. Selecting a profile requires source-aware review and the separate [language protocol](001-open-data-and-language-gates.md).

Review the comparison without using exact-reference equality as a pass threshold. Record source meaning, grammar, omissions/additions, names, facts, numbers, negation and reference discrepancies by corpus row. Distinguish genuine model errors from alternate Russian wording or an inconsistent reference. Re-run promising variants on development scenes before freezing a new profile; keep the release holdout untouched. Existing saved runs retain their original profile fingerprint.

The evaluation scripts and test data are outside the production crate graph. Auralis delivery policies exclude evaluation payloads and weights; see the [delivery audit](../../eval/experiments/2026-09-26-translation-delivery-audit.md).
