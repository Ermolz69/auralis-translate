import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const url = new URL('https://upload.wikimedia.org/wikipedia/commons/1/14/%E4%B8%AD%E6%96%87%E7%B6%AD%E5%9F%BA%E7%99%BE%E7%A7%91%E6%95%99%E5%AD%B8%E9%A0%BB%E9%81%93%E7%AC%AC%E5%85%A9%E7%AB%A0.ogv');
const outputRoot = path.join(root, '.cache/eval/commons-wikipedia-lesson-media');
const timeoutMs = 180_000;
const maxBytes = 24 * 1024 * 1024;
if (process.argv.includes('--preflight')) {
  console.log(JSON.stringify({ url: url.toString(), requests: 1,
    timeout_ms: timeoutMs, max_bytes: maxBytes, retries: 0,
    output_root: outputRoot }, null, 2));
  process.exit(0);
}

await fs.mkdir(outputRoot, { recursive: true });
const workspace = await fs.mkdtemp(path.join(outputRoot, 'attempt-'));
const started = Date.now();
const report = { experiment: 'DATA-03-commons-wikipedia-lesson-media-2026-10-02-v1',
  source_url: url.toString(), started_at: new Date(started).toISOString(),
  budget: { requests: 1, timeout_ms: timeoutMs, max_bytes: maxBytes, retries: 0 },
  status: 'running' };
try {
  const response = await fetch(url, { redirect: 'error',
    signal: AbortSignal.timeout(timeoutMs),
    headers: { 'User-Agent': 'AuralisTranslateResearch/0.1 (https://github.com/Ermolz69/auralis-translate)' } });
  report.http_status = response.status;
  assert(response.body, 'media response has no body');
  const reader = response.body.getReader();
  const chunks = [];
  let size = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.length;
    if (size > maxBytes) {
      await reader.cancel();
      throw new Error('media exceeds frozen byte limit');
    }
    chunks.push(value);
  }
  const bytes = Buffer.concat(chunks, size);
  await fs.writeFile(path.join(workspace, 'response.bin'), bytes, { flag: 'wx' });
  report.bytes = size;
  report.sha256 = createHash('sha256').update(bytes).digest('hex');
  assert.equal(response.status, 200);
  assert(bytes.length > 1024 * 1024, 'unexpectedly small media');
  await fs.writeFile(path.join(workspace, 'source.ogv'), bytes, { flag: 'wx' });
  report.status = 'retained_private_unreviewed';
} catch (error) {
  report.status = 'failed';
  report.error = String(error);
  process.exitCode = 1;
} finally {
  report.finished_at = new Date().toISOString();
  report.elapsed_ms = Date.now() - started;
  await fs.writeFile(path.join(workspace, 'acquisition.json'),
    `${JSON.stringify(report, null, 2)}\n`, { flag: 'wx' });
  console.log(`Retained media attempt: ${workspace}`);
  console.log(JSON.stringify(report, null, 2));
}
