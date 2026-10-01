import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const title = 'TimedText:Inside One Of Singapore’s Most Refined Cantonese Kitchen - Behind The Plate (Turn on CC).webm.zh-hans.srt';
const revision = '1200692574';
const pinnedRevisionResponseSha256 = 'f612add78c7924c02a93ef3dd8f9e4f8e6e7cda6e759e69d35db932937de9108';
const revisionBytes = await fs.readFile(path.join(root,
  '.cache/eval/commons-sethlui-caption/revision-oNikme/api-response.json'));
assert.equal(createHash('sha256').update(revisionBytes).digest('hex'),
  pinnedRevisionResponseSha256, 'revision inventory response changed');
const page = JSON.parse(revisionBytes.toString('utf8')).query?.pages?.[0];
assert.equal(page?.title, title);
assert.equal(String(page.revisions?.[0]?.revid), revision);

const endpoint = new URL('https://commons.wikimedia.org/w/index.php');
endpoint.search = new URLSearchParams({ title, oldid: revision,
  action: 'raw' }).toString();
const timeoutMs = 90_000;
const maxBytes = 256 * 1024;
if (process.argv.includes('--preflight')) {
  console.log(JSON.stringify({ title, revision, url: endpoint.toString(),
    revision_response_sha256: pinnedRevisionResponseSha256,
    requests: 1, timeout_ms: timeoutMs, max_bytes: maxBytes, retries: 0 }, null, 2));
  process.exit(0);
}

const parent = path.join(root, '.cache/eval/commons-sethlui-caption');
const workspace = await fs.mkdtemp(path.join(parent, 'caption-'));
const started = Date.now();
const report = { experiment: 'DATA-03-commons-sethlui-caption-2026-10-01-v1',
  title, revision, url: endpoint.toString(),
  revision_response_sha256: pinnedRevisionResponseSha256,
  started_at: new Date(started).toISOString(),
  budget: { requests: 1, timeout_ms: timeoutMs, max_bytes: maxBytes, retries: 0 },
  outcome: { status: 'running' } };
try {
  const response = await fetch(endpoint, { redirect: 'error',
    signal: AbortSignal.timeout(timeoutMs),
    headers: { 'User-Agent': 'AuralisTranslateResearch/0.1 (https://github.com/Ermolz69/auralis-translate)' } });
  report.outcome.http_status = response.status;
  assert(response.body, 'caption response has no body');
  const chunks = [];
  let size = 0;
  const reader = response.body.getReader();
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.length;
    if (size > maxBytes) {
      await reader.cancel();
      throw new Error('caption response exceeded byte limit');
    }
    chunks.push(value);
  }
  const bytes = Buffer.concat(chunks, size);
  await fs.writeFile(path.join(workspace, 'response.bin'), bytes, { flag: 'wx' });
  report.outcome.bytes = size;
  report.outcome.sha256 = createHash('sha256').update(bytes).digest('hex');
  assert.equal(response.status, 200);
  const content = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  assert(/^1\r?\n00:00:07,966 --> 00:00:09,600\r?\n/u.test(content),
    'unexpected first cue in pinned caption');
  await fs.writeFile(path.join(workspace, 'source.zh.srt'), bytes, { flag: 'wx' });
  report.outcome.status = 'downloaded_private_unreviewed';
} catch (error) {
  report.outcome.status = 'failed';
  report.outcome.error = String(error);
  process.exitCode = 1;
} finally {
  report.finished_at = new Date().toISOString();
  report.elapsed_ms = Date.now() - started;
  await fs.writeFile(path.join(workspace, 'acquisition.json'),
    `${JSON.stringify(report, null, 2)}\n`, { flag: 'wx' });
  console.log(`Retained Commons caption acquisition: ${workspace}`);
  console.log(JSON.stringify(report, null, 2));
}
