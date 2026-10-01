# Frozen Paywall source-audio window screen

Date: 1 October 2026. Task: partial `DATA-03`/`DATA-05` and source material
for later `VOICE-01`. The exact 294,354,909-byte OGV derivative SHA-256 is
`1bc2e667d296cfb9d11ebdf4ecfec468e3c6fd2aa969f2f6bbfb3fbe46343fd0`.
FFprobe measured Theora video and 44.1-kHz stereo Vorbis audio, with total
duration 3,888,085 ms. All 880 Chinese SRT cues end by 3,745,164 ms.

Decode exactly three private 20-second 16-kHz mono PCM windows beginning at
300, 1,920 and 3,600 seconds. These cover beginning, middle and end without
selecting samples after inspecting any Russian model output. Run one FFmpeg
process per window with no retry and a 90-second process timeout; cap total
sample bytes at 2 MiB per WAV. Retain command, process exit, WAV SHA-256,
decoded duration and the ordered source cue IDs/text overlapping each window
in an ignored report. Do not edit either original. Stop if a window cannot
decode or lacks overlapping cues. Do not claim Chinese speech: the film's
catalog lists English as its language. Human source-audio listening and
utterance-level cue alignment remain open.
