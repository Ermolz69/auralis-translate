# NAME-02 and TERM-02 integration audit

Date: 3 October 2026. This audit integrates two bounded outcomes while keeping
the product translation profile at v8. It does not accept name/term quality,
independent language review, a natural long file or RELEASE-05.

## Inputs and conflict resolution

- TERM-02 was based on `76b0dbd` and published as a fast-forward through
  `e599ad3`. Its four commits, original catalog v43, failed candidate report,
  120 raw paired replies and earlier measurements remain unchanged.
- NAME-02 local branch `feat/name-action-review` (`26aae72`, `6c2e265`,
  `bc3075c`) was based on older `9173efd` and repeated NAME-01 files. A trial
  merge into an isolated checkout exposed conflicts in those repeated files,
  generated pages and catalog v43; it was aborted without modifying the dirty
  shared checkout. Only the NAME-02 delta relative to the published NAME-01
  implementation was transferred and retested. The integrated code commit is
  `855a723`.
- Both branches independently used catalog version 43. The published TERM-02
  `catalog-v43.json` and original v42 are preserved byte-for-byte. The
  [combined v44](../regressions/catalog-v44.json) adds NAME-02's REG-063
  admission outcome after TERM-02's REG-062 outcome; its checker verifies the
  base byte hash, pack/trace hashes, zero new name-model calls and zero human
  ratings. NAME's unpublished v43 remains in its local branch and frozen
  report; its content is represented by the new v44 entry, not substituted for
  TERM's already published v43.

## Observed validation

- `task eval:regression:reg062:check` passed in the clean TERM-02 checkout with
  `AURALIS_TERM_ASSET_ROOT` pointing to the existing read-only local model and
  runtime cache: 9 scope tests, 120 retained chats, 240 preflights, rejected
  candidate and v43 verified. An initial check without that asset-root setting
  failed before evidence validation because the isolated checkout had no GGUF;
  no model call was repeated.
- `task test:name-action` passed 4 provider and 2 CLI tests in the integration
  checkout. `task name-registry:check` passed formatting, Clippy and the full
  workspace test command; three existing private ASUS tests stayed ignored.
- `task eval:name-action:check` passed after copying three exact ignored private
  evidence files into the isolated cache: all nine frozen error chains, 33/33
  proposal refusals, nine historical no-name request pairs, 20 deterministic
  controls, no inference and v44. The original cache files were read and copied,
  never changed. This replay does not assess new translation quality.
- `task eval:regression:catalog:recent:check` passed v41-v44; `task plan:check`
  passed 53 tasks and six document identities; `task docs:check` passed 426
  Markdown files; `task site:build` and `task site:check` passed with both
  current and historical pages. Full archive catalog validation still requires
  the old private v19 journal in this isolated checkout and is not claimed.

No new translation inference, natural full-file run, independent Chinese-Russian
judgment, audio listening or clean-install validation occurred during integration.
The shared checkout's unrelated `014` change, original subtitle/media files,
registry revisions, prior accepted results and both failed experiment journals
remain untouched.

Publication follow-up: `e599ad3..b893b80` fast-forwarded `main` without
force. [Pages run 37116109512](https://github.com/Ermolz69/auralis-translate/actions/runs/37116109512)
completed successfully for `b893b8007727a2ce219151d9cfb33508a06682df`.
`task site:live:check` confirmed byte-identical published pages: current
`index.html` SHA-256
`f1477b6756f64d8fa72c2d2563cf0a70e616ca937e649683d75fdcc0b22cbfcc`
(58,976 bytes) and historical `history.html` SHA-256
`4efa4e5655f3cf90de52d6a66673d459443591e2c2a2ba5fd45a011e5f7b5afb`
(1,187,833 bytes). This confirms publication only, not translation or audio
acceptance.

## Rollback

For usable new translations, keep the unchanged pinned v8 profile and start a
fresh run. Do not combine another profile with an existing checkpoint identity.
The guarded NAME profile refuses active proposals before checkpoint; the TERM
candidate is evaluation-only. To remove the integrated NAME code, revert its
scoped commit in a new reviewed change while retaining these evidence files and
history. The SQLite v10 registry needs a compatible binary; an older binary
requires a verified compatible database backup, never a destructive downgrade
of a user database. No user data was migrated by this integration.
