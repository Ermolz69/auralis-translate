# Auralis selected-script real-SAPI private stage

Status: `VOICE-01`/`VOICE-02` engineering evidence, not A1–A6 acceptance.
The tested Auralis application commit was
`1a9ce76971794ecad68d67892573eb897dd4f85e` on the local
`feat/real-tts-pilot` branch; a separate evidence commit is `15485b6`.
The Auralis worktree's `docs/voice/009-private-speech-stage-contract.md` and
`docs/voice/010-private-speech-stage-result.md` record the implementation and
exact command. The Auralis branch remains local, so those documents are not
linked from the public report. This Translate record uses a
byte-identical copy of the Auralis machine-readable evidence, SHA-256
`579e31afec34e74d4f61c78755e18ce8524d4e18fd3f48dbf0e3921816b328c5`.
Raw WAVs remain private under the Auralis worktree `.cache` and are not on
GitHub Pages.

The application stage now reverifies the selected ready result and original
source before and after TTS, validates ordered full audio coverage and keeps
generated files in a unique private directory. Three deterministic tests on
temporary Auralis/Translate SQLite files passed: stale selection stops before
an engine call, a real selection change during fixture synthesis discards
generated files, and an extra unmapped output file is rejected. The successful
fixture case closes the stage without leaving files. A production media worker
and selected-result-conditional artifact transaction are still absent.

One predeclared real-SAPI run used an authored two-cue synthetic fixture and
the pinned local PowerShell 7.6.5 runtime SHA-256
`362a356ce7f0940ec74f73a8fc2c990a2cc24a38a11c90bbd8eca947110ad139`.
The source SRT hash was
`8ffec2c2f00168182e2cc6f379395d58e9f75b436112f0a5b1fd6f29e2b212e8`
and selected translation output hash was
`8da0ce497026d9479e05d33596841b235bb4bfcb3ebf2aad766dc51bdd7dbc02`.
The test's reviewer label/digest were synthetic, with no human authorization.
The real test completed in 4.25 seconds with 2/2 WAVs. Pinned FFprobe and
FFmpeg n8.1.2 decoded both mono 22,050 Hz 16-bit PCM files; zero clipped
samples were observed. Durations were 2,469 and 2,664 ms against two 1,000 ms
source windows, over by 1,469 and 1,664 ms. Cue fit therefore **failed**.

The [copied report](../reports/2026-09-29-auralis-private-speech-stage.json)
contains WAV SHA-256 values, FFmpeg/FFprobe binaries, runtime and source hashes,
stage/test hashes, segment IDs and private retention location. It explicitly
records no human listening, no final-media playback and no publication. There
is no basis to select SAPI as the release TTS, infer naturalness or mark any
audio gate passed. The raw clips stay private until redistribution rights are
known.

Auralis checks observed: `task voice:stage:check` passed 3 tests; the ignored
real test was run once by `task voice:stage:real:probe`; `task voice:tts:check`
passed 2 WAV and 3 non-ignored SAPI checks; `task voice:stage:real:inspect`
passed pinned media verification, decoding and an idempotent evidence recheck;
`task voice:handoff:check`, `task voice:handoff:lint`, `task rs:fmt` and
`task docs:check` passed. The first docs check encountered sandbox-only Node
`spawn EPERM`; its permitted retry passed. These checks prove an application
stage and real technical audio generation, not a listened or shippable pilot.

The Auralis submodule was advanced locally to this Translate commit,
`37e7a6714aa85d007986687d6b703658893ae493`, in Auralis commit `4230a53`.
The update initially failed to compile because Auralis still constructed the
old tuple `ProviderError`; after typed error mapping, `task rs:test:translate`
found an obsolete SQLite schema-v6 assertion. The corrected Auralis adapter
passed `task rs:resolve:translate`, `task rs:resolve:application`,
`task rs:test:translate` (15 ordinary tests, two opt-in real tests ignored),
`task voice:stage:check` (3 passed, real probe ignored),
`task voice:handoff:check` (14 passed), `task rs:clippy`, `task rs:fmt` and
`task docs:check`. This pin and fix remain in the local Auralis branch pending
authorization to publish that repository.
