# Commons candidate strict parser recheck

Date: 29 September 2026. Scope: `DATA-03` technical source evidence only.
The checked Translate parent was `5915d06`; the Taskfile and inspection script
were the only uncommitted code changes during this recheck. No translation,
audio or human review was performed.

`task eval:data:candidates:inspect` first verified all three retained source
SHA-256 values against the [non-admitted inventory](../corpora/commons-inspected-candidates-v1.json),
built the CLI offline, and ran its strict SRT inspector on the exact files.
The checker compared each CLI-reported source hash, ordered internal cue IDs
and cue count with the manifest. Results: Ying 93, Guiyangese 66, train 206;
all three source hashes matched, 365 inspected candidate cues, **0 eligible**
development or holdout cues. Source bytes were neither normalized nor published.

The first sandboxed run built successfully but Node could not start the CLI
child process (`EPERM`). A permitted retry of the same Taskfile command passed
without changing the files, code, or expected counts. The command has a
30-second timeout and 2 MiB output limit per source and prints counts only,
not raw third-party subtitle text.

This check proves parser acceptance and inventory consistency for these exact
bytes. Subtitle/media rights, spoken alignment, scene boundaries, source-aware
Russian references and bilingual review remain unresolved. No candidate was
admitted for model evaluation or a release denominator.
