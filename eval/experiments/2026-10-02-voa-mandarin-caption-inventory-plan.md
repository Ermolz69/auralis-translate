# VOA Mandarin caption inventory v1

Status: frozen metadata-only `DATA-03` source screen, 2 October 2026. This
does not admit either source to the release corpus.

Question: do two public-domain-marked Commons Mandarin videos have an original
Chinese subtitle track on their YouTube source? A Commons video license and
language category do not establish subtitle rights, alignment or speech content.

| Video | Commons media | Original platform ID | Commons duration |
| --- | --- | --- | ---: |
| VOA discussion | [Mandarin video](https://commons.wikimedia.org/wiki/File:%E6%97%B6%E4%BA%8B%E5%A4%A7%E5%AE%B6%E8%B0%88_%E9%80%8F%E8%A7%86%E4%B8%AD%E5%9B%BD%E7%BD%91%E7%BB%9C%E4%B8%8A%E7%9A%84%E2%80%9C%E8%86%9C%E8%9B%A4%E6%96%87%E5%8C%96%E2%80%9D.webm) | `_Ok42iFpLpQ` | 1,204.937 s |
| VOA report | [Mandarin video](https://commons.wikimedia.org/wiki/File:1-5%E3%80%90%E5%A6%96%E5%A6%96%E9%85%B1%E7%9C%8B%E5%8F%B0%E6%B9%BE%E5%A4%A7%E9%80%89%E3%80%91%E2%80%9C%E6%8E%A2%E7%A7%98%E2%80%9D%E6%B0%91%E8%BF%9B%E5%85%9A%E3%80%81%E5%9B%BD%E6%B0%91%E5%85%9A%E5%85%9A%E9%83%A8.webm) | `bjWlhc_RpRc` | 655.941 s |

Run `task eval:data:voa:captions:inventory` once, sequentially. The pinned
`yt-dlp` SHA-256 is `52fe3c26dcf71fbdc85b528589020bb0b8e383155cfa81b64dd447bbe35e24b8`.
Use two metadata requests, no media/caption downloads, no retries, at most
90 seconds and 12 MiB of combined output per source (180 seconds / 24 MiB total).
Retain raw stdout, stderr, exit and a summary in a unique ignored attempt
directory, including failures. Do not classify automatic translation as an
original caption or a Commons caption button as an authored subtitle track.

If a manual Chinese track exists, the next separately frozen step may acquire
its exact bytes privately, inspect SRT syntax and timing, compare speech to
captions, and establish independent subtitle-text rights. If only automatic
Chinese captions exist, retain it as an unverified candidate, not a reviewed
source. No model translation, reference text, paid compute or holdout use occurs
in this inventory.
