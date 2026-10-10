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
  relationBytes, grammarBytes] = await Promise.all([
  read('eval/regressions/catalog-v55.json'),
  read('eval/experiments/2026-10-10-reg-077-referent-v4-freeze.json'),
  read('eval/reports/2026-10-10-reg077-v4.json'),
  read('eval/reports/2026-10-10-reg077-v4-ai-review.json'),
  read('eval/regressions/reg-079-referent-card-recurrence-v1.json'),
  read('eval/regressions/reg-080-one-core-agreement-expansion-v1.json'),
]);
for (const [bytes, pinned] of [
  [baseBytes, '0263e59b32325215e705a3fcc4e96625f809a5be1df45c16c972f1e21555b342'],
  [freezeBytes, '95d3548ff895c9da654bc646aa3dac44a505f0f9a8896843f164bc204cea42dd'],
  [machineBytes, '1cd09c57dcad44e7eadcc1357faaa6cb1d901a620a129fdc845ed6bb6e17e8ae'],
  [reviewBytes, '299ef270b466f79f66e3a720c006026e28c4ff8679e08a7ed978d087cb09206d'],
  [relationBytes, '4edd1257eb1d98d2bbaa78d28863f513de88ee09950a67c2bfb059cef3c78cc5'],
  [grammarBytes, 'efc65a80d4b32bbf5b29c0f0088cae12ffcaa4222f0e714b86150acd55f8af76'],
]) assert.equal(sha(bytes), pinned);
const base = JSON.parse(baseBytes);
const freeze = JSON.parse(freezeBytes);
const machine = JSON.parse(machineBytes);
const review = JSON.parse(reviewBytes);
const relation = JSON.parse(relationBytes);
const grammar = JSON.parse(grammarBytes);
assert.equal(base.schema_version, 55);
assert.equal(base.entries.at(-1).id, 'REG-078');
assert.equal(freeze.planned.length, 192);
assert.equal(machine.chats, 192);
assert.equal(machine.preflights, 384);
assert.equal(review.summary.paired_cases_reviewed_ai_only, 96);
assert.equal(review.summary.targeted_relation_card_fact_passes, 0);
assert.equal(review.summary.candidate_shortlisted, false);
assert.equal(review.summary.human_bilingual_reviews, 0);
assert.deepEqual([relation.id, grammar.id], ['REG-079', 'REG-080']);
assert.equal(relation.minimal_reproducer.candidate_major_errors, 3);
assert.equal(grammar.minimal_reproducers.length, 2);
for (const pack of [relation, grammar]) {
  assert.equal(pack.machine_report_sha256, sha(machineBytes));
  assert.equal(pack.ai_review_sha256, sha(reviewBytes));
  assert.equal(pack.related_controls.length, 3);
  assert.equal(pack.negative_controls.length, 3);
  assert.equal(pack.control_model_runs, 0);
}
const evidence = 'eval/experiments/2026-10-10-reg-077-referent-v4-result.md';
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
const catalog = { schema_version: 56,
  catalog_id: 'zh-ru-development-regressions-v56',
  base_catalog_file: 'catalog-v55.json',
  base_catalog_sha256: sha(baseBytes),
  entries: [...base.entries,
    entry(relation, 'source_relation_card_referent_failure',
      'reg-079-referent-card-recurrence-v1.json', 1, relationBytes,
      'The source relation card still changed one multi-core chip into one multi-processor chip in all six exposed candidate replies; v4 rejected.'),
    entry(grammar, 'one_core_russian_agreement_expansion',
      'reg-080-one-core-agreement-expansion-v1.json', 2, grammarBytes,
      'Two additional one-core forms reproduced the Russian agreement error in all twelve paired replies; human review and new controls remain open.')
  ] };
const output = `${JSON.stringify(catalog, null, 2)}\n`;
const outputPath = path.join(root, 'eval/regressions/catalog-v56.json');
if (write) await fs.writeFile(outputPath, output, { flag: 'wx' });
else assert.equal(await fs.readFile(outputPath, 'utf8'), output);
console.log(`Catalog v56 ${write ? 'written' : 'verified'}: REG-079/080 retained; v4 rejected.`);
