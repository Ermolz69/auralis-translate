# Kirin original-platform caption and bounded media attempts

Date: 2 October 2026. This record closes the bounded caption and media probes
declared in the [caption plan](2026-10-02-kirin-original-caption-probe-plan.md),
[zero-redirect media plan](2026-10-02-kirin-original-media-plan.md) and
[one-redirect follow-up](2026-10-02-kirin-original-media-redirect-plan.md).
The source is a private, unassigned technical candidate. No source admission,
human rating or dubbing claim follows from these observations.

## Chinese subtitle acquisition and strict inspection

- Source identity: original YouTube video `73XUeYRFsZU`; pinned extractor
  metadata stdout SHA-256
  `26e81c23f653efc066b3d9a7ef83da4e76b36252e9508a0eb35a980de682f15b`.
  One `zh-CN` `srt` track was advertised. The exact signed URL was checked by
  hash `d54a1b9f67fbe7087bb528aee1bcf75aecd8e5c7b6f9e3d970842cb80b19d2ec`
  and never published.
- `task eval:data:youtube:kirin:caption:preflight` verified metadata, track
  host/path, video ID and the unchanged Commons SRT. The single caption GET
  under `task eval:data:youtube:kirin:caption:acquire` returned HTTP 200 in
  282 ms with 25,112 bytes. There were no redirects or retries. Original
  response SHA-256:
  `c2a5fa3ae5139fe90b2be0b4b48b10ddd20d9b42103f4dd8401e1426d1b3eae5`.
  The bytes differ from Commons revision `880535591` SRT SHA-256
  `57dfd9feb3bfe6381421c4142820b780af341e195e52ee81d58e8f9f12858feb`.
  The raw source and acquisition report remain ignored/private in
  `.cache/eval/youtube-geekerwan-kirin-original-caption/attempt-QbgkVq/`;
  acquisition report SHA-256:
  `bb7570d9be85b99e8e8f6b4e81c5d26a57b989d1cee5706e287869fa998722d5`.
- The first strict CLI inspection did not start the executable: the local
  sandbox returned `spawnSync ... EPERM`. That failure is retained in
  `strict-inspection/`, report SHA-256
  `0ee004f54b3dd5d9681a9f4c55b3fea823c879d0b4248ba8c85b6bd8c21cfd43`.
  It is an infrastructure failure, not a parser rejection. One elevated
  **offline** retry using the same CLI SHA-256
  `48195b25dda70d08bb23c2e31a75fb665aae84f12e6726c8f72e0c0ea77bbbb8`
  succeeded. Its private `strict-inspection-retry/inspection.json` SHA-256 is
  `90873c7f9206003b42d450f2adffa171394ffbff1b9e6933982059458ca67578`;
  raw CLI stdout SHA-256 is
  `73a29eb703aa6b419034f26c7b6819e6268917f233ac68d1233835cce2654e22`.
- Strict parsing found **343 ordered cues**, first `280–2,800 ms`, last
  `846,960–849,160 ms`, zero cue overlaps. Exactly **39 cues**, beginning
  with cue 305, end after the archived Commons media's measured 761,818 ms;
  none ends after the current original-platform metadata duration 852,000 ms.
  The [redacted caption report](../reports/youtube-geekerwan-kirin-caption-v1.json)
  preserves only timing, counts and hashes. Clock containment supports a
  version distinction; it does not prove spoken Chinese alignment.
- The [new candidate inventory](../corpora/youtube-geekerwan-kirin-original-candidate-v1.json)
  shares `group_id: geekerwan-huawei-kirin-9010-analysis` with the Commons
  version. Its private staging copy has the same source SHA-256. `task
  eval:data:youtube:kirin:candidate:check` passed source-inventory validation
  and strict CLI inspection: 343 candidate cues, **zero eligible**. The
  subtitle, reference and audio rights remain `unknown`; scenes and human
  alignment remain empty. Across 12 technical candidates there are now 3,336
  inspected cues and zero eligible cues.

## Media attempts and retained failures

The original-platform metadata offered format `133` 240p H.264 video-only,
declared 4,126,636 bytes, and format `139` AAC audio-only, declared 5,200,087
bytes. Both requests were limited to 90 seconds and 6 MiB per stream, with
no alternative format or refreshed URL.

1. `task eval:data:youtube:kirin:media:acquire` used zero redirects. The
   first format-133 GET returned **HTTP 302**, zero bytes, after 115 ms.
   The plan required a stop. Format 139 was not requested. Private report
   SHA-256:
   `c937756018622b6ce6b744f2810d7112059467edb4723528073a3b0ee94ceb8a`.
2. A separately declared one-redirect follow-up allowed only an HTTPS
   `*.googlevideo.com/videoplayback` target with unchanged format ID.
   `task eval:data:youtube:kirin:media:redirect:acquire` received **HTTP 403**
   on its first format-133 GET, zero bytes, after 79 ms; there was no
   redirect to follow. Format 139 was not requested. Private report SHA-256:
   `bde2fd18282ed4a42c592f1881462c0ce08863c99265e54e750e2a111d57aa38`.

The [redacted media-failure report](../reports/youtube-geekerwan-kirin-media-failure-v1.json)
pins both outcomes. No current-version original media was acquired or muxed.
No further network request belongs to these experiments. The cause of the
HTTP 302/403 sequence is unknown; neither a stale signature nor a rights
denial is proven. The Commons 12:41.818 video and current 14:12 SRT must not
be presented as one synchronized full source. The Commons 304-cue version
and current 343-cue version remain related unassigned candidates.

## Repeatable checks

`task eval:data:youtube:kirin:caption:check` rehashes the private response,
both strict-inspection attempts and raw CLI output, then rechecks exact cue
coverage with four existing media-boundary controls. `task
eval:data:youtube:kirin:media:failure:check` pins both HTTP reports and verifies
that neither audio nor media was acquired. `task
eval:data:youtube:kirin:candidate:check` passed private-byte, manifest and
strict CLI checks. `task eval:data:check` passes the inventory validator and
four new cross-inventory controls: a related alternate version stays in one
group, a development/holdout split conflict is rejected, duplicate IDs are
rejected and independent groups retain their splits. No check labels a
duration-compatible track as speech-aligned.

The next DATA-03 step is a rights-suitable, version-matched media and subtitle
pair with a private human start/middle/end speech-alignment check. Independent
Chinese–Russian adequacy review and separate Russian TTS listening are still
absent; G3/G4 and A4/A6 remain open. No original subtitle, media or signed
download URL is published.
