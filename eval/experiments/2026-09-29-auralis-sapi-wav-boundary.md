# Auralis SAPI WAV RIFF-boundary regression

Status: local Auralis `VOICE-02`/`VOICE-07` engineering evidence, 29 September
2026. Implementation is in the isolated `feat/real-tts-pilot` worktree at
`5d8bc07` and result documentation at `4c15290`. The Auralis private branch
has not been pushed; this public record contains no private WAV or script text.

## Confirmed defect

The SAPI WAV duration parser previously scanned chunks after the end of the
RIFF payload declared in the header. Changing only a valid one-second fixture's
declared RIFF size to 12 bytes still returned 1,000 ms. Removing one PCM data
byte while updating both chunk sizes returned 999 ms. The first corrected
`task voice:tts:check` test run observed those two failures against the old
parser; the earliest test attempt had a Rust borrow error in the test helper
and was fixed before the reproduction. The new parser requires an exact RIFF
boundary, complete frame alignment, one `fmt ` chunk and one nonempty `data`
chunk. It accepts a padded non-audio chunk inside the declared RIFF size.

The implementation changed only Auralis's experimental Windows SAPI adapter.
It did not alter Translate runs, prior WAV bytes, model profiles, accepted
translations or publication state.

## Frozen real-audio compatibility check

Before rechecking, the two retained WAVs from the earlier synthetic selected-
script stage were pinned by SHA-256, byte size and prior duration. The
local Auralis plan `docs/voice/011-sapi-wav-riff-boundary.md` describes one
parser invocation, a 30-second budget, zero retries and no new
TTS/model/network request. The commit IDs and commands above identify the
current evidence without implying the private branch is published.

| Retained segment | Bytes | SHA-256 | New parsed duration |
| --- | ---: | --- | ---: |
| 0 | 108,936 | `f9798f58368408c0e9f913327057bb33ad00088921f9192a7900afe24c8290c0` | 2,469 ms |
| 1 | 117,534 | `6f03946ad2eecc6b4d5e0bf3314b142d6b7fb72703cd03e14179bc803a78daaf` | 2,664 ms |

`task voice:tts:retained:wav:check` passed 1/1 with those exact files and
durations. `task voice:tts:check` passed five WAV tests and three other adapter
controls (three real-voice tests remained ignored); `task voice:tts:lint`,
`task rs:fmt` and `task docs:check` passed. The first lint run found an `expect`
in the new test helper, which was removed before the passing run. The first
docs run hit a sandbox `spawn EPERM`; a permitted retry found a broken relative
link, fixed before the final pass. No new synthesis was run for this check.

The two WAVs were created by genuine SAPI in an earlier authored two-cue
fixture, with a synthetic review identity. Their original cue windows were
1,000 ms, so the 2,469/2,664-ms audio still fails fit. No person listened,
and no complete natural media was published or played. This compatibility
recheck does not pass A1–A6, settle speaker/meaning quality or select a voice
engine for release.
