import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve('.');
const directory = path.join(root, 'eval/regressions');
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
const catalog = JSON.parse(fs.readFileSync(path.join(directory, 'catalog-v33.json')));
assert.equal(catalog.schema_version, 33);
assert.equal(catalog.catalog_id, 'zh-ru-development-regressions-v33');
assert.equal(sha256(fs.readFileSync(path.join(directory, catalog.base_catalog_file))),
  catalog.base_catalog_sha256);
assert.deepEqual(catalog.entries.map(row => row.id), ['REG-051']);
const entry = catalog.entries[0];
const packBytes = fs.readFileSync(path.join(directory, entry.pack_file));
assert.equal(sha256(packBytes), entry.pack_sha256);
const pack = JSON.parse(packBytes);
for (const field of ['id', 'severity', 'source_family', 'split', 'expected_invariant'])
  assert.equal(pack[field], entry[field]);
assert.equal(Number(Boolean(pack.minimal_reproducer)), entry.minimal_reproducer_count);
assert.equal(pack.related_controls.length, entry.related_control_count);
assert.equal(pack.negative_controls.length, entry.negative_control_count);
assert.equal(new Set([...pack.related_controls, ...pack.negative_controls]
  .map(row => row.id)).size, 6);
assert.equal(pack.minimal_reproducer.old_outcome, 'validated_batch_with_wrong_meaning');
assert.equal(pack.minimal_reproducer.new_outcome, 'invalid_candidate_no_checkpoint');
assert.equal(pack.release_gate, 'open');
assert(fs.existsSync(path.join(root, entry.evidence_record)));
const test = fs.readFileSync(path.join(root, pack.contract_test), 'utf8');
for (const phrase of ['v7_rejects_currency_copied_from_context_into_nonmoney_target',
  'десять юаней', 'сто долларов', 'пять евро', 'европейский',
  'v7_maps_multiline_money_and_context_without_exposing_context_as_target']) {
  assert(test.includes(phrase), `missing REG-051 control: ${phrase}`);
}
console.log('REG-051 pinned: real context-money leak rejected before checkpoint; meaning gate open.');
