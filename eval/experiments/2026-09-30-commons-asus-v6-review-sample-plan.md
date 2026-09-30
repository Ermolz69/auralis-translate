# Frozen source-only review sample for complete ASUS v6 candidate

Date: 30 September 2026. The structurally complete private ASUS v6 result
has source SRT SHA-256
`923aed3991c2308d92b89c45181cea8ec7ece74e9b4d3a3ce0234d95e329913b`
and candidate SRT SHA-256
`aa74b20d4255f46c9a23ddfd0865dd2e221e7b08ab3cbceb8665be3b0c7b6e8b`.
The [full-run plan](2026-09-30-commons-asus-full-v6-slot-plan.md) and
retained report precede this sample. The source is inspected development
material, never a sealed holdout or human-scored release sample. This
selection policy is frozen before inspecting the complete Russian output.

Run `task eval:natural:asus:v6:review-sample` once. It first verifies all
268 raw target-bound replies, durable checkpoints, result and offline SRT.
Then it reads **only the Chinese source** and selects a union of:

- Fixed beginning 1–3, pre-failure 19–21, first/middle thirds 88–90 and
  133–135, late third 178–180, previous 7B failure 225–228, and end 266–268.
- The first two cues with Arabic/full-width digits, first two with named
  product/company spellings and first two with Chinese negation in each
  of four consecutive source quartiles: 1–67, 68–134, 135–201, 202–268.
- The longest source-text cue in each quartile, ties broken by lower cue ID.

The selector records cue IDs, source-only tags and private source text in
a unique ignored JSON. It does not read Russian output or model reports to
choose IDs. No model requests, retries, edits or new published artifact
result from selection. After the file is frozen, compare only the selected
Chinese windows with the corresponding actual raw and accepted Russian
lines. Record expected source meaning, uncertainty, source/target/request/
response hashes and AI observations separately from human review. Follow
up with related/negative controls for confirmed critical or major defects.
The sample is targeted, not random; unsampled cues, scene/audio alignment,
rights, approved terminology and independent bilingual review remain open.
