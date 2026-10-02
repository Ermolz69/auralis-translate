import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve('.');
const directory = path.join(root, 'eval/regressions');
const digest = bytes => createHash('sha256').update(bytes).digest('hex');
const catalog = JSON.parse(fs.readFileSync(path.join(directory, 'catalog-v36.json')));
assert.equal(catalog.schema_version, 36);
assert.equal(catalog.catalog_id, 'zh-ru-development-regressions-v36');
assert.equal(digest(fs.readFileSync(path.join(directory, catalog.base_catalog_file))),
  catalog.base_catalog_sha256);
assert.deepEqual(catalog.entries.map(row => row.id), ['REG-054', 'REG-055']);
const report = JSON.parse(fs.readFileSync(path.join(root,
  'eval/reports/2026-10-02-v8-asus-natural-long.json')));
assert.equal(report.status, 'completed_with_failure');
assert.equal(report.accepted_language_quality, false);
for (const [index, entry] of catalog.entries.entries()) {
  const packBytes = fs.readFileSync(path.join(directory, entry.pack_file));
  assert.equal(digest(packBytes), entry.pack_sha256);
  const pack = JSON.parse(packBytes);
  for (const field of ['id', 'severity', 'source_family', 'split', 'category',
    'profile_scope', 'expected_invariant']) assert.equal(pack[field], entry[field]);
  assert.equal(Number(Boolean(pack.minimal_reproducer)), entry.minimal_reproducer_count);
  assert.equal(pack.related_controls.length, entry.related_control_count);
  assert.equal(pack.negative_controls.length, entry.negative_control_count);
  assert.equal(new Set([...pack.related_controls, ...pack.negative_controls]
    .map(row => row.id)).size, 6);
  assert([...pack.related_controls, ...pack.negative_controls]
    .every(row => row.model_runs === 0));
  assert(pack.negative_controls.every(row => row.expected_accept === true));
  assert.equal(pack.minimal_reproducer.private_report_sha256, report.private_report_sha256);
  assert.equal(pack.minimal_reproducer.source_sha256, report.source_sha256);
  assert.equal(pack.minimal_reproducer.request_sha256,
    report.arms[index].final_chat_request_sha256);
  assert.equal(pack.minimal_reproducer.raw_response_sha256,
    report.arms[index].final_raw_response_sha256);
  assert.equal(pack.minimal_reproducer.durable_prefix_cues,
    report.arms[index].covered_prefix_cues);
  assert.equal(pack.minimal_reproducer.published_results, 0);
  assert.equal(pack.minimal_reproducer.target_ids[0],
    report.arms[index].first_failed_target_id);
  assert.equal(pack.human_bilingual_review_count, 0);
  assert.equal(pack.release_gate, 'open');
  assert(fs.existsSync(path.join(root, entry.evidence_record)));
}
assert.equal(catalog.entries[0].id, 'REG-054');
assert.equal(catalog.entries[1].id, 'REG-055');
console.log('REG-054–055 pinned: two real long-file failures, exact private hashes and twelve unrun controls.');
