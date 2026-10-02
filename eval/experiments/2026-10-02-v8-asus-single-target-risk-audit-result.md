# Source-aware AI risk audit of the complete natural 7B draft

Date: 2 October 2026. Frozen source-only [selection plan](2026-10-02-v8-asus-single-target-risk-audit-plan.md);
[source-free audit report](../reports/2026-10-02-v8-asus-single-target-risk-audit.json).
The selector used only the 268-cue Chinese SRT to choose fixed seam
anchors, first/median/last source-risk occurrences and immediate neighbors.
It selected 43 IDs **before** the Russian candidate was viewed. The
private pair record SHA-256 is
`61fc8649fbf1f824acef185cbadc696168b634ec965f39e36720e3205fb33bef`.
Every ID/timing seam was checked structurally by the run checker; this
43-cue reading is a targeted AI assessment, not independent human review
or an estimated corpus-wide error rate.

The AI review found six high-confidence meaning/terminology problems:
cue 3 changes a handheld game device into a tablet; cues 140 and 143
misstate single-core and multi-core performance concepts; cue 215 turns
a comparison across product generations into a spatial orientation;
cue 263 turns a one-action platform support idiom into three presses of
one button; cue 267 renders mouse pads as mouse stands. REG-058 retains
private source/candidate hashes for all six and new authored controls.
Russian grammar/wording also fails at cues 1, 142, 218 and 254. The
source name at cue 265 lacks an approved Russian form; its rendition is
uncertain, not scored as a confirmed error.

The automated scan emitted 54 verbatim digit/Latin-marker warnings in
51 cues. All three digit warnings inspected in context were decimal-locale
or spelled-number variants, not clear amount loss. Many Latin warnings
are translated units. The warning count is diagnostic only and should
not be converted into an error rate. The source-only negation heuristic
has a false positive inside a non-negative word; sampled cues 160 and
262 preserve their less-than and qualified-positive meanings. The
selected numeric windows did not show a clear quantity omission, but a
complete numeric meaning audit was not done. Adjacent technical windows
139–143 and 217–218 show weak Russian continuity. The provisional single
scene cannot establish real scene-cut behavior.

No human bilingual reviewer has rated any cue. The complete SRT remains
`needs_review`; source rights and Chinese-speech alignment remain open.
No approved spoken script follows from this AI audit. The next model
work should test the six frozen cases and their controls on the same
source-aware prompt without leaking expected Russian meanings into the
requests, then seek an independent review route that respects the owner's
decision against volunteers.
