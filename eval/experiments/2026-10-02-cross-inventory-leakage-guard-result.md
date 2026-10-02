# Exact source-identity leakage guard and corrected current inventory

Date: 2 October 2026. Partial `DATA-05` engineering result under the
[bounded plan](2026-10-02-cross-inventory-leakage-guard-plan.md). No model,
TTS, network request or human review was used. The committed baseline before
this slice was `eef7561`; the unrelated working-tree edit to
`docs/architecture/014-result-history-selection.md` was not changed or staged.

## Confirmed defect and reproduction

The old cross-inventory checker compared only declared `group_id` and split.
Three new regression cases initially failed under `task eval:data:check`: the
same subtitle SHA-256 in unrelated groups, YouTube watch versus short URL for
one video, and one Commons media URL with changed subtitle bytes. After adding
the guard, the first all-manifest check rejected **real retained data**:

`commons-ying-1238607314` in the initial inventory and
`commons-ying-henan-1238607314` in the later Ying inventory both declared
SHA-256 `505913bd7046b28c873307562a55d567043f8703bc00375c3485853b87c420d9`,
93 cues, Commons TimedText revision `1238607314`, the same local SRT path and
the same Commons media URL, but used different group IDs. The later record
also carries the matched media investigation. This is **one subtitle file**,
not two independent sources. The earlier 12 candidate records / 3,336
inspected cue slots counted its 93 slots twice. They were already zero
eligible, so no language gate changed from pass to fail.

## Repair and controls

The historical `commons-inspected-candidates-v1.json` and
`commons-geekerwan-two-scenes-candidate-v1.json` remain unchanged. Current
`commons-inspected-candidates-v2.json` omits only the duplicate Ying record;
the later dedicated Ying manifest remains current. The current Geekerwan v2
manifest adds the original Kirin YouTube URL to its Commons derivative,
based on the [original-platform provenance check](2026-10-02-youtube-geekerwan-kirin-license-result.md).
This links two known versions for leakage prevention. It does not resolve
their 90,182-ms duration difference, subtitle authorship, rights or alignment.

The current inventory is **11 track records, 10 media groups, 3,243 inspected
cue slots and 0 eligible cues**. Kirin's 304-cue Commons and 343-cue current
original tracks remain two distinct unreviewed track records in one group;
the cue-slot sum is not a count of independent Chinese sentences. The old
12/3,336 snapshot remains on the history page as a dated observation, with
this correction on the current page.

The checker now rejects any repeated declared non-null SRT hash and
cross-group reuse of a canonical YouTube ID across source/media/origin URLs
or a declared media URL. The same-group repeated-hash control was added after
the real Ying duplicate was found: a corrected group label alone must not
inflate a future count. Ten authored group controls and ten source-schema
controls pass, including same-group revisions, unrelated videos, null
metadata hashes and HTTPS validation. A Taskfile command compares all nine
**current** manifests;
another rehashes their eleven private SRT files. Both passed. Exact identity
checks cannot find edited near-duplicates, dishonest URLs or overlapping
scenes; `DATA-05` stays planned until its dependencies and full audit pass.

Manifest SHA-256 values (lowercase): historical initial v1
`59c3f7be9c4a41fdd49f04c5c95b2e9a85917a78d4463d3ba8f16affc128ea8b`,
current initial v2
`34de9c20ce08cb850cab9dce7ca5e414e44d5d8f39bab25223f3259c540d2286`,
historical Geekerwan v1
`17931dd84de07960bdfca47f2c4eb66baebac34b576062768a42e4a5b10f41ba`,
current Geekerwan v2
`970a345a7326b1ec5b51c9fa75ace36a4a0aad11588ebbc754d028195697b27d`.

Checks: `task eval:data:check` passed 10 schema, 10 cross-inventory and 4
media-boundary tests, all per-manifest schema checks and the 11-source /
10-group aggregate. `task eval:data:current:bytes:check` passed all nine
current manifest-to-file SHA-256 checks and the aggregate identity guard.
Documentation, plan and generated-site checks were run after the correction.
Live publication must be verified separately after deployment; a local build
does not attest the live page. No Chinese speech, independent meaning,
reference, listener or clean-install gate is satisfied by this correction.
