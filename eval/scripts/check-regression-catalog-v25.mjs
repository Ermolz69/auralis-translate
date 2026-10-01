import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { readRunSnapshot } from './cli-run-state.mjs';

const root = path.resolve('.');
const directory = path.join(root, 'eval/regressions');
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const catalog = JSON.parse(fs.readFileSync(path.join(directory, 'catalog-v25.json')));
assert.equal(catalog.schema_version, 25);
assert.equal(catalog.catalog_id, 'zh-ru-development-regressions-v25');
assert.equal(sha(fs.readFileSync(path.join(directory, catalog.base_catalog_file))),
  catalog.base_catalog_sha256);
assert.deepEqual(catalog.entries.map(row => row.id), ['REG-040', 'REG-041']);
const packs = new Map();
for (const entry of catalog.entries) {
  const packBytes = fs.readFileSync(path.join(directory, entry.pack_file));
  assert.equal(sha(packBytes), entry.pack_sha256);
  const pack = JSON.parse(packBytes);
  packs.set(entry.id, pack);
  for (const field of ['id', 'severity', 'source_family', 'split', 'expected_invariant'])
    assert.equal(pack[field], entry[field]);
  assert.equal(pack.private_reproducer.cases?.length ?? 1, entry.minimal_reproducer_count);
  assert.equal(pack.related_controls.length, entry.related_control_count);
  assert.equal(pack.negative_controls.length, entry.negative_control_count);
  assert.equal(new Set([...pack.related_controls, ...pack.negative_controls].map(row => row.id)).size, 6);
  assert.equal(pack.control_model_runs, 0);
  assert.equal(pack.human_review, 'missing');
  assert.equal(pack.release_gate, 'open');
  assert(fs.existsSync(path.join(root, entry.evidence_record)));
}
const source = fs.readFileSync(path.join(root, '.cache/eval/commons-sethlui-derived-v1/source.zh.srt'));
const sourceBlocks = source.toString('utf8').trimEnd().split(/\r?\n\r?\n+/u);
const oneFolder = path.join(root, '.cache/eval/commons-sethlui-full-v6-1b-v1/run-Hp7iM7');
const sevenFolder = path.join(root, '.cache/eval/commons-sethlui-full-v6-7b-v1/run-6Pa9oA');
const onePack = packs.get('REG-040');
assert.equal(sha(source), onePack.private_reproducer.source_sha256);
assert.equal(sha(fs.readFileSync(path.join(oneFolder, 'report.json'))),
  onePack.private_reproducer.report_sha256);
const output = fs.readFileSync(path.join(oneFolder, 'candidate.ru.srt'));
assert.equal(sha(output), onePack.private_reproducer.candidate_sha256);
const outputBlocks = output.toString('utf8').trimEnd().split(/\r?\n\r?\n+/u);
for (const item of onePack.private_reproducer.cases) {
  const sourceLine = sourceBlocks[item.cue_id - 1].split(/\r?\n/u)[2];
  const candidateLine = outputBlocks[item.cue_id - 1].split(/\r?\n/u)[2];
  assert.equal(sha(Buffer.from(sourceLine)), item.source_text_sha256);
  assert.equal(sha(Buffer.from(candidateLine)), item.accepted_text_sha256);
}
const [name, category, reservation] = onePack.private_reproducer.cases.map(row =>
  outputBlocks[row.cue_id - 1].split(/\r?\n/u)[2]);
assert(!/Ли\s+Хуайбо/iu.test(name));
assert(/тридцать\s+десертов.*восемь\s+закусок/iu.test(category));
assert(/навык/iu.test(reservation) && !/заказ|брон|резерв/iu.test(reservation));
const sevenPack = packs.get('REG-041');
assert.equal(sha(source), sevenPack.private_reproducer.source_sha256);
assert.equal(sha(fs.readFileSync(path.join(sevenFolder, 'report.json'))),
  sevenPack.private_reproducer.report_sha256);
const seven = JSON.parse(fs.readFileSync(path.join(sevenFolder, 'report.json')));
const focus = seven.requests.filter(row => row.path === '/v1/chat/completions')[61];
const item = sevenPack.private_reproducer;
assert.equal(sha(Buffer.from(sourceBlocks[item.focus_cue - 1].split(/\r?\n/u)[2])),
  item.source_text_sha256);
assert.equal(focus.request_sha256, item.request_sha256);
const text = JSON.parse(focus.raw_candidate).translations[0].text;
assert.equal(sha(Buffer.from(text)), item.candidate_text_sha256);
assert(text.endsWith(item.observed_suffix));
assert.equal(sha(fs.readFileSync(path.join(sevenFolder, 'state/auralis-translate.sqlite'))),
  item.state_sha256);
const snapshot = readRunSnapshot(path.join(sevenFolder, 'state/auralis-translate.sqlite'), item.run_id);
assert.equal(snapshot.checkpoints.length, item.saved_checkpoints);
assert.equal(snapshot.results.length, item.complete_results);
assert(!fs.existsSync(path.join(sevenFolder, 'candidate.ru.srt')));
console.log('REG-040/041 pinned: three accepted source-fact defects and one rejected raw 7B format recurrence; six authored controls each remain unrun on models.');
