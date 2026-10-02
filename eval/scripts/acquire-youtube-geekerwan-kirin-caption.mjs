import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const preflight = process.argv[2] === '--preflight';
assert.equal(process.argv.length, preflight ? 3 : 2,
  'Use no arguments or --preflight');
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
const metadataPath = path.join(root,
  '.cache/eval/youtube-geekerwan-kirin-license/attempt-w7pIGY/extractor-stdout.json');
const metadataBytes = await fs.readFile(metadataPath);
assert.equal(sha256(metadataBytes),
  '26e81c23f653efc066b3d9a7ef83da4e76b36252e9508a0eb35a980de682f15b',
  'Original-platform metadata changed');
const metadata = JSON.parse(metadataBytes.toString('utf8'));
assert.equal(metadata.id, '73XUeYRFsZU');
assert.equal(metadata.duration, 852);
assert.equal(metadata.license, 'Creative Commons Attribution license (reuse allowed)');
const tracks = metadata.subtitles?.['zh-CN']?.filter(track => track.ext === 'srt') ?? [];
assert.equal(tracks.length, 1, 'Expected one regular Chinese SRT track');
const url = new URL(tracks[0].url);
assert.equal(url.protocol, 'https:');
assert.equal(url.hostname, 'www.youtube.com');
assert.equal(url.pathname, '/api/timedtext');
assert.equal(url.searchParams.get('v'), metadata.id);
assert.equal(url.searchParams.get('lang'), 'zh-CN');
assert.equal(url.searchParams.get('fmt'), 'srt');
const archived = await fs.readFile(path.join(root,
  '.cache/eval/commons-huawei-kirin-9010-880535591/source.zh.srt'));
assert.equal(sha256(archived),
  '57dfd9feb3bfe6381421c4142820b780af341e195e52ee81d58e8f9f12858feb',
  'Archived Chinese SRT changed');
const limits = { requests: 1, timeout_ms: 60_000,
  response_bytes: 1024 * 1024, retries: 0, redirects: 0 };
const parent = path.join(root, '.cache/eval/youtube-geekerwan-kirin-original-caption');
const previous = await fs.readdir(parent).catch(error => {
  if (error.code === 'ENOENT') return [];
  throw error;
});
assert.equal(previous.length, 0, 'The one-request budget was already used');
const urlSha256 = sha256(Buffer.from(url.href));

if (preflight) {
  console.log(JSON.stringify({ experiment:
    'DATA-03-youtube-geekerwan-kirin-original-caption-2026-10-02-v1',
  video_id: metadata.id, language: 'zh-CN', format: 'srt',
  source_host: url.hostname, source_path: url.pathname,
  metadata_sha256: sha256(metadataBytes), archived_srt_sha256: sha256(archived),
  caption_url_sha256: urlSha256, limits }, null, 2));
  process.exit(0);
}

await fs.mkdir(parent, { recursive: true });
const workspace = await fs.mkdtemp(path.join(parent, 'attempt-'));
const report = {
  schema_version: 1,
  experiment: 'DATA-03-youtube-geekerwan-kirin-original-caption-2026-10-02-v1',
  video_id: metadata.id, language: 'zh-CN', format: 'srt',
  started_at: new Date().toISOString(), metadata_sha256: sha256(metadataBytes),
  archived_srt_sha256: sha256(archived), caption_url_sha256: urlSha256,
  source_host: url.hostname, source_path: url.pathname,
  limits, outcome: 'running',
};
const started = performance.now();
try {
  const response = await fetch(url, {
    redirect: 'manual', signal: AbortSignal.timeout(limits.timeout_ms),
  });
  report.http_status = response.status;
  report.content_type = response.headers.get('content-type');
  report.declared_bytes = response.headers.get('content-length');
  const reader = response.body?.getReader();
  assert(reader, 'Caption response has no body');
  const chunks = [];
  let received = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    received += value.byteLength;
    if (received > limits.response_bytes) {
      await reader.cancel();
      throw new Error('Caption response exceeded the byte budget');
    }
    chunks.push(value);
  }
  const bytes = Buffer.concat(chunks, received);
  report.response_bytes = received;
  report.response_sha256 = sha256(bytes);
  await fs.writeFile(path.join(workspace,
    response.status === 200 ? 'source.zh.srt' : 'http-body.bin'),
  bytes, { flag: 'wx' });
  assert.equal(response.status, 200, `Caption GET returned HTTP ${response.status}`);
  assert(received > 0, 'Caption response is empty');
  report.matches_archived_bytes = bytes.equals(archived);
  report.outcome = 'acquired_private_unreviewed';
} catch (error) {
  report.outcome = 'failed';
  report.error = String(error);
  process.exitCode = 1;
} finally {
  report.finished_at = new Date().toISOString();
  report.elapsed_ms = Math.round(performance.now() - started);
  await fs.writeFile(path.join(workspace, 'acquisition.json'),
    `${JSON.stringify(report, null, 2)}\n`, { flag: 'wx' });
  console.log(`Private caption attempt: ${workspace}`);
  console.log(JSON.stringify(report, null, 2));
}
