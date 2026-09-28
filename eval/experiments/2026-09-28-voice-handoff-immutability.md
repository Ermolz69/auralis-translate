# Verified voice-handoff boundary

Status: partial engineering evidence for `VOICE-01`, 28 September 2026. The
Auralis branch `feat/real-tts-pilot` has local commits `13c9df7` and `6e093aa`.
Neither a reviewed spoken script nor A1–A6 is accepted by this record.

## Reproduction and correction

At Auralis parent `bc71330`, any application caller could construct or mutate
`VerifiedTranslationHistory` and `PreparedSpokenScript` through public fields.
That bypassed the intended history verifier or changed a cue after validation.
Commit `13c9df7` makes history construction local to the translation module,
with only the verifier using it in production. A synthetic constructor exists
only in application unit tests. Prepared script fields are private, with
read-only accessors for result, source, review, cue and transcript lineage.

The moved handoff regression checks a selected result and immutable lineage.
Negative controls reject no selected result, a different selected result, a
changed output digest, missing, reordered and duplicate cues, changed spoken
text without an adaptation review, an invalid evidence digest and a second
voice. Eight historical edit tests still cover frozen bases, selection,
concurrent branches and recovery. These are synthetic engineering controls;
they do not verify the claimed human reviewer or spoken meaning.

The first full Auralis workspace run stopped because the checkout lacked
packaged media binaries. `task media:prepare` downloaded and verified pinned
FFmpeg/ffprobe 8.1.2 and yt-dlp 2026.08.19. It needed an unsandboxed retry
because the sandbox returned `EPERM` while executing FFmpeg for version
verification. The next full run exposed a stale Auralis adapter assertion:
it expected Translate SQLite schema 5 while the pinned Translate submodule
defines schema 6. Commit `6e093aa` updates that existing minimal test and adds
a reopen-and-original-bytes control. No source subtitle was changed.

## Verification

- `task voice:handoff:check`: passed, 3 handoff and 8 historical edit tests.
- `task voice:handoff:lint`: passed with warnings denied.
- `task rs:fmt`: passed.
- `task docs:check`: passed, 5 script tests and 32 Markdown files. The first
  sandboxed attempt returned Node spawn `EPERM`; the unsandboxed retry passed.
- `task media:prepare`: pinned tools prepared and verified after the sandbox
  execution error.
- `task rs:test`: full Auralis workspace passed after the schema assertion
  correction. Real SAPI and installed-model tests marked `ignored` by that
  command are not counted as passing real-media checks.
- `task rs:clippy`: full workspace passed with warnings denied before the
  final extra selected-result negative control; the affected application
  lint and tests passed again afterward.

The separate real Microsoft Irina Desktop SAPI probe produced 22.05 kHz mono
PCM WAV. Its two measured utterances lasted 3,144 ms and 2,069 ms against
2,400 ms and 1,900 ms cue windows, exceeding them by 744 ms and 169 ms. This
is a fit failure, with no human listening or final-media playback recorded.

`VOICE-01` remains open: a real independent review identity and evidence,
durable managed script, and worker re-verification before synthesis are still
required. The source and speaker decisions need rights and reviewer evidence.
