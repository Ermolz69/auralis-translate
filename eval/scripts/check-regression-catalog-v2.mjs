import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { digest } from './flores-file-fixture.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const catalog = JSON.parse(await fs.readFile(path.join(root, 'eval/regressions/catalog-v2.json')));
assert.equal(catalog.schema_version, 2);
assert.equal(catalog.catalog_id, 'zh-ru-development-regressions-v2');
assert.equal(catalog.entries.length, 9);
const fields = ['id', 'pack_file', 'pack_sha256', 'source_family', 'split',
  'category', 'profile_scope', 'expected_invariant', 'severity',
  'related_control_count', 'negative_control_count', 'evidence_record', 'last_outcome'];
const gaps = [];
for (const [index, row] of catalog.entries.entries()) {
  assert.deepEqual(Object.keys(row).sort(), [...fields].sort());
  assert.equal(row.id, `REG-${String(index + 1).padStart(3, '0')}`);
  assert(/^[a-z0-9-]+\.json$/u.test(row.pack_file));
  assert(/^[a-f0-9]{64}$/u.test(row.pack_sha256));
  assert.equal(row.split, 'development');
  assert.equal(row.severity, 'major');
  assert(row.category.length > 5 && row.profile_scope.length > 15);
  assert(row.expected_invariant.length > 50 && row.last_outcome.length > 40);
  assert(/^eval\/experiments\/[a-z0-9-]+\.md$/u.test(row.evidence_record));
  await fs.access(path.join(root, row.evidence_record));
  const packBytes = await fs.readFile(path.join(root, 'eval/regressions', row.pack_file));
  assert.equal(digest(packBytes), row.pack_sha256, row.id);
  const raw = JSON.parse(packBytes);
  const pack = row.id === 'REG-001' ? raw.entries.find(entry => entry.id === row.id) : raw;
  assert(pack, `missing ${row.id} pack`);
  assert.equal(pack.id, row.id);
  assert.equal(pack.expected_invariant, row.expected_invariant);
  assert.equal(pack.severity, row.severity);
  if (pack.source_family) assert.equal(pack.source_family, row.source_family);
  if (row.id === 'REG-008') {
    const originalBytes = await fs.readFile(path.join(root,
      'eval/regressions/long-v6-postflight-tdz-v1.json'));
    assert.equal(digest(originalBytes), pack.source_pack_v1_sha256);
    const { source_pack_v1_sha256, negative_control, ...retained } = pack;
    assert(negative_control.includes('before spawning'));
    assert.deepEqual({ ...retained, schema_version: 1 }, JSON.parse(originalBytes));
  }
  const related = pack.related_case_ids ?? pack.related_cases ?? pack.related_controls;
  const negative = pack.negative_case_ids ?? pack.negative_controls
    ?? (pack.negative_control === undefined ? [] : [pack.negative_control]);
  assert.equal(related.length, row.related_control_count, row.id);
  assert.equal(negative.length, row.negative_control_count, row.id);
  assert(row.related_control_count >= 2, `${row.id} lacks related controls`);
  if (row.negative_control_count === 0) gaps.push(row.id);
}
assert.deepEqual(gaps, []);
console.log(`Regression catalog verified: ${catalog.entries.length} pinned packs; every pack declares a negative control.`);
