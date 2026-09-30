import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createHash, randomUUID } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';

const root = resolve('.');
const revision = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root,
  encoding: 'utf8', timeout: 10_000 }).trim();
assert.match(revision, /^[0-9a-f]{40}$/u);
const directory = join(root, '.cache/eval/live-pages-check', `attempt-${randomUUID()}`);
await mkdir(directory, { recursive: true });
const local = await readFile(join(root, 'site/index.html'));
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const url = new URL('https://ermolz69.github.io/auralis-translate/');
url.searchParams.set('revision', revision);
const started = Date.now();
const report = { schema_version: 1, id: 'live-pages-byte-check-v1', revision,
  url: url.toString(), max_requests: 1, max_bytes: 2 * 1024 * 1024,
  timeout_ms: 30_000, local_bytes: local.length, local_sha256: hash(local),
  started_at: new Date(started).toISOString(), status: 'running' };
try {
  assert(report.local_bytes > 0 && report.local_bytes <= report.max_bytes);
  const response = await fetch(url, { signal: AbortSignal.timeout(report.timeout_ms),
    redirect: 'error' });
  report.http_status = response.status;
  report.content_type = response.headers.get('content-type');
  assert.equal(response.status, 200);
  const chunks = [];
  let size = 0;
  for await (const chunk of response.body) {
    size += chunk.length;
    assert(size <= report.max_bytes, 'Live HTML exceeds byte budget');
    chunks.push(chunk);
  }
  const live = Buffer.concat(chunks);
  await writeFile(join(directory, 'live.html'), live, { flag: 'wx' });
  report.live_bytes = live.length;
  report.live_sha256 = hash(live);
  assert(live.equals(local), 'Live HTML differs from the checked local report');
  const text = live.toString('utf8');
  assert(text.includes('https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4'));
  assert(text.includes('<script id="report-data" type="application/json">'));
  report.status = 'live_byte_identical';
  console.log(JSON.stringify({ url: url.toString(), sha256: report.live_sha256,
    bytes: report.live_bytes, status: report.status }));
} catch (error) {
  report.status = 'failed';
  report.error = error.message;
  process.exitCode = 1;
  console.error(error);
} finally {
  report.finished_at = new Date().toISOString();
  report.elapsed_ms = Date.now() - started;
  await writeFile(join(directory, 'report.json'), `${JSON.stringify(report, null, 2)}\n`,
    { flag: 'wx' });
  console.log(`Private live-page report: ${join(directory, 'report.json')}`);
}
