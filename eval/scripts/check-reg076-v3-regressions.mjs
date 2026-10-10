import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const read = name => fs.readFileSync(path.join(root, name));
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const machineBytes = read('eval/reports/2026-10-10-reg076-v3.json');
const reviewBytes = read('eval/reports/2026-10-10-reg076-v3-ai-review.json');
const machine = JSON.parse(machineBytes);
const review = JSON.parse(reviewBytes);
assert.equal(review.machine_report_sha256, sha(machineBytes));
const packs = ['reg-077-chip-core-contrast-v1.json',
  'reg-078-one-core-russian-agreement-v1.json'].map(name =>
  JSON.parse(read(`eval/regressions/${name}`)));
const [chip, grammar] = packs;
assert.deepEqual(packs.map(pack => pack.id), ['REG-077', 'REG-078']);
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
assert.equal(chip.minimal_reproducers.length, 2);
for (const repro of chip.minimal_reproducers) {
  const rows = machine.rows.filter(row => row.case_id === repro.case_id);
  assert.equal(rows.length, 6);
  assert.equal(rows[0].source_text_sha256, repro.source_text_sha256);
  assert.equal(rows[0].source_inventory_sha256,
    repro.source_inventory_sha256);
  assert.equal(repro.candidate_repeats, 3);
  assert.equal(repro.candidate_major_errors,
    review.verdicts[repro.case_id].candidate.filter(value => value ===
      'major_fact_error').length);
}
const denied = chip.minimal_reproducers[0];
const denied101 = machine.rows.find(row => row.case_id === denied.case_id &&
  row.seed === 101 && row.arm === 'candidate');
assert.equal(denied101.request_sha256,
  denied.candidate_seed101_request_sha256);
assert.equal(denied101.raw_http_sha256,
  denied.candidate_seed101_raw_http_sha256);
assert.equal(denied101.accepted_text_sha256,
  denied.candidate_seed101_accepted_text_sha256);
const variation = chip.minimal_reproducers[1];
const variation101 = machine.rows.filter(row => row.case_id ===
  variation.case_id && row.seed === 101);
assert.equal(variation101.length, 2);
assert.equal(variation101[0].request_sha256,
  variation.seed101_identical_request_sha256);
assert.equal(variation101[1].request_sha256,
  variation.seed101_identical_request_sha256);
assert.equal(variation101.find(row => row.arm === 'baseline')
  .accepted_text_sha256, variation.baseline_seed101_accepted_text_sha256);
const sampledCandidate = variation101.find(row => row.arm === 'candidate');
assert.equal(sampledCandidate.raw_http_sha256,
  variation.candidate_seed101_raw_http_sha256);
assert.equal(sampledCandidate.accepted_text_sha256,
  variation.candidate_seed101_accepted_text_sha256);
const oneCore = grammar.minimal_reproducer;
const oneCoreRows = machine.rows.filter(row => row.case_id ===
  oneCore.case_id);
assert.equal(oneCoreRows.length, 6);
assert.equal(oneCoreRows[0].source_text_sha256,
  oneCore.source_text_sha256);
assert.equal(oneCoreRows[0].source_inventory_sha256,
  oneCore.source_inventory_sha256);
assert.equal(new Set(oneCoreRows.map(row =>
  row.accepted_text_sha256)).size, 1);
assert.equal(oneCoreRows[0].accepted_text_sha256,
  oneCore.seed101_accepted_text_sha256_both);
assert.equal(oneCoreRows.filter(row => row.seed === 101).length, 2);
assert(oneCoreRows.filter(row => row.seed === 101).every(row =>
  row.request_sha256 === oneCore.seed101_identical_request_sha256));
assert.equal(oneCore.grammar_error_cells,
  review.summary.shared_grammar_error_cells);
console.log(JSON.stringify({ status: 'regression_packs_checked',
  packs: packs.map(pack => pack.id), minimal_reproducers: 3,
  new_controls: 12, control_model_runs: 0 }));
