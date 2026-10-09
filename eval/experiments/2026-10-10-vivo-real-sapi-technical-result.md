# Vivo 18:36 real-SAPI technical dubbing pilot

Date: 10 October 2026. This is partial `VOICE-02`/`VOICE-03` evidence in
Auralis local branch `feat/natural-tts-pilot`, not a selected Translate
result or a reviewed audio release. The [matched original-platform Chinese
source](2026-10-10-youtube-vivo-source-recheck.md) has 467 cues, SHA-256
`b100803367b95fa55fc638b1ff39a0abfa0d5b8183ebe58d58b1a87242d9d8c4`.
Its matched private video SHA-256 is
`7ad0484b31a6788c31632616649c51e6aaf6cdcdd7d90083d88e1d5ee66e1507`.
The separate v8/7B Russian `needs_review` draft SHA-256 is
`4451868ea3e7cbb3ed81f3d24b5f85bc61a749168b213c54c88ae552208c4831`.
All raw media, captions, WAVs and mixed output remain ignored and private.
Auralis commits `ca603be`, `4c30495`, `27d66e4`, `c21f80b`, `34ee7f5`,
`925ee06` and `615758c` preserve the frozen plans, real adapters, timeline
regression, independent checkers and result documents in that branch.

One real Microsoft Irina Desktop `ru-RU` SAPI run generated 467/467 WAVs
in 291,942 ms, report SHA-256
`eeb049e1bd3ad4639e0ba4f3aaead95cd7a464c1cda3c534f03f5d6bd7ade7c1`.
Independent WAV decoding found zero clipped samples but **465/467** speech
segments longer than their source cue windows, **464/467** starts before
previous speech ends and a maximum overrun of 8,541 ms. The private analysis
SHA-256 is `5e8680d88bbadbccbd247284db9bacc0583db249137b81ca5b6ae1805dba6de8`.
This fails a usable cue-fit policy.

One predeclared FFmpeg pass mixed all retained WAVs with the version-matched
video. The output Matroska SHA-256 is
`3215003c8b5302f19896d54ffb64a398e15c91eea46b40b010b70f2da08c4bd5`,
52,394,280 bytes; private media report SHA-256
`58a5b64a3f7773cd0eb16b884eec9a768a6066646e21663aaaba1e97b6916135`.
It decodes through 1,116,828 ms with no clipped decoded PCM and at most a
1-ms gap across 55,842 audio packets. The final 1,258 ms of speech extends
beyond the original picture. One full FFplay process pass completed in
1,117,185 ms; its private report SHA-256 is
`5fbcbdedfec08f26dd21c28cbf4e6cbafa61279333ac8e1a05bb4c9ee0ceb5ab`.
The Auralis Taskfile checker independently rehashed the source, all 467
WAVs, speech track, MKV and playback record and reproduced the packet and
fit measurements. The first sandboxed player command failed before launch
with `spawn EPERM`; the separately permitted run used the same media once.

A read-only calculation on those 467 measured WAV durations gives just
**50/467** possible cue fits at up to 1.5× and **175/467** at up to 2×,
after reserving 75 ms. Nearest-rank median required factor is **2.192×**,
p95 **3.699×** and maximum **6.115×**. The private report SHA-256 is
`67cc5fa98e8416b53ac7f1ca4764d40fab4f600dfa494084bc9de5cf0484480a`;
an independent checker recomputed its thresholds and real beginning/middle/end
groups of 156/156/155 cues. The shared old fit helper had hard-coded 89/89/rest
groups; a minimal 467-cue regression and short/uneven controls now prevent
mislabeling a long file. Older ASUS/restaurant measurements remain unchanged.

The draft has known AI-identified source-fact errors; no bilingual person
approved its meaning or spoken script, nobody rated intelligibility or
naturalness, and media/subtitle rights are unresolved. Player execution
cannot replace listening. No A1–A6 or G3–G5 criterion passes from this
technical attempt. Continue v8 for translation, retain every private
artifact, and require reviewed script adaptation before another full TTS
candidate is promoted.
