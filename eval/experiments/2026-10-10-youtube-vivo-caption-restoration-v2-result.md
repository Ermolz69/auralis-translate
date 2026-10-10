# Vivo original Chinese caption restored to a separate private attempt

Date: 10 October 2026. Partial `DATA-03` result under the committed
[one-attempt plan](2026-10-10-youtube-vivo-caption-restoration-v2-plan.md)
at `dd6fe6a505a81dba61d2d637e5dc02e6a5ea7479`. This repairs an evidence
availability gap, not a translation, speech-alignment or rights decision.

The selected [Geekerwan YouTube interview](https://www.youtube.com/watch?v=_G4e2p1p-is)
is still the complete 18:35.570 Vivo/MediaTek scene. The pinned local
`yt-dlp` binary SHA-256 was
`52fe3c26dcf71fbdc85b528589020bb0b8e383155cfa81b64dd447bbe35e24b8`.
The one metadata invocation ran for 6,066 ms, returned 75,758 bytes at
SHA-256 `f2e7918717e57c404873b03488d50ad54a8e1ed7015eedbac615a82a7680d6de`,
and again listed one regular `zh-CN` SRT, no automatic Chinese caption,
the creator channel, 1,116-second rounded duration and the creator's CC
Attribution video-license field. These are source metadata, not proof of
manual transcription or separate text/audio rights.

One subsequent HTTPS caption GET returned HTTP 200, content type
`text/plain; charset=UTF-8`, 33,577 bytes in 300 ms. Its SHA-256 is
`b100803367b95fa55fc638b1ff39a0abfa0d5b8183ebe58d58b1a87242d9d8c4`:
**byte-identical to the previously acquired YouTube SRT**. `task inspect`
accepted 467 strict cues. A read-only comparison found all 467 cue texts
identical to the retained Commons SRT; exactly eight timing rows differ,
each by no more than 1 ms, matching the published v1 machine report. The
first cue starts at 100 ms, the last ends at 1,114,463 ms, and no cue ends
after the pinned 1,115,570-ms WebM. The [source-free machine report](../reports/2026-10-10-youtube-vivo-caption-restoration-v2.json)
is SHA-256 `f11fbd64c634f1c814087ed5790258912d0e5b0aec54b62213a596f1f4012834`.
The exact new response and both raw attempts remain only in ignored
`.cache/eval/youtube-vivo-caption-restoration-v2/`. The old missing
`attempt-LQWxgw` was neither rewritten nor silently recreated.

## Harness failure and correction

The caption task wrote the exact HTTP 200 response and durable acquisition
record, then exited **9** on Windows with a libuv assertion after the new
runner called `process.exit()` while fetch handles were closing. This is
[REG-084](../regressions/reg-084-youtube-caption-fetch-exit-v1.json).
The versioned machine index is [catalog v60](../regressions/catalog-v60.json);
catalog v59 and every prior source result remain unchanged.
No second caption request was made. The runner now returns from its async
entry point; the read-only report and `task
eval:data:youtube:vivo:restore:check SOURCE_ROOT=E:\Anything\Projects\Commercial\auralis-translate`
exited 0 using the saved response. Three bounded-fetch controls cover a
complete HTTP 200 body, an unfollowed redirect and an oversize response;
three version controls cover exact bytes, timing changes and changed/missing
text. The fixed fetch exit has not been replayed against a new external
caption request because the one-request budget is exhausted.

## Decision

The original-platform SRT is again available for new private diagnostics
under this v2 attempt. Historical checks hardcoded to the missing v1 attempt
still cannot be called freshly passed, and the old private three-window ASR
raw JSON is still missing. The prior start/middle/end ASR interpretation is
historical evidence only. No person listened to or verified the Chinese
words, timing or speakers today. Caption authorship, soundtrack rights and
the Commons license review remain open. This source has **zero admitted
development or holdout cues** and cannot authorize public dubbed media.
Next, independently recheck the three audio windows against this exact
source under a new frozen ASR identity, then obtain a Chinese-language
listening decision and a separate rights decision. Product v8, all accepted
translations and TTS artifacts are unchanged. Rollback is to retain the
prior Commons SRT/WebM and v1 public report while ignoring this new private
YouTube attempt; preserve both successful bytes and the exit-9 failure.
