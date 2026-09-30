import assert from 'node:assert/strict';
import { createHash, randomUUID } from 'node:crypto';
import { createWriteStream } from 'node:fs';
import { mkdir, readFile, rename, rm, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { Readable, Transform } from 'node:stream';
import { pipeline } from 'node:stream/promises';

const root = resolve('.');
const sourceSha256 = '8c41e66f52000a5b67ab27bfc319accd11d89290b60e50fc5c60f4ee8230a000';
const inventoryDirectory = join(root,
  '.cache/eval/commons-vivo-media/inventory-e0625b94-6329-4190-960e-5b9e687a4956');
const inventorySha256 = 'b9545b78ee11fe1c57c58b1b96520217ca38371b00035c63e0410adc32928b30';
const directory = join(root, '.cache/eval/commons-vivo-media', `media-${randomUUID()}`);
const maxBytes = 100 * 1024 * 1024;
const timeoutMs = 600_000;
await mkdir(directory, { recursive: true });
const partial = join(directory, 'source.240p.webm.partial');
const final = join(directory, 'source.240p.webm');
const started = Date.now();
const report = { schema_version: 1, id: 'commons-vivo-media-240p-v1',
  source_srt_sha256: sourceSha256, inventory_report_sha256: inventorySha256,
  max_get_attempts: 1, max_bytes: maxBytes, timeout_ms: timeoutMs,
  started_at: new Date(started).toISOString(), status: 'running' };
let received = 0;
try {
  const digest = bytes => createHash('sha256').update(bytes).digest('hex');
  assert.equal(digest(await readFile(join(root, '.cache/eval/commons-vivo-979826861/source.zh.srt'))), sourceSha256);
  const inventoryBytes = await readFile(join(inventoryDirectory, 'report.json'));
  assert.equal(digest(inventoryBytes), inventorySha256);
  const inventory = JSON.parse(inventoryBytes);
  assert.equal(inventory.status, 'inventoried_unreviewed');
  const selected = inventory.derivatives.filter(row => row.height === 240 && row.width === 426
    && row.type === 'video/webm; codecs="vp9, opus"');
  assert.equal(selected.length, 1);
  const url = new URL(selected[0].url);
  assert.equal(url.protocol, 'https:');
  assert.equal(url.hostname, 'upload.wikimedia.org');
  assert(url.pathname.startsWith('/wikipedia/commons/transcoded/'));
  report.media_url = url.toString();
  const response = await fetch(url, { signal: AbortSignal.timeout(timeoutMs), redirect: 'error',
    headers: { 'User-Agent': 'AuralisTranslateResearch/1.0 (private alignment inspection)' } });
  report.http_status = response.status;
  report.content_type = response.headers.get('content-type');
  report.declared_bytes = Number(response.headers.get('content-length'));
  assert.equal(response.status, 200);
  assert(report.content_type?.includes('video/webm'));
  assert(Number.isSafeInteger(report.declared_bytes)
    && report.declared_bytes > 0 && report.declared_bytes <= maxBytes,
  'Missing or excessive declared media size');
  const sha = createHash('sha256');
  const limit = new Transform({ transform(chunk, _, callback) {
    received += chunk.length;
    if (received > maxBytes) return callback(new Error('Media byte budget exceeded'));
    sha.update(chunk);
    callback(null, chunk);
  } });
  await pipeline(Readable.fromWeb(response.body), limit,
    createWriteStream(partial, { flags: 'wx' }));
  assert.equal(received, report.declared_bytes, 'Incomplete media body');
  await rename(partial, final);
  report.status = 'downloaded_private_unreviewed';
  report.bytes = received;
  report.sha256 = sha.digest('hex');
  report.path = final;
  console.log(JSON.stringify({ path: final, bytes: received, sha256: report.sha256 }));
} catch (error) {
  report.status = 'failed';
  report.error = error.message;
  report.bytes = received;
  await rm(partial, { force: true });
  process.exitCode = 1;
  console.error(error);
} finally {
  report.finished_at = new Date().toISOString();
  report.elapsed_ms = Date.now() - started;
  await writeFile(join(directory, 'acquisition.json'), `${JSON.stringify(report, null, 2)}\n`, { flag: 'wx' });
  console.log(`Private media acquisition: ${join(directory, 'acquisition.json')}`);
}
