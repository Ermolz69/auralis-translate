import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const machineBytes = fs.readFileSync(path.join(root,
  'eval/reports/2026-10-10-reg076-v3.json'));
const reviewBytes = fs.readFileSync(path.join(root,
  'eval/reports/2026-10-10-reg076-v3-ai-review.json'));
const machine = JSON.parse(machineBytes);
const review = JSON.parse(reviewBytes);
assert.equal(review.machine_report_sha256, sha(machineBytes));
assert.equal(review.experiment, machine.experiment);
assert.deepEqual(review.seed_order, [101, 202, 303]);
assert.equal(machine.rows.length, 120);
assert.equal(machine.human_bilingual_reviews, 0);
assert.equal(review.summary.human_bilingual_reviews, 0);
const caseIds = [...new Set(machine.rows.map(row => row.case_id))];
assert.deepEqual(Object.keys(review.verdicts), caseIds);
const allowed = new Set(['major_fact_error', 'fact_pass',
  'fact_pass_style_review', 'fact_pass_actor_review',
  'fact_pass_term_review', 'fact_pass_grammar_error']);
for (const caseId of caseIds) {
  const reviewed = review.verdicts[caseId];
  assert.equal(typeof reviewed.finding, 'string');
  assert(reviewed.finding.length > 20);
  for (const arm of ['baseline', 'candidate']) {
    assert.equal(reviewed[arm].length, 3);
    for (const [index, seed] of review.seed_order.entries()) {
      assert(allowed.has(reviewed[arm][index]));
      assert.equal(machine.rows.filter(row => row.case_id === caseId &&
        row.arm === arm && row.seed === seed).length, 1);
    }
  }
}
const count = (arm, verdict) => caseIds.reduce((sum, id) => sum +
  review.verdicts[id][arm].filter(item => item === verdict).length, 0);
assert.equal(count('baseline', 'major_fact_error'),
  review.summary.baseline_major_fact_errors);
assert.equal(count('candidate', 'major_fact_error'),
  review.summary.candidate_major_fact_errors);
assert.equal(count('baseline', 'fact_pass_grammar_error') +
  count('candidate', 'fact_pass_grammar_error'),
review.summary.shared_grammar_error_cells);
assert.equal(review.summary.paired_cases_reviewed_ai_only, 60);
assert.equal(review.summary.candidate_new_reg076_control_cells, 18);
const controlIds = ['not_multicore_but_separate_chips',
  'multicore_inside_each_chip', 'not_more_processors',
  'actual_multiple_processors', 'single_multicore_chip',
  'three_chips_without_core_claim'];
const controlPasses = controlIds.reduce((sum, id) => sum +
  review.verdicts[id].candidate.filter(item => item !==
    'major_fact_error').length, 0);
assert.equal(controlPasses,
  review.summary.candidate_new_reg076_control_fact_passes);
assert.deepEqual(review.verdicts.multiple_chip_count.candidate,
  ['fact_pass', 'fact_pass', 'fact_pass']);
assert.deepEqual(review.verdicts.not_multicore_but_separate_chips.candidate,
  ['major_fact_error', 'major_fact_error', 'major_fact_error']);
assert.equal(review.verdicts.multicore_inside_each_chip.candidate[0],
  'major_fact_error');
for (const seed of review.seed_order) {
  const pair = machine.rows.filter(row => row.case_id ===
    'multicore_inside_each_chip' && row.seed === seed);
  assert.equal(pair[0].request_sha256, pair[1].request_sha256);
}
assert.equal(review.summary.natural_technical_fact_repairs, 2);
assert.equal(review.summary.candidate_shortlisted, false);
assert.equal(review.summary.product_profile_changed, false);
assert.equal(review.summary.full_file_quality_accepted, false);
console.log(JSON.stringify({ status: 'ai_review_record_checked', cases: 20,
  pairs: 60, candidate_major_errors:
    review.summary.candidate_major_fact_errors,
  human_reviews: 0, review_sha256: sha(reviewBytes) }));
