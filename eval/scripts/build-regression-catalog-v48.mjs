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
const [baseBytes, machineBytes, reviewBytes, freezeBytes, omissionBytes,
  languageBytes] = await Promise.all([
  read('eval/regressions/catalog-v47.json'),
  read('eval/reports/2026-10-09-reg066-natural-seams.json'),
  read('eval/reports/2026-10-09-reg066-natural-seams-ai-review.json'),
  read('eval/experiments/2026-10-09-reg066-natural-seams-freeze.json'),
  read('eval/regressions/reg-067-vivo-shifted-tail-id-omission-v1.json'),
  read('eval/regressions/reg-068-vivo-shifted-mixed-script-v1.json'),
]);
assert.equal(digest(baseBytes),
  'aa3ebef4ecfb55a2373cc481b8232a74ed312c2400c0814c4ff86fad164b5550');
assert.equal(digest(machineBytes),
  '91399791c61f9daa8fc3f6e1adc9457871f86a7ea5641179524209b7f3dbb6ef');
assert.equal(digest(reviewBytes),
  '970eeb289978bf498eea2cbe72c64f9bc600cd3bb340028a21bf182cea8c25a5');
const base = JSON.parse(baseBytes);
const machine = JSON.parse(machineBytes);
const review = JSON.parse(reviewBytes);
const freeze = JSON.parse(freezeBytes);
const omission = JSON.parse(omissionBytes);
const language = JSON.parse(languageBytes);
assert.equal(base.schema_version, 47);
assert.deepEqual(base.entries.map(entry => entry.id),
  ['REG-062', 'REG-063', 'REG-065', 'REG-066']);
assert.equal(machine.freeze_sha256, digest(freezeBytes));
assert.equal(review.machine_report_sha256, digest(machineBytes));
assert.equal(machine.chat_requests, 30);
assert.equal(machine.template_token_preflights, 60);
assert.equal(machine.structurally_valid, 28);
assert.equal(machine.structurally_invalid, 2);
assert.equal(machine.human_bilingual_reviews, 0);
assert.equal(review.human_bilingual_reviews, 0);
assert.equal(review.summary.observed_7b_time_repairs, 1);
assert.equal(review.summary.new_tail_id_omissions, 2);
assert.equal(review.summary.new_mixed_script_observations, 1);
assert.equal(review.summary.shifted_candidate_promoted, false);
assert.equal(omission.id, 'REG-067');
assert.equal(language.id, 'REG-068');
for (const pack of [omission, language]) {
  assert.equal(pack.source_sha256, machine.source_sha256);
  assert.equal(pack.frozen_request_sha256, digest(freezeBytes));
  assert.equal(pack.machine_report_sha256, digest(machineBytes));
  assert(pack.related_controls.length >= 2);
  assert(pack.negative_controls.length >= 2);
  assert.equal(new Set([...pack.related_controls, ...pack.negative_controls]
    .map(row => row.id)).size,
  pack.related_controls.length + pack.negative_controls.length);
  assert(pack.related_controls.every(row => row.outcome === 'pending_model_screen'));
}
const find = (model, caseId, variant) => machine.observations.find(row =>
  row.model === model && row.case_id === caseId && row.variant === variant);
const invalid = machine.observations.filter(row => row.status === 'invalid_unreviewed');
assert.equal(invalid.length, 2);
assert.deepEqual(invalid.map(row => row.model), ['1_8b', '7b']);
for (const pinned of omission.minimal_reproducer.models) {
  const row = find(pinned.id, 'natural_466', 'shifted');
  assert(row);
  assert.equal(row.status, 'invalid_unreviewed');
  assert.deepEqual(row.target_ids, omission.minimal_reproducer.target_ids);
  assert.equal(row.request_sha256, pinned.request_sha256);
  assert.equal(row.raw_http_sha256, pinned.raw_http_sha256);
  assert(row.validation_error.includes('467'));
  assert.equal(find(pinned.id, 'natural_466', 'original').status,
    'valid_unreviewed');
}
const french = find('1_8b', 'natural_60', 'shifted');
assert.equal(french.status, 'valid_unreviewed');
assert.deepEqual(french.target_ids, language.minimal_reproducer.shifted_target_ids);
assert.equal(french.request_sha256, language.minimal_reproducer.request_sha256);
assert.equal(french.raw_http_sha256, language.minimal_reproducer.raw_http_sha256);
assert.equal(french.raw_candidate_sha256,
  language.minimal_reproducer.raw_candidate_sha256);
