import assert from 'node:assert/strict';
import { createHash, randomUUID } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';

const root = resolve('.');
const sourcePath = join(root, '.cache/eval/commons-train-1144114810/source.zh.srt');
const sourceSha256 = 'ccc47105cdc2c782d82421d9790e5babf5801a8196d1b6b744d6b8df71bf9b4c';
const title = 'File:250_KMH-2400_KM-12_Hour_Sleeper_Train_Across_China_｜Shenzhen-Beijing_on_CRH2E-2463_(纵向动卧).webm';
const endpoint = new URL('https://commons.wikimedia.org/w/api.php');
endpoint.search = new URLSearchParams({ action: 'query', format: 'json', prop: 'videoinfo',
  titles: title, viprop: 'derivatives|url|size|mime|sha1' }).toString();
const directory = join(root, '.cache/eval/commons-train-media', `inventory-${randomUUID()}`);
await mkdir(directory, { recursive: true });
const started = Date.now();
const report = { schema_version: 1, id: 'commons-train-media-inventory-v1',
  source_srt_sha256: sourceSha256, source_srt_revision: '1144114810',
  media_title: title, metadata_url: endpoint.toString(),
  max_requests: 1, max_response_bytes: 1_048_576, timeout_ms: 90_000,
  started_at: new Date(started).toISOString(), status: 'running' };
try {
  const source = await readFile(sourcePath);
  assert.equal(createHash('sha256').update(source).digest('hex'), sourceSha256);
  const response = await fetch(endpoint, { signal: AbortSignal.timeout(report.timeout_ms),
    headers: { 'User-Agent': 'AuralisTranslateResearch/1.0 (private candidate inventory)' } });
  report.http_status = response.status;
  assert.equal(response.status, 200);
  const chunks = [];
  let size = 0;
  for await (const chunk of response.body) {
    size += chunk.length;
    assert(size <= report.max_response_bytes, 'API response exceeds declared byte budget');
    chunks.push(chunk);
  }
  const raw = Buffer.concat(chunks);
  await writeFile(join(directory, 'raw-api.json'), raw, { flag: 'wx' });
  report.raw_sha256 = createHash('sha256').update(raw).digest('hex');
  report.raw_bytes = raw.length;
  const data = JSON.parse(raw.toString('utf8'));
  assert(!data.error, 'Commons API returned an error');
  const pages = Object.values(data.query?.pages ?? {});
  assert.equal(pages.length, 1);
  const page = pages[0];
  assert.equal(page.title.replaceAll(' ', '_'), title.replaceAll(' ', '_'));
  const video = page.videoinfo?.[0];
  assert(video, 'Missing video info');
  report.original_bytes = video.size ?? null;
  report.original_sha1 = video.sha1 ?? null;
  report.derivatives = (video.derivatives ?? []).map(({ type, src, width, height, bitrate }) => ({
    type, url: src, width, height, bitrate }));
  report.status = 'inventoried_unreviewed';
  console.log(JSON.stringify({ directory, original_bytes: report.original_bytes,
    derivatives: report.derivatives.filter(row => row.height <= 480) }));
} catch (error) {
  report.status = 'failed';
  report.error = error.message;
  process.exitCode = 1;
  console.error(error);
} finally {
  report.finished_at = new Date().toISOString();
  report.elapsed_ms = Date.now() - started;
  await writeFile(join(directory, 'report.json'), `${JSON.stringify(report, null, 2)}\n`, { flag: 'wx' });
  console.log(`Private candidate inventory: ${join(directory, 'report.json')}`);
}
