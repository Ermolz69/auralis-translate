# Source inventory v1

Status: `DATA-01` schema and owned fixture, 28 September 2026. This is a
provenance and admission format, not an acquired subtitle corpus or a scored
language gate. The executable checker is `task eval:data:check`; its authored
[example](../../eval/corpora/source-inventory-example-v1.json) refers to a
two-cue [fixture](../../eval/corpora/fixtures/inventory-example.zh.srt) and
sets `fixture_only: true`.

The JSON root contains `schema_version: 1`, a stable `inventory_id`,
`fixture_only`, and `sources`. Each source has an immutable `id`, `group_id`,
whole-group `split`, curation `state`, exact source URL/revision/retrieval UTC,
raw-byte SHA-256 after acquisition, `language: zh`, `script: Hans|Hant`,
`format: strict_srt_v1`, inspected `cue_count`, optional `media_url`, separate
subtitle/reference/audio rights, and ordered scenes. A source may be metadata
only while `discovered`, `rights_checked` or `rejected`; it may not invent a
hash, parsed cue count or scene. `inspected_candidate` records exact downloaded
bytes and a strict parser cue count while subtitle rights remain unresolved. It
requires an unassigned split, no admitted scenes or reference, and contributes
zero eligible cues. This is a technical observation, not source admission.
Rejection includes an explicit reason.

When a matched media duration is known, store `media_duration_ms` with an HTTPS
`media_duration_evidence_url`. Both fields are optional for discovery but must
appear together. The candidate inspector checks every parsed cue's end against
that duration and rejects any overrun. This was added after a 271-cue Commons
caption ended at 14:18.333 while its associated video was listed as only
12:18; strict SRT syntax alone did not reveal the media mismatch. Record media
duration from a verified stream before using this as an admission check;
rounded catalog durations can serve only as an obvious-mismatch screen.

Every right has `decision: unknown|approved|rejected`. An approved right needs
its license or grant, evidence URL, attribution, explicit internal-use approval
and a boolean public-redistribution decision. Unknown/rejected rights cannot
grant use. Subtitle rights must be approved before source admission. Human
reference rights are separate. Audio rights do not follow from a subtitle or
video license; `VOICE-01` must require approved audio use separately.

`group_id` identifies the complete media item or related series/release family.
All entries in a group must have one split: `training`, `development`, `holdout`,
`excluded` or `unassigned`. Adjacent scenes, alternate subtitle tracks and
paraphrased releases belong in the same group. A scene lists unique internal
`cue_ids` in original order, explicit `{cue_id, reason}` exclusions, and
alignment/reference review states. The validator requires scene IDs to cover
every inspected cue exactly once; excluded cues still count in structural
mapping, but leave the eligible language denominator. This prevents silent
omission of non-dialogue or unsupported content. Cue IDs are internal inspector
IDs, not possibly repeated external SRT labels.

Review state is `none`, `ai_proposed` or `human_reviewed`. Human review requires
reviewer and evidence IDs; the latter must resolve to controlled, source-aware
records before a release audit. `reference_reviewed`, `development_only` and
`holdout_frozen` require human-reviewed source alignment and reference for each
scene plus approved reference rights. `development_only` requires the development
split. A sealed holdout requires the holdout split and a non-fixture inventory.
The validator does not attest that a named reviewer exists or that a license is
legally sufficient; those are human and item-level admission checks.

The example's `local_fixture_path` is restricted to an owned SRT fixture under
`eval/corpora/fixtures/`. The Taskfile checker recalculates its raw SHA-256.
The separate [Commons candidate inventory](../../eval/corpora/commons-inspected-candidates-v1.json)
uses `local_candidate_path` only under ignored `.cache/eval/<candidate-id>/source.zh.srt`.
`task eval:data:check` checks its schema and reports 365 inspected candidate
cues with zero eligible cues for that initial inventory. It also checks the
separate 123-cue Commons commerce inventory and the [230-cue private Mandarin
candidate](../../eval/corpora/youtube-mingfay-candidate-v1.json); the five
inspected candidates total 718 cues and still have zero eligible cues. On the
acquisition machine,
`task eval:data:candidates:bytes` additionally hashes all three retained raw
files; it cannot pass without those local bytes.
`task eval:data:candidates:inspect` then runs the strict CLI inspector and
checks each CLI source hash and ordered cue count against the inventory. The
[observed recheck](../../eval/experiments/2026-09-29-commons-candidate-parser-recheck.md)
passed 93 + 66 + 206 cues. The Mingfay derivative has its own
`task eval:data:youtube:mingfay:derivative:inspect` and
`task eval:data:youtube:mingfay:candidate:check` for strict parsing and exact
private bytes. None of these tasks clears rights, speech alignment or
references.

The separate [Commons Ying candidate inventory](../../eval/corpora/commons-ying-candidate-v1.json)
adds 93 strict Chinese cues from the pinned subtitle revision and a privately
retained matching 3:38 WebM. `task eval:data:commons:ying:candidate:check`
verifies the exact original bytes on this machine. Across the previous five
candidates and Ying, six sources now account for 811 inspected cues and still
zero eligible development cues. Media and caption rights, exact speech
alignment and independent bilingual review remain unapproved. The
[guarded complete-file result](../../eval/experiments/2026-09-30-commons-ying-guarded-full-result.md)
is structurally valid but has AI-triaged fact and negation errors, so it cannot
serve as an approved spoken script.

Production licensed text and media stay in controlled storage outside the code
repository; published manifests contain only permitted metadata and excerpts.
The verifier does not download a third-party source, normalize raw bytes, infer
speaker identity or create a Russian reference.

`DATA-05` later audits near-duplicates, source/reference alignment evidence,
license decisions, reviewer coverage, category balance and split leakage beyond
the exact group-ID check. The source inventory is versioned before any model
comparison. An inspected holdout used for tuning is retired into development
with a new inventory version; old records and failures remain available.

## DATA-01 acceptance

`task eval:data:check` passes seven semantic tests: example and exclusions,
cross-split group rejection, separate subtitle/reference rights, named human
review, complete ordered cue mapping, candidate non-admission, and fixture holdout rejection. It checks
the authored fixture's raw SHA-256. These tests certify the schema mechanics;
they do not certify any real source, rights decision or bilingual review.
`task plan:check` passes all 49 backlog IDs and dependencies;
`task docs:check` passes 102 local Markdown files. `task site:build` and
`task site:check` pass while retaining 180 historical and 240 model-comparison
requests in the generated Pages report. No new language result is claimed.
