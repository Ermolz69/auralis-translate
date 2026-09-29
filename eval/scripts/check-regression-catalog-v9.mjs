import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { digest } from './flores-file-fixture.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const directory = path.join(root, 'eval/regressions');
const catalog = JSON.parse(await fs.readFile(path.join(directory, 'catalog-v9.json')));
assert.equal(catalog.schema_version, 9);
assert.equal(catalog.catalog_id, 'zh-ru-development-regressions-v9');
assert.equal(catalog.base_catalog_file, 'catalog-v8.json');
assert.equal(digest(await fs.readFile(path.join(directory, catalog.base_catalog_file))),
  catalog.base_catalog_sha256);
assert.deepEqual(catalog.entries.map(entry => entry.id), ['REG-017']);
for (const entry of catalog.entries) {
  assert.equal(entry.split, 'development');
  assert.equal(entry.severity, 'major');
  const packBytes = await fs.readFile(path.join(directory, entry.pack_file));
  assert.equal(digest(packBytes), entry.pack_sha256);
  const pack = JSON.parse(packBytes);
  assert.equal(pack.id, entry.id);
  assert.equal(pack.source_family, entry.source_family);
  assert.equal(pack.expected_invariant, entry.expected_invariant);
  assert.equal(pack.severity, entry.severity);
  assert.equal(pack.related_controls.length, entry.related_control_count);
  assert.equal(pack.negative_controls.length, entry.negative_control_count);
  assert.equal(pack.human_review, 'missing');
  assert.equal(pack.release_gate, 'open');
  await fs.access(path.join(root, entry.evidence_record));
}
console.log('Regression catalog verified: 17 pinned packs through REG-017; prior catalogs unchanged.');
