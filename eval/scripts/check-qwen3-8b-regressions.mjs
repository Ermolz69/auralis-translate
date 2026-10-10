import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const read = relative => fs.readFile(path.join(root, relative));
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const [reportBytes, reviewBytes, reg81Bytes, reg82Bytes,
  journalBytes] = await Promise.all([
  read('eval/reports/2026-10-10-qwen3-8b-local-screen-v1.json'),
  read('eval/reports/2026-10-10-qwen3-8b-local-screen-ai-review.json'),
  read('eval/regressions/reg-081-qwen-all-big-core-loss-v1.json'),
  read('eval/regressions/reg-082-qwen-russian-agreement-v1.json'),
  read('.cache/eval/qwen3-8b-local-screen-v1/attempt-6QiVtF/requests.jsonl'),
]);
const report = JSON.parse(reportBytes);
const review = JSON.parse(reviewBytes);
const packs = [JSON.parse(reg81Bytes), JSON.parse(reg82Bytes)];
const rows = journalBytes.toString('utf8').trimEnd().split(/\r?\n/u)
  .map(JSON.parse);
assert.equal(sha(reportBytes),
  'b7928d632474da5e7da2c9272aacc050c444dd4bf17343141df871dce93889c5');
assert.equal(review.machine_report_sha256, sha(reportBytes));
assert.equal(review.reviewer_kind, 'ai_source_aware_not_independent_human');
assert.equal(review.human_bilingual_reviews, 0);
assert.equal(review.release_quality_claim, false);
assert.equal(review.decision, 'reject_candidate_before_cross_source_or_full_file');
assert.equal(review.cases.length, 6);
assert.deepEqual(review.cases.map(row => row.case_id), [
  'natural_multicore', 'natural_all_big_core', 'natural_process',
  'not_multicore_but_separate_chips',
  'three_independent_not_one_multicore',
  'real_dual_processor_single_core']);
assert.deepEqual(packs.map(row => row.id), ['REG-081', 'REG-082']);
for (const pack of packs) {
  assert.equal(pack.machine_report_sha256, sha(reportBytes));
  assert.equal(pack.ai_review_sha256, sha(reviewBytes));
  assert.equal(pack.related_controls.length, 3);
  assert.equal(pack.negative_controls.length, 3);
  assert.equal(pack.control_model_runs, 0);
  const controls = [...pack.related_controls, ...pack.negative_controls];
  assert.equal(new Set(controls.map(row => row.id)).size, 6);
  assert(controls.every(row => row.source_line && row.expected_fact));
}
const byCase = (caseId, arm) => rows.filter(row =>
  row.case_id === caseId && row.arm === arm);
const allBig = byCase('natural_all_big_core', 'candidate');
assert.equal(allBig.length, 3);
assert(allBig.every(row => !/больш|крупн/u.test(row.accepted_text)));
assert(/крупн/u.test(byCase('natural_all_big_core', 'baseline')
  .find(row => row.seed === 101).accepted_text));
const reg81 = packs[0].minimal_reproducer;
const reg81Row = allBig.find(row => row.seed === 101);
assert.equal(reg81Row.source_text_sha256, reg81.source_text_sha256);
assert.equal(reg81Row.request_sha256, reg81.candidate_seed101_request_sha256);
assert.equal(sha(Buffer.from(reg81Row.chat.raw_response)),
  reg81.candidate_seed101_raw_http_sha256);
assert.equal(reg81Row.accepted_text_sha256,
  reg81.candidate_seed101_accepted_text_sha256);
assert.equal(review.cases[1].candidate_fact_passes, 0);
assert.equal(review.cases[1].baseline_fact_passes, 1);
for (const row of byCase('not_multicore_but_separate_chips', 'candidate'))
  assert(/две независимые чипы/u.test(row.accepted_text));
for (const row of byCase('real_dual_processor_single_core', 'candidate'))
  assert(/каждая процессор/u.test(row.accepted_text) &&
    /один ядро/u.test(row.accepted_text));
for (const item of packs[1].minimal_reproducers) {
  const row = byCase(item.case_id, 'candidate').find(row => row.seed === 101);
  assert.equal(row.source_text_sha256, item.source_text_sha256);
  assert.equal(row.accepted_text_sha256,
    item.candidate_seed101_accepted_text_sha256);
}
assert.equal(review.cases[3].candidate_language_issue_cells, 3);
assert.equal(review.cases[5].candidate_language_issue_cells, 3);
console.log('Qwen3 REG-081/082 checked: raw reproducers, six new controls each, AI-only rejection.');
