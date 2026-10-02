# VOA Mandarin original-caption screen

Status: unsuccessful `DATA-03` source discovery, 2 October 2026. The
[predeclared inventory](2026-10-02-voa-mandarin-caption-inventory-plan.md)
screened two Commons public-domain-marked Mandarin videos against their
original YouTube IDs. This did not acquire a subtitle track or add eligible
cues. The [source-free public summary](../reports/voa-mandarin-caption-inventory-2026-10-02.json)
binds the two private raw reports and extractor outputs by SHA-256.

The first `task eval:data:voa:captions:inventory` invocation failed before
network access: both child launches returned sandbox `spawn EPERM`. Its
private report SHA-256 is
`59c56cbf334b8940dd92fb1f4f1e698e23c593644999a3c4495d1f0d01ac0dcd`.
The same frozen command under permitted process execution made two sequential
metadata-only requests from 15:32:58.175 to 15:33:04.236 UTC. Its private
report SHA-256 is
`7ff794ac883773782742ade6964936aba89152ce617a78f02c76d2dc85bcee82`.
Both extractor calls exited zero without timeout, stderr, media download or
retry. The pinned `yt-dlp` SHA-256 is
`52fe3c26dcf71fbdc85b528589020bb0b8e383155cfa81b64dd447bbe35e24b8`.

| Source | Commons duration → original metadata | Manual Chinese subtitle tracks | Automatic Chinese caption tracks | Raw metadata SHA-256 |
| --- | ---: | ---: | ---: | --- |
| [VOA discussion](https://commons.wikimedia.org/wiki/File:%E6%97%B6%E4%BA%8B%E5%A4%A7%E5%AE%B6%E8%B0%88_%E9%80%8F%E8%A7%86%E4%B8%AD%E5%9B%BD%E7%BD%91%E7%BB%9C%E4%B8%8A%E7%9A%84%E2%80%9C%E8%86%9C%E8%9B%A4%E6%96%87%E5%8C%96%E2%80%9D.webm) | 1204.937 → 1205 s | 0 | 0 | `09909d1fa1eb69b2a71d4fa6e6228c897cd98b9f3b2bae9fd73408073ee6c29f` |
| [VOA report](https://commons.wikimedia.org/wiki/File:1-5%E3%80%90%E5%A6%96%E5%A6%96%E9%85%B1%E7%9C%8B%E5%8F%B0%E6%B9%BE%E5%A4%A7%E9%80%89%E3%80%91%E2%80%9C%E6%8E%A2%E7%A7%98%E2%80%9D%E6%B0%91%E8%BF%9B%E5%85%9A%E3%80%81%E5%9B%BD%E6%B0%91%E5%85%9A%E5%85%9A%E9%83%A8.webm) | 655.941 → 656 s | 0 | 0 | `967b1dab56c40069cbf9fe29f25663476da0a8b724d037e01cfc0fbdd48a29df` |

The extractor returned no subtitle or automatic-caption language entries of
any kind for either original video. The nearly matching duration is a useful
media identity check, not proof of caption or speech alignment. The Commons
video rights label does not transfer to nonexistent or future subtitle text.
No human heard these sources in this screen; their source-audio language and
third-party inclusions were not independently rechecked. Candidate status is
`rejected_no_chinese_subtitle_track`, with zero eligible cues. The prior
11-track/10-media-group/3,243-inspected-cue inventory is unchanged.

`task eval:data:voa:captions:preflight` and the permitted
`task eval:data:voa:captions:inventory` passed;
`task eval:data:voa:captions:check` verified both retained attempts and the
redacted report offline. The failed first invocation remains retained. Next
source discovery should require an actual Chinese subtitle listing before
media transfer or release admission. The independent Chinese/Russian reviewer
and real audio listener are still unavailable by owner decision against
volunteer recruitment.
