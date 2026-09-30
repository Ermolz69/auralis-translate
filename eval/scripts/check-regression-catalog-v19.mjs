import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const directory = path.join(root, 'eval/regressions');
const digest = bytes => createHash('sha256').update(bytes).digest('hex');
const catalog = JSON.parse(await fs.readFile(path.join(directory, 'catalog-v19.json')));
assert.equal(catalog.schema_version, 19);
assert.equal(catalog.catalog_id, 'zh-ru-development-regressions-v19');
assert.equal(catalog.base_catalog_file, 'catalog-v18.json');
assert.equal(digest(await fs.readFile(path.join(directory, catalog.base_catalog_file))),
  catalog.base_catalog_sha256);
assert.deepEqual(catalog.entries.map(entry => entry.id), ['REG-034']);
const entry = catalog.entries[0];
const bytes = await fs.readFile(path.join(directory, entry.pack_file));
assert.equal(digest(bytes), entry.pack_sha256);
const pack = JSON.parse(bytes);
assert.equal(pack.id, entry.id);
assert.equal(pack.status, 'outer_json_valid_but_text_tail_invalid');
assert.equal(pack.severity, entry.severity);
assert.equal(pack.source_family, entry.source_family);
assert.equal(pack.expected_invariant, entry.expected_invariant);
assert.equal(pack.related_controls.length, entry.related_control_count);
assert.equal(pack.negative_controls.length, entry.negative_control_count);
assert.deepEqual(pack.private_reproducer.cases.map(row => row.case_id),
  ['asus-227', 'REG-032-negative-actual_phone_variant']);
assert.equal(pack.control_model_runs, 0);
assert.equal(pack.human_review, 'missing');
assert.equal(pack.release_gate, 'open');
await fs.access(path.join(root, entry.evidence_record));
const journalBytes = await fs.readFile(path.join(root,
  '.cache/eval/commons-asus-v6-fact-model-screen-v1/run-bWDBNw/requests.jsonl'));
assert.equal(digest(journalBytes), pack.private_reproducer.journal_sha256);
const rows = journalBytes.toString('utf8').trimEnd().split(/\r?\n/u).map(JSON.parse);
for (const item of pack.private_reproducer.cases) {
  const row = rows.find(candidate => candidate.model === '7b'
    && candidate.case_id === item.case_id);
  assert(row);
  assert.equal(digest(Buffer.from(row.source_zh)), item.source_text_sha256);
  assert.equal(row.request_sha256, item.request_sha256);
  assert.equal(row.raw_response_sha256, item.raw_response_sha256);
  assert.equal(digest(Buffer.from(row.raw_candidate)), item.raw_candidate_sha256);
  assert(row.accepted_candidate.endsWith(item.observed_text_suffix));
  assert.equal(row.structural_outcome, 'valid_unreviewed');
}
for (const control of pack.related_controls) {
  assert.match(control.candidate_text, /」\s*\}/u);
}
for (const control of pack.negative_controls) {
  assert(!/」[}\]]{3,}$/u.test(control.candidate_text));
}
console.log('Regression catalog verified: 34 pinned packs through REG-034; two exact leaked-tail responses retained.');