assert.deepEqual(french.translated_ids, [58, 59, 60, 61]);
for (const model of ['1_8b', '7b']) {
  const negatives = machine.observations.filter(row =>
    row.model === model && row.kind === 'negative');
  assert.equal(negatives.length, 5);
  assert(negatives.every(row => row.status === 'valid_unreviewed'));
}
const evidenceRecord = 'eval/experiments/2026-10-09-reg066-natural-seams-result.md';
await read(evidenceRecord);
const catalog = { schema_version: 48,
  catalog_id: 'zh-ru-development-regressions-v48',
  base_catalog_file: 'catalog-v47.json',
  base_catalog_sha256: digest(baseBytes),
  entries: [
    ...base.entries.map(entry => entry.id === 'REG-066' ? {
      ...entry,
      last_outcome: 'A 30-chat natural cue-seam screen retained all raw results. One 7B time fact improved once, while planning, team and future-product risks remained; the shifted candidate lost the final cue in both models and caused 1.8B mixed script. No promotion.',
      natural_seam_evidence_record: evidenceRecord,
      natural_seam_machine_report_sha256: digest(machineBytes),
      natural_seam_ai_review_sha256: digest(reviewBytes),
      natural_seam_frozen_requests_sha256: digest(freezeBytes),
      human_review_count: 0,
    } : entry),
    { id: 'REG-067', source_family: omission.source_family,
      split: omission.split, category: 'shifted_final_batch_drops_last_target_id',
      profile_scope: 'Hy-MT2 1.8B and 7B Q4_K_M v8 on the same original Vivo SRT',
      expected_invariant: omission.expected_invariant, severity: omission.severity,
      pack_file: 'reg-067-vivo-shifted-tail-id-omission-v1.json',
      pack_sha256: digest(omissionBytes), minimal_reproducer_count: 2,
      related_control_count: omission.related_controls.length,
      negative_control_count: omission.negative_controls.length,
      evidence_record: evidenceRecord,
      last_outcome: 'Both shifted final-batch replies omitted cue 467; validation rejected them. Authored follow-up controls remain unrun.' },
    { id: 'REG-068', source_family: language.source_family,
      split: language.split, category: 'unlicensed_french_word_in_russian_target',
      profile_scope: 'Hy-MT2 1.8B Q4_K_M v8 shifted natural Vivo cue group',
      expected_invariant: language.expected_invariant, severity: language.severity,
      pack_file: 'reg-068-vivo-shifted-mixed-script-v1.json',
      pack_sha256: digest(languageBytes), minimal_reproducer_count: 1,
      related_control_count: language.related_controls.length,
      negative_control_count: language.negative_controls.length,
      evidence_record: evidenceRecord,
      last_outcome: 'A shifted cue-60 reply introduced génération where the paired original did not. Authored follow-up controls remain unrun.' },
  ] };
const output = `${JSON.stringify(catalog, null, 2)}\n`;
const outputPath = path.join(root, 'eval/regressions/catalog-v48.json');
if (write) await fs.writeFile(outputPath, output, { flag: 'wx' });
else assert.equal(await fs.readFile(outputPath, 'utf8'), output);
console.log(`Catalog v48 ${write ? 'written' : 'verified'}: exact REG-067/068 failures retained, follow-up controls pending; release gates open.`);
