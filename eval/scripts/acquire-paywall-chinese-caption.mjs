import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const revision = '4b4ffc0cbafd1d08bc4e0974dbd5454967a4acf9';
const filename = 'Paywall The Business of Scholarship CC BY 40.zh-tw.srt';
const url = new URL(`https://raw.githubusercontent.com/SCgeeker/Paywall_CH_Subtitles/${revision}/${encodeURIComponent(filename)}`);
const limits = { requests: 1, retries: 0, timeout_ms: 45_000, max_bytes: 256 * 1024 };
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
const preflight = process.argv[2] === '--preflight';
assert.equal(process.argv.length, preflight ? 3 : 2, 'Use no arguments or --preflight');
assert.equal(url.protocol, 'https:');
assert.equal(url.hostname, 'raw.githubusercontent.com');
assert(url.pathname.includes(`/${revision}/`));
if (preflight) {
  console.log(JSON.stringify({ source_repository: 'SCgeeker/Paywall_CH_Subtitles',
    revision, filename, url: url.href, limits }, null, 2));
  process.exit(0);
}

const parent = path.join(root, '.cache/eval/paywall-chinese-caption');
await fs.mkdir(parent, { recursive: true });
const workspace = await fs.mkdtemp(path.join(parent, 'caption-'));
const report = { schema_version: 1, experiment: 'DATA-03-paywall-caption-2026-10-01-v1',
  source_repository: 'SCgeeker/Paywall_CH_Subtitles', revision, filename,
  url: url.href, url_sha256: sha256(Buffer.from(url.href)), limits,
  started_at: new Date().toISOString(), outcome: 'running' };
const started = performance.now();
try {
  const response = await fetch(url, { redirect: 'error',
    signal: AbortSignal.timeout(limits.timeout_ms) });
  report.http_status = response.status;
  report.content_type = response.headers.get('content-type');
  assert.equal(response.status, 200, 'Pinned Chinese subtitle GET did not return HTTP 200');
  const reader = response.body?.getReader();
  assert(reader, 'Pinned Chinese subtitle response has no body');
  const chunks = [];
  let received = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    received += value.byteLength;
    if (received > limits.max_bytes) {
      await reader.cancel();
      throw new Error('Pinned Chinese subtitle exceeded byte budget');
    }
    chunks.push(value);
  }
  const bytes = Buffer.concat(chunks);
  const decoded = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  assert(/^\uFEFF?\d+\r?\n\d\d:\d\d:\d\d,\d\d\d --> /u.test(decoded),
    'Pinned response is not a plain SRT opening');
  await fs.writeFile(path.join(workspace, 'source.zh-tw.srt'), bytes, { flag: 'wx' });
  report.response_bytes = bytes.length;
  report.response_sha256 = sha256(bytes);
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
  console.log(JSON.stringify({ workspace, ...report }, null, 2));
}
