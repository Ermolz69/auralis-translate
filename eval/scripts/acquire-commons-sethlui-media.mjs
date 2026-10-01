import assert from 'node:assert/strict';
import { createHash, randomUUID } from 'node:crypto';
import { createWriteStream } from 'node:fs';
import { mkdir, readFile, rename, rm, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { Readable, Transform } from 'node:stream';
import { pipeline } from 'node:stream/promises';

const root = resolve('.');
const title = 'File:Inside One Of Singapore’s Most Refined Cantonese Kitchen - Behind The Plate (Turn on CC).webm';
const sourceSha256 = '077aef6a49aa7128f5ddd349f38ffc84dd669f5e4bbfae6d692efa2d78304967';
const endpoint = new URL('https://commons.wikimedia.org/w/api.php');
endpoint.search = new URLSearchParams({ action: 'query', format: 'json',
  prop: 'videoinfo', titles: title,
  viprop: 'derivatives|url|size|mime|sha1' }).toString();
const metadataMaxBytes = 1_048_576;
const mediaMaxBytes = 60 * 1024 * 1024;
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
if (process.argv.includes('--preflight')) {
  console.log(JSON.stringify({ title, metadata_url: endpoint.toString(),
    source_sha256: sourceSha256, metadata_gets: 1, media_gets: 1,
    metadata_timeout_ms: 90_000, media_timeout_ms: 600_000,
    metadata_max_bytes: metadataMaxBytes, media_max_bytes: mediaMaxBytes,
    retries: 0, redirects: 0 }, null, 2));
  process.exit(0);
}

const directory = join(root, '.cache/eval/commons-sethlui-media', `media-${randomUUID()}`);
await mkdir(directory, { recursive: true });
const started = Date.now();
const report = { experiment: 'DATA-03-commons-sethlui-media-2026-10-01-v1',
  title, source_srt_sha256: sourceSha256, metadata_url: endpoint.toString(),
  started_at: new Date(started).toISOString(), status: 'running',
  budget: { metadata_gets: 1, media_gets: 1, metadata_max_bytes: metadataMaxBytes,
    media_max_bytes: mediaMaxBytes, metadata_timeout_ms: 90_000,
    media_timeout_ms: 600_000, retries: 0 } };
const partial = join(directory, 'source.240p.webm.partial');
try {
  const source = await readFile(join(root,
    '.cache/eval/commons-sethlui-caption/caption-Cgsmq4/source.zh.srt'));
  assert.equal(sha256(source), sourceSha256, 'source caption changed');
  const metadata = await fetch(endpoint, { redirect: 'error',
    signal: AbortSignal.timeout(90_000),
    headers: { 'User-Agent': 'AuralisTranslateResearch/1.0 (private media inspection)' } });
  report.metadata_http_status = metadata.status;
  assert(metadata.body, 'missing metadata response body');
  const chunks = [];
  let metadataSize = 0;
  for await (const chunk of metadata.body) {
    metadataSize += chunk.length;
    assert(metadataSize <= metadataMaxBytes, 'metadata byte budget exceeded');
    chunks.push(chunk);
  }
  const raw = Buffer.concat(chunks);
  await writeFile(join(directory, 'raw-api.json'), raw, { flag: 'wx' });
  report.metadata_bytes = raw.length;
  report.metadata_sha256 = sha256(raw);
  assert.equal(metadata.status, 200);
  const data = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(raw));
  assert(!data.error, 'Commons API error');
  const pages = Object.values(data.query?.pages ?? {});
  assert.equal(pages.length, 1);
  assert.equal(pages[0].title.replaceAll(' ', '_'), title.replaceAll(' ', '_'));
  const video = pages[0].videoinfo?.[0];
  assert(video, 'missing video info');
  report.original_sha1 = video.sha1 ?? null;
  report.original_bytes = video.size ?? null;
  const selected = (video.derivatives ?? []).filter(row => row.width === 426
    && row.height === 240 && row.type === 'video/webm; codecs="vp9, opus"');
  assert.equal(selected.length, 1, 'expected one 426x240 VP9/Opus derivative');
  const mediaUrl = new URL(selected[0].src);
  assert.equal(mediaUrl.protocol, 'https:');
  assert.equal(mediaUrl.hostname, 'upload.wikimedia.org');
  assert(mediaUrl.pathname.startsWith('/wikipedia/commons/transcoded/'));
  report.media_url = mediaUrl.toString();
  report.selected_derivative = { width: 426, height: 240,
    type: selected[0].type, bitrate: selected[0].bitrate ?? null };
  const media = await fetch(mediaUrl, { redirect: 'error',
    signal: AbortSignal.timeout(600_000),
    headers: { 'User-Agent': 'AuralisTranslateResearch/1.0 (private media inspection)' } });
  report.media_http_status = media.status;
  report.media_content_type = media.headers.get('content-type');
  report.media_declared_bytes = Number(media.headers.get('content-length'));
  assert.equal(media.status, 200);
  assert(report.media_content_type?.includes('video/webm'));
  assert(Number.isSafeInteger(report.media_declared_bytes)
    && report.media_declared_bytes > 0
    && report.media_declared_bytes <= mediaMaxBytes, 'invalid media size');
  let received = 0;
  const digest = createHash('sha256');
  const limit = new Transform({ transform(chunk, _, callback) {
    received += chunk.length;
    if (received > mediaMaxBytes) return callback(new Error('media byte budget exceeded'));
    digest.update(chunk);
    callback(null, chunk);
  } });
  await pipeline(Readable.fromWeb(media.body), limit,
    createWriteStream(partial, { flags: 'wx' }));
  assert.equal(received, report.media_declared_bytes, 'incomplete media body');
  report.media_bytes = received;
  report.media_sha256 = digest.digest('hex');
  await rename(partial, join(directory, 'source.240p.webm'));
  report.status = 'downloaded_private_unreviewed';
} catch (error) {
  report.status = 'failed';
  report.error = String(error);
  await rm(partial, { force: true });
  process.exitCode = 1;
} finally {
  report.finished_at = new Date().toISOString();
  report.elapsed_ms = Date.now() - started;
  await writeFile(join(directory, 'acquisition.json'),
    `${JSON.stringify(report, null, 2)}\n`, { flag: 'wx' });
  console.log(JSON.stringify({ directory, ...report }, null, 2));
}
