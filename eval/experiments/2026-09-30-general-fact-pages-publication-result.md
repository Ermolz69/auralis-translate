# Failed fact-reminder comparison published and verified

Date: 30 September 2026. Translate `7ba31c52e9d3c3d64f24d4b657da742e86510557`
added the redacted 28-request 7B source-fact comparison to the existing
<https://ermolz69.github.io/auralis-translate/> report. The
[Pages workflow](https://github.com/Ermolz69/auralis-translate/actions/runs/36694753480)
completed successfully for that exact commit. `task site:build` generated
1,034,638 bytes; `task site:check` passed with the prior model, long-file and
real-SAPI measurements retained. `task site:live:check` received HTTP 200 and
found live/local HTML byte-identical, SHA-256
`7cf374f4b04833c47d706411b584f2a87cefa1412d9f8129a9f422fda4ffdf05`.
The private live-check report at
`.cache/eval/live-pages-check/attempt-540dabfd-6b9b-41d6-9a13-1f7824c658c4/report.json`
has SHA-256 `b4d320a38ee9753e16a5bd85e9de17a98f7314ee5cfc21d3769aeec446d43192`.

The page states that the prompt variant was not promoted: it retained 28/28
structural slots but did not repair the critical natural Vivo fact windows,
while adding 1,568 prompt tokens. It distinguishes AI source-aware triage from
zero independent Chinese–Russian reviews and links only the redacted report.
No Chinese source text, raw model reply, private audio/video or reviewer packet
was published. This confirms deployment, not translation or audio release.
