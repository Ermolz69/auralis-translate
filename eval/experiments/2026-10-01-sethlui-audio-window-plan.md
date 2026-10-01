# Restaurant source-audio review windows: bounded plan

Date: 1 October 2026. Backlog: partial `DATA-03` and `DATA-05`.
The [measured stream](2026-10-01-sethlui-stream-derivative-result.md) and
mapped 263-cue SRT are technical candidates only. This check asks whether
beginning, middle and end windows can be decoded and paired with the exact
source cues for later human speech/alignment review. It does not use ASR or
translate text.

Frozen inputs: 29,634,438-byte 240p media SHA-256
`6e29f1512a76f553bdfc1678f458a69cf010e4653ac3f1cdfc4c45742bfb39d6`,
original 271-cue SRT SHA-256
`077aef6a49aa7128f5ddd349f38ffc84dd669f5e4bbfae6d692efa2d78304967`,
derivation record SHA-256
`da63dec61c03ccbfcc307aa028e9499b8ba9a65de41c1df6b0daab5a629a9a4f`,
and FFmpeg 8.1.2 executable SHA-256
`ad8f211bc894755e0061c55ab280ae00e8d3d4f15a8cc4372b24cfa247b5942e`.
The fixed windows are 8–20 seconds (cues 1–6), 360–372 seconds (cues
123–129), and 725–737 seconds (cues 260–263). These are not a random or
representative sample; they cover file positions and an ending boundary.

`task eval:data:commons:sethlui:audio:sample` runs at most three local FFmpeg
processes, sequentially, 30 seconds each, with no network, model call or
retry. Each creates at most 12 seconds of 16 kHz mono PCM WAV; the task stops
on process error, unexpected WAV format or all-zero audio. Raw clips, source
cue text, hashes, process errors and timestamps remain in ignored
`.cache/eval/commons-sethlui-audio/window-*`. Successful decoding cannot
establish spoken language, caption alignment, speaker identity, rights or
listening quality. No source is admitted on this basis.
