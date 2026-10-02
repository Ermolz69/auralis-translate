import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve('.');
const directory = path.join(root, 'eval/regressions');
const digest = bytes => createHash('sha256').update(bytes).digest('hex');
const catalog = JSON.parse(fs.readFileSync(path.join(directory, 'catalog-v35.json')));
assert.equal(catalog.schema_version, 35);
assert.equal(catalog.catalog_id, 'zh-ru-development-regressions-v35');
assert.equal(digest(fs.readFileSync(path.join(directory, catalog.base_catalog_file))),
  catalog.base_catalog_sha256);
assert.deepEqual(catalog.entries.map(row => row.id), ['REG-053']);
const entry = catalog.entries[0];
const packBytes = fs.readFileSync(path.join(directory, entry.pack_file));
assert.equal(digest(packBytes), entry.pack_sha256);
const pack = JSON.parse(packBytes);
for (const field of ['id', 'severity', 'source_family', 'split', 'category',
  'profile_scope', 'expected_invariant']) assert.equal(pack[field], entry[field]);
assert.equal(Number(Boolean(pack.minimal_reproducer)), entry.minimal_reproducer_count);
assert.equal(pack.related_controls.length, entry.related_control_count);
assert.equal(pack.negative_controls.length, entry.negative_control_count);
assert.equal(new Set([...pack.related_controls, ...pack.negative_controls]
  .map(row => row.id)).size, 6);
assert([...pack.related_controls, ...pack.negative_controls]
  .every(row => row.model_runs === 0));
const report = JSON.parse(fs.readFileSync(path.join(root,
  'eval/reports/2026-10-02-reg-052-v8-controls.json')));
assert.equal(pack.minimal_reproducer.private_report_sha256, report.private_report_sha256);
for (const context of ['on', 'off']) {
  const row = report.rows.find(item => item.case_id === 'other_xiao_name_question'
    && item.seed === 202 && item.context === context);
  assert(row);
  assert.equal(row.request_sha256,
    pack.minimal_reproducer[`context_${context}_request_sha256`]);
  assert.equal(row.raw_candidate,
    pack.minimal_reproducer[`context_${context}_raw_candidate`]);
}
assert.match(pack.minimal_reproducer.context_on_raw_candidate, /^Заплатил ли/u);
assert(!pack.minimal_reproducer.context_off_raw_candidate.startsWith('Заплатил'));
assert.equal(pack.human_bilingual_review_count, 0);
assert.equal(pack.release_gate, 'open');
assert(fs.existsSync(path.join(root, entry.evidence_record)));
console.log('REG-053 pinned: real context payment-verb intrusion, exact paired raw responses and six unrun controls.');
