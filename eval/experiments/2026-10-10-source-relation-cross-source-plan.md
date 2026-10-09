# Frozen second-source relation-warning coverage screen

Date: 10 October 2026. Task IDs: `EVAL-04`, `LONG-04`. Experiment ID:
`SOURCE-RELATION-CROSS-SOURCE-2026-10-10-v1`. This is an offline,
evaluation-only check of the already implemented v2 warning rule after
its [one-source replay](2026-10-10-source-relation-review-v2-result.md).
No product validator, prompt, model profile, translation or checkpoint
changes. All inputs are exposed development material, not sealed holdout.

The question is whether source relation classes seen in the Vivo interview
are recognized on distinct natural files, and whether existing Russian
drafts produce warnings there. Freeze these exact private pairs:

| Group / draft | Chinese SRT SHA-256 | Russian SRT SHA-256 | Cues |
| --- | --- | --- | ---: |
| Geekerwan ASUS / 7B v8 | `923aed3991c2308d92b89c45181cea8ec7ece74e9b4d3a3ce0234d95e329913b` | `746495ba8bfc9c7c3cee0b5021fea87c10605b1d8e07be6dc316907138ea48ee` | 268 |
| Sethlui restaurant / 1.8B v6 | `4777e11caa115e893f2328c2a33c25a76c7391ace8ecf0ac4b9436635fc27964` | `042c0ffffd67a4ea6f562645655ffe9db823866d7505b4ed64708e0ff829df4d` | 263 |
| Sethlui restaurant / 7B v6 | same Chinese source | `45f140e201f5a6228a0754e48d1e2b4153a392a7869dc279768339882fa53511` | 263 |

Rule files `eval/scripts/source-relation-review-v1.mjs` SHA-256
`215486c2a6fa85fc278ef84b28d0bd0abf7c99174311414aa982ab7c9b83c18a`
and v2 SHA-256
`f0d1bb879fbc869aa7ed7f1d3165eb657dfad0add8f7d873029bd44913315eb5`
remain unchanged. Preserve source group identity: two Sethlui drafts are
correlated, not two independent sources. Scan all 794 cue pairs once,
including first/middle/last and all seams, with one previous and next
source cue under the rule's existing gap policy. Require exact source/result
cue count, ID and timing agreement before any warning is counted.

Budget: one local replay attempt, zero model/ASR/TTS/network requests,
zero retries, 20-second process limit and no GPU use. Retain the raw
private source/draft paths unchanged; publish only hashes, per-source
relation counts, cue IDs and warning kinds. The capture task stores one
source-free report; the check task rehashes all inputs and both rule files
and independently recomputes the report. A missing file, identity mismatch
or parser failure is a retained failure, not an empty-warning result.

Decision: a source group with zero recognized source relations has no
observable warning precision; do not call its zero warnings a true-negative
rate. Any warning requires source-aware review before labeling it correct
or false. This cross-source diagnostic cannot approve the rule, translations,
G3–G5 or spoken scripts. Keep v8 and all prior evidence unchanged.
