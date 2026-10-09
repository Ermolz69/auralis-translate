# Vivo stratified full-file blind-spot review: AI findings only

Date: 10 October 2026. Tasks: `LONG-04`, `CTX-03`, `EVAL-04`.
The [plan](2026-10-10-vivo-stratified-blindspot-v1-plan.md) and
[Chinese-only freeze](2026-10-10-vivo-stratified-blindspot-v1-freeze.json)
were committed before either Russian draft was read at the new locations.
The source was the retained 18:36 Geekerwan/Vivo/MediaTek YouTube SRT,
467 cues, SHA-256 `b100803367b95fa55fc638b1ff39a0abfa0d5b8183ebe58d58b1a87242d9d8c4`.
The two unchanged complete Russian v8 drafts were 1.8B SHA-256
`32d96fe75eb0f5c90a67e2f6606d3d6ace27f79e67352a12b065efe91a08d3fc`
and 7B SHA-256
`4451868ea3e7cbb3ed81f3d24b5f85bc61a749168b213c54c88ae552208c4831`.
They came from different recovery histories but use this identical Chinese
source; neither is an accepted translation. The source and raw full drafts
remain private, unchanged, and `needs_review`.

`task eval:vivo:blindspot:freeze` selected 15 nonoverlapping three-cue
windows from Chinese text alone: five each in the beginning, middle and
end, including three pinned anchors and source-derived numeric, negation,
entity and batch-seam candidates. It excluded previously exposed risk
ranges. The freeze SHA-256 is
`ac2536f4878de123d50a89fbc35f7d383f93f9709dc19acf14c14f376d6413cc`.
`task eval:vivo:blindspot:preflight` rehashed all input files and verified
all 467 IDs and timing lines. One bounded `task eval:vivo:blindspot:report`
replay then read 45 unique source cues and 90 paired draft cues, with no
model, ASR or TTS call. The private packet is
`.cache/eval/vivo-stratified-blindspot-v1/attempt-7zf5j4/packet.json`,
SHA-256 `a665a4b4fb5a6c2d9b0fb8decaef1ee3916f526a98403d2e766dc1a82bfd3097`.
The [public source-free machine report](../reports/2026-10-10-vivo-stratified-blindspot-v1.json)
has SHA-256 `94ed2dce1bf48b4eef4b71fa34c12cbd50ad60834599dcdfba6741e02ec4b396`.
The capture took 15 ms according to its retained attempt record; this is
an offline extraction time, not translation speed or end-to-end review time.

The separate [source-aware AI review](../reports/2026-10-10-vivo-stratified-blindspot-v1-ai-review.json),
SHA-256 `2c8e7bc4088b9e0d584173b605a2f352154f868e5c3b49f43988684f278eb77e`,
marked six windows with clear major meaning/scene problems, six minor,
one uncertain, and two with no clear issue seen in this narrow read.
Among the six major windows, the 1.8B draft is implicated in six and the
7B draft in two. These correlated, purposively selected windows are **not**
a quality rate or a statistically valid model ranking. No bilingual human
approved any finding, source-aligned audio or Russian spoken script.

| Cue | Source meaning to preserve | Observed AI concern |
| --- | --- | --- |
| 20 | Movement into the high-end product segment | 1.8B describes a path to higher prices. |
| 172 | Multi-core capability | 1.8B changes cores to chips; 7B says multiple processors. |
| 232 | All-big-core CPU architecture | 1.8B loses the architecture and 7B generalizes to powerful technology. |
| 334 | Early planning driven by user scenarios | 1.8B turns this into dramatic scene staging. |
| 393 | Advanced semiconductor manufacturing process | 1.8B changes the process into processors. |
| 457–458 | Introductory fragment followed by conversation with Vivo/MediaTek colleagues | 1.8B repeats cue 458's complete statement at cue 457, so the statement occurs twice. |

The technical interpretation of `全大核` is supported by
[MediaTek's Dimensity 9300 specification](https://www.mediatek.com/zh-cn/products/smartphones/mediatek-dimensity-9300),
which describes its all-big-core CPU architecture. MediaTek's
[traditional-Chinese specification](https://www.mediatek.com/zh-tw/products/smartphones/mediatek-dimensity-9300)
also uses `先进制程` for the 4 nm manufacturing process. The premium-market
and scenario-led readings are AI inferences from local scene context and
still need independent review. The adjacent-cue duplication is directly
visible in the retained 1.8B SRT, whose cue-457 and cue-458 text hashes
are identical. [REG-073 and catalog v52](../regressions/catalog-v52.json)
pin the six minimal reproducers, including the extra cue-458 hash, and
six authored related plus six negative controls. These controls have not
been sent to either model; their count is not a pass result.

The sampler's “numeric” feature was too broad at cues 267 and 455: generic
Chinese “one” expressions triggered it without a meaningful measured
quantity. Retain those results and tighten the next predeclared source-only
sampling rule on a new source, without retroactively changing this freeze.
The six minor and one uncertain scene require review; a “no issue seen”
label is not a correctness claim. The selected video still has unresolved
caption authorship, human speech alignment and separate media rights, so
all raw source-derived text stays private. Existing SRT outputs, SQLite
checkpoints, v8 profile, previous experiment results and audio artifacts
are unchanged. No full-file quality, G3–G5 or RELEASE-05 admission follows.
