import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve('.');
const directory = path.join(root, 'eval/regressions');
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const catalog = JSON.parse(fs.readFileSync(path.join(directory, 'catalog-v28.json')));
assert.equal(catalog.schema_version, 28);
assert.equal(catalog.catalog_id, 'zh-ru-development-regressions-v28');
assert.equal(sha(fs.readFileSync(path.join(directory, catalog.base_catalog_file))),
  catalog.base_catalog_sha256);
assert.deepEqual(catalog.entries.map(row => row.id), ['REG-044']);
const entry = catalog.entries[0];
const packBytes = fs.readFileSync(path.join(directory, entry.pack_file));
assert.equal(sha(packBytes), entry.pack_sha256);
const pack = JSON.parse(packBytes);
for (const field of ['id', 'severity', 'source_family', 'split', 'expected_invariant'])
  assert.equal(pack[field], entry[field]);
assert.equal(pack.private_reproducer.cases.length, entry.minimal_reproducer_count);
assert.equal(pack.related_controls.length, entry.related_control_count);
assert.equal(pack.negative_controls.length, entry.negative_control_count);
assert.equal(new Set([...pack.related_controls, ...pack.negative_controls]
  .map(row => row.id)).size, 6);
assert.equal(pack.control_model_runs, 0);
assert.equal(pack.human_review, 'missing');
assert.equal(pack.release_gate, 'open');
assert(fs.existsSync(path.join(root, entry.evidence_record)));
const source = fs.readFileSync(path.join(root, '.cache/eval/commons-sethlui-derived-v1/source.zh.srt'));
const workspace = path.join(root, '.cache/eval/commons-sethlui-json-tail-length-retry-7b-v2/run-mHswjb');
const candidate = fs.readFileSync(path.join(workspace, 'candidate.ru.srt'));
const report = fs.readFileSync(path.join(workspace, 'report.json'));
const reproducer = pack.private_reproducer;
assert.equal(sha(source), reproducer.source_sha256);
assert.equal(sha(candidate), reproducer.candidate_sha256);
assert.equal(sha(report), reproducer.report_sha256);
assert.equal(sha(Buffer.from('金蜓湾')), reproducer.source_name_sha256);
const sourceBlocks = source.toString('utf8').trimEnd().split(/\r?\n\r?\n+/u);
const targetBlocks = candidate.toString('utf8').trimEnd().split(/\r?\n\r?\n+/u);
assert.equal(sourceBlocks.length, 263);
assert.equal(targetBlocks.length, 263);
const renderings = [];
for (const item of reproducer.cases) {
  const sourceLine = sourceBlocks[item.cue_id - 1].split(/\r?\n/u)[2];
  const targetLine = targetBlocks[item.cue_id - 1].split(/\r?\n/u)[2];
  assert(sourceLine.includes('金蜓湾'));
  assert.equal(sha(Buffer.from(sourceLine)), item.source_text_sha256);
  assert.equal(sha(Buffer.from(targetLine)), item.accepted_text_sha256);
  const name = targetLine.match(/«([^»]+)»/u)?.[1]
    ?? targetLine.match(/^(.+?)\s+—/u)?.[1];
  assert(name, `No venue rendering found at cue ${item.cue_id}`);
  renderings.push(name);
}
assert.equal(new Set(renderings).size, 3);
console.log('REG-044 pinned: one repeated source venue has three differing 7B renderings; human canonical term and model controls remain open.');
