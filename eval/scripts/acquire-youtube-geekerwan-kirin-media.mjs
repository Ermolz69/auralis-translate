import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const mode = process.argv[2] ?? 'initial';
const preflight = mode === '--preflight' || mode === '--preflight-redirect';
const allowRedirect = mode === '--preflight-redirect' || mode === '--allow-one-redirect';
assert(['initial', '--preflight', '--preflight-redirect',
  '--allow-one-redirect'].includes(mode));
assert.equal(process.argv.length, mode === 'initial' ? 2 : 3);
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
const metadataBytes = await fs.readFile(path.join(root,
  '.cache/eval/youtube-geekerwan-kirin-license/attempt-w7pIGY/extractor-stdout.json'));
assert.equal(sha256(metadataBytes),
  '26e81c23f653efc066b3d9a7ef83da4e76b36252e9508a0eb35a980de682f15b');
const metadata = JSON.parse(metadataBytes.toString('utf8'));
assert.equal(metadata.id, '73XUeYRFsZU');
assert.equal(metadata.duration, 852);
assert.equal(metadata.license, 'Creative Commons Attribution license (reuse allowed)');
const caption = await fs.readFile(path.join(root,
  '.cache/eval/youtube-geekerwan-kirin-original-caption/attempt-QbgkVq/source.zh.srt'));
assert.equal(sha256(caption),
  'c2a5fa3ae5139fe90b2be0b4b48b10ddd20d9b42103f4dd8401e1426d1b3eae5');
const formats = [
  { id: '133', ext: 'mp4', bytes: 4_126_636, height: 240,
    filename: 'video-240p.mp4' },
  { id: '139', ext: 'm4a', bytes: 5_200_087, height: null,
    filename: 'audio-low.m4a' },
];
const streams = formats.map(spec => {
  const matching = metadata.formats.filter(item => item.format_id === spec.id);
  assert.equal(matching.length, 1);
  const value = matching[0];
  assert.equal(value.ext, spec.ext);
  assert.equal(value.filesize, spec.bytes);
  assert.equal(value.height ?? null, spec.height);
  if (spec.id === '133') {
    assert.match(value.vcodec, /^avc1\./);
    assert.equal(value.acodec, 'none');
  } else {
    assert.equal(value.vcodec, 'none');
    assert.match(value.acodec, /^mp4a\./);
  }
  const url = new URL(value.url);
  assert.equal(url.protocol, 'https:');
  assert.match(url.hostname, /(?:^|\.)googlevideo\.com$/);
  assert.equal(url.pathname, '/videoplayback');
  assert.equal(url.searchParams.get('itag'), spec.id);
  return { ...spec, url, url_sha256: sha256(Buffer.from(url.href)) };
});
const limits = { requests: 2, per_request_timeout_ms: 90_000,
  per_response_bytes: 6 * 1024 * 1024,
  total_retained_media_bytes: 12 * 1024 * 1024,
  retries: 0, redirects: 0 };
if (allowRedirect) {
  const firstBytes = await fs.readFile(path.join(root,
    '.cache/eval/youtube-geekerwan-kirin-original-media/attempt-CI3Ywx/acquisition.json'));
  assert.equal(sha256(firstBytes),
    'c937756018622b6ce6b744f2810d7112059467edb4723528073a3b0ee94ceb8a');
  const first = JSON.parse(firstBytes.toString('utf8'));
  assert.equal(first.outcome, 'failed');
  assert.equal(first.streams.length, 1);
  assert.equal(first.streams[0].format_id, '133');
  assert.equal(first.streams[0].http_status, 302);
  assert.equal(first.streams[0].response_bytes, 0);
  limits.requests = 4;
  limits.redirects = 1;
}
const experiment = allowRedirect
  ? 'DATA-03-youtube-geekerwan-kirin-original-media-redirect-2026-10-02-v1'
  : 'DATA-03-youtube-geekerwan-kirin-original-media-2026-10-02-v1';
const parent = path.join(root, allowRedirect
  ? '.cache/eval/youtube-geekerwan-kirin-original-media-redirect'
  : '.cache/eval/youtube-geekerwan-kirin-original-media');
