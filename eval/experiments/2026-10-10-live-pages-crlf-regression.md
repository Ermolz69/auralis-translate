# REG-086: Windows checkout line endings in the live Pages gate

On 10 October 2026, `task site:live:check` in the clean primary Windows
`main` checkout failed for both pages after the Pages workflow for `22b0a3a`
succeeded. The private failed report is retained at
`E:/Anything/Projects/Commercial/auralis-translate/.cache/eval/live-pages-check/attempt-49cf5de0-cca4-4f95-a8bf-c825e83c6405/report.json`.
The local `index.html` was 120,448 bytes while the deployed copy was 120,342;
the local `history.html` was 1,192,482 bytes while the deployed copy was
1,192,072. The same task passed in the clean feature worktree, whose local
files matched the published 120,342/1,192,072-byte Git blobs. The primary
checkout has `core.autocrlf=true`. This is a **false publication failure**
caused by comparing platform-expanded working files with published Git blobs;
it is not a difference in page content.

Minimal reproduction: on a Windows checkout of this revision with CRLF page
files, run `task site:live:check`. The original checker reports both files
different even though `git cat-file -s HEAD:site/index.html` is 120,342 and
the deployed file is the same size/hash. The repair reads the two committed
blobs with `git show HEAD:site/<name>`, rejects any staged/unstaged page
content changes and compares the live bytes to those blobs.

Permanent controls in `task site:committed-bytes:test` cover both HTML pages,
synthetic CRLF working bytes, the two-page path allowlist and a clean HEAD
content check. `task site:live:check` runs them before network comparison.
Historical v2 reports remain unmodified; new checks use schema v3 with
`committed_bytes`/`committed_sha256` so the compared identity is explicit.
Before this fix was committed, the new `task site:live:check` passed in the
feature worktree against published revision `22b0a3a`: both files returned
HTTP 200 and exact committed SHA-256 values
`a0306f8e8a4cfb5beb98d5611d5bec09cffa178bc747c052cdf7ae99c9ce705b`
and `a4ec3d6408dd4abfc677febfa3559bd8716c425dcd5af81347c3dfe7621a5482`.
The private v3 report is retained under
`.cache/eval/live-pages-check/attempt-7ea942b3-9d0e-41a7-b07d-402b513719bb/report.json`.

The regression is about report verification only. Translation v8, source
files, model outputs and private evidence are unchanged.
