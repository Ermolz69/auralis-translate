import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { gunzipSync } from 'node:zlib';
import { digest } from './flores-file-fixture.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const reports = path.join(root, 'eval/reports');
const stem = '2026-09-29-reg-009-identifier-prompt';
const summaryBytes = await fs.readFile(path.join(reports, `${stem}-summary.json`));
assert.equal(digest(summaryBytes), 'ac70512ba2e3f60148fdbf832dd12cc746a1a5e048e1211bdac3d2ccd3c178e6');
const summary = JSON.parse(summaryBytes);
const reportBytes = await fs.readFile(path.join(reports, summary.report_file));
const requestsGzip = await fs.readFile(path.join(reports, summary.requests_file));
const resourcesGzip = await fs.readFile(path.join(reports, summary.resources_file));
assert.equal(digest(reportBytes), summary.report_sha256);
assert.equal(digest(requestsGzip), summary.requests_gzip_sha256);
assert.equal(digest(resourcesGzip), summary.resources_gzip_sha256);
assert.equal(digest(gunzipSync(requestsGzip)), summary.requests_uncompressed_sha256);
const report = JSON.parse(reportBytes);
const requests = gunzipSync(requestsGzip).toString('utf8').trim().split('\n').map(JSON.parse);
const resources = gunzipSync(resourcesGzip).toString('utf8').trim().split('\n').map(JSON.parse);
assert.equal(summary.outcome, 'no_identifier_gain_unreviewed');
assert.equal(summary.release_gate, 'open');
assert.equal(summary.human_review, 'missing');
assert.equal(summary.sealed_holdout, false);
assert.equal(summary.git_head, report.identity.git_head);
assert.equal(summary.harness_sha256, report.identity.harness_sha256);
assert.equal(report.status, 'complete_observations_unreviewed');
assert.equal(report.requests.length, 16);
assert.equal(requests.length, 16);
assert.equal(summary.baseline.requests, 8);
assert.equal(summary.reminder.requests, 8);
assert.equal(summary.baseline.structurally_valid, 8);
assert.equal(summary.reminder.structurally_valid, 8);
assert.equal(summary.baseline.exact_identifier, 2);
assert.equal(summary.reminder.exact_identifier, 2);
assert.equal(summary.paired_code_gain, 0);
assert.equal(summary.reminder.prompt_tokens - summary.baseline.prompt_tokens, 312);
assert.equal(resources.length, summary.resources.sample_count);
assert(resources.every(row => row.errors.length === 0));
assert.deepEqual(resources, report.resources.samples);
for (const [index, request] of requests.entries()) {
  assert.equal(request.request_sha256, digest(Buffer.from(JSON.stringify(request.request))));
  assert.equal(request.request_sha256, report.planned_requests[index].request_sha256);
  assert.equal(request.accepted_candidate, report.requests[index].accepted_candidate);
  assert.equal(request.identifier_preserved, report.requests[index].identifier_preserved);
  assert.equal(request.structural_outcome, 'valid_unreviewed');
  assert(!/\p{Script=Cyrillic}/u.test(request.request.messages[0].content));
}
for (const cue of [1, 2, 514, 1000]) for (const seed of [101, 202]) {
  const pair = requests.filter(row => row.cue_id === cue && row.seed === seed);
  assert.equal(pair.length, 2);
  assert.equal(pair[0].identifier_preserved, pair[1].identifier_preserved);
}
console.log('REG-009 prompt screen verified: 16 matched raw requests; both arms keep 2/8 codes and all 8 JSON slots each.');
