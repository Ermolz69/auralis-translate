# REG-035 Pages publication check

Date: 1 October 2026. This records publication of the redacted
[signed-measurement regression](2026-10-01-signed-fullwidth-measurement-regression.md),
not a translation or audio acceptance decision. The repository and report
revision was `01ed1cc0383797f26130092c27b53b0d9bea4795` on `main`.

The [GitHub Pages workflow](https://github.com/Ermolz69/auralis-translate/actions/runs/36778483744)
completed successfully for that exact revision. `task site:live:check`
requested the [published report](https://ermolz69.github.io/auralis-translate/?revision=01ed1cc0383797f26130092c27b53b0d9bea4795#measurement-v2)
once and returned `live_byte_identical`: HTTP 200, `text/html; charset=utf-8`,
1,066,172 bytes locally and remotely, and SHA-256
`0d6e976811b549cd751956dc45c01f06f88a67a09b20e32018b91d201a7d5e92`
on both copies. The ignored machine-readable check report is
`.cache/eval/live-pages-check/attempt-c90abac3-32b6-4c51-a9c8-c07ec4e165cb/report.json`,
SHA-256 `588ca4882ce3df3034217714ba4b9bf670566b9d17580687da6335e54216c768`.

The page was then opened in the in-app browser at the same revision and
`#measurement-v2` fragment. The REG-035 heading, explanatory paragraphs,
pack hash and two evidence links rendered. The section states that the check
is review-only, used zero model requests and zero human ratings, and leaves
G3–G5 open. The first release heading still states that translation and voice
have not been accepted. At a 1,280-pixel viewport, the document width was
1,265 pixels, with no horizontal overflow. Earlier model and ASUS result
sections remained present below the new section. The browser inspection is
visual and DOM evidence for this viewport, not a cross-browser or mobile QA
claim.

The REG-035 pack is SHA-256
`dcf3945cfd6fea01b41be5889475bde8eae77315538773d03b6964ee937e5e88`.
The new page does not replace the private 268-cue translation, the retained
audio diagnostic, or the prior measurements. Rights admission, independent
Chinese–Russian review, real listening and clean-Windows verification remain
unmet release dependencies.
