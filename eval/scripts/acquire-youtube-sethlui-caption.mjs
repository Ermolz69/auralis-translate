import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const preflight = process.argv[2] === '--preflight';
assert.equal(process.argv.length, preflight ? 3 : 2, 'Use no arguments or --preflight');
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const metadataPath = path.join(root,
  '.cache/eval/youtube-sethlui-license/inventory-T8gpxQ/extractor-stdout.json');
const metadataBytes = await fs.readFile(metadataPath);
assert.equal(sha(metadataBytes),
  'ef0e47700896ec4ea2909ffcfdc12bc4075f6bc301006d86da9f8fda34ad0a8b');
const metadata = JSON.parse(metadataBytes);
assert.equal(metadata.id, 'yvCR-EqMhng');
assert.equal(metadata.license, 'Creative Commons Attribution license (reuse allowed)');
const tracks = metadata.subtitles?.['zh-Hans']?.filter(track => track.ext === 'srt') ?? [];
assert.equal(tracks.length, 1);
const url = new URL(tracks[0].url);
assert.equal(url.protocol, 'https:');
assert.equal(url.hostname, 'www.youtube.com');
assert.equal(url.pathname, '/api/timedtext');
assert.equal(url.searchParams.get('v'), metadata.id);
assert.equal(url.searchParams.get('lang'), 'zh-Hans');
assert.equal(url.searchParams.get('fmt'), 'srt');
const commons = await fs.readFile(path.join(root,
  '.cache/eval/commons-sethlui-caption/caption-Cgsmq4/source.zh.srt'));
assert.equal(sha(commons), '077aef6a49aa7128f5ddd349f38ffc84dd669f5e4bbfae6d692efa2d78304967');
const limits = { calls: 1, timeout_ms: 30_000, response_bytes: 256 * 1024, retries: 0 };
if (preflight) {
  console.log(JSON.stringify({ source_video_id: metadata.id, source_url_host: url.hostname,
    source_url_path: url.pathname, source_url_sha256: sha(Buffer.from(url.href)),
    metadata_sha256: sha(metadataBytes), commons_sha256: sha(commons), limits }, null, 2));
  process.exit(0);
}
const parent = path.join(root, '.cache/eval/youtube-sethlui-caption');
await fs.mkdir(parent, { recursive: true });
const workspace = await fs.mkdtemp(path.join(parent, 'caption-'));
const report = { schema_version: 1, experiment: 'DATA-03-youtube-sethlui-caption-2026-10-01-v1',
  video_id: metadata.id, language: 'zh-Hans', format: 'srt',
  started_at: new Date().toISOString(), metadata_sha256: sha(metadataBytes),
  commons_source_sha256: sha(commons), url_sha256: sha(Buffer.from(url.href)),
  source_host: url.hostname, source_path: url.pathname, limits, outcome: 'running' };
const started = performance.now();
try {
  const response = await fetch(url, { redirect: 'manual', signal: AbortSignal.timeout(limits.timeout_ms) });
  report.http_status = response.status;
  report.content_type = response.headers.get('content-type');
  assert.equal(response.status, 200, 'YouTube SRT GET did not return HTTP 200');
  const reader = response.body?.getReader();
  assert(reader, 'YouTube SRT response has no body');
  const chunks = [];
  let received = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    received += value.byteLength;
    assert(received <= limits.response_bytes, 'YouTube SRT exceeded byte budget');
    chunks.push(value);
  }
  const source = Buffer.concat(chunks);
  assert(source.length > 0, 'YouTube SRT response is empty');
  report.response_bytes = source.length;
  report.response_sha256 = sha(source);
  report.matches_commons_bytes = source.equals(commons);
  await fs.writeFile(path.join(workspace, 'source.zh.srt'), source, { flag: 'wx' });
  report.outcome = 'acquired';
} catch (error) {
  report.outcome = 'failed';
  report.error = String(error);
  process.exitCode = 1;
} finally {
  report.finished_at = new Date().toISOString();
  report.elapsed_ms = Math.round(performance.now() - started);
  await fs.writeFile(path.join(workspace, 'acquisition.json'), `${JSON.stringify(report, null, 2)}\n`, { flag: 'wx' });
  console.log(JSON.stringify({ workspace, ...report }, null, 2));
}
