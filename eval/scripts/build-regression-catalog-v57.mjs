import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const write = process.argv.length === 3 && process.argv[2] === '--write';
assert(process.argv.length === 2 || write);
const read = relative => fs.readFile(path.join(root, relative));
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const [baseBytes, freezeBytes, machineBytes, reviewBytes,
  modifierBytes, agreementBytes] = await Promise.all([
  read('eval/regressions/catalog-v56.json'),
  read('eval/experiments/2026-10-10-qwen3-8b-local-screen-freeze.json'),
  read('eval/reports/2026-10-10-qwen3-8b-local-screen-v1.json'),
  read('eval/reports/2026-10-10-qwen3-8b-local-screen-ai-review.json'),
  read('eval/regressions/reg-081-qwen-all-big-core-loss-v1.json'),
  read('eval/regressions/reg-082-qwen-russian-agreement-v1.json'),
]);
assert.equal(sha(baseBytes),
  'a5273bd232c9d327a37d0c5a1d18cdf976fcc02c46afb0aa9c6f9e9ef4cd0245');
assert.equal(sha(freezeBytes),
  '6bc9a8b2c1f04f6717cd0e3e7fa27652fd31aacb28b54be9fac3de449bbef975');
assert.equal(sha(machineBytes),
  'b7928d632474da5e7da2c9272aacc050c444dd4bf17343141df871dce93889c5');
const base = JSON.parse(baseBytes);
const freeze = JSON.parse(freezeBytes);
const machine = JSON.parse(machineBytes);
const review = JSON.parse(reviewBytes);
const modifier = JSON.parse(modifierBytes);
const agreement = JSON.parse(agreementBytes);
assert.equal(base.schema_version, 56);
assert.equal(base.entries.at(-1).id, 'REG-080');
assert.equal(freeze.planned.length, 36);
assert.equal(machine.request_count, 36);
assert.equal(machine.preflight_count, 72);
assert.equal(machine.failure_count, 0);
assert.equal(review.machine_report_sha256, sha(machineBytes));
assert.equal(review.human_bilingual_reviews, 0);
assert.equal(review.decision, 'reject_candidate_before_cross_source_or_full_file');
assert.deepEqual([modifier.id, agreement.id], ['REG-081', 'REG-082']);
for (const pack of [modifier, agreement]) {
  assert.equal(pack.machine_report_sha256, sha(machineBytes));
  assert.equal(pack.ai_review_sha256, sha(reviewBytes));
  assert.equal(pack.related_controls.length, 3);
  assert.equal(pack.negative_controls.length, 3);
  assert.equal(pack.control_model_runs, 0);
}
assert.equal(modifier.minimal_reproducer.candidate_major_error_cells, 3);
assert.equal(agreement.minimal_reproducers.length, 2);
const evidence = 'eval/experiments/2026-10-10-qwen3-8b-local-screen-result.md';
await read(evidence);
const entry = (pack, category, file, count, packBytes, outcome) => ({
  id: pack.id, source_family: pack.source_family, split: pack.split,
  category, profile_scope: pack.profile_scope,
  expected_invariant: pack.expected_invariant,
  severity: pack.severity, pack_file: file,
  pack_sha256: sha(packBytes), minimal_reproducer_count: count,
  related_control_count: pack.related_controls.length,
  negative_control_count: pack.negative_controls.length,
  evidence_record: evidence, freeze_sha256: sha(freezeBytes),
  paired_machine_report_sha256: sha(machineBytes),
  ai_review_sha256: sha(reviewBytes), last_outcome: outcome });
const catalog = { schema_version: 57,
  catalog_id: 'zh-ru-development-regressions-v57',
  base_catalog_file: 'catalog-v56.json',
  base_catalog_sha256: sha(baseBytes),
  entries: [...base.entries,
    entry(modifier, 'all_big_core_modifier_loss',
      'reg-081-qwen-all-big-core-loss-v1.json', 1, modifierBytes,
      'Qwen3 drops the big-core modifier in all three natural repeats, including one matched v8 cell that preserved it; candidate rejected.'),
    entry(agreement, 'russian_chip_processor_core_agreement',
      'reg-082-qwen-russian-agreement-v1.json', 2, agreementBytes,
      'Qwen3 retains hardware counts but repeats chip/processor/core agreement errors in six authored cells; v8 is grammatical in those controls.')
  ] };
const output = `${JSON.stringify(catalog, null, 2)}\n`;
const outputPath = path.join(root, 'eval/regressions/catalog-v57.json');
if (write) await fs.writeFile(outputPath, output, { flag: 'wx' });
else assert.equal(await fs.readFile(outputPath, 'utf8'), output);
console.log(`Catalog v57 ${write ? 'written' : 'verified'}: REG-081/082 retained; Qwen3 rejected.`);
