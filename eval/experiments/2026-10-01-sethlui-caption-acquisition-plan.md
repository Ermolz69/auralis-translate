# Restaurant interview: pinned Chinese SRT acquisition

Date: 1 October 2026. Backlog: partial `DATA-03`. The earlier
[revision plan](2026-10-01-sethlui-caption-revision-plan.md) was committed at
`8217780` before one Commons API GET. That HTTP 200 response is retained
privately with SHA-256
`f612add78c7924c02a93ef3dd8f9e4f8e6e7cda6e759e69d35db932937de9108`
and inventory-record SHA-256
`679c85a68550ca973a1747a860ae19bc97947663f6f313fa35f1e02db3f5c89d`.
It identifies TimedText revision `1200692574`, edited 20 April 2026 by
`TaronjaSatsuma` with comment “Import Chinese (Simplified) subtitles”; the
API reports 17,618 page bytes. This is edit provenance, not a determination
of the caption's original author or license.

`task eval:data:commons:sethlui:caption:acquire` makes one HTTPS GET of the
exact `action=raw&oldid=1200692574` TimedText URL, without redirects or
retries, with a 90-second timeout and 256 KiB response cap. It retains every
response, digest and failure under ignored
`.cache/eval/commons-sethlui-caption/caption-*` and never edits the raw bytes.
Then `task inspect -- <private path>` may check strict SRT syntax. A successful
download alone does not admit the source. Chinese speech alignment, mixed
language segments, speaker boundaries, subtitle/media rights and independent
translation reference remain open. No model/TTS call or holdout assignment is
authorized by this plan.
