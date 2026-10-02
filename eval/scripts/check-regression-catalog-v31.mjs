import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve('.');
const directory = path.join(root, 'eval/regressions');
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
const catalog = JSON.parse(fs.readFileSync(path.join(directory, 'catalog-v31.json')));
assert.equal(catalog.schema_version, 31);
assert.equal(catalog.catalog_id, 'zh-ru-development-regressions-v31');
assert.equal(sha256(fs.readFileSync(path.join(directory, catalog.base_catalog_file))),
  catalog.base_catalog_sha256);
assert.deepEqual(catalog.entries.map(row => row.id),
  ['REG-047', 'REG-048', 'REG-049']);
for (const entry of catalog.entries) {
  const bytes = fs.readFileSync(path.join(directory, entry.pack_file));
  assert.equal(sha256(bytes), entry.pack_sha256);
  const pack = JSON.parse(bytes);
  for (const field of ['id', 'severity', 'source_family', 'split',
    'expected_invariant']) assert.equal(pack[field], entry[field]);
  assert.equal(Number(Boolean(pack.minimal_reproducer)),
    entry.minimal_reproducer_count);
  assert.equal(pack.related_controls.length, entry.related_control_count);
  assert.equal(pack.negative_controls.length, entry.negative_control_count);
  const controls = [...pack.related_controls, ...pack.negative_controls];
  assert.equal(new Set(controls.map(row => row.id)).size, controls.length);
  assert(controls.every(row => row.id && row.condition));
  assert(fs.existsSync(path.join(root, entry.evidence_record)));
  assert(fs.existsSync(path.join(root, pack.contract_test)));
  assert.equal(pack.release_gate, 'open');
}
const name = JSON.parse(fs.readFileSync(path.join(directory,
  'paywall-source-name-omission-v1.json')));
const nameTest = fs.readFileSync(path.join(root, name.contract_test), 'utf8');
assert(nameTest.includes(name.minimal_reproducer.source.split('\n')[0]));
assert(nameTest.includes(name.minimal_reproducer.accepted_target.split('\n')[0]));
assert.equal(name.minimal_reproducer.expected_surface_flag, true);
const amount = JSON.parse(fs.readFileSync(path.join(directory,
  'paywall-russian-number-grouping-v1.json')));
const amountTest = fs.readFileSync(path.join(root, amount.contract_test), 'utf8');
assert(amountTest.includes(amount.minimal_reproducer.accepted_target_surface));
assert.equal(amount.minimal_reproducer.expected_surface_flag, true);
const slots = JSON.parse(fs.readFileSync(path.join(directory,
  'paywall-multiline-slot-budget-v1.json')));
assert.deepEqual([slots.minimal_reproducer.cue_count,
  slots.minimal_reproducer.text_slot_count,
  slots.minimal_reproducer.observed_paywall_total_cues,
  slots.minimal_reproducer.observed_paywall_total_text_slots], [4, 5, 12, 16]);
console.log('REG-047–049 pinned: one observed name omission, one numeric reading risk and the repaired future slot-budget check.');
