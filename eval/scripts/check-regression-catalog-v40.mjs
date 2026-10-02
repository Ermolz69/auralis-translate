import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const directory = path.join(root, 'eval/regressions');
const digest = bytes => createHash('sha256').update(bytes).digest('hex');
const catalog = JSON.parse(await fs.readFile(path.join(directory, 'catalog-v40.json')));
assert.equal(catalog.schema_version, 40);
assert.equal(catalog.catalog_id, 'zh-ru-development-regressions-v40');
assert.equal(digest(await fs.readFile(path.join(directory, catalog.base_catalog_file))),
  catalog.base_catalog_sha256);
assert.deepEqual(catalog.entries.map(row => row.id), ['REG-061']);
for (const entry of catalog.entries) {
  const packBytes = await fs.readFile(path.join(directory, entry.pack_file));
  assert.equal(digest(packBytes), entry.pack_sha256);
  const pack = JSON.parse(packBytes);
  for (const field of ['id', 'severity', 'source_family', 'split', 'category',
    'profile_scope', 'expected_invariant']) assert.equal(pack[field], entry[field]);
  assert.equal(pack.minimal_reproducers.length, entry.minimal_reproducer_count);
  assert.equal(pack.related_controls.length, entry.related_control_count);
  assert.equal(pack.negative_controls.length, entry.negative_control_count);
  assert.equal(new Set([...pack.related_controls, ...pack.negative_controls]
    .map(row => row.id)).size,
  pack.related_controls.length + pack.negative_controls.length);
  assert(pack.related_controls.every(row => row.model_runs === 0));
  assert(pack.negative_controls.every(row => row.model_runs === 0));
  await fs.access(path.join(root, entry.evidence_record));
  const reportBytes = await fs.readFile(path.join(root,
    'eval/reports/2026-10-02-reg-058-provisional-terms-v1.json'));
  assert.equal(digest(reportBytes), pack.public_report_sha256);
  const report = JSON.parse(reportBytes);
  assert.equal(report.private_report_sha256, pack.private_model_report_sha256);
  for (const repro of pack.minimal_reproducers) {
    const baseline = report.rows.find(row => row.id === repro.control_id &&
      row.variant === 'baseline');
    const terms = report.rows.find(row => row.id === repro.control_id &&
      row.variant === 'terms');
    assert(baseline && terms);
    assert.equal(baseline.candidate, repro.baseline_candidate);
    assert.equal(terms.candidate, repro.terms_candidate);
    assert.equal(terms.request_sha256, repro.terms_request_sha256);
    assert.equal(terms.raw_response_sha256, repro.terms_raw_response_sha256);
  }
  assert.equal(pack.release_gate, 'open');
  assert.equal(pack.human_bilingual_review_count, 0);
}
console.log('REG-061 pinned: two negative term contaminations and five future controls.');
