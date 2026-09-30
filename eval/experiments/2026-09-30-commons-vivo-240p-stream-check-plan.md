# Commons Vivo interview: stream check

Date: 30 September 2026. Task: `DATA-03`. One private 240p WebM acquisition completed at 49,681,853 bytes, SHA-256 `7ad0484b31a6788c31632616649c51e6aaf6cdcdd7d90083d88e1d5ee66e1507`. Its immutable acquisition report is SHA-256 `4f9a277d797e47048bc5fff159f7a3c2e0714af30f83fe224e9b19086ac7d836`. The SRT remains SHA-256 `8c41e66f52000a5b67ab27bfc319accd11d89290b60e50fc5c60f4ee8230a000`.

Run `task eval:data:commons:vivo:media:streams` once after rehashing all three inputs and the pinned FFprobe binary. Limit the local FFprobe child to 30 seconds and 1 MiB of output; retain its exact JSON and a uniquely named success/failure report. Require one VP9 video stream, one Opus audio stream, 426×240 dimensions and 18:35–18:37 duration. This tests container metadata only. Chinese speech, audible alignment, subtitle correctness and rights are still unverified.
