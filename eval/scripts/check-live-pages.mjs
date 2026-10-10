import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createHash, randomUUID } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { assertSiteMatchesHead, committedSiteBytes } from './committed-site-bytes.mjs';

const root = resolve('.');
const revision = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root,
  encoding: 'utf8', timeout: 10_000 }).trim();
assert.match(revision, /^[0-9a-f]{40}$/u);
assertSiteMatchesHead(root);
const directory = join(root, '.cache/eval/live-pages-check', `attempt-${randomUUID()}`);
await mkdir(directory, { recursive: true });
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const maxBytes = 2 * 1024 * 1024;
const timeoutMs = 30_000;
const report = { schema_version: 3, id: 'live-pages-two-html-byte-check-v3',
  revision, max_requests: 2, max_bytes_per_page: maxBytes,
  timeout_ms_per_page: timeoutMs, started_at: new Date().toISOString(),
  pages: [], status: 'running' };
for (const name of ['index.html', 'history.html']) {
  const url = new URL(name === 'index.html'
    ? 'https://ermolz69.github.io/auralis-translate/'
    : 'https://ermolz69.github.io/auralis-translate/history.html');
  url.searchParams.set('revision', revision);
  const page = { name, url: url.toString(), status: 'running' };
  report.pages.push(page);
  try {
    const committed = committedSiteBytes(root, name);
    page.committed_bytes = committed.length;
    page.committed_sha256 = hash(committed);
    assert(committed.length > 0 && committed.length <= maxBytes);
    const response = await fetch(url, { signal: AbortSignal.timeout(timeoutMs),
      redirect: 'error' });
    page.http_status = response.status;
    page.content_type = response.headers.get('content-type');
    assert.equal(response.status, 200);
    const chunks = [];
    let size = 0;
    for await (const chunk of response.body) {
      size += chunk.length;
      assert(size <= maxBytes, `${name} exceeds live byte budget`);
      chunks.push(chunk);
    }
    const live = Buffer.concat(chunks);
    await writeFile(join(directory, `live-${name}`), live, { flag: 'wx' });
    page.live_bytes = live.length;
    page.live_sha256 = hash(live);
    assert(live.equals(committed), `${name} differs from committed HEAD`);
    const text = live.toString('utf8');
    assert(text.includes('https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4'));
    assert(text.includes(name === 'index.html' ? 'id="current-data"' : 'id="report-data"'));
    page.status = 'live_byte_identical';
    console.log(JSON.stringify({ url: page.url, sha256: page.live_sha256,
      bytes: page.live_bytes, status: page.status }));
  } catch (error) {
    page.status = 'failed';
    page.error = error.message;
    console.error(`${name}: ${error.message}`);
  }
}
report.status = report.pages.every(page => page.status === 'live_byte_identical')
  ? 'live_byte_identical' : 'failed';
report.finished_at = new Date().toISOString();
await writeFile(join(directory, 'report.json'), `${JSON.stringify(report, null, 2)}\n`,
  { flag: 'wx' });
console.log(`Private live-page report: ${join(directory, 'report.json')}`);
if (report.status !== 'live_byte_identical') process.exitCode = 1;
