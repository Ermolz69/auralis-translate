import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const directory = path.join(root, 'eval/regressions');
const digest = bytes => createHash('sha256').update(bytes).digest('hex');
const catalog = JSON.parse(await fs.readFile(path.join(directory, 'catalog-v21.json')));
assert.equal(catalog.schema_version, 21);
assert.equal(catalog.catalog_id, 'zh-ru-development-regressions-v21');
assert.equal(catalog.base_catalog_file, 'catalog-v20.json');
assert.equal(digest(await fs.readFile(path.join(directory, catalog.base_catalog_file))),
  catalog.base_catalog_sha256);
assert.deepEqual(catalog.entries.map(entry => entry.id), ['REG-036']);
const entry = catalog.entries[0];
const bytes = await fs.readFile(path.join(directory, entry.pack_file));
assert.equal(digest(bytes), entry.pack_sha256);
const pack = JSON.parse(bytes);
assert.equal(pack.id, entry.id);
assert.equal(pack.status, 'uppercase_capacity_g_false_positive');
assert.equal(pack.severity, entry.severity);
assert.equal(pack.source_family, entry.source_family);
assert.equal(pack.split, entry.split);
assert.equal(pack.expected_invariant, entry.expected_invariant);
assert.equal(pack.minimal_reproducer.length, entry.minimal_reproducer_count);
assert.equal(pack.related_controls.length, entry.related_control_count);
assert.equal(pack.negative_controls.length, entry.negative_control_count);
assert.deepEqual(pack.minimal_reproducer.map(row => [row.expected_warning, row.before_fix_warning]),
  [[false, true], [false, true]]);
assert(pack.related_controls.every(row => row.expected_warning === true));
assert(pack.negative_controls.every(row => row.expected_warning === false));
assert.deepEqual(pack.private_reproducer.cue_ids, [81, 83]);
assert.deepEqual(pack.private_reproducer.before_fix_warning_ids, [12, 81, 83, 127, 145, 227]);
assert.deepEqual(pack.private_reproducer.after_fix_warning_ids, [12, 127, 145, 227]);
assert.equal(pack.control_model_runs, 0);
assert.equal(pack.human_review, 'missing');
assert.equal(pack.release_gate, 'open');
const ids = [...pack.minimal_reproducer, ...pack.related_controls, ...pack.negative_controls]
  .map(row => row.id);
assert.equal(new Set(ids).size, ids.length);
const test = await fs.readFile(path.join(root,
  'crates/auralis-translation/tests/measurement_diagnostics.rs'), 'utf8');
for (const row of [...pack.minimal_reproducer, ...pack.related_controls,
  ...pack.negative_controls]) {
  assert(test.includes(`"${row.source}"`), `missing source control ${row.id}`);
  assert(test.includes(`"${row.candidate}"`), `missing candidate control ${row.id}`);
}
await fs.access(path.join(root, entry.evidence_record));
console.log('Regression catalog verified: 36 pinned packs through REG-036; uppercase-G capacity controls are executable.');