const previous = await fs.readdir(parent).catch(error => {
  if (error.code === 'ENOENT') return [];
  throw error;
});
assert.equal(previous.length, 0, 'The one-attempt media budget was already used');

if (preflight) {
  console.log(JSON.stringify({ experiment,
  video_id: metadata.id, metadata_sha256: sha256(metadataBytes),
  caption_sha256: sha256(caption),
  formats: streams.map(({ id, ext, bytes, height, url, url_sha256 }) =>
    ({ id, ext, bytes, height, host: url.hostname,
      path: url.pathname, url_sha256 })), limits }, null, 2));
  process.exit(0);
}

await fs.mkdir(parent, { recursive: true });
const workspace = await fs.mkdtemp(path.join(parent, 'attempt-'));
const report = {
  schema_version: 1,
  experiment,
  video_id: metadata.id, metadata_sha256: sha256(metadataBytes),
  caption_sha256: sha256(caption),
  started_at: new Date().toISOString(), limits,
  streams: [], outcome: 'running',
};
const started = performance.now();
try {
  for (const stream of streams) {
    const item = { format_id: stream.id, ext: stream.ext,
      advertised_bytes: stream.bytes, url_sha256: stream.url_sha256,
      source_host: stream.url.hostname, source_path: stream.url.pathname,
      started_at: new Date().toISOString() };
    report.streams.push(item);
    const signal = AbortSignal.timeout(limits.per_request_timeout_ms);
    let response = await fetch(stream.url, { redirect: 'manual', signal });
    if (allowRedirect && [301, 302, 307, 308].includes(response.status)) {
      const location = response.headers.get('location');
      assert(location, `Format ${stream.id} redirect lacks Location`);
      const redirected = new URL(location, stream.url);
      item.redirect = { status: response.status,
        host: redirected.hostname, path: redirected.pathname,
        url_sha256: sha256(Buffer.from(redirected.href)) };
      assert.equal(redirected.protocol, 'https:');
      assert.match(redirected.hostname, /(?:^|\.)googlevideo\.com$/);
      assert.equal(redirected.pathname, '/videoplayback');
      assert.equal(redirected.searchParams.get('itag'), stream.id);
      await response.body?.cancel();
      response = await fetch(redirected, { redirect: 'manual', signal });
    }
    item.http_status = response.status;
    item.content_type = response.headers.get('content-type');
    item.declared_bytes = response.headers.get('content-length');
    const reader = response.body?.getReader();
    assert(reader, `Format ${stream.id} response has no body`);
    const chunks = [];
    let received = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      received += value.byteLength;
      if (received > limits.per_response_bytes) {
        await reader.cancel();
        throw new Error(`Format ${stream.id} exceeded response byte budget`);
      }
      chunks.push(value);
    }
    const bytes = Buffer.concat(chunks, received);
    item.response_bytes = received;
    item.response_sha256 = sha256(bytes);
    await fs.writeFile(path.join(workspace,
      response.status === 200 ? stream.filename : `http-${stream.id}.bin`),
    bytes, { flag: 'wx' });
    assert.equal(response.status, 200,
      `Format ${stream.id} GET returned HTTP ${response.status}`);
    assert(received > 0, `Format ${stream.id} response is empty`);
    assert(received <= stream.bytes + 1024,
      `Format ${stream.id} exceeded advertised size allowance`);
    item.outcome = 'downloaded_private_unreviewed';
    item.finished_at = new Date().toISOString();
  }
  assert(report.streams.reduce((sum, stream) => sum + stream.response_bytes, 0)
    <= limits.total_retained_media_bytes);
  report.outcome = 'downloaded_private_unreviewed';
} catch (error) {
  report.outcome = 'failed';
  report.error = String(error);
  process.exitCode = 1;
} finally {
  report.finished_at = new Date().toISOString();
  report.elapsed_ms = Math.round(performance.now() - started);
  await fs.writeFile(path.join(workspace, 'acquisition.json'),
    `${JSON.stringify(report, null, 2)}\n`, { flag: 'wx' });
  console.log(`Private media attempt: ${workspace}`);
  console.log(JSON.stringify(report, null, 2));
}
