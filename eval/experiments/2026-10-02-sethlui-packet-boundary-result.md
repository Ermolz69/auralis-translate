# Retained restaurant audio packet boundary regression

Date: 2 October 2026. Partial `VOICE-03`/`VOICE-07` engineering evidence.
The separate Auralis `feat/real-tts-pilot` worktree at local commit `02eed75`
adds a Taskfile check for the already generated 12:18 restaurant MKV. The
[public aggregate](../reports/2026-10-02-sethlui-packet-boundary-summary.json)
pins its media and FFprobe hashes; the private MKV, Chinese/Russian SRT, 263
real SAPI WAVs and earlier full-playback result were not modified.

The old check measured only gaps between adjacent audio packets. A fixture
with a 500-ms delayed first packet returned zero from that old measure. The
new check also tests the beginning and end of the track, preroll, overlap,
timestamp order and positive duration. An optional FFprobe CSV side-data field
exposed a parser rejection during the first permitted probe; it now has a
minimal regression and missing/nonnumeric negative controls. The initial
sandbox attempt failed at `spawn EPERM` before FFprobe ran. Both failures are
retained in local Auralis `docs/voice/034-packet-boundary-regression-plan.md`
and `docs/voice/035-packet-boundary-regression-result.md`; the branch is not
published to the private Auralis remote.

The final `task voice:natural:sethlui:media:packet:check` passed 11 fixture
tests and the read-only pinned FFprobe check: 36,904 packets, -7-ms first PTS,
738,057-ms final packet end versus 738,056-ms source duration, 1-ms maximum
internal gap, 1-ms maximum overlap, 7-ms codec preroll and 1-ms overshoot.
No TTS, model, remux or playback request occurred. Auralis `task docs:check`
passed. Repository-wide `task docs:lint` found two existing findings in
`docs/voice/011` and `012`; `task q:format-check` found 13 existing files,
none changed in this slice. Neither broad check passed; their findings are
retained and should be addressed separately.

This confirms packet continuity only. The earlier 256/263 cue overruns and
236 speech-start overlaps still fail fit. Source speech alignment and rights,
reviewed spoken text, sound listening and A1–A6 remain open. There is no
independent Chinese–Russian score or human audio verdict.

## Public report verification

Translate commit `95ea0ce07e4a93f6041999dbc614b224ad31616c` updated the
current report, retained the history page and passed `task plan:check`,
`task docs:check`, `task site:build` and `task site:check`. The
[Pages workflow](https://github.com/Ermolz69/auralis-translate/actions/runs/37021285846)
completed successfully for that exact commit. Downloaded live
[`index.html`](https://ermolz69.github.io/auralis-translate/?revision=95ea0ce07e4a93f6041999dbc614b224ad31616c)
matched local SHA-256
`e6549c8cb4e553af7c8a34fa2d2e5a893e6722b2cc870967b967be46557d69a6`;
live [`history.html`](https://ermolz69.github.io/auralis-translate/history.html?revision=95ea0ce07e4a93f6041999dbc614b224ad31616c)
matched local SHA-256
`fb2c3fb5a71a74a82f2ac36ebf4e095f420b3d245eb7504f7d77ef25dcddd735`.
The historical measurement corpus was retained; its generated task-progress
snapshot now includes the new partial voice evidence.
