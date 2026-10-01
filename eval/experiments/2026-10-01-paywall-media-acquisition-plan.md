# Frozen Paywall OGV acquisition

Date: 1 October 2026. Task: partial `DATA-03`. The
[one-response metadata plan](2026-10-01-paywall-media-metadata-plan.md)
returned item `PaywallTheBusinessOfScholarshipFinalMovieMastered`, creator
Jason Schmitt, CC BY 4.0, and an OGV derivative named `Paywall The Business
of Scholarship Final Movie Mastered.ogv`. The retained metadata SHA-256 is
`f5948aba883c2e0cfac0ef8a8eef3e4693fac01cc094a8b5e809d7d3908db33c`.
It reports 294,354,909 bytes, MD5 `ca0820d330ff5c55f147c17ce95f5ab4`,
SHA-1 `7f2590d2128823bf144de62f723c672b0fd086c9`, 3,888.09 seconds and
`source=derivative`. The 880-cue Chinese SRT ends at 3,745.164 seconds.

Question: can the exact OGV derivative be retained and verified so cue/video
alignment and a possible later source-subtitle pilot can be checked? Fetch only
that file from the exact Archive item over HTTPS. Allow at most one redirect
to an `archive.org` subdomain, at most two HTTP requests total, no retry,
12-minute timeout and a 320-MiB streamed byte cap. Require HTTP 200,
exact metadata byte count, MD5 and SHA-1; record SHA-256, timing, response
and failure. Keep any failed partial response in ignored private storage.
The original source and any earlier accepted result remain untouched.

No TTS, translation, listener, model or human-quality claim follows from
this acquisition. The full video is English-language speech with Chinese
translated subtitles. It is a development candidate, not an independent
Chinese-speech holdout. Its dialogue/cue alignment and sound require actual
playback. The media is kept private; Pages may link to the source Archive
item with attribution, but must not copy video bytes.
