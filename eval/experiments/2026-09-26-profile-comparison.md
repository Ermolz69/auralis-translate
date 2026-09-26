# Checked local decoding and prompt comparison

Date: 26 September 2026. Scope: S5 development investigation using auxiliary sentence inputs through the real durable file pipeline. No subtitle holdout, bilingual approval or production-profile selection is claimed.

## Reproduction

From the standalone Translate checkout, with the already installed pinned assets:

```powershell
$env:AURALIS_TEST_LLAMA_SERVER = 'E:\Anything\Projects\Commercial\auralis-translate\.cache\runtime\llama\llama-server.exe'
$env:AURALIS_TEST_GGUF = 'E:\Anything\Projects\Commercial\auralis-translate\.cache\models\Hy-MT2-1.8B-Q4_K_M.gguf'
$env:AURALIS_TEST_GPU_LAYERS = '99'
$env:PATH = 'E:\Anything\Projects\Commercial\auralis-translate\.cache\runtime\cudart;' + $env:PATH
task eval:cli:flores:profiles
task eval:profiles:verify REPORT_DIR=E:\Anything\Projects\Commercial\auralis-translate\.cache\eval\profile-runs\flores-dev-FQBE8n
```

The [matrix](../profiles/hy-mt2-dev-decoding-v1.json), [protocol](../../docs/evaluation/004-model-profile-comparison.md) and [sample](../corpora/flores200-file-probe-v1.json) freeze the comparison. The task builds the existing debug CLI offline and verifies its evaluation harness before inference. The final `task eval:file:checks` passed seven behavior checks, including changed pinned inputs, holdout tuning, modified protected bytes, reordered/missing row IDs, changed references, incomplete durable results and reuse of one run across variants.

All three sequential real variants and the final retained-artifact verifier exited 0. The selected corpus source/reference files passed their pinned hashes. Each variant committed 10/10 blocks in a distinct Translate SQLite database, produced a separate structurally validated SRT, retained the original, refused an existing output, and re-exported identical bytes after the model server stopped. Every result remains `needs_review`.

## Identity and observed outcomes

- Model: Hy-MT2-1.8B Q4_K_M, SHA-256 `dc5f44fcf1fa496ee7ad725982c0c8c553a4de00259b53af84c4b89fb0c06699`.
- Runtime build reported by checked preflight: `b10977-0ecb159c9`; the same local executable path was used throughout.
- Observed GPU: NVIDIA GeForce RTX 3070, 8192 MiB, driver 595.79. Requested offload layers: 99. This record does not establish a supported GPU package or minimum hardware profile.
- Matrix SHA-256: `6f356a61b1c6c353d8c2926a9b58d6ffd83928818831e8a9789205d9d361735e`.
- Shared synthetic SRT source SHA-256: `21e1d7c20f9f29f3c8d3df609a29efe5ad787b9532158418d7fe5f8de1490989`.
- Local combined JSON report SHA-256: `52f31d17146a51a2e573fad25ed24ec9308cfe0d4ab804fbd30e42e1f977f3f9`.

| Variant | Prompt / temperature | Run ID | Profile SHA-256 | Output SHA-256 | Translation wall time |
| --- | --- | --- | --- | --- | --- |
| `plain-sampling` | v1 / 0.7 | `409198e3-0cb3-4f8e-bf2a-c5767a2b4c43` | `f34cf5b2ed3cc3722364810d02235114aa13f3afd88fbb8c4e144b16163f9e0a` | `adacc1af0e6354ddba39868bb7b462af298cd5eadf8a570ea34b2738941bb1ad` | 80,039 ms |
| `plain-greedy` | v1 / 0 | `815f9973-3704-4060-bd21-d62befbf1311` | `7734c8cb265bfc6df15c075c8138f1301bc3bcfa783a2deb1fd4a52689d83f65` | `5431eed01b1d222c493400e3deac299fe2f8522bcdb6da9b0028a9e40d7a89ba` | 79,513 ms |
| `json-greedy` | v3 / 0 | `77e09c58-0661-46d9-b9f8-4443a3bb245c` | `8b1114e430d1c690321d47acd71c1d509434f60f47e66e42d6882f64bf22c4c9` | `addfb029a25cdd40f892ea4f0579762af917a087e27feea3d1979c1988e433a1` | 79,470 ms |

Each variant had zero heuristic warnings and zero normalized exact-reference matches out of ten. Exact equality is not an adequacy metric. Compared with this run's sampling candidate, eight greedy plain-text candidates and all ten JSON candidates differed textually; these counts do not identify improvements. Wall times include checked model hashing and durable persistence in a debug build; they are not model-only throughput or release-SLA measurements.

## Quality triage

Initial automated inspection records these review leads, without representing a human bilingual score:

- The sampling and greedy plain-text candidates retain the same Russian case error in row 401 and agreement error in row 601. Reducing temperature did not remove these observed defects.
- The JSON candidate improves the case construction in row 401 but retains the agreement problem in row 601.
- In row 501, plain-text candidates retain a Latin origami term and awkward Russian wording. The JSON candidate instead uses a calligraphy term, diverging from the source's paper-folding meaning. Better surface grammar does not establish adequate translation.
- Row 101 needs terminology review across all three variants. Rows 601 and 901 still require adjudication of the previously recorded source/reference discrepancies.
- Row 1 now uses the inkjet-printing term in all three candidates, while the earlier file probe raised a different rendering. There is only one run per variant here; stochastic reliability is not measured.

The combined report records `quality_verdict: unreviewed` and `winner: null`. These observations do not justify silently replacing the desktop's frozen profile. The existing production configuration and old run fingerprints remain unchanged. Further work is reviewed scene evaluation and comparison with the other model/quantization candidates in the product plan, using explicitly supplied or user-installed weights.

## Local artifacts and limits

The local comparison root is `.cache/eval/profile-runs/flores-dev-FQBE8n/`. It contains derived profile manifests, the original frozen matrix, `comparison.json`, `comparison.md`, progress records, and a workspace per variant with source/reference/candidate files, complete reports, attribution, model/CLI logs and durable state. Full FLORES text and the CC BY-SA 4.0 synthetic adaptation remain in ignored storage; tracked documentation contains aggregate observations only. No model or dataset was downloaded or published by these tasks.

The reusable file runner is shared with `task eval:cli:flores:file`; it now retains exact profile bytes and logs all CLI invocations, including failed ones. Failed variants remain in report denominators, cannot supply an accepted candidate, and make the matrix task exit nonzero. The artifact verifier additionally confirms official selected row text/reference/provenance, reconstructed source/reference files, unique run identities and immutable output/profile hashes. It does not rescore language or replay structural parsing.

Long-file behavior, context/glossary adherence, multiple models, human subtitle review, clean offline installation and language release gates remain open. `task docs:check` verifies local documentation links; no linguistic gate is closed by those checks.
