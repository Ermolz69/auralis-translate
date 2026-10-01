# Restaurant source audio: three cue-linked windows, unlistened

Date: 1 October 2026. Backlog: partial `DATA-03` and `DATA-05`.
The bounded [plan](2026-10-01-sethlui-audio-window-plan.md) and Taskfile
command were committed at `f5cd14b` before decoding. The inputs were the
immutable 271-cue original, the [measured 263-cue derivative](2026-10-01-sethlui-stream-derivative-result.md)
and the 29,634,438-byte Commons 240p copy. FFmpeg 8.1.2 executable SHA-256
was `ad8f211bc894755e0061c55ab280ae00e8d3d4f15a8cc4372b24cfa247b5942e`.
There was no network, model or retry call.

`task eval:data:commons:sethlui:audio:sample` decoded three fixed 12-second
windows sequentially, from 07:41:26.108 to 07:41:27.228 UTC (1,120 ms for
the command). Each WAV is 384,078 bytes of 16 kHz mono 16-bit PCM with 12,000
ms decoded duration and nonzero samples. `task eval:data:commons:sethlui:audio:check`
rechecked exact packet/source/mapping and clip hashes, cue overlap and the
explicit zero-listener state.

| Window | Source time | Mapped original cues | WAV SHA-256 |
| --- | --- | --- | --- |
| Beginning | 00:08–00:20 | 1–6 | `7d63ed5414f838fc35ea16f7ea829f6184c986f5b784255cf3a5c9a6ad12c95a` |
| Middle | 06:00–06:12 | 123–129 | `351b896351e8c11da0d4de0552d0bb935d61dab156185de330e4c5dcbdd4395f` |
| End | 12:05–12:17 | 260–263 | `9b29dd83e230c0c10f2277daf133ad4c0aacf20dddb584d1095db29700948ac6` |

The private cue-linked packet is
`.cache/eval/commons-sethlui-audio/window-51d40a84-f804-4f5c-8dd3-de108fa20def/review-packet.json`,
SHA-256 `48d643d85fd4209020cbc5ec15bad8eef6029c061689482b36640673f3a3b68a`.
It contains the exact Chinese text overlapping each audio window, the three
WAVs and process/format measurements. No media or subtitle text is committed
or embedded in the public HTML. **Human listening count is zero.** The
existence of nonzero PCM does not verify Chinese speech, caption timing,
speaker identity, rights or intelligibility. The source remains an unassigned
technical candidate with zero eligible cues; no translation or Auralis TTS
was attempted in this audio-window check.
