# RELEASE-05 interim self-audit after the ASUS context-width screen

Date: 1 October 2026. This is an **incomplete self-audit**, not final
`RELEASE-05` acceptance. The selected scope remains
[PLAN-03 v1](2026-09-28-goal-scope-v1.md): Chinese existing subtitles to
Russian on Windows and a real source-subtitle dubbing pilot in Auralis.
Japanese and subtitle-free ASR are separate directions. Fine-tuning and higher
precision remain measurement-conditional. The owner has deferred the desktop
milestone; a CLI result cannot close the full release.

The committed evidence candidate was Translate
`95b5adcd3cdc2ef6785d4581284a6071f191adf9`. Its existing GitHub Pages
workflow [36827143330](https://github.com/Ermolz69/auralis-translate/actions/runs/36827143330)
passed. `task site:live:check` compared the deployed HTML byte-for-byte to
`site/index.html` at
`https://ermolz69.github.io/auralis-translate/?revision=95b5adcd3cdc2ef6785d4581284a6071f191adf9`:
1,083,983 bytes, SHA-256
`9e75c8a0085dd13ee34a6ebcd2f52d64c8ad8fb52425cbd97ee0fd4021dbaa5c`.
The page retains older measurements and states that all release gates remain
open. Published results contain hashes and source-free summaries; raw Chinese
subtitle/media files and raw model replies remain private.

| Gate | Exact current evidence | Decision |
| --- | --- | --- |
| G1 structure | ASUS 1.8B v6 produced 268/268 structurally mapped cues; original SRT retained. | Partial engineering evidence; selected final candidate absent. |
| G2 coverage | The same candidate has a full structural SRT; 7B stopped at 226 checkpoints and the separate context screen had one 7B length failure. | Open for selected profile and every required file. |
| G3 adequacy | AI source-aware review found ASUS and other natural-source fact errors; independent eligible holdout ratings: 0. | Open; 95% at least 4/5 unmeasured. |
| G4 critical errors | Cue 133 polarity/referent and other known errors remain; independent adjudication: 0. | Open. |
| G5 terminology | Technical controls, ROG handheld class, hyperthreading and mouse pads remain unstable; approved-term human scoring: 0. | Open; 98% unmeasured. |
| G6 resources | Real context screen: 88 chats, 82,257 ms, 1.8B/7B process memory samples; prior full 268-cue timing exists. No frozen release SLA or selected package. | Open. |
| G7 recovery | Existing long-file checkpoint, interruption, host and rollback fixtures cover slices; natural final-candidate fault matrix absent. | Open. |
| G8 export | Technical SRT and media consumer checks exist for prototypes; selected reviewed final artifact absent. | Open. |
| G9 installation | No unseeded clean Windows target or complete desktop endpoint. | Open. |
| A1 approved lineage | Auralis cross-database guard exists on a local branch, but reviewed spoken script/voice approval is missing. | Open. |
| A2 complete real speech | SAPI generated 268/268 ASUS WAVs and full VP9/Opus media; the translation is unapproved. | Open for approved script. |
| A3 sound and fit | 264/268 cues overrun original windows, 259 starts overlap prior speech. No frozen acceptable baseline or human listening. | Fails observed timing fit; open for corrected pilot. |
| A4 listening | Three accepted 10–20-minute scenes and listener ratings: 0. | Open. |
| A5 full-length durability | One full media file was technically played; declared restart/cancellation matrix for selected source and audio lineage is absent. | Open. |
| A6 delivery | FFplay completed one 14:42 media variant; rights, consumer/listener review and rollback not accepted. | Open. |

The [context-width result](2026-10-01-asus-context-width-paired-result.md)
adds actual paired 1.8B/7B source-only evidence but does not select width three.
It reproduces an incomplete valid-JSON target and a worse battery-life
translation with wider context. `REG-038` is linked in
[catalog v23](../regressions/catalog-v23.json); its eleven new authored
controls have zero model runs. The prior 268-cue Russian candidate SHA-256 is
`aa74b20d4255f46c9a23ddfd0865dd2e221e7b08ab3cbceb8665be3b0c7b6e8b`;
the playable but unaccepted full media SHA-256 is
`75253e8e7c92b950434f82c82fd4d4e245d0c6ef525983bcd311c8dceeecd888`.
The Auralis voice worktree remains at local commit
`12b109da68e5242552afbbed786340c550dcb197`, unpublished. No Auralis
submodule pin was changed. Do not attach this media as an accepted voice
artifact or overwrite the original source or prior accepted results.

Verification for this slice: `task eval:context:asus:width:check` passed 88
raw chats and 176 preflights; `task eval:regression:catalog:check` passed all
38 indexed packs; `task docs:check` passed 298 Markdown file links;
`task plan:check` passed 49 task IDs and six document identities;
`task site:build`, `task site:check` and `task site:live:check` passed.
Human bilingual reviews, listener ratings, rights/audio alignment and
clean-install checks: **zero**, not inferred from these engineering checks.

Unblock inputs: an independent Chinese/Russian reviewer for a licensed and
aligned 300-cue holdout, listeners for three 10–20-minute approved scenes,
and an unseeded Windows installation target. The user allows finding test
sources independently, including YouTube; source discovery continues, but
rights and caption/audio alignment must be verified before admission. The
desktop schedule needs an explicit owner decision when its dependency chain
is ready. Continue `DATA-03`/`DATA-04`, `CTX-02` and real Auralis audio work
without claiming G3–G5 or A1–A6. Roll back the context-width publication
and this self-audit by reverting their commits; retain the ignored raw workspace and immutable
baseline artifacts. The Auralis local worktree can be archived independently
once its unpublished changes are no longer needed.
