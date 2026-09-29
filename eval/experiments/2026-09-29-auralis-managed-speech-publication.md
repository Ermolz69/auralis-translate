# Managed real-SAPI speech publication in Auralis

Date: 29 September 2026. Scope: partial `VOICE-01`/`VOICE-02` engineering
evidence. Auralis local branch `feat/real-tts-pilot` has commits
`d962448b7192adb9190a79f75275d6395a69444a` (atomic SQLite journal),
`4b3abcb3f98c6fc36fa43bf8a97926e39136f4bc` (application publication),
`da2081a78af98ec37343e3d6b98e41caac03369b` (voice inventory) and
`326150264242659e321dabb80e2b6b1a75637df1` (retained evidence). The
private Auralis branch has not been pushed. Its full source contract and
results are in `docs/voice/012-managed-speech-publication-contract.md` and
`docs/voice/013-managed-speech-publication-result.md` in that checkout.

The source is an authored two-cue Chinese SRT fixture, SHA-256
`8ffec2c2f00168182e2cc6f379395d58e9f75b436112f0a5b1fd6f29e2b212e8`.
The selected fixture Russian result is SHA-256
`8da0ce497026d9479e05d33596841b235bb4bfcb3ebf2aad766dc51bdd7dbc02`.
The reviewer string and digest are synthetic. No translation model was run in
this probe, so translation prompt/completion tokens, model timing, and
translation quality scores do not apply. No RAM/GPU sampling was captured for
this short TTS probe. These omissions are not zero measurements.

The first real SAPI attempt failed at `SelectVoice` in the restricted process
environment after 3.35 seconds; the [failure record](../reports/2026-09-29-auralis-managed-speech-publication-failure.json)
is retained. A pinned read-only inventory found the requested voice enabled
when process launch was permitted. After recording the cause and expanding the
budget to exactly two attempts, the second attempt used identical source,
voice and PowerShell binary SHA-256
`362a356ce7f0940ec74f73a8fc2c990a2cc24a38a11c90bbd8eca947110ad139`.
It passed in 4.16 seconds. The application reverified selected translation
lineage, captured private SHA-256, copied both files to managed storage,
committed one batch plus two artifacts and outbox entries in one SQLite
transaction, finalized them, and verified ready managed bytes. The fixture's
two databases and managed files were ephemeral; the raw WAVs and manifest were
retained only in an ignored private directory for inspection.

The [machine report](../reports/2026-09-29-auralis-managed-speech-publication.json)
is byte-identical to Auralis evidence (SHA-256
`50234864a6c2bb5da32b913d900566bb75ecab675874b33b6994bac1dab531e0`).
Pinned FFmpeg n8.1.2 independently decoded both mono 22,050 Hz 16-bit PCM
WAVs. The raw hashes equal the earlier private-stage baseline, but these
managed artifact IDs and batch ID are new.

| Cue | Managed WAV SHA-256 | Duration | Source window | Overrun | Clipped samples |
| --- | --- | ---: | ---: | ---: | ---: |
| 1 | `f9798f58368408c0e9f913327057bb33ad00088921f9192a7900afe24c8290c0` | 2,469 ms | 1,000 ms | 1,469 ms | 0 |
| 2 | `6f03946ad2eecc6b4d5e0bf3314b142d6b7fb72703cd03e14179bc803a78daaf` | 2,664 ms | 1,000 ms | 1,664 ms | 0 |

Auralis checks: `task voice:publication:check` passed three SQLite
publication tests, one v10 migration test and six application controls;
`task rs:test:storage`, `task rs:test:application`,
`task voice:publication:lint`, `task rs:fmt`, `task docs:check`,
`task voice:publication:real:preflight` and
`task voice:publication:real:inspect` passed. The broad storage run first
exposed stale v10 assertions and an inaccurate v9 migration fixture; both
were fixed and the full suite rerun. The SAPI preflight is a new regression
guard against the confirmed unavailable-voice failure mode. The failed
sandboxed run remains separate from the successful permitted run.

The selected synthetic result and review are not human approved. Neither cue
fits its source window. No human listening, natural rights-cleared Chinese
source, full media playback, clean-target install, production voice worker or
duration policy was verified here. A1–A6 and the complete `VOICE-01`/`VOICE-02`
tasks remain open. Auralis SQLite advances from v10 to v11; rollback of a
migrated installation requires restoring its pre-migration database backup
with older code, while preserving the v11 database and managed assets for
recovery. Original subtitles and Translate results were not modified.
