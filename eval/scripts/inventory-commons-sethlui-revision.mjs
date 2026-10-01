import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const title = 'TimedText:Inside One Of Singapore’s Most Refined Cantonese Kitchen - Behind The Plate (Turn on CC).webm.zh-hans.srt';
const endpoint = new URL('https://commons.wikimedia.org/w/api.php');
endpoint.search = new URLSearchParams({ action: 'query', prop: 'revisions',
  titles: title, rvprop: 'ids|timestamp|user|size|comment', rvlimit: '1',
  format: 'json', formatversion: '2' }).toString();
const timeoutMs = 90_000;
const maxBytes = 1024 * 1024;
if (process.argv.includes('--preflight')) {
  console.log(JSON.stringify({ title, url: endpoint.toString(), max_requests: 1,
    timeout_ms: timeoutMs, max_bytes: maxBytes, retries: 0, downloads: 0 }, null, 2));
  process.exit(0);
}

const parent = path.join(root, '.cache/eval/commons-sethlui-caption');
await fs.mkdir(parent, { recursive: true });
const workspace = await fs.mkdtemp(path.join(parent, 'revision-'));
const started = Date.now();
const report = { experiment: 'DATA-03-commons-sethlui-revision-2026-10-01-v1',
  title, url: endpoint.toString(), started_at: new Date(started).toISOString(),
  budget: { requests: 1, timeout_ms: timeoutMs, max_bytes: maxBytes,
    retries: 0, downloads: 0 }, outcome: { status: 'running' } };
try {
  const response = await fetch(endpoint, { redirect: 'error',
    signal: AbortSignal.timeout(timeoutMs),
    headers: { 'User-Agent': 'AuralisTranslateResearch/0.1 (https://github.com/Ermolz69/auralis-translate)' } });
  report.outcome.http_status = response.status;
  assert(response.body, 'metadata response has no body');
  const chunks = [];
  let size = 0;
  const reader = response.body.getReader();
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.length;
    if (size > maxBytes) {
      await reader.cancel();
      throw new Error('revision metadata exceeded byte limit');
    }
    chunks.push(value);
  }
  const bytes = Buffer.concat(chunks, size);
  await fs.writeFile(path.join(workspace, 'api-response.json'), bytes, { flag: 'wx' });
  report.outcome.bytes = size;
  report.outcome.sha256 = createHash('sha256').update(bytes).digest('hex');
  assert.equal(response.status, 200);
  const value = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes));
  const pages = value.query?.pages;
  assert.equal(pages?.length, 1, 'unexpected page count');
  assert.equal(pages[0].title, title, 'resolved TimedText title changed');
  assert.equal(pages[0].revisions?.length, 1, 'revision not found');
  const revision = pages[0].revisions[0];
  assert(Number.isInteger(revision.revid) && revision.revid > 0);
  report.revision = { id: revision.revid, timestamp: revision.timestamp,
    user: revision.user, size: revision.size, comment: revision.comment };
  report.outcome.status = 'retrieved_private_unreviewed';
} catch (error) {
  report.outcome.status = 'failed';
  report.outcome.error = String(error);
  process.exitCode = 1;
} finally {
  report.finished_at = new Date().toISOString();
  report.elapsed_ms = Date.now() - started;
  await fs.writeFile(path.join(workspace, 'inventory.json'),
    `${JSON.stringify(report, null, 2)}\n`, { flag: 'wx' });
  console.log(`Retained Commons revision inventory: ${workspace}`);
  console.log(JSON.stringify(report, null, 2));
}
