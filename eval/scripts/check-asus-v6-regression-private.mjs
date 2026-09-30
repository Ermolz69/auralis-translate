import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { digest } from './flores-file-fixture.mjs';

const root = path.resolve('.');
const packetBytes = fs.readFileSync(path.join(root,
  '.cache/eval/commons-asus-full-v6-slot-v1/run-7XjHrR/review-packet.json'));
assert.equal(digest(packetBytes),
  'da15e4cf479513ba1a41fc5e86f7802e6531e7c51c5a855e30f675d533485a6a');
const packet = JSON.parse(packetBytes);
const catalog = JSON.parse(fs.readFileSync(path.join(root, 'eval/regressions/catalog-v18.json')));
let checked = 0;
for (const entry of catalog.entries) {
  const bytes = fs.readFileSync(path.join(root, 'eval/regressions', entry.pack_file));
  assert.equal(digest(bytes), entry.pack_sha256);
  const pack = JSON.parse(bytes);
  assert.equal(pack.private_reproducer.review_packet_sha256, digest(packetBytes));
  for (const item of pack.private_reproducer.cases) {
    const row = packet.rows.find(candidate => candidate.id === item.focus_cue);
    assert(row, `Missing selected cue ${item.focus_cue}`);
    assert.equal(row.source_text_sha256, item.source_text_sha256);
    assert.equal(row.accepted_text_sha256, item.accepted_text_sha256);
    assert.match(row.request_sha256, /^[a-f0-9]{64}$/u);
    assert.match(row.raw_response_sha256, /^[a-f0-9]{64}$/u);
    checked += 1;
  }
}
const grams = packet.rows.find(row => row.id === 12);
assert.match(grams.source_text, /608g.*60g/u);
assert.match(grams.accepted_text, /608 ги\S*байт.*60 ги\S*байт/u);
const watts = packet.rows.find(row => row.id === 227);
assert.match(watts.source_text, /9W/u);
assert.match(watts.accepted_text, /9В/u);
assert.equal(packet.human_review_count, 0);
console.log(`ASUS v6 private regressions verified: ${checked} exact source/accepted windows across REG-031–033; human review missing.`);
