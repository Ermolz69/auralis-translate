# Restaurant stream: mapped 263-cue technical candidate

Date: 1 October 2026. Backlog: partial `DATA-03`, `DATA-05` and `EVAL-04`.
This is a technical source inspection, **not** source admission or language
evaluation. The bounded [plan](2026-10-01-sethlui-media-acquisition-plan.md)
and one-GET command were committed at `2083eb0` before acquisition; the
hash-pinned local stream and derivation command was committed at `d85e76b`
before running FFprobe. No model, TTS, reference or human review was used.

`task eval:data:commons:sethlui:media:acquire` used one Commons videoinfo GET
and one 426x240 VP9/Opus derivative GET, both HTTP 200, without retry. The
2,461-byte raw API reply has SHA-256
`b7e6c5de2ea4580e63bd679b8095e03a20f552c6b77d21060f3e8f978e00c0cb`.
The 29,634,438-byte media has SHA-256
`6e29f1512a76f553bdfc1678f458a69cf010e4653ac3f1cdfc4c45742bfb39d6`;
the acquisition record has SHA-256
`63dbde64f502e06021a5edf635168a4c14d2a6344bb62569116e0b4e007dd1af`.
The original 17,618-byte Chinese SRT remains immutable at SHA-256
`077aef6a49aa7128f5ddd349f38ffc84dd669f5e4bbfae6d692efa2d78304967`.
The requests ran from 07:30:14.615 to 07:30:16.527 UTC (1,912 ms total).
Raw media, API metadata and acquisition report are retained privately under
ignored `.cache/eval/commons-sethlui-media/media-86cd634d-fa4e-43eb-ba4b-472b4bf5c9e1/`.

The first `task eval:data:commons:sethlui:media:derive` attempt was stopped by
local sandbox `spawn EPERM`, before FFprobe ran. Its failed derivation record
remains at `derived-e85e4edf-0edb-45d7-98b2-43e719fa6155/derivation.json`,
SHA-256 `b46496042a63fba1df5e5859b395b520200fdd261ca8b82a0cdc7671abea569b`.
The same pinned local command, rerun with process permission and no network
request, succeeded. FFprobe executable SHA-256 was
`9df3b0b5275e830961df6d94e1f7a71121a7abd5ff708e9fec8a0b6084a55015`;
its raw JSON output SHA-256 was
`a206b4aefa295821991c0d291dbd1f078178424f76ecc8922bc8a90d8092a6a8`.
It found **738,056 ms** of 426x240 VP9 video and 48 kHz stereo Opus audio.
This confirms the approximate 12:18 duration listed on Commons using the
actual downloaded stream. It does not show what language is spoken.

All 271 original SRT cues were mapped in original order. Cue 263 ends at
732,900 ms, within the stream by 5,156 ms. Cue 264 starts at 840,100 ms,
102,044 ms after the stream ends; cues 264–271 all overrun it. The derivation
kept the original text, IDs and timing of cues 1–263 byte for byte apart from
the final newline, and retained an explicit SHA-256 per source block plus
eight excluded IDs in the private mapping. The new 263-cue SRT SHA-256 is
`4777e11caa115e893f2328c2a33c25a76c7391ace8ecf0ac4b9436635fc27964`.
The derivation report SHA-256 is
`da63dec61c03ccbfcc307aa028e9499b8ba9a65de41c1df6b0daab5a629a9a4f`.
`task inspect -- .cache/eval/commons-sethlui-media/derived-1e655c9c-f93e-4b03-938c-f2510640fa2b/source.zh.srt`
accepted 263 strict SRT cues. The original 271-cue source was never replaced.

`task eval:data:commons:sethlui:candidate:stage` made a second private,
hash-identical copy for the [source inventory](../corpora/commons-sethlui-candidate-v1.json).
`task eval:data:commons:sethlui:candidate:check` verified its original-prefix
mapping, eight exclusions, source/media hashes, inventory bytes and 263 strict
CLI cues. Its first sandboxed CLI child process also got `spawnSync EPERM`;
the permitted rerun passed with no source changes. Across all registered
sources there are now **10 technical candidates, 2,113 inspected cues and zero
eligible cues**. The 263-cue derivative is unassigned; rights for subtitle,
reference and audio remain unknown. The imported caption's authorship and
license, actual Chinese speech/alignment, scene and speaker boundaries,
independent bilingual reference, human listening and any Russian translation
remain unverified. It cannot serve as an approved voice script or a sealed
holdout. `REG-039` continues to reject the complete original and its
boundary controls; the derivative does not erase that failure.
