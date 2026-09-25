# FLORES-200 auxiliary corpus acquisition

Date: 25 September 2026. Scope: acquisition and integrity verification only. **No model score, bilingual assessment, or subtitle release gate is claimed.**

## Provenance and rights

- Publisher: Meta's [FLORES repository](https://github.com/facebookresearch/flores) and [FLORES-200 README](https://github.com/facebookresearch/flores/blob/main/flores200/README.md).
- Distribution: [official FLORES-200 archive](https://dl.fbaipublicfiles.com/nllb/flores200_dataset.tar.gz). The publisher does not expose a reliable date in the archive URL, so this project identifies the acquired snapshot by SHA-256 rather than assuming a release date.
- Publisher-stated license: [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/). Preserve attribution and ShareAlike obligations for any redistributed derivative data. No corpus text is committed to this repository.
- Local storage: ignored `.cache/eval/flores200_dataset.tar.gz` and `.cache/eval/flores200_dataset/`. The tracked [manifest](../corpora/flores200-archive-b8b0b767.json) contains hashes and counts only.

## Observed acquisition

The official archive returned HTTP 200 and `Content-Length: 25585843`. Its SHA-256 is `b8b0b76783024b85797e5cc75064eb83fc5288b41e9654dabc7be6ae944011f6`. Before extraction, the tar listing contained only regular files and directories under `./flores200_dataset/`; no link or escaping path was observed. Only `README`, both metadata TSV files, and the `zho_Hans`, `zho_Hant`, `jpn_Jpan`, and `rus_Cyrl` `dev`/`devtest` files were extracted into the ignored cache.

The archive README states that each language file and metadata file has the same sentence order within a split. The verifier confirmed **997** sentence rows per language in `dev` and **1012** in `devtest`, with matching metadata rows after the header. It also checked every selected file against the pinned SHA-256 manifest. The command was:

```text
task eval:flores:verify
```

The observed report set `use_scope` to `auxiliary_sentence_comparison_only` and `subtitle_holdout` to `false`. Rust verifier tests cover accepted aligned data, changed bytes, row-count mismatch, and an escaping manifest path. To reproduce from a clean workspace, download the official archive to the ignored `.cache/eval/` path, check its pinned SHA-256 **before** extracting, extract the official `flores200_dataset/` directory under `.cache/eval/`, then run the task. The task will fail if the archive or any of the ten selected files differs from the manifest.

## Evaluation boundary

These are aligned article sentences without subtitle timing, dialogue scenes, cue identity, or a private holdout. Use split plus one-based row number as a stable ID. `dev` may guide model/profile selection; public `devtest` provides a repeatable auxiliary comparison. Neither establishes Chinese or Japanese subtitle support. The [language protocol](../../docs/evaluation/001-open-data-and-language-gates.md) still requires separately licensed timed-text scenes, source-aware Russian references, bilingual review, and the release gates.
