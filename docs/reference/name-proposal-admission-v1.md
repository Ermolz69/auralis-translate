# Name proposal admission v1

Date: 3 October 2026. NAME-02 safety containment, not language approval.

The nine new NAME-01 errors are traced from its immutable 84 responses: three
Li-address substitutions at cue 1, three neighboring file-transfer substitutions
at cue 6, and three Li-address substitutions at cue 11. Exact requests, source
context, proposals, raw responses and accepted checkpoints are retained in the
[trace](../../eval/reports/2026-10-03-name-action-trace-v1.json).
Correct JSON, a matching cue ID and a name spelling do not prove the actor/action.
An arrival question can be lost despite a structurally valid response. No reliable
general Chinese-to-Russian action verifier is established by this evidence.

One candidate changes only admission. It leaves the v8 and NAME-01 prompt bytes
unchanged. The separately pinned `name_proposal_admission_sha256` profile rejects
every structurally decoded target with an active name proposal, even a plausible
answer or human-approved spelling. Approval of spelling cannot attest the action.
The typed, nonretryable provider failure and CLI code are
`name_proposal_review_required` (classified exit 4). The journal records
`invalid_candidate`, the exact raw response, parsed/restored candidate, usage,
elapsed time and reason. No checkpoint or complete/partial subtitle is published
for that rejected target. There is no automatic correction or semantic retry.

Only proposals present in the actual rendered target slots activate the barrier.
Neighbor-only names, other slots, empty proposals and trimmed context cannot
activate it. No-name request bytes stay identical to baseline v8. Legacy proposal
profiles remain readable for historical export, but active proposals with no
admission pin refuse inference. Runs bind profile and registry identities;
use a fresh run rather than changing a saved checkpoint's profile.

This conservative barrier deliberately stops correct named outputs too. It has
no model-based accept path and cannot qualify for a natural long-file probe.
The single screen is an offline replay of all 84 frozen answers plus deterministic
unseen source controls. New inference is zero; the owner's 120-chat ceiling is
unused. Repeating the unchanged request cannot establish a semantic verifier.
Independent human review remains zero. Keep baseline v8 and G3–G5, LONG-04 and
RELEASE-05 open. Review/correction tooling is a later task; do not silently unblock
by removing proposals from the run or mutating its registry.
