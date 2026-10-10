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
  chipBytes, grammarBytes] = await Promise.all([
  read('eval/regressions/catalog-v54.json'),
  read('eval/experiments/2026-10-10-reg-076-negated-multicore-v3-freeze.json'),
  read('eval/reports/2026-10-10-reg076-v3.json'),
  read('eval/reports/2026-10-10-reg076-v3-ai-review.json'),
  read('eval/regressions/reg-077-chip-core-contrast-v1.json'),
  read('eval/regressions/reg-078-one-core-russian-agreement-v1.json'),
]);
for (const [bytes, pinned] of [
  [baseBytes, '28198d3f355607718673b45d3f0fbfc5a43dfe7ae86f571289a2a796b7f394dc'],
  [freezeBytes, '9a8a91ec5d91f2c6338b181f4272854b968f6559d973bf72944b51b0c8c7d8a7'],
  [machineBytes, 'f16cea2e2840d87e3f1230ae9cf85e2fd80901fc3e6bb90df738ce75bc63cecb'],
  [reviewBytes, '313760eb3c19d82bf6d4f23c8b95c115e1b3805b0623d1667d837537a642434e'],
  [chipBytes, 'f7ac5bd4c9f5310719f23cb4b7a987fe38c09013d2c17e18f9d8b36f61f46bfa'],
  [grammarBytes, 'cb02e941b73d822119b2e5ed75f5b00dc7e0e3db8bc7a2f3408701dcd3565eed'],
]) assert.equal(sha(bytes), pinned);
const base = JSON.parse(baseBytes);
const freeze = JSON.parse(freezeBytes);
const machine = JSON.parse(machineBytes);
const review = JSON.parse(reviewBytes);
const chip = JSON.parse(chipBytes);
const grammar = JSON.parse(grammarBytes);
assert.equal(base.schema_version, 54);
assert.equal(base.entries.at(-1).id, 'REG-076');
assert.equal(freeze.planned.length, 120);
assert.equal(machine.chats, 120);
assert.equal(machine.preflights, 240);
assert.equal(review.summary.paired_cases_reviewed_ai_only, 60);
assert.equal(review.summary.candidate_major_fact_errors, 4);
assert.equal(review.summary.candidate_shortlisted, false);
assert.equal(review.summary.human_bilingual_reviews, 0);
assert.deepEqual([chip.id, grammar.id], ['REG-077', 'REG-078']);
assert.equal(chip.minimal_reproducers.length, 2);
assert.equal(grammar.minimal_reproducer.grammar_error_cells, 6);
for (const pack of [chip, grammar]) {
  assert.equal(pack.machine_report_sha256, sha(machineBytes));
  assert.equal(pack.ai_review_sha256, sha(reviewBytes));
  assert.equal(pack.related_controls.length, 3);
  assert.equal(pack.negative_controls.length, 3);
  assert.equal(pack.control_model_runs, 0);
}
const evidence = 'eval/experiments/2026-10-10-reg-076-negated-multicore-v3-result.md';
await read(evidence);
const entry = (pack, category, file, count, outcome) => ({
  id: pack.id, source_family: pack.source_family, split: pack.split,
  category, profile_scope: pack.profile_scope,
  expected_invariant: pack.expected_invariant,
  severity: pack.severity, pack_file: file,
  pack_sha256: sha(pack === chip ? chipBytes : grammarBytes),
  minimal_reproducer_count: count,
  related_control_count: pack.related_controls.length,
  negative_control_count: pack.negative_controls.length,
  evidence_record: evidence,
  freeze_sha256: sha(freezeBytes),
  paired_machine_report_sha256: sha(machineBytes),
  ai_review_sha256: sha(reviewBytes), last_outcome: outcome });
const catalog = { schema_version: 55,
  catalog_id: 'zh-ru-development-regressions-v55',
  base_catalog_file: 'catalog-v54.json',
  base_catalog_sha256: sha(baseBytes),
  entries: [...base.entries,
    entry(chip, 'chip_core_processor_contrast',
      'reg-077-chip-core-contrast-v1.json', 2,
      'The scoped candidate repaired one exposed negation but lost the related single-multi-core-chip distinction in all three seeds; another byte-identical control varied in one seed. Candidate rejected.'),
    entry(grammar, 'one_core_russian_agreement',
      'reg-078-one-core-russian-agreement-v1.json', 1,
      'All six real replies preserved one core per processor but used ungrammatical Russian agreement. Human review and model controls remain open.')
  ] };
const output = `${JSON.stringify(catalog, null, 2)}\n`;
const outputPath = path.join(root, 'eval/regressions/catalog-v55.json');
if (write) await fs.writeFile(outputPath, output, { flag: 'wx' });
else assert.equal(await fs.readFile(outputPath, 'utf8'), output);
console.log(`Catalog v55 ${write ? 'written' : 'verified'}: REG-077/078 retained; v3 rejected.`);
