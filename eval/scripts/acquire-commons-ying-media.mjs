import assert from 'node:assert/strict';
import { createHash, randomUUID } from 'node:crypto';
import { createWriteStream, mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { performance } from 'node:perf_hooks';
import { Readable, Transform } from 'node:stream';
import { pipeline } from 'node:stream/promises';

const source = 'https://upload.wikimedia.org/wikipedia/commons/7/7f/WIKITONGUES-_Ying_speaking_Henan_Chinese.webm';
const root = resolve('.cache/eval/commons-ying-media');
const directory = join(root, `attempt-${randomUUID()}`);
const maxBytes = 50 * 1024 * 1024;
const timeoutMs = 180_000;
const started = performance.now();
mkdirSync(directory, { recursive: true });
const partial = join(directory, 'source.webm.partial');
const final = join(directory, 'source.webm');
const report = {
  schema_version: 1,
  experiment_id: 'commons-ying-media-private-v1',
  source_url: source,
  source_srt_sha256: '505913bd7046b28c873307562a55d567043f8703bc00375c3485853b87c420d9',
  source_srt_revision: '1238607314',
  max_bytes: maxBytes,
  timeout_ms: timeoutMs,
  max_get_attempts: 1,
  started_at: new Date().toISOString(),
};
const controller = new AbortController();
const timeout = setTimeout(() => controller.abort(), timeoutMs);
let received = 0;
const digest = createHash('sha256');
try {
  assert.equal(createHash('sha256').update(readFileSync('.cache/eval/commons-ying-1238607314/source.zh.srt')).digest('hex'),
    report.source_srt_sha256);
  const response = await fetch(source, { signal: controller.signal, redirect: 'error',
    headers: { 'User-Agent': 'AuralisTranslateResearch/1.0 (private source inspection)' } });
  report.http_status = response.status;
  report.content_type = response.headers.get('content-type');
  report.declared_bytes = Number(response.headers.get('content-length'));
  assert.equal(response.status, 200);
  assert(report.content_type?.includes('video/webm'));
  assert(Number.isSafeInteger(report.declared_bytes) && report.declared_bytes > 0 && report.declared_bytes <= maxBytes);
  const limit = new Transform({ transform(chunk, _, callback) {
    received += chunk.length;
    if (received > maxBytes) return callback(new Error('download exceeded byte budget'));
    digest.update(chunk);
    callback(null, chunk);
  } });
  await pipeline(Readable.fromWeb(response.body), limit, createWriteStream(partial, { flags: 'wx' }));
  assert.equal(received, report.declared_bytes);
  renameSync(partial, final);
  report.status = 'downloaded_private_unreviewed';
  report.bytes = received;
  report.sha256 = digest.digest('hex');
  report.path = final;
  console.log(JSON.stringify({ path: final, bytes: received, sha256: report.sha256 }));
} catch (error) {
  report.status = 'failed';
  report.error = error.message;
  report.bytes = received;
  rmSync(partial, { force: true });
  console.error(error);
  process.exitCode = 1;
} finally {
  clearTimeout(timeout);
  report.finished_at = new Date().toISOString();
  report.elapsed_ms = Math.round(performance.now() - started);
  writeFileSync(join(directory, 'acquisition.json'), `${JSON.stringify(report, null, 2)}\n`, { flag: 'wx' });
}
