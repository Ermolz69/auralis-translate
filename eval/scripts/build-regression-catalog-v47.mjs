import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const write = process.argv.length === 3 && process.argv[2] === '--write';
assert(process.argv.length === 2 || write);
const read = relative => fs.readFile(path.join(root, relative));
const digest = bytes => createHash('sha256').update(bytes).digest('hex');
const [baseBytes, machineBytes, reviewBytes, freezeBytes, packBytes] = await Promise.all([
  read('eval/regressions/catalog-v46.json'),
  read('eval/reports/2026-10-09-reg066-authored-v8-screen.json'),
  read('eval/reports/2026-10-09-reg066-authored-v8-screen-ai-review.json'),
  read('eval/experiments/2026-10-09-reg066-authored-v8-screen-freeze.json'),
  read('eval/regressions/reg-066-vivo-v8-cross-model-facts-v1.json'),
]);
assert.equal(digest(baseBytes),
  '93933952cae2533230e67ee040caad98dd97e12d8ac13839ae5b9af3bcaa83cd');
assert.equal(digest(machineBytes),
  'ac02b59ed3da899c6f253c21ee00106fa6c615615457487a41916ddbf489154d');
assert.equal(digest(reviewBytes),
  '99df8aaa4cb7f967d3d07e1a764182fbd5d305b302b152f8b8371f0a29e50c40');
const base = JSON.parse(baseBytes);
const machine = JSON.parse(machineBytes);
const review = JSON.parse(reviewBytes);
const freeze = JSON.parse(freezeBytes);
const pack = JSON.parse(packBytes);
assert.equal(base.schema_version, 46);
assert.deepEqual(base.entries.map(row => row.id),
  ['REG-062', 'REG-063', 'REG-065', 'REG-066']);
assert.equal(base.entries.at(-1).pack_sha256, digest(packBytes));
assert.equal(machine.control_pack_sha256, digest(packBytes));
assert.equal(machine.frozen_requests_sha256, digest(freezeBytes));
assert.equal(machine.chat_requests, 20);
assert.equal(machine.template_token_preflights, 40);
assert.equal(machine.observations.length, 20);
assert.equal(machine.human_bilingual_reviews, 0);
assert.equal(machine.accepted_language_quality, false);
assert.equal(review.machine_report_sha256, digest(machineBytes));
assert.deepEqual(review.summary['1_8b'], {
  fact_preserved: 8, needs_review: 2,
  major_fact_error: 0, awkward_russian: 5 });
assert.deepEqual(review.summary['7b'], {
  fact_preserved: 8, needs_review: 2,
  major_fact_error: 0, awkward_russian: 2 });
assert.equal(review.summary.human_bilingual_reviews, 0);
assert.equal(review.summary.natural_file_errors_resolved, false);
assert.equal(review.summary.model_promoted, false);
const evidenceRecord = 'eval/experiments/2026-10-09-reg066-authored-v8-screen-result.md';
await read(evidenceRecord);
const updated = base.entries.map(entry => entry.id === 'REG-066' ? {
  ...entry,
  last_outcome: 'Twenty real paired authored v8 chats were structurally valid. AI review found eight preserved facts and two needs-review cases per model, zero confirmed major errors in this small control set, and unresolved full-file fact drift. No model promoted.',
  control_screen_evidence_record: evidenceRecord,
  frozen_requests_sha256: digest(freezeBytes),
  machine_report_sha256: digest(machineBytes),
  ai_review_sha256: digest(reviewBytes),
  observed_related_controls_per_model: 5,
  observed_negative_controls_per_model: 5,
  human_review_count: 0,
} : entry);
const catalog = { schema_version: 47,
  catalog_id: 'zh-ru-development-regressions-v47',
  base_catalog_file: 'catalog-v46.json',
  base_catalog_sha256: digest(baseBytes),
  entries: updated };
const output = `${JSON.stringify(catalog, null, 2)}\n`;
const outputPath = path.join(root, 'eval/regressions/catalog-v47.json');
if (write) await fs.writeFile(outputPath, output, { flag: 'wx' });
else assert.equal(await fs.readFile(outputPath, 'utf8'), output);
console.log(`Catalog v47 ${write ? 'written' : 'verified'}: ten REG-066 authored controls observed on both v8 models; full-file language gates open.`);
