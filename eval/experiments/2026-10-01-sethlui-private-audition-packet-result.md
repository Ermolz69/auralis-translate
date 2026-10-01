# Private same-source audio review packet, without human scores

Date: 1 October 2026. Auralis local `feat/real-tts-pilot` commits `153771c`
and `10427b8` froze and then verified a private packet from the previously
[checked real-SAPI media](2026-10-01-sethlui-real-audio-technical-result.md).
No new translation, SAPI synthesis, mix or full video playback occurred.

Six preselected, nonoverlapping windows cover cue 11 (opening name), cue 35
(thirty dim sum dishes and eight desserts), cue 119 (negation), cues 130/143
(venue name and the worst measured fit), cue 219 (venue name and over 120
wines), and cue 262 (ending name/media tail). They total 110,056 ms of
selected timeline per track and include **49 distinct cues**. Twelve private
48-kHz Opus files pair source audio with the Russian technical mix. A private
HTML page displays corresponding source/candidate cue text alongside separate
audio controls; a review JSON template contains null reviewer and score fields.
This is a sampling aid, not three reviewed 10–20-minute scenes or whole-file
listening.

The one 10,161-ms extraction made 12 FFmpeg transcodes and 12 FFprobe duration
reads under its 180-second budget, with zero model or TTS requests. Its private
report SHA-256 is
`1fb021669a82fa8a8690a19bec8b9ede6de57b1bcffd5cf3371358db686e0351`.
The private packet lives at
`.cache/voice/natural-sethlui-audition-v1/packet-e39a9993-dc95-4722-9bc4-de32b1f1d624`
inside the dedicated Auralis worktree. `task voice:natural:sethlui:audition:check`
independently rehashed the pinned original and Russian SRTs, original and
mixed full media, packet page/form/report and all 12 clips; matched all
49 cue IDs, texts and times; verified each clip duration within 200 ms; and
fully decoded every clip. It passed. The [redacted public JSON](../reports/2026-10-01-sethlui-real-audio-summary.json)
contains only counts and hashes.

**Human bilingual review and listening remain zero.** The source speech may
not align to the Chinese TimedText, the translation contains known role/name
errors, and source/media rights are unsettled. The packet cannot establish
meaning, intelligibility, naturalness or A4/A6. Source, translated draft,
all WAVs and both full media files remain unchanged and private.
