# Vivo scene post-edit: candidate rejected after time displacement

Date: 10 October 2026. The single run followed the
[frozen plan](2026-10-10-vivo-scene-post-edit-v1-plan.md) and
[ten-request schedule](2026-10-10-vivo-scene-post-edit-v1-freeze.json),
SHA-256 `1df1121d6cbd858c3baf16838e01d597777e519d5ec321f67f754a6bb2146465`.
Its Chinese original-platform SRT and complete 7B/v8 draft have pinned SHA-256
`b100803367b95fa55fc638b1ff39a0abfa0d5b8183ebe58d58b1a87242d9d8c4`
and `4451868ea3e7cbb3ed81f3d24b5f85bc61a749168b213c54c88ae552208c4831`.
The model, manifest and runtime identities are in the schedule and
[source-free report](../reports/2026-10-10-vivo-scene-post-edit-v1.json),
SHA-256 `ea135459148721da5819e616a0a691af0c9ffe6f1fd9d6a683636ec1b3069e51`.
All raw requests, template/tokenizer replies, model responses and samples
remain private at `.cache/eval/vivo-scene-post-edit-v1/attempt-FKCsLE/`;
the report and journal hashes are `957ded8ccc613f7287d2cb81633a3f2e127f32b82e2efcbda9629f03f29689c5`
and `430b591d5401aa373804618eee1e4a076da9a996e628defb5572c5fd5af681f5`.

One local 7B Q4_K_M server answered **10/10 chats** with **20/20**
template/tokenizer preflights and correctly mapped every target cue. It used
3,742 prompt and 2,098 completion tokens, 32,009 ms summed chat time and
42,171 ms whole-run time. Eight resource samples found at most
5,061,619,712 B tracked working set and 7,343 MiB device-wide GPU use;
there were no sampler errors. These are sampled lower bounds and the GPU
number includes other processes. The candidate receives the earlier Russian
draft and an extra inference pass, so timing is not an equal-compute comparison
with the original v8 run. No source expectation or Russian reference entered
any request. The 10 cases and 43 target cues are exposed, correlated
development examples; no closed holdout, retry or full-file candidate run.

| Fixed case family | Baseline versus scene revision, AI source-aware triage |
| --- | --- |
| 9400 generation | The generation survives; another incomplete line becomes an awkward production noun. No clear gain. |
| 36-month planning | The revision changes the mistaken time anchor, but does not clearly connect the 36-month lead to joint planning. No confirmed repair. |
| More-than-1,000-person team | Financial-investment wording remains. No repair. |
| Work until 1–2 a.m. | The revision inserts 11–12 at night into preceding cue 327 and removes the 1–2 a.m. hour from cue 328. New major scene-level time displacement. |
| Future products | Future tense improves, but the speaker/recipient agency shifts to an owned product claim. Full relation unconfirmed. |
| Five REG-066 negative cases | Their five primary contrasts survive. One neighboring thanks line loses “everyone,” a minor omission. |

This is [AI triage](../reports/2026-10-10-vivo-scene-post-edit-v1-ai-review.json),
SHA-256 `4d1670f8a7e4ebf3680d9b08017a5f2da67809101d464d7248f9a8014fd28135`;
independent Chinese–Russian ratings are **zero**. The disclosed decision is
**0/3 confirmed primary relation repairs and one new major scene error**.
The exact minimal cue-327/328 failure and six fresh related/negative cases
are retained in [REG-072](../regressions/reg-072-post-edit-time-displacement-v1.json).
Those six controls have **not** been sent to a model or scored.

`task eval:vivo:post-edit:unit`, `freeze`, `preflight`, `probe`, `report`
and `check` passed; the last task rehashed every raw request/reply,
source/draft, model/runtime, preflight, usage, result and AI-review record.
The attempt had zero retries or failures. The candidate is **rejected** by
its predeclared no-new-major criterion. It is neither a verified 467-cue
translation nor an approved spoken script. Product v8, the full Russian
SRT, source media, earlier failed results and their SQLite records remain
unchanged. Rollback is to keep using the existing v8 profile in a fresh
run; omit this evaluation-only post-editor. G3–G5, independent review,
rights, audio acceptance and RELEASE-05 remain open.
