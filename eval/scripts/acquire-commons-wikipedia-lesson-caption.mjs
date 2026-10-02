import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const title = 'TimedText:中文維基百科教學頻道第兩章.ogv.zh-cn.srt';
const timeoutMs = 90_000;
const maxBytes = 256 * 1024;
const userAgent = 'AuralisTranslateResearch/0.1 (https://github.com/Ermolz69/auralis-translate)';
const api = new URL('https://commons.wikimedia.org/w/api.php');
api.search = new URLSearchParams({ action: 'query', format: 'json', formatversion: '2',
  prop: 'revisions', rvprop: 'ids|user|timestamp', titles: title }).toString();

if (process.argv.includes('--preflight')) {
  console.log(JSON.stringify({ title, metadata_url: api.toString(), requests: 2,
    timeout_ms_each: timeoutMs, max_bytes_each: maxBytes, retries: 0,
    output_root: '.cache/eval/commons-wikipedia-lesson-caption' }, null, 2));
  process.exit(0);
}

const outputRoot = path.join(root, '.cache/eval/commons-wikipedia-lesson-caption');
await fs.mkdir(outputRoot, { recursive: true });
const workspace = await fs.mkdtemp(path.join(outputRoot, 'attempt-'));
const started = Date.now();
const report = { experiment: 'DATA-03-commons-wikipedia-lesson-caption-2026-10-02-v1',
  title, started_at: new Date(started).toISOString(),
  budget: { requests: 2, timeout_ms_each: timeoutMs, max_bytes_each: maxBytes,
    retries: 0 }, requests: [], outcome: 'running' };

async function getBounded(url, name) {
  const record = { url: url.toString(), started_at: new Date().toISOString() };
  report.requests.push(record);
  const response = await fetch(url, { redirect: 'error',
    signal: AbortSignal.timeout(timeoutMs), headers: { 'User-Agent': userAgent } });
  record.http_status = response.status;
  assert(response.body, `${name} response has no body`);
  const reader = response.body.getReader();
  const chunks = [];
  let size = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.length;
    if (size > maxBytes) {
      await reader.cancel();
      throw new Error(`${name} response exceeded ${maxBytes} bytes`);
    }
    chunks.push(value);
  }
  const bytes = Buffer.concat(chunks, size);
  await fs.writeFile(path.join(workspace, name), bytes, { flag: 'wx' });
  record.bytes = size;
  record.sha256 = createHash('sha256').update(bytes).digest('hex');
  assert.equal(response.status, 200, `${name} HTTP status`);
  return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
}

try {
  const metadata = JSON.parse(await getBounded(api, 'revision-response.json'));
  const page = metadata.query?.pages?.[0];
  assert.equal(page?.title, title);
  assert(!page.missing, 'Chinese subtitle page is missing');
  const revision = page.revisions?.[0];
  assert(Number.isSafeInteger(revision?.revid), 'missing revision ID');
  report.revision = { id: revision.revid, author: revision.user,
    timestamp: revision.timestamp };
  const raw = new URL('https://commons.wikimedia.org/w/index.php');
  raw.search = new URLSearchParams({ title, oldid: String(revision.revid),
    action: 'raw' }).toString();
  const caption = await getBounded(raw, 'source.zh.srt');
  assert(/^1\r?\n\d{2}:\d{2}:\d{2},\d{3} --> /u.test(caption),
    'first cue is not plain SRT');
  report.outcome = 'retained_private_unreviewed';
} catch (error) {
  report.outcome = 'failed';
  report.error = String(error);
  process.exitCode = 1;
} finally {
  report.finished_at = new Date().toISOString();
  report.elapsed_ms = Date.now() - started;
  await fs.writeFile(path.join(workspace, 'acquisition.json'),
    `${JSON.stringify(report, null, 2)}\n`, { flag: 'wx' });
  console.log(`Retained source discovery: ${workspace}`);
  console.log(JSON.stringify(report, null, 2));
}
