import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { digest } from './flores-file-fixture.mjs';
import { readRunSnapshot } from './cli-run-state.mjs';

const root = path.resolve('.');
const workspace = path.join(root, '.cache/eval/commons-asus-full-v6-slot-v1/run-7XjHrR');
const source = fs.readFileSync(path.join(root, '.cache/eval/commons-asus-rog-ally-892592485/source.zh.srt'));
assert.equal(digest(source), '923aed3991c2308d92b89c45181cea8ec7ece74e9b4d3a3ce0234d95e329913b');
const bytes = fs.readFileSync(path.join(workspace, 'report.json'));
assert.equal(digest(bytes), '1d8addf0860cb88f0161ac6eeed3fc45351ab9912aaf0eff2b39a76772a26413');
const report = JSON.parse(bytes);
assert.equal(report.experiment, 'commons-asus-full-v6-slot-v1');
assert.equal(report.status, 'passed_structural_probe');
assert.equal(report.revision, '4f34f8faa13c942b2cfcbd75e3a2d6c43fc60eb9');
assert.equal(report.profile_sha256, 'b30546f228ba230364ba79edae55456d62e7d7c5010e56fef38464c3531089c5');
assert.equal(report.cli_sha256, '82df0fbd0167b9163f945c58d8387a1edf2c6eedfed9f38086f617f74914df1d');
assert.equal(report.runtime_sha256, '6f15be27bd80b6b4d52afefa49094e18fcfab55d5da354d717971f2d2537b2f4');
assert.equal(report.model_sha256_verified_by_doctor,
  'dc5f44fcf1fa496ee7ad725982c0c8c553a4de00259b53af84c4b89fb0c06699');
assert.equal(report.scene_map_sha256,
  digest(fs.readFileSync(path.join(workspace, 'scene-map.json'))));
assert.equal(report.run_id, 'c5118ed9-eb8a-4cb4-8618-1383e0491153');
assert.equal(report.run_status.state, 'validated');
assert.equal(report.run_status.review_state, 'needs_review');
assert.equal(report.run_status.completed_blocks, 268);
assert.equal(report.run_status.total_blocks, 268);
assert.equal(report.requests.length, 807);
const chats = report.requests.filter(row => row.path === '/v1/chat/completions');
assert.equal(chats.length, 268);
for (const [index, chat] of chats.entries()) {
  const target = index + 1;
  assert.equal(chat.http_status, 200);
  assert.equal(chat.request_sha256, digest(Buffer.from(JSON.stringify(chat.request))));
  assert.equal(chat.raw_candidate, JSON.parse(chat.raw_response).choices[0].message.content);
  const envelope = JSON.parse(chat.request.messages[0].content.split('Input JSON:\n')[1]);
  assert.equal(envelope.target_slots[0].segment_id, target);
  const properties = chat.request.response_format.schema.properties.translations.items.properties;
  assert.deepEqual(properties.segment_id, { const: target });
  assert.deepEqual(properties.line_index, { const: 0 });
  const rows = JSON.parse(chat.raw_candidate).translations;
  assert.equal(rows.length, 1);
  assert.equal(rows[0].segment_id, target);
  assert.equal(rows[0].line_index, 0);
  assert.equal(typeof rows[0].text, 'string');
  assert(rows[0].text.trim().length > 0);
  assert(chat.usage.prompt_tokens > 0 && chat.usage.completion_tokens > 0);
}
const database = path.join(workspace, 'state/auralis-translate.sqlite');
assert.equal(digest(fs.readFileSync(database)),
  '76e074663d67d40246aae8e7f1b725918bc4cfd13af1bb81d4b15a80a13ac294');
const snapshot = readRunSnapshot(database, report.run_id);
assert(snapshot.run);
assert.equal(snapshot.checkpoints.length, 268);
assert(snapshot.checkpoints.every((row, index) => row.block_index === index));
assert.equal(snapshot.attempts.length, 1);
assert.equal(snapshot.results.length, 1);
assert.equal(snapshot.results[0].review_state, 'needs_review');
assert.equal(snapshot.results[0].output_sha256, report.output_sha256);
const output = fs.readFileSync(path.join(workspace, 'candidate.ru.srt'));
assert.equal(digest(output), 'aa74b20d4255f46c9a23ddfd0865dd2e221e7b08ab3cbceb8665be3b0c7b6e8b');
assert.equal(digest(fs.readFileSync(path.join(workspace, 'offline.ru.srt'))), digest(output));
const blocks = text => text.trimEnd().split(/\r?\n\r?\n+/u);
const originals = blocks(source.toString('utf8'));
const translated = blocks(output.toString('utf8'));
assert.equal(originals.length, 268);
assert.equal(translated.length, 268);
for (let index = 0; index < 268; index++) {
  const oldLines = originals[index].split(/\r?\n/u);
  const newLines = translated[index].split(/\r?\n/u);
  assert.equal(newLines[0], oldLines[0]);
  assert.equal(newLines[1], oldLines[1]);
  assert.equal(newLines.length, oldLines.length);
}
assert.equal(report.accepted_lines.length, 268);
assert.equal(report.offline_reexport, 'byte_identical');
assert.deepEqual(report.failures, []);
console.log('ASUS v6 private result verified: 268 raw target-bound replies, 268 checkpoints, one review-needed result and byte-identical offline SRT.');
