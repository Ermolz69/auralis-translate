import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const firstPath = path.join(root,
  '.cache/eval/youtube-geekerwan-kirin-original-media/attempt-CI3Ywx');
const secondPath = path.join(root,
  '.cache/eval/youtube-geekerwan-kirin-original-media-redirect/attempt-XhnEF7');
const publicPath = path.join(root,
  'eval/reports/youtube-geekerwan-kirin-media-failure-v1.json');
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
async function pinnedReport(directory, expected) {
  const bytes = await fs.readFile(path.join(directory, 'acquisition.json'));
  assert.equal(sha256(bytes), expected);
  return JSON.parse(bytes.toString('utf8'));
}
const [first, second] = await Promise.all([
  pinnedReport(firstPath,
    'c937756018622b6ce6b744f2810d7112059467edb4723528073a3b0ee94ceb8a'),
  pinnedReport(secondPath,
    'bde2fd18282ed4a42c592f1881462c0ce08863c99265e54e750e2a111d57aa38'),
]);
assert.deepEqual(await fs.readdir(firstPath).then(names => names.sort()),
  ['acquisition.json', 'http-133.bin']);
assert.deepEqual(await fs.readdir(secondPath).then(names => names.sort()),
  ['acquisition.json', 'http-133.bin']);
for (const [report, directory, status, redirects] of [
  [first, firstPath, 302, 0], [second, secondPath, 403, 1],
]) {
  assert.equal(report.video_id, '73XUeYRFsZU');
  assert.equal(report.outcome, 'failed');
  assert.equal(report.metadata_sha256,
    '26e81c23f653efc066b3d9a7ef83da4e76b36252e9508a0eb35a980de682f15b');
  assert.equal(report.caption_sha256,
    'c2a5fa3ae5139fe90b2be0b4b48b10ddd20d9b42103f4dd8401e1426d1b3eae5');
  assert.equal(report.limits.redirects, redirects);
  assert.equal(report.limits.retries, 0);
  assert.equal(report.streams.length, 1);
  const item = report.streams[0];
  assert.equal(item.format_id, '133');
  assert.equal(item.http_status, status);
  assert.equal(item.response_bytes, 0);
  assert.equal(sha256(await fs.readFile(path.join(directory, 'http-133.bin'))),
    item.response_sha256);
}
const summary = {
  schema_version: 1,
  video_id: first.video_id,
  caption_sha256: first.caption_sha256,
  media_acquired: false,
  attempts: [
    { experiment: first.experiment, started_at: first.started_at,
      format_id: '133', http_status: 302, response_bytes: 0,
      redirected: false, audio_requested: false,
      report_sha256: 'c937756018622b6ce6b744f2810d7112059467edb4723528073a3b0ee94ceb8a' },
    { experiment: second.experiment, started_at: second.started_at,
      format_id: '133', http_status: 403, response_bytes: 0,
      redirected: false, audio_requested: false,
      report_sha256: 'bde2fd18282ed4a42c592f1881462c0ce08863c99265e54e750e2a111d57aa38' },
  ],
  source_admission: 'unassigned_unreviewed',
  further_requests_in_experiment: 0,
};
const serialized = `${JSON.stringify(summary, null, 2)}\n`;
if (process.argv.includes('--capture')) {
  await fs.writeFile(publicPath, serialized, { flag: 'wx' });
} else {
  assert.equal(await fs.readFile(publicPath, 'utf8'), serialized);
}
console.log('Kirin original media attempts verified: HTTP 302 then 403; no media acquired or audio requested.');
