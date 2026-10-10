import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const read = name => fs.readFile(path.join(root, name));
const [machineBytes, reviewBytes, oldReviewBytes, oldMachineBytes,
  reg077Bytes, reg078Bytes] = await Promise.all([
  read('eval/reports/2026-10-10-reg077-v4.json'),
  read('eval/reports/2026-10-10-reg077-v4-ai-review.json'),
  read('eval/reports/2026-10-10-reg076-v3-ai-review.json'),
  read('eval/reports/2026-10-10-reg076-v3.json'),
  read('eval/regressions/reg-077-chip-core-contrast-v1.json'),
  read('eval/regressions/reg-078-one-core-russian-agreement-v1.json'),
]);
assert.equal(sha(machineBytes),
  '1cd09c57dcad44e7eadcc1357faaa6cb1d901a620a129fdc845ed6bb6e17e8ae');
assert.equal(sha(oldReviewBytes),
  '313760eb3c19d82bf6d4f23c8b95c115e1b3805b0623d1667d837537a642434e');
assert.equal(sha(oldMachineBytes),
  'f16cea2e2840d87e3f1230ae9cf85e2fd80901fc3e6bb90df738ce75bc63cecb');
const machine = JSON.parse(machineBytes);
const review = JSON.parse(reviewBytes);
const old = JSON.parse(oldReviewBytes);
assert.equal(review.experiment, machine.experiment);
assert.equal(review.machine_report_sha256, sha(machineBytes));
assert.equal(review.prior_ai_review_sha256, sha(oldReviewBytes));
assert.equal(machine.chats, 192);
assert.equal(machine.prior_cells, 120);
assert.equal(machine.identical_prior_requests_and_outputs, 117);
assert.equal(review.summary.prior_identical_request_and_output_cells, 117);
assert.equal(review.summary.changed_prior_candidate_cells_reviewed, 3);
assert.equal(review.summary.new_control_cells_reviewed, 72);
assert.deepEqual(review.seed_order, [101, 202, 303]);
const reg077 = JSON.parse(reg077Bytes);
const reg078 = JSON.parse(reg078Bytes);
const newIds = [reg077, reg078].flatMap(pack =>
  [...pack.related_controls, ...pack.negative_controls].map(row => row.id));
assert.equal(new Set(newIds).size, 12);
assert.deepEqual(Object.keys(review.new_cases).sort(), [...newIds].sort());
const major = verdict => verdict === 'major_fact_error';
const grammar = verdict => verdict === 'fact_pass_grammar_error';
for (const id of newIds) {
  const verdict = review.new_cases[id];
  assert.equal(typeof verdict.finding, 'string');
  assert(verdict.finding.length > 25);
  for (const arm of ['baseline', 'candidate']) {
    assert.equal(verdict[arm].length, 3);
    for (const [index, seed] of review.seed_order.entries()) {
      assert(machine.rows.some(row => row.case_id === id && row.arm === arm &&
        row.seed === seed && row.status === 'valid_unreviewed'));
      assert(['major_fact_error', 'fact_pass',
        'fact_pass_grammar_error'].includes(verdict[arm][index]));
    }
  }
}
const changed = review.changed_prior_case;
assert.equal(changed.case_id, 'not_multicore_but_separate_chips');
assert.deepEqual(changed.candidate,
  ['major_fact_error', 'major_fact_error', 'major_fact_error']);
assert.deepEqual(old.verdicts[changed.case_id].candidate,
  changed.candidate);
for (const seed of review.seed_order) {
  const row = machine.rows.find(item => item.case_id === changed.case_id &&
    item.arm === 'candidate' && item.seed === seed);
  assert(row?.eligible_terms.includes('source:separate-chip-vs-one-multicore'));
}
const newMajor = arm => Object.values(review.new_cases).reduce((sum, item) =>
  sum + item[arm].filter(major).length, 0);
assert.equal(newMajor('baseline'), 3);
assert.equal(newMajor('candidate'), 3);
assert.equal(review.summary.baseline_major_fact_errors_selected_set,
  old.summary.baseline_major_fact_errors + newMajor('baseline'));
assert.equal(review.summary.candidate_major_fact_errors_selected_set,
  old.summary.candidate_major_fact_errors + newMajor('candidate'));
assert.equal(review.summary.candidate_new_control_cells, 36);
assert.equal(review.summary.candidate_new_control_fact_passes,
  review.summary.candidate_new_control_cells - newMajor('candidate'));
const newGrammar = Object.values(review.new_cases).reduce((sum, item) =>
  sum + ['baseline', 'candidate'].reduce((armSum, arm) =>
    armSum + item[arm].filter(grammar).length, 0), 0);
assert.equal(newGrammar, 12);
assert.equal(review.summary.shared_grammar_error_cells,
  old.summary.shared_grammar_error_cells + newGrammar);
assert.equal(review.summary.targeted_relation_card_cells, 6);
assert.equal(review.summary.targeted_relation_card_fact_passes, 0);
assert.equal(review.summary.paired_cases_reviewed_ai_only, 96);
assert.equal(review.summary.candidate_shortlisted, false);
assert.equal(review.summary.human_bilingual_reviews, 0);
assert.equal(review.summary.language_quality_score, null);
assert.equal(review.summary.full_file_quality_accepted, false);
assert.equal(review.summary.product_profile_changed, false);
console.log(JSON.stringify({ status: 'ai_review_record_checked',
  pairs: review.summary.paired_cases_reviewed_ai_only,
  targeted_card_fact_passes: review.summary.targeted_relation_card_fact_passes,
  human_reviews: review.summary.human_bilingual_reviews,
  review_sha256: sha(reviewBytes) }));
