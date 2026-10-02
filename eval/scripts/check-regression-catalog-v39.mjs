import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const directory = path.join(root, 'eval/regressions');
const digest = bytes => createHash('sha256').update(bytes).digest('hex');
const catalog = JSON.parse(await fs.readFile(path.join(directory, 'catalog-v39.json')));
assert.equal(catalog.schema_version, 39);
assert.equal(catalog.catalog_id, 'zh-ru-development-regressions-v39');
assert.equal(digest(await fs.readFile(path.join(directory, catalog.base_catalog_file))),
  catalog.base_catalog_sha256);
assert.deepEqual(catalog.entries.map(row => row.id), ['REG-060']);
for (const entry of catalog.entries) {
  const packBytes = await fs.readFile(path.join(directory, entry.pack_file));
  assert.equal(digest(packBytes), entry.pack_sha256);
  const pack = JSON.parse(packBytes);
  for (const field of ['id', 'severity', 'source_family', 'split', 'category',
    'profile_scope', 'expected_invariant']) assert.equal(pack[field], entry[field]);
  assert.equal(Number(Boolean(pack.minimal_reproducer)), entry.minimal_reproducer_count);
  assert.equal(pack.related_controls.length, entry.related_control_count);
  assert.equal(pack.negative_controls.length, entry.negative_control_count);
  await fs.access(path.join(root, entry.evidence_record));
  assert.equal(pack.release_gate, 'open');
  assert.equal(pack.human_bilingual_review_count, 0);
}
console.log('REG-060 pinned: mismatched paired target fields and corrected control requests.');
