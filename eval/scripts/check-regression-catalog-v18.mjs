import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const directory = path.join(root, 'eval/regressions');
const digest = bytes => createHash('sha256').update(bytes).digest('hex');
const catalog = JSON.parse(await fs.readFile(path.join(directory, 'catalog-v18.json')));
assert.equal(catalog.schema_version, 18);
assert.equal(catalog.catalog_id, 'zh-ru-development-regressions-v18');
assert.equal(catalog.base_catalog_file, 'catalog-v17.json');
assert.equal(digest(await fs.readFile(path.join(directory, catalog.base_catalog_file))),
  catalog.base_catalog_sha256);
assert.deepEqual(catalog.entries.map(entry => entry.id), ['REG-031', 'REG-032', 'REG-033']);
const expectedCases = [[12, 227], [2, 3, 91, 267], [20, 133, 142, 226, 242]];
for (const [index, entry] of catalog.entries.entries()) {
  assert.equal(entry.split, 'source_selected_private_development_review');
  const bytes = await fs.readFile(path.join(directory, entry.pack_file));
  assert.equal(digest(bytes), entry.pack_sha256);
  const pack = JSON.parse(bytes);
  assert.equal(pack.id, entry.id);
  assert.equal(pack.status, 'accepted_model_error_needs_review');
  assert.equal(pack.source_family, entry.source_family);
  assert.equal(pack.expected_invariant, entry.expected_invariant);
  assert.equal(pack.severity, entry.severity);
  assert.equal(pack.related_controls.length, entry.related_control_count);
  assert.equal(pack.negative_controls.length, entry.negative_control_count);
  assert.deepEqual(pack.private_reproducer.cases.map(row => row.focus_cue), expectedCases[index]);
  assert.equal(pack.private_reproducer.review_packet_sha256,
    'da15e4cf479513ba1a41fc5e86f7802e6531e7c51c5a855e30f675d533485a6a');
  assert.equal(pack.control_model_runs, 0);
  assert.equal(pack.human_review, 'missing');
  assert.equal(pack.release_gate, 'open');
  for (const row of pack.private_reproducer.cases) {
    assert.match(row.source_text_sha256, /^[a-f0-9]{64}$/u);
    assert.match(row.accepted_text_sha256, /^[a-f0-9]{64}$/u);
    assert(row.expected_fact.length > 15);
    assert(row.observed_error.length > 15);
  }
  assert.equal(new Set(pack.related_controls.map(row => row.id)).size,
    pack.related_controls.length);
  assert.equal(new Set(pack.negative_controls.map(row => row.id)).size,
    pack.negative_controls.length);
  await fs.access(path.join(root, entry.evidence_record));
}
console.log('Regression catalog verified: 33 pinned packs through REG-033; new ASUS controls authored, not model-run.');
