import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { digest } from './flores-file-fixture.mjs';

const root = path.resolve('.');
const reportPath = path.join(root, '.cache/eval/natural-asus-slot-schema-screen-v1/run-b5AhOd/report.json');
const reportBytes = fs.readFileSync(reportPath);
assert.equal(digest(reportBytes), '0fc64a935e3f2bccdcd3b54e1dd6adda05982acdd63e87dde3b133e6f7b4645b');
const report = JSON.parse(reportBytes);
assert.equal(report.experiment, 'natural-asus-slot-schema-screen-v1');
assert.equal(report.status, 'completed');
assert.equal(report.identity.code_commit, 'f4f9078303a1120c6c92560de72d5d51fa6faf61');
assert.equal(report.identity.archived_request_sha256,
  'c4fb7132f0ab385aad7d3cef404a9f9fc772169a221d5d492873fffc9378b1c3');
assert.equal(report.identity.source_sha256,
  '923aed3991c2308d92b89c45181cea8ec7ece74e9b4d3a3ce0234d95e329913b');
assert.equal(report.identity.model_sha256,
  'dc5f44fcf1fa496ee7ad725982c0c8c553a4de00259b53af84c4b89fb0c06699');
assert.equal(report.identity.runtime_sha256,
  '6f15be27bd80b6b4d52afefa49094e18fcfab55d5da354d717971f2d2537b2f4');
assert.deepEqual(report.budget, { chat_requests: 6, per_request_timeout_ms: 120_000,
  total_wall_ms: 600_000, seeds: [101, 202, 303] });
assert.equal(report.requests.length, 6);
assert.deepEqual(report.failures, []);
const prior = JSON.parse(fs.readFileSync(path.join(root,
  '.cache/eval/commons-asus-full-1_8b-v1/run-M5lG2W/report.json')));
const archived = prior.requests.filter(row => row.path === '/v1/chat/completions').at(-1).request;
for (let index = 0; index < report.requests.length; index += 2) {
  const seed = report.budget.seeds[index / 2];
  const baseline = report.requests[index];
  const constrained = report.requests[index + 1];
  for (const [row, arm] of [[baseline, 'baseline'], [constrained, 'const_schema']]) {
    assert.equal(row.seed, seed);
    assert.equal(row.arm, arm);
    assert.equal(row.http_status, 200);
    assert.equal(row.request_sha256, digest(Buffer.from(JSON.stringify(row.request))));
    assert.equal(row.raw_response_sha256, digest(Buffer.from(row.raw_response)));
    assert.equal(row.raw_candidate_sha256, digest(Buffer.from(row.raw_candidate)));
    assert.equal(JSON.parse(row.raw_response).choices[0].message.content, row.raw_candidate);
    assert.deepEqual(JSON.parse(row.raw_candidate), row.candidate);
    assert.equal(row.request.seed, seed);
    assert.equal(row.usage.prompt_tokens, 279);
    assert(row.usage.completion_tokens > 0);
    assert(row.elapsed_ms > 0 && row.elapsed_ms < report.budget.per_request_timeout_ms);
  }
  const replay = structuredClone(baseline.request);
  delete replay.seed;
  assert.deepEqual(replay, archived);
  const expectedConstrained = structuredClone(baseline.request);
  const properties = expectedConstrained.response_format.schema.properties.translations.items.properties;
  properties.segment_id = { const: 20 };
  properties.line_index = { const: 0 };
  assert.deepEqual(constrained.request, expectedConstrained);
  assert.equal(baseline.candidate.translations.length, 1);
  assert.equal(constrained.candidate.translations.length, 1);
  assert.equal(baseline.candidate.translations[0].segment_id, 21);
  assert.equal(constrained.candidate.translations[0].segment_id, 20);
  assert.equal(baseline.candidate.translations[0].line_index, 0);
  assert.equal(constrained.candidate.translations[0].line_index, 0);
  assert.equal(baseline.structurally_accepted, false);
  assert.equal(constrained.structurally_accepted, true);
}
assert(report.wall_ms > 0 && report.wall_ms < report.budget.total_wall_ms);
assert(report.resources.samples.length >= 1);
assert(report.resources.samples.every(sample => sample.errors.length === 0));
console.log('Natural ASUS slot-schema screen verified: 3/3 baseline neighbor IDs, 3/3 constrained target IDs; semantic quality unreviewed.');
