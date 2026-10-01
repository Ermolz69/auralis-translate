import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve('.');
const directory = path.join(root, 'eval/regressions');
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const catalog = JSON.parse(fs.readFileSync(path.join(directory, 'catalog-v29.json')));
assert.equal(catalog.schema_version, 29);
assert.equal(catalog.catalog_id, 'zh-ru-development-regressions-v29');
assert.equal(sha(fs.readFileSync(path.join(directory, catalog.base_catalog_file))),
  catalog.base_catalog_sha256);
assert.deepEqual(catalog.entries.map(row => row.id), ['REG-045']);
const entry = catalog.entries[0];
const packBytes = fs.readFileSync(path.join(directory, entry.pack_file));
assert.equal(sha(packBytes), entry.pack_sha256);
const pack = JSON.parse(packBytes);
for (const field of ['id', 'severity', 'source_family', 'split', 'expected_invariant'])
  assert.equal(pack[field], entry[field]);
assert.equal(Number(Boolean(pack.minimal_reproducer)), entry.minimal_reproducer_count);
assert.equal(pack.related_controls.length, entry.related_control_count);
assert.equal(pack.negative_controls.length, entry.negative_control_count);
assert.equal(new Set([...pack.related_controls, ...pack.negative_controls]
  .map(row => row.id)).size, 6);
assert.equal(pack.minimal_reproducer.expected_diagnostic, 'approved_term_missing');
assert.equal(pack.control_model_runs, 0);
assert.equal(pack.human_review, 'missing');
assert.equal(pack.release_gate, 'open');
for (const file of [entry.evidence_record, pack.contract_test, pack.durability_test])
  assert(fs.existsSync(path.join(root, file)));
const contractTest = fs.readFileSync(path.join(root, pack.contract_test), 'utf8');
assert(contractTest.includes(pack.minimal_reproducer.source));
assert(contractTest.includes(pack.minimal_reproducer.approved_source));
assert(contractTest.includes(pack.minimal_reproducer.approved_target));
assert(contractTest.includes(pack.minimal_reproducer.accepted_target));
assert(contractTest.includes('DiagnosticCode::ApprovedTermMissing'));
console.log('REG-045 pinned: authored missing approved form warns without changing accepted text; real review remains open.');
