# GitHub Pages check after Vivo media evidence

Date: 30 September 2026. The public report was committed and pushed at `0806055df24d93a06b76d16ba6e8b0e4f205eb4b`. GitHub Actions Pages run `36674190455` completed successfully. The local generated `site/index.html` is 1,017,339 bytes, SHA-256 `0c0b2a63ef54a499f57d87b1264461a1a00f4096d061bff05ce368033cd99ffc`.

Run `task site:live:check` once: fetch `https://ermolz69.github.io/auralis-translate/` with a revision query parameter, one GET, 30-second deadline and 2 MiB body ceiling. Require HTTP 200 and byte-for-byte equality with the local HTML, including the Tailwind CDN, seven-source/zero-admission section, and the new media evidence link. Save the exact live bytes and a unique report under ignored `.cache`; retain a failure without changing the committed site. No media or subtitle source bytes are part of the public HTML.
