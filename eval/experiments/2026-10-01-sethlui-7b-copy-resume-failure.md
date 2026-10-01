# Copied 7B restaurant continuation: cue 62 recovered, cue 100 rejected

Date: 1 October 2026. This is the single planned continuation of the
[failed 7B model screen](2026-10-01-sethlui-full-v6-model-comparison-result.md)
under the [copy-and-resume budget](2026-10-01-sethlui-7b-copy-resume-plan.md).
It is partial `LONG-03`, `LONG-04`, `CTX-02` and `EVAL-04` evidence, not a
complete translation or human language review.

The original run at commit `ed6a8c4b3b21b9a7da8da01737e28296047af199`
stopped at cue 62 with 61 saved checkpoints. The recovery runner was frozen at
`c5ca1f6bc8b627b838dfba8eccf741f08beef198`, copied the verified state,
relocated only its owned source locator and resumed the same run ID
`ef5f83be-05ab-4410-90ff-ddeb0c4a9c89`. It used the same 7B GGUF,
v6 profile, llama-server, release CLI and 263-cue source hashes as the
[original comparison](2026-10-01-sethlui-full-v6-model-comparison-result.md).
There was one fresh server and one CLI resume; no changed prompt, term,
reference, output repair, model or post-failure retry. The runtime sampling
seed remains unknown.

The private continuation workspace is
`.cache/eval/commons-sethlui-full-v6-7b-resume-v1/run-oWMFtv/`; its raw report
SHA-256 is `16b1e806d52ce9bdd0d7a088e1b4e289802dc4b745bb149a429ccdea595e8c81`.
The copied SQLite SHA-256 is
`e470d7ba6c01f34d93c490dde8b0c0ed7110da21bb9b3a02e99683a4ee2b57c8`.
The old 61 checkpoints are exactly preserved; 38 new cues, 62–99, reached
durable storage. The original SQLite/SHM/WAL hashes are still exactly their
predeclared values. At cue 100 the model produced a parseable target-bound
JSON object, but its translated string ended in `」}]}`. The unchanged SRT
grammar guard rejected it. The copied state has 99 contiguous checkpoints,
two attempts, no result row and no partial output SRT. The prior failure
remains separately archived. `REG-042` pins this second exact real-model
occurrence and source-only authored controls.

| New continuation only | Observed |
| --- | ---: |
| Chat / rendered-template / tokenizer calls | 39 / 39 / 39 |
| All proxied HTTP calls | 120 |
| Prompt / completion tokens | 10,402 / 1,458 |
| CLI resume command | 58.828 s |
| Summed chat HTTP time | 26.724 s |
| Peak sampled server working set | 5,065,461,760 B |
| Peak sampled whole-device GPU allocation | 6,460 MiB |
| Resource samples | 59 |
| Original / final copied checkpoints | 61 / 99 of 263 |
| Human adequacy scores / listeners | 0 / 0 |

The failed cue-100 request SHA-256 is
`764f2599a7d30b0ff3c1f7dbcbdbdfc2f4319e6975a3f7a33cbe072015624d74`;
its source-line SHA-256 is
`bdc93a18b6d02e1cfb9addfdfa5eb946977471c625d715a9613a8faea109e389`
and invalid candidate-text SHA-256 is
`dd857bafdd3b2f5154755d969174698fdd1b3ba8aba8faee485706d79bfbdb9d`.
Neither licensed source text nor raw model answer is copied into the public
report. `task eval:natural:sethlui:v6:7b:resume:result:check` independently
reconciles every new raw response, tokenizer count and source slot, the copied
prefix and unchanged original bytes.

The one-attempt continuation budget is exhausted. Its successful passage of
cue 62 shows that a fresh sampling path can avoid one suffix, while the new
cue-100 failure shows that the same profile is not reliable enough for a full
artifact. A distinct versioned reliability change would need a new frozen
experiment and related controls; repeated sampling until success would
obscure this failure rate. Translation adequacy, human review, rights,
speech alignment, selected candidate and Auralis approved audio remain open.

The later [CLI provenance audit](2026-10-01-sethlui-cli-provenance-audit.md)
clarifies that this historical executable predates the newer provider-level
JSON-tail guard. Only the recorded SRT grammar rejection is attributed to
this run; current-source guard tests are separate evidence.
