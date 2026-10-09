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
const [baseBytes, v1Bytes, v2Bytes, packBytes] = await Promise.all([
  read('eval/regressions/catalog-v52.json'),
  read('eval/reports/2026-10-10-vivo-source-quantity-feature-v1.json'),
  read('eval/reports/2026-10-10-vivo-source-quantity-feature-v2.json'),
  read('eval/regressions/reg-074-source-quantity-false-positives-v1.json'),
]);
assert.equal(sha(v1Bytes),
  'f13d6efcd08e0a166055551050d110a2b8b81c9f42e62b12d210a764477d64ec');
assert.equal(sha(v2Bytes),
  '4fa3ca708ddce06e63f496610669930050ab09440ae8296318b70b2b7bfa51ad');
const base = JSON.parse(baseBytes);
const v1 = JSON.parse(v1Bytes);
const v2 = JSON.parse(v2Bytes);
const pack = JSON.parse(packBytes);
assert.equal(base.schema_version, 52);
assert.equal(base.entries.at(-1).id, 'REG-073');
assert.equal(pack.id, 'REG-074');
assert.equal(pack.source_sha256, v1.source_sha256);
assert.equal(pack.v1_report_sha256, sha(v1Bytes));
assert.equal(v2.source_sha256, v1.source_sha256);
assert.equal(v2.v1_report_sha256, sha(v1Bytes));
assert.equal(v2.regression_pack_sha256, sha(packBytes));
assert.equal(v1.matched_cues, 20);
assert.equal(v2.v2_matched_cues, 15);
assert.deepEqual(v2.added_ids, []);
assert.deepEqual(v2.removed_ids, [85, 236, 283, 306, 415]);
assert.equal(pack.minimal_reproducers.length, 5);
assert.equal(pack.related_controls.length, 5);
assert.equal(pack.negative_controls.length, 5);
assert.deepEqual(v2.known_false_positives.map(row => row.id),
  pack.minimal_reproducers.map(row => row.cue_id));
for (const repro of pack.minimal_reproducers) {
  assert(v1.matches.some(row => row.id === repro.cue_id &&
    row.source_text_sha256 === repro.source_text_sha256));
  assert(!v2.matches.some(row => row.id === repro.cue_id));
}
assert.equal(v1.translation_drafts_read, 0);
assert.equal(v2.translation_drafts_read, 0);
assert.equal(v1.model_requests, 0);
assert.equal(v2.model_requests, 0);
const evidence = 'eval/experiments/2026-10-10-source-quantity-feature-v2-result.md';
await read(evidence);
const catalog = { schema_version: 53,
  catalog_id: 'zh-ru-development-regressions-v53',
  base_catalog_file: 'catalog-v52.json',
  base_catalog_sha256: sha(baseBytes),
  entries: [...base.entries, {
    id: pack.id, source_family: pack.source_family, split: pack.split,
    category: 'source_numeric_sampler_false_positives',
    profile_scope: 'evaluation-only source quantity classifier v1/v2',
    expected_invariant: 'Do not classify ordinal labels, idiomatic one-point wording, or separated product model names as measured source quantities.',
    severity: pack.severity,
    pack_file: 'reg-074-source-quantity-false-positives-v1.json',
    pack_sha256: sha(packBytes),
    minimal_reproducer_count: pack.minimal_reproducers.length,
    related_control_count: pack.related_controls.length,
    negative_control_count: pack.negative_controls.length,
    evidence_record: evidence,
    rejected_v1_report_sha256: sha(v1Bytes),
    bounded_v2_report_sha256: sha(v2Bytes),
    last_outcome: 'Source-only v2 removes five known v1 false-positive cues, with no added marks and ten authored controls passed; cross-source accuracy and translation gates remain open.'
  }] };
const output = `${JSON.stringify(catalog, null, 2)}\n`;
const outputPath = path.join(root, 'eval/regressions/catalog-v53.json');
if (write) await fs.writeFile(outputPath, output, { flag: 'wx' });
else assert.equal(await fs.readFile(outputPath, 'utf8'), output);
console.log(`Catalog v53 ${write ? 'written' : 'verified'}: REG-074 v1 rejection and v2 bounded source replay pinned.`);
