import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { digest } from './flores-file-fixture.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const directory = path.join(root, 'eval/regressions');
const catalog = JSON.parse(await fs.readFile(path.join(directory, 'catalog-v3.json')));
assert.equal(catalog.schema_version, 3);
assert.equal(catalog.catalog_id, 'zh-ru-development-regressions-v3');
assert.equal(catalog.base_catalog_file, 'catalog-v2.json');
const baseBytes = await fs.readFile(path.join(directory, catalog.base_catalog_file));
assert.equal(digest(baseBytes), catalog.base_catalog_sha256);
const base = JSON.parse(baseBytes);
assert.equal(base.entries.length, 9);
assert.equal(catalog.entries.length, 1);
const ids = [...base.entries, ...catalog.entries].map(entry => entry.id);
assert.deepEqual(ids, Array.from({ length: 10 }, (_, index) =>
  `REG-${String(index + 1).padStart(3, '0')}`));
const fields = ['id', 'pack_file', 'pack_sha256', 'source_family', 'split',
  'category', 'profile_scope', 'expected_invariant', 'severity',
  'related_control_count', 'negative_control_count', 'evidence_record', 'last_outcome'];
for (const row of catalog.entries) {
  assert.deepEqual(Object.keys(row).sort(), [...fields].sort());
  assert.equal(row.split, 'development');
  assert.equal(row.severity, 'major');
  assert(row.related_control_count >= 2);
  assert(row.negative_control_count >= 1);
  const packBytes = await fs.readFile(path.join(directory, row.pack_file));
  assert.equal(digest(packBytes), row.pack_sha256);
  const pack = JSON.parse(packBytes);
  assert.equal(pack.id, row.id);
  assert.equal(pack.source_family, row.source_family);
  assert.equal(pack.expected_invariant, row.expected_invariant);
  assert.equal(pack.severity, row.severity);
  assert.equal(pack.related_controls.length, row.related_control_count);
  assert.equal(pack.negative_controls.length, row.negative_control_count);
  await fs.access(path.join(root, row.evidence_record));
}
console.log(`Regression catalog verified: ${ids.length} pinned packs, including REG-010.`);
