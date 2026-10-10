import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const read = name => fs.readFileSync(path.join(root, name));
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const machineBytes = read('eval/reports/2026-10-10-reg077-v4.json');
const reviewBytes = read('eval/reports/2026-10-10-reg077-v4-ai-review.json');
const machine = JSON.parse(machineBytes);
const review = JSON.parse(reviewBytes);
assert.equal(review.machine_report_sha256, sha(machineBytes));
const packs = ['reg-079-referent-card-recurrence-v1.json',
  'reg-080-one-core-agreement-expansion-v1.json'].map(name =>
  JSON.parse(read(`eval/regressions/${name}`)));
const [referent, grammar] = packs;
assert.deepEqual(packs.map(pack => pack.id), ['REG-079', 'REG-080']);
for (const pack of packs) {
  assert.equal(pack.machine_report_sha256, sha(machineBytes));
  assert.equal(pack.ai_review_sha256, sha(reviewBytes));
  assert.equal(pack.control_model_runs, 0);
  assert.equal(pack.human_review, 'missing');
  assert.equal(pack.related_controls.length, 3);
  assert.equal(pack.negative_controls.length, 3);
  assert.equal(new Set([...pack.related_controls,
    ...pack.negative_controls].map(row => row.id)).size, 6);
  for (const row of [...pack.related_controls, ...pack.negative_controls]) {
    assert.equal(row.source_lines.length, 1);
    assert.equal(row.outcome, 'pending_model_screen');
  }
}
const relation = referent.minimal_reproducer;
const relationRows = machine.rows.filter(row => row.case_id === relation.case_id);
assert.equal(relationRows.length, 6);
assert(relationRows.every(row =>
  row.source_text_sha256 === relation.source_text_sha256 &&
  row.source_inventory_sha256 === relation.source_inventory_sha256));
assert.equal(relation.candidate_repeats, 3);
assert.equal(relation.candidate_major_errors,
  review.new_cases[relation.case_id].candidate.filter(value =>
    value === 'major_fact_error').length);
const relation101 = relationRows.find(row => row.seed === 101 &&
  row.arm === 'candidate');
assert.equal(relation101.request_sha256,
  relation.candidate_seed101_request_sha256);
assert.equal(relation101.raw_http_sha256,
  relation.candidate_seed101_raw_http_sha256);
assert.equal(relation101.accepted_text_sha256,
  relation.candidate_seed101_accepted_text_sha256);
assert.equal(grammar.minimal_reproducers.length, 2);
for (const repro of grammar.minimal_reproducers) {
  const rows = machine.rows.filter(row => row.case_id === repro.case_id);
  assert.equal(rows.length, 6);
  assert(rows.every(row => row.source_text_sha256 ===
    repro.source_text_sha256 && row.source_inventory_sha256 ===
    repro.source_inventory_sha256));
  assert.equal(repro.grammar_error_cells, 6);
  assert.deepEqual(review.new_cases[repro.case_id].candidate,
    ['fact_pass_grammar_error', 'fact_pass_grammar_error',
      'fact_pass_grammar_error']);
  const seed101 = rows.filter(row => row.seed === 101);
  assert.equal(seed101.length, 2);
  assert(seed101.every(row => row.request_sha256 ===
    repro.seed101_request_sha256_both &&
    row.accepted_text_sha256 ===
    repro.seed101_accepted_text_sha256_both));
}
console.log(JSON.stringify({ status: 'regression_packs_checked',
  packs: packs.map(pack => pack.id), minimal_reproducers: 3,
  new_controls: 12, control_model_runs: 0 }));
