import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve('.');
const regressionDir = path.join(root, 'eval/regressions');
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
const catalog = JSON.parse(fs.readFileSync(path.join(regressionDir, 'catalog-v23.json')));
assert.equal(catalog.schema_version, 23);
assert.equal(catalog.catalog_id, 'zh-ru-development-regressions-v23');
assert.equal(catalog.base_catalog_file, 'catalog-v22.json');
assert.equal(sha256(fs.readFileSync(path.join(regressionDir, catalog.base_catalog_file))),
  catalog.base_catalog_sha256);
assert.deepEqual(catalog.entries.map(entry => entry.id), ['REG-038']);
const entry = catalog.entries[0];
const packBytes = fs.readFileSync(path.join(regressionDir, entry.pack_file));
assert.equal(sha256(packBytes), entry.pack_sha256);
const pack = JSON.parse(packBytes);
for (const field of ['id', 'severity', 'source_family', 'split', 'expected_invariant'])
  assert.equal(pack[field], entry[field]);
assert.equal(pack.minimal_reproducer_count, undefined);
assert.equal(pack.private_reproducer.cases.length, entry.minimal_reproducer_count);
assert.equal(pack.related_controls.length, entry.related_control_count);
assert.equal(pack.negative_controls.length, entry.negative_control_count);
const controls = [...pack.related_controls, ...pack.negative_controls];
assert.equal(new Set(controls.map(row => row.id)).size, controls.length);
assert(controls.every(row => row.source && row.expected_fact));
assert.equal(pack.control_model_runs, 0);
assert.equal(pack.human_review, 'missing');
assert.equal(pack.release_gate, 'open');
assert(fs.existsSync(path.join(root, entry.evidence_record)));
const workspace = path.join(root, '.cache/eval/asus-context-width-paired-v1/run-X4grxy');
const reportBytes = fs.readFileSync(path.join(workspace, 'report.json'));
const journalBytes = fs.readFileSync(path.join(workspace, 'requests.jsonl'));
assert.equal(sha256(reportBytes), pack.private_reproducer.report_sha256);
assert.equal(sha256(journalBytes), pack.private_reproducer.journal_sha256);
const report = JSON.parse(reportBytes);
assert.equal(report.identity.source, pack.private_reproducer.source_sha256);
const journal = journalBytes.toString('utf8').trimEnd().split('\n').map(JSON.parse);
for (const caseRecord of pack.private_reproducer.cases) {
  const raw = journal.find(row => row.cue_id === caseRecord.cue_id &&
    row.model === caseRecord.model && row.seed === caseRecord.seed &&
    row.width === caseRecord.width);
  assert(raw, `missing raw reproduction for cue ${caseRecord.cue_id}`);
  assert.equal(sha256(Buffer.from(raw.source_zh)), caseRecord.source_text_sha256);
  assert.equal(raw.request_sha256, caseRecord.request_sha256);
  assert.equal(sha256(Buffer.from(raw.raw_candidate)), caseRecord.raw_candidate_sha256);
  assert.equal(raw.structural_outcome, 'outer_json_valid_unreviewed');
  assert.equal(raw.finish_reason, 'stop');
  if (caseRecord.cue_id === 3) {
    assert.equal(raw.parsed_candidate, 'Теперь наш знакомый ');
    assert(!raw.parsed_candidate.includes('ROG'));
  } else {
    assert.equal(raw.cue_id, 133);
    assert(raw.parsed_candidate.includes('Выживаемость'));
    assert(raw.parsed_candidate.includes('наименее улучшаемой'));
    const narrow = journal.find(row => row.cue_id === 133 && row.model === '1b' &&
      row.seed === 101 && row.width === 1);
    assert(narrow.parsed_candidate.includes('Время работы'));
  }
}
console.log('REG-038: two pinned private reproductions, six related and five negative authored controls; semantic model gate open.');
