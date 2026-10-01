import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const inventoryPath = path.join(root,
  '.cache/eval/paywall-media-metadata/inventory-lQWKfU/metadata.json');
const inventoryBytes = await fs.readFile(inventoryPath);
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
assert.equal(sha256(inventoryBytes),
  'f5948aba883c2e0cfac0ef8a8eef3e4693fac01cc094a8b5e809d7d3908db33c');
const metadata = JSON.parse(inventoryBytes);
const identifier = 'PaywallTheBusinessOfScholarshipFinalMovieMastered';
const filename = 'Paywall The Business of Scholarship Final Movie Mastered.ogv';
assert.equal(metadata.metadata.identifier, identifier);
const matches = metadata.files?.filter(file => file.name === filename) ?? [];
assert.equal(matches.length, 1);
const expected = { bytes: 294354909,
  md5: 'ca0820d330ff5c55f147c17ce95f5ab4',
  sha1: '7f2590d2128823bf144de62f723c672b0fd086c9' };
assert.equal(Number(matches[0].size), expected.bytes);
assert.equal(matches[0].md5, expected.md5);
assert.equal(matches[0].sha1, expected.sha1);
const url = new URL(`https://archive.org/download/${identifier}/${encodeURIComponent(filename)}`);
const limits = { max_http_requests: 2, max_redirects: 1, retries: 0,
  timeout_ms: 12 * 60 * 1000, max_bytes: 320 * 1024 * 1024 };
const preflight = process.argv[2] === '--preflight';
assert.equal(process.argv.length, preflight ? 3 : 2, 'Use no arguments or --preflight');
if (preflight) {
  console.log(JSON.stringify({ identifier, url: url.href, inventory_sha256: sha256(inventoryBytes),
    expected, limits }, null, 2));
  process.exit(0);
}

const parent = path.join(root, '.cache/eval/paywall-media');
await fs.mkdir(parent, { recursive: true });
const workspace = await fs.mkdtemp(path.join(parent, 'media-'));
const partialPath = path.join(workspace, 'media.partial.ogv');
const outputPath = path.join(workspace, 'source.ogv');
const report = { schema_version: 1, experiment: 'DATA-03-paywall-ogv-2026-10-01-v1',
  identifier, filename, source_url: url.href,
  inventory_sha256: sha256(inventoryBytes), expected, limits,
  started_at: new Date().toISOString(), outcome: 'running', http: [] };
const started = performance.now();
const md5 = createHash('md5');
const sha1 = createHash('sha1');
const sha256stream = createHash('sha256');
let received = 0;
let file;
try {
  const signal = AbortSignal.timeout(limits.timeout_ms);
  let current = url;
  let response;
  for (let request = 1; request <= limits.max_http_requests; request++) {
    assert.equal(current.protocol, 'https:');
    assert(current.hostname === 'archive.org' || current.hostname.endsWith('.archive.org'));
    response = await fetch(current, { redirect: 'manual', signal });
    report.http.push({ host: current.hostname, pathname: current.pathname,
      status: response.status, content_length: response.headers.get('content-length') });
    if (![301, 302, 303, 307, 308].includes(response.status)) break;
    assert(request < limits.max_http_requests, 'Archive redirect budget exceeded');
    current = new URL(response.headers.get('location'), current);
  }
  assert.equal(response.status, 200, 'Archive OGV GET did not return HTTP 200');
  assert(response.body, 'Archive OGV response has no body');
  file = await fs.open(partialPath, 'wx');
  for await (const chunk of response.body) {
    received += chunk.byteLength;
    assert(received <= limits.max_bytes, 'Archive OGV exceeded byte budget');
    let offset = 0;
    while (offset < chunk.byteLength) {
      const { bytesWritten } = await file.write(chunk, offset, chunk.byteLength - offset);
      assert(bytesWritten > 0, 'Archive OGV file write stalled');
      offset += bytesWritten;
    }
    md5.update(chunk);
    sha1.update(chunk);
    sha256stream.update(chunk);
  }
  await file.close();
  file = null;
  report.received_bytes = received;
  report.md5 = md5.digest('hex');
  report.sha1 = sha1.digest('hex');
  report.sha256 = sha256stream.digest('hex');
  assert.equal(received, expected.bytes, 'Archive OGV byte count differs from metadata');
  assert.equal(report.md5, expected.md5, 'Archive OGV MD5 differs from metadata');
  assert.equal(report.sha1, expected.sha1, 'Archive OGV SHA-1 differs from metadata');
  await fs.rename(partialPath, outputPath);
  report.outcome = 'acquired_private_unreviewed';
} catch (error) {
  report.outcome = 'failed';
  report.error = String(error);
  report.received_bytes = received;
  process.exitCode = 1;
} finally {
  if (file) await file.close();
  report.finished_at = new Date().toISOString();
  report.elapsed_ms = Math.round(performance.now() - started);
  await fs.writeFile(path.join(workspace, 'acquisition.json'),
    `${JSON.stringify(report, null, 2)}\n`, { flag: 'wx' });
  console.log(JSON.stringify({ workspace, ...report }, null, 2));
}
