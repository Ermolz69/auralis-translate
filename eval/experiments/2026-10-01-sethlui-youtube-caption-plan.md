# Frozen single YouTube Chinese caption-byte comparison

Date: 1 October 2026. Partial `DATA-03` provenance and source-integrity
evidence, separate from rights or speech alignment. The [one-call YouTube
metadata screen](2026-10-01-sethlui-rights-metadata-plan.md) returned video ID
`yvCR-EqMhng`, SETHLUI.com, upload date 1 March 2026, 738-second duration,
the explicit field `Creative Commons Attribution license (reuse allowed)`,
and one listed `zh-Hans` SRT track. Raw metadata SHA-256 is
`ef0e47700896ec4ea2909ffcfdc12bc4075f6bc301006d86da9f8fda34ad0a8b`
in private `.cache/eval/youtube-sethlui-license/inventory-T8gpxQ/`.
The Commons imported Chinese SRT SHA-256 is
`077aef6a49aa7128f5ddd349f38ffc84dd669f5e4bbfae6d692efa2d78304967`
with 271 cues, eight after the actual stream. Question: do the official
YouTube timed-text bytes match that import, and what cue timing does the
original track provide?

Take exactly one HTTPS GET of the metadata's `zh-Hans` SRT URL, constrained to
`www.youtube.com/api/timedtext`. No video/audio download, no API search,
no retry and no refreshed metadata request under this plan. Use a 30-second
timeout and a 256-KiB streamed response limit. Reject redirects to another
host, changed video ID, non-SRT URL, non-200 status or oversized response.
Save the exact returned bytes, response status/headers needed for diagnosis,
URL hash, start/end times, input metadata hash, failure if any and separate
source hashes under a unique ignored workspace. Keep both YouTube and
Commons originals immutable. Run strict SRT inspection and duration
comparison only after the exact bytes are retained, with another Taskfile
check. Do not use either caption as an eligible language/voice source without
rights, speech-alignment and independent review. No reference or translated
output enters any model prompt.
