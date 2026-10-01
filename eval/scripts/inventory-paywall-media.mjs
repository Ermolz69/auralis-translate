import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const identifier = 'PaywallTheBusinessOfScholarshipFinalMovieMastered';
const url = new URL(`https://archive.org/metadata/${identifier}`);
const expectedOgV = 'Paywall The Business of Scholarship Final Movie Mastered.ogv';
const limits = { requests: 1, retries: 0, timeout_ms: 45_000, max_bytes: 2 * 1024 * 1024 };
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
const preflight = process.argv[2] === '--preflight';
assert.equal(process.argv.length, preflight ? 3 : 2, 'Use no arguments or --preflight');
assert.equal(url.protocol, 'https:');
assert.equal(url.hostname, 'archive.org');
if (preflight) {
  console.log(JSON.stringify({ identifier, url: url.href, expected_ogv: expectedOgV, limits }, null, 2));
  process.exit(0);
}

const parent = path.join(root, '.cache/eval/paywall-media-metadata');
await fs.mkdir(parent, { recursive: true });
const workspace = await fs.mkdtemp(path.join(parent, 'inventory-'));
const report = { schema_version: 1, experiment: 'DATA-03-paywall-media-metadata-2026-10-01-v1',
  identifier, url: url.href, limits, started_at: new Date().toISOString(), outcome: 'running' };
const started = performance.now();
try {
  const response = await fetch(url, { redirect: 'error',
    signal: AbortSignal.timeout(limits.timeout_ms) });
  report.http_status = response.status;
  assert.equal(response.status, 200, 'Internet Archive metadata did not return HTTP 200');
  const reader = response.body?.getReader();
  assert(reader, 'Internet Archive metadata response has no body');
  const chunks = [];
  let received = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    received += value.byteLength;
    if (received > limits.max_bytes) {
      await reader.cancel();
      throw new Error('Internet Archive metadata exceeded byte budget');
    }
    chunks.push(value);
  }
  const bytes = Buffer.concat(chunks);
  await fs.writeFile(path.join(workspace, 'metadata.json'), bytes, { flag: 'wx' });
  report.response_bytes = bytes.length;
  report.response_sha256 = sha256(bytes);
  const metadata = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes));
  assert.equal(metadata.metadata?.identifier, identifier);
  const matches = metadata.files?.filter(file => file.name === expectedOgV) ?? [];
  assert.equal(matches.length, 1, 'Expected exactly one OGV derivative');
  report.film = { title: metadata.metadata.title, creator: metadata.metadata.creator,
    licenseurl: metadata.metadata.licenseurl, language: metadata.metadata.language };
  report.ogv = { name: matches[0].name, size: matches[0].size,
    md5: matches[0].md5, sha1: matches[0].sha1, source: matches[0].source,
    length: matches[0].length, format: matches[0].format };
  report.outcome = 'inventoried';
} catch (error) {
  report.outcome = 'failed';
  report.error = String(error);
  process.exitCode = 1;
} finally {
  report.finished_at = new Date().toISOString();
  report.elapsed_ms = Math.round(performance.now() - started);
  await fs.writeFile(path.join(workspace, 'inventory.json'),
    `${JSON.stringify(report, null, 2)}\n`, { flag: 'wx' });
  console.log(JSON.stringify({ workspace, ...report }, null, 2));
}
