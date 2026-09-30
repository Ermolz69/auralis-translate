import assert from 'node:assert/strict';
import { createHash, randomUUID } from 'node:crypto';
import { createWriteStream } from 'node:fs';
import { mkdir, readFile, rename, rm, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { Readable, Transform } from 'node:stream';
import { pipeline } from 'node:stream/promises';

const root = resolve('.');
const sources = [
  {
    id: 'asus-rog-ally', revision: '892592485',
    sourceSha256: '923aed3991c2308d92b89c45181cea8ec7ece74e9b4d3a3ce0234d95e329913b',
    title: 'File:ASUS_ROG-Handheld-Leistungsanalyse_(极客湾Geekerwan)_01.webm',
  },
  {
    id: 'huawei-kirin-9010', revision: '880535591',
    sourceSha256: '57dfd9feb3bfe6381421c4142820b780af341e195e52ee81d58e8f9f12858feb',
    title: 'File:Huawei_Kirin_9010_in-depth_analysis_compared_to_9000s_(极客湾Geekerwan)_19.webm',
  },
];
const metadataMaxBytes = 1_048_576;
const mediaMaxBytes = 100 * 1024 * 1024;
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
let failed = false;

for (const source of sources) {
  const directory = join(root, '.cache/eval/commons-geekerwan-two-media',
    `${source.id}-${randomUUID()}`);
  await mkdir(directory, { recursive: true });
  const started = Date.now();
  const report = {
    schema_version: 1, id: source.id, title: source.title,
    source_srt_revision: source.revision, source_srt_sha256: source.sourceSha256,
    max_metadata_gets: 1, max_media_gets: 1,
    metadata_max_bytes: metadataMaxBytes, media_max_bytes: mediaMaxBytes,
    started_at: new Date(started).toISOString(), status: 'running',
  };
  const partial = join(directory, 'source.240p.webm.partial');
  try {
    const sourcePath = join(root,
      `.cache/eval/commons-${source.id}-${source.revision}/source.zh.srt`);
    assert.equal(hash(await readFile(sourcePath)), source.sourceSha256);
    const endpoint = new URL('https://commons.wikimedia.org/w/api.php');
    endpoint.search = new URLSearchParams({ action: 'query', format: 'json',
      prop: 'videoinfo', titles: source.title,
      viprop: 'derivatives|url|size|mime|sha1' }).toString();
    report.metadata_url = endpoint.toString();
    const metadata = await fetch(endpoint, {
      signal: AbortSignal.timeout(90_000), redirect: 'error',
      headers: { 'User-Agent': 'AuralisTranslateResearch/1.0 (private media inspection)' },
    });
    report.metadata_http_status = metadata.status;
    assert.equal(metadata.status, 200);
    const chunks = [];
    let metadataSize = 0;
    for await (const chunk of metadata.body) {
      metadataSize += chunk.length;
      assert(metadataSize <= metadataMaxBytes, 'Metadata response exceeds byte budget');
      chunks.push(chunk);
    }
    const raw = Buffer.concat(chunks);
    await writeFile(join(directory, 'raw-api.json'), raw, { flag: 'wx' });
    report.metadata_bytes = raw.length;
    report.metadata_sha256 = hash(raw);
    const data = JSON.parse(raw.toString('utf8'));
    assert(!data.error, 'Commons API returned an error');
    const pages = Object.values(data.query?.pages ?? {});
    assert.equal(pages.length, 1);
    const page = pages[0];
    assert.equal(page.title.replaceAll(' ', '_'), source.title.replaceAll(' ', '_'));
    const video = page.videoinfo?.[0];
    assert(video, 'Missing video info');
    report.original_sha1 = video.sha1 ?? null;
    report.original_bytes = video.size ?? null;
    const derivatives = video.derivatives ?? [];
    const selected = derivatives.filter(row => row.width === 426 && row.height === 240
      && row.type === 'video/webm; codecs="vp9, opus"');
    assert.equal(selected.length, 1, 'Expected one 426x240 VP9/Opus derivative');
    const mediaUrl = new URL(selected[0].src);
    assert.equal(mediaUrl.protocol, 'https:');
    assert.equal(mediaUrl.hostname, 'upload.wikimedia.org');
    assert(mediaUrl.pathname.startsWith('/wikipedia/commons/transcoded/'));
    report.media_url = mediaUrl.toString();
    report.selected_derivative = { width: 426, height: 240,
      type: selected[0].type, bitrate: selected[0].bitrate ?? null };
    const media = await fetch(mediaUrl, {
      signal: AbortSignal.timeout(600_000), redirect: 'error',
      headers: { 'User-Agent': 'AuralisTranslateResearch/1.0 (private alignment inspection)' },
    });
    report.media_http_status = media.status;
    report.media_content_type = media.headers.get('content-type');
    report.media_declared_bytes = Number(media.headers.get('content-length'));
    assert.equal(media.status, 200);
    assert(report.media_content_type?.includes('video/webm'));
    assert(Number.isSafeInteger(report.media_declared_bytes)
      && report.media_declared_bytes > 0 && report.media_declared_bytes <= mediaMaxBytes,
    'Missing or excessive declared media size');
    let received = 0;
    const digest = createHash('sha256');
    const limit = new Transform({ transform(chunk, _, callback) {
      received += chunk.length;
      if (received > mediaMaxBytes) return callback(new Error('Media byte budget exceeded'));
      digest.update(chunk);
      callback(null, chunk);
    } });
    await pipeline(Readable.fromWeb(media.body), limit,
      createWriteStream(partial, { flags: 'wx' }));
    assert.equal(received, report.media_declared_bytes, 'Incomplete media body');
    report.media_path = join(directory, 'source.240p.webm');
    await rename(partial, report.media_path);
    report.media_bytes = received;
    report.media_sha256 = digest.digest('hex');
    report.status = 'downloaded_private_unreviewed';
    console.log(JSON.stringify({ id: source.id, path: report.media_path,
      bytes: received, sha256: report.media_sha256 }));
  } catch (error) {
    failed = true;
    report.status = 'failed';
    report.error = error.message;
    await rm(partial, { force: true });
    console.error(`${source.id}: ${error.message}`);
  } finally {
    report.finished_at = new Date().toISOString();
    report.elapsed_ms = Date.now() - started;
    const reportPath = join(directory, 'acquisition.json');
    await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, { flag: 'wx' });
    console.log(`Private media acquisition: ${reportPath}`);
  }
}
if (failed) process.exitCode = 1;
