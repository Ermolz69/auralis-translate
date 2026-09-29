import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { gunzipSync } from 'node:zlib';
import { digest } from './flores-file-fixture.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const directory = path.join(root, 'eval/reports');
const stem = '2026-09-29-reg-010-neighbor-context';
const summaryBytes = await fs.readFile(path.join(directory, `${stem}-summary.json`));
assert.equal(digest(summaryBytes), 'c2b290906e8f34e595721e7cce7d9e67e5cefbb0304e4bec8a690bdaed604638');
const summary = JSON.parse(summaryBytes);
const reportBytes = await fs.readFile(path.join(directory, summary.report_file));
const requestsGzip = await fs.readFile(path.join(directory, summary.requests_file));
const resourcesGzip = await fs.readFile(path.join(directory, summary.resources_file));
assert.equal(digest(reportBytes), summary.report_sha256);
assert.equal(digest(requestsGzip), summary.requests_gzip_sha256);
assert.equal(digest(resourcesGzip), summary.resources_gzip_sha256);
const requestsBytes = gunzipSync(requestsGzip);
assert.equal(digest(requestsBytes), summary.requests_uncompressed_sha256);
const report = JSON.parse(reportBytes);
const requests = requestsBytes.toString('utf8').trim().split('\n').map(JSON.parse);
const resources = gunzipSync(resourcesGzip).toString('utf8').trim().split('\n').map(JSON.parse);
assert.equal(summary.outcome, 'inconclusive_no_baseline_recurrence_unreviewed');
assert.equal(summary.release_gate, 'open');
assert.equal(summary.human_review, 'missing');
assert.equal(summary.quality_verdict, 'unreviewed');
assert.equal(summary.sealed_holdout, false);
assert.equal(summary.git_head, '42af7c48677d97372999a5147811f7ea87f01235');
assert.equal(summary.git_head, report.identity.git_head);
assert.equal(summary.harness_sha256, report.identity.harness_sha256);
assert.equal(summary.harness_sha256,
  digest(await fs.readFile(path.join(root, 'eval/scripts/probe-reg010-neighbor-context.mjs'))));
assert.equal(summary.archive_sha256, report.identity.archive_sha256);
assert.equal(report.status, 'complete_observations_unreviewed');
assert.equal(report.requests.length, 30);
assert.equal(requests.length, 30);
assert.equal(report.failures.length, 0);
assert.equal(summary.wall_elapsed_ms, report.wall_elapsed_ms);
assert(report.wall_elapsed_ms < report.budget.total_wall_ms);
assert.deepEqual(resources, report.resources.samples);
assert.equal(resources.length, 17);
assert(resources.every(row => row.errors.length === 0));
const marker = 'Input JSON:\n';
for (const [index, entry] of requests.entries()) {
  const observation = report.requests[index];
  assert.equal(entry.cue_id, observation.cue_id);
  assert.equal(entry.seed, observation.seed);
  assert.equal(entry.arm, observation.arm);
  assert.equal(entry.request_sha256, digest(Buffer.from(JSON.stringify(entry.request))));
  assert.equal(entry.request_sha256, report.planned_requests[index].request_sha256);
  assert.equal(entry.prompt_sha256, report.planned_requests[index].prompt_sha256);
  assert.equal(entry.structural_outcome, 'valid_unreviewed');
  assert.equal(entry.finish_reason, 'stop');
  assert.equal(entry.http_status, 200);
  const raw = JSON.parse(entry.raw_response);
  assert.equal(raw.choices[0].finish_reason, 'stop');
  const candidate = JSON.parse(raw.choices[0].message.content).translations[0];
  assert.equal(candidate.segment_id, entry.cue_id);
  assert.equal(candidate.line_index, 0);
  assert.equal(candidate.text, entry.accepted_candidate);
  assert.equal(entry.accepted_candidate, observation.accepted_candidate);
  assert.equal(entry.identifier_preserved, observation.identifier_preserved);
  assert.equal(entry.target_time_preserved, observation.target_time_preserved);
  assert.equal(entry.next_cue_phrase_copied, observation.next_cue_phrase_copied);
  assert(!/\p{Script=Cyrillic}/u.test(entry.request.messages[0].content));
}
for (const cue of [1, 129, 257, 513, 769]) for (const seed of [101, 202, 303]) {
  const pair = requests.filter(row => row.cue_id === cue && row.seed === seed);
  assert.equal(pair.length, 2);
  const baseline = pair.find(row => row.arm === 'baseline');
  const noContext = pair.find(row => row.arm === 'no_next_context');
  assert(baseline && noContext);
  const [prefix, body] = baseline.request.messages[0].content.split(marker);
  const input = JSON.parse(body);
  assert.equal(input.source_context.length, 1);
  assert.equal(input.source_context[0].segment_id, cue + 1);
  input.source_context = [];
  assert.equal(noContext.request.messages[0].content,
    `${prefix}${marker}${JSON.stringify(input)}`);
  const restored = structuredClone(noContext.request);
  restored.messages[0].content = baseline.request.messages[0].content;
  assert.deepEqual(restored, baseline.request);
}
for (const arm of ['baseline', 'no_next_context']) {
  const rows = report.requests.filter(row => row.arm === arm);
  const metrics = summary[arm];
  assert.equal(metrics.requests, 15);
  assert.equal(metrics.structurally_valid, 15);
  assert.equal(metrics.exact_identifier, 15);
  assert.equal(metrics.source_time, 15);
  assert.equal(metrics.exact_next_cue_phrase, 0);
  assert.equal(metrics.prompt_tokens,
    rows.reduce((sum, row) => sum + row.usage.prompt_tokens, 0));
  assert.equal(metrics.completion_tokens,
    rows.reduce((sum, row) => sum + row.usage.completion_tokens, 0));
  assert.equal(metrics.request_elapsed_sum_ms,
    rows.reduce((sum, row) => sum + row.elapsed_ms, 0));
}
assert.equal(summary.baseline.prompt_tokens, 3831);
assert.equal(summary.no_next_context.prompt_tokens, 3213);
assert.equal(summary.baseline.request_elapsed_sum_ms, 38136);
assert.equal(summary.no_next_context.request_elapsed_sum_ms, 33486);
console.log('REG-010 paired screen verified: 30 raw responses and one-factor prompts; both arms 15/15 exact code/time; no baseline recurrence.');
