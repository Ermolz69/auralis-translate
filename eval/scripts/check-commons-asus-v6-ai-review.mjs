import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { digest } from './flores-file-fixture.mjs';

const root = path.resolve('.');
const workspace = path.join(root, '.cache/eval/commons-asus-full-v6-slot-v1/run-7XjHrR');
const pinned = (file, hash) => {
  const bytes = fs.readFileSync(file);
  assert.equal(digest(bytes), hash);
  return bytes;
};
const source = pinned(path.join(root, '.cache/eval/commons-asus-rog-ally-892592485/source.zh.srt'),
  '923aed3991c2308d92b89c45181cea8ec7ece74e9b4d3a3ce0234d95e329913b');
const candidate = pinned(path.join(workspace, 'candidate.ru.srt'),
  'aa74b20d4255f46c9a23ddfd0865dd2e221e7b08ab3cbceb8665be3b0c7b6e8b');
const report = JSON.parse(pinned(path.join(workspace, 'report.json'),
  '1d8addf0860cb88f0161ac6eeed3fc45351ab9912aaf0eff2b39a76772a26413'));
const sample = JSON.parse(pinned(path.join(workspace, 'source-only-review-sample.json'),
  '0e170fc7565291313b148fa7b8d74468ed48d6f1dce94a7ccbd2c745f98a0d83'));
const packet = JSON.parse(pinned(path.join(workspace, 'review-packet.json'),
  'da15e4cf479513ba1a41fc5e86f7802e6531e7c51c5a855e30f675d533485a6a'));
assert.equal(sample.selected_count, 44);
assert.equal(packet.sample_count, 44);
assert.deepEqual(packet.selected_ids, sample.selected_ids);
assert.equal(packet.human_review_count, 0);
const blocks = bytes => bytes.toString('utf8').trimEnd().split(/\r?\n\r?\n+/u)
  .map(block => block.split(/\r?\n/u));
const sourceBlocks = blocks(source);
const targetBlocks = blocks(candidate);
assert.equal(sourceBlocks.length, 268);
assert.equal(targetBlocks.length, 268);
const chats = report.requests.filter(row => row.path === '/v1/chat/completions');
assert.equal(chats.length, 268);
for (const [index, row] of packet.rows.entries()) {
  assert.equal(row.id, sample.selected_ids[index]);
  assert.deepEqual(row.tags, sample.selected[index].tags);
  assert.equal(row.source_text, sourceBlocks[row.id - 1].slice(2).join('\n'));
  assert.equal(row.accepted_text, targetBlocks[row.id - 1].slice(2).join('\n'));
  assert.equal(row.source_text_sha256, digest(Buffer.from(row.source_text)));
  assert.equal(row.accepted_text_sha256, digest(Buffer.from(row.accepted_text)));
  const chat = chats[row.id - 1];
  assert.equal(row.request_sha256, chat.request_sha256);
  assert.equal(row.raw_response_sha256, digest(Buffer.from(chat.raw_response)));
  assert.equal(row.raw_envelope_sha256, digest(Buffer.from(chat.raw_candidate)));
  assert.equal(row.raw_candidate, JSON.parse(chat.raw_candidate).translations[0].text);
  assert.equal(row.raw_candidate_sha256, digest(Buffer.from(row.raw_candidate)));
  assert.equal(row.expected_meaning, null);
  assert.equal(row.ai_review, null);
  assert.equal(row.human_review, null);
}
for (const id of [2, 12, 20, 91, 133, 142, 204, 226, 227, 242, 267])
  assert(packet.selected_ids.includes(id));
console.log('ASUS v6 AI review packet verified: 44 source-selected raw/accepted cues and evidence hashes; no human judgments.');
