import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { gunzipSync } from 'node:zlib';
import { digest } from './flores-file-fixture.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const stem = '2026-09-29-reg-006-paired-model-probe';
const base = path.join(root, 'eval/reports', stem);
const summary = JSON.parse(await fs.readFile(`${base}.json`));
const reportBytes = await fs.readFile(`${base}-report.json`);
const requestsGzip = await fs.readFile(`${base}-requests.jsonl.gz`);
const logsGzip = await fs.readFile(`${base}-server-logs.json.gz`);
assert.equal(digest(reportBytes), summary.report_sha256);
assert.equal(digest(requestsGzip), summary.requests_gzip_sha256);
assert.equal(digest(logsGzip), summary.server_logs_gzip_sha256);
const requestBytes = gunzipSync(requestsGzip);
const logsBytes = gunzipSync(logsGzip);
assert.equal(digest(requestBytes), summary.requests_uncompressed_sha256);
assert.equal(digest(logsBytes), summary.server_logs_uncompressed_sha256);
const report = JSON.parse(reportBytes);
const entries = requestBytes.toString('utf8').trim().split(/\r?\n/u).map(line => JSON.parse(line));
assert.equal(report.status, 'complete_observations_unreviewed');
assert.equal(entries.length, 16);
assert.equal(report.requests.length, 16);
assert.equal(summary.request_count, 16);
assert.equal(summary.model_summaries.length, 2);
assert(summary.model_summaries.every(row => row.structurally_valid === 8));
assert.deepEqual(report.budget.seeds, [101, 202]);
assert.equal(report.human_review, 'missing');
assert.equal(report.sealed_holdout, false);
for (let i = 0; i < 16; i++) {
  const entry = entries[i];
  assert.equal(entry.request_sha256, digest(Buffer.from(JSON.stringify(entry.request))));
  assert.equal(report.requests[i].request_sha256, entry.request_sha256);
  assert.equal(report.planned_requests[i].request_sha256, entry.request_sha256);
  assert.equal(entry.http_status, 200);
  assert.equal(entry.finish_reason, 'stop');
  assert.equal(entry.structural_outcome, 'valid_unreviewed');
  assert.equal(entry.accepted_candidate, JSON.parse(entry.raw_candidate).translations[0].text);
  assert.doesNotMatch(entry.request.messages[0].content, /\p{Script=Cyrillic}/u);
}
for (let i = 0; i < 8; i++) {
  const a = structuredClone(entries[i].request);
  const b = structuredClone(entries[i + 8].request);
  b.model = a.model;
  assert.deepEqual(a, b);
}
const logs = JSON.parse(logsBytes);
assert.equal(Object.keys(logs).sort().join(','), '1b,7b');
assert(Object.values(logs).every(log => log.includes('model loaded')));
console.log('REG-006 paired report verified: 16 source-only requests, matched model factor, raw responses and resource/log archive.');
