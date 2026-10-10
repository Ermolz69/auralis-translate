# Translator-only scope v3: published-reference acceptance

Owner direction: 10 October 2026. This supersedes the active acceptance route
in [scope v2](2026-10-10-translation-only-scope-v2.md) after the owner confirmed
that no bilingual reviewer will be recruited. Scope v1/v2 and all measured
results remain historical evidence.

Continue only Auralis Translate's Chinese-to-Russian subtitle path. Do not
change Auralis, TTS, voices or media. Japanese, subtitle-free ASR and desktop UI
remain separate/deferred. Preserve source files, saved outputs, raw attempts,
private licensed material and other worktrees. Product v8 is unchanged.

The new [reference protocol v2](../../docs/evaluation/011-published-reference-review-v2.md)
replaces an unavailable person as the **planned evidence route** for G3–G5.
It retains the 300-cue holdout, 95% adequacy and 98% applicable-term targets,
requires zero unresolved detected critical errors, and counts uncertain cases
against acceptance. Scores based on AI/reference checks are never represented
as independent human ratings. No existing exposed PDF or natural-file draft
becomes holdout or passes a gate by this decision. Published Chinese/Russian
subtitle pairs, exact media versions, rights and source alignment remain to be
found and admitted before a release comparison.

Current cleanup removes only obsolete **future reviewer dependency language**
from active contracts. The former reviewer protocol and historical failed or
unreviewed experiments remain intact. A1–A6 are outside this translator
assignment and unpassed. G1–G9 and RELEASE-05 stay open wherever evidence is
missing; no clean Windows installation is claimed. The next independent work
is source-pair admission and a prospectively frozen reference-based evaluation.

## Cleanup and validation

The working branch started clean. One ignored, obsolete commit-message scratch
file and this checkout's reproducible `target/` build artifacts were removed.
Ignored `.cache/eval/` raw journals, licensed inputs, original media, accepted
results and other attached worktrees were retained. No model or audio run was
started; no product translation behavior changed.

`task plan:check` passed 53 task identities and dependencies. `task docs:check`
passed local links across 529 Markdown files. `task site:build` regenerated
both pages, and `task site:check` passed the current/history evidence and link
checks. The site check's existing audio metadata dependency did not generate
or modify speech. These checks validate the contract/publication update only;
they are not G3–G5 evidence.
