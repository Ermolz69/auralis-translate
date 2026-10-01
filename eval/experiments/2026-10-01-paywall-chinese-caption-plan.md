# Frozen Paywall Chinese subtitle acquisition

Date: 1 October 2026. Task: partial `DATA-03` source discovery. Question: can
the credited Traditional Chinese subtitle track for *Paywall: The Business of
Scholarship* be retained as exact original bytes for strict inspection and later
matched-media development use?

The [film item's creator and CC BY 4.0 license](https://archive.org/details/PaywallTheBusinessOfScholarshipFinalMovieMastered)
identify Jason Schmitt and English-language source audio. The
[film subtitle repository](https://github.com/paywallthemovie/subtitles) credits
Sau-Chin Chen for the Traditional Chinese track and explicitly licenses the film
and subtitles under CC BY 4.0. Amara returned HTTP 403 to this environment.
The [separate Chinese subtitle repository](https://github.com/SCgeeker/Paywall_CH_Subtitles)
contains a plain YouTube-style SRT, a styled full SRT and an English transcript;
its README repeats CC BY 4.0. Its `master` revision was observed by one
`git ls-remote` read as `4b4ffc0cbafd1d08bc4e0974dbd5454967a4acf9`.
The current paywallthemovie.com website is not relied on for provenance.

Acquire exactly the plain `Paywall The Business of Scholarship CC BY
40.zh-tw.srt` at that Git revision from `raw.githubusercontent.com`. Budget:
one GET, no retry, 45-second timeout, 256-KiB response limit. Require HTTPS,
HTTP 200, valid UTF-8 and a nonempty SRT-like opening. Retain exact response
bytes in an ignored unique workspace, with report times, request identity,
response status, byte count, hash and any failure. No reference, model or TTS
call is part of acquisition. After retention, a separate Taskfile check must
verify the original hash, strict parse, cue count and the video alignment
envelope before any candidate admission.

This is a **development candidate only**. The track translates English speech
into Chinese, so independent Chinese–Russian review and matched-media listening
are still required. It cannot become a sealed holdout after source inspection.
No original subtitle or video bytes will be committed or copied into Pages.
The intended public attribution is film by Jason Schmitt; Chinese subtitles by
Sau-Chin Chen; CC BY 4.0, with links to the source and license and a statement
that the Russian version is a modified derivative. Eligibility and rights for
any redistributed audio export remain separate decisions.
