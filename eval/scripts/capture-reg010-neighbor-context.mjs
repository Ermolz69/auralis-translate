import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { gzipSync } from 'node:zlib';
import { digest } from './flores-file-fixture.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const run = path.resolve(process.argv[2] ?? '');
const parent = path.join(root, '.cache/eval/reg010-neighbor-context');
assert(run.startsWith(`${parent}${path.sep}`) && path.basename(run).startsWith('run-'));
const reports = path.join(root, 'eval/reports');
const stem = '2026-09-29-reg-010-neighbor-context';
const reportBytes = await fs.readFile(path.join(run, 'report.json'));
const journalBytes = await fs.readFile(path.join(run, 'requests.jsonl'));
const resourcesBytes = await fs.readFile(path.join(run, 'resources.jsonl'));
const serverLogBytes = await fs.readFile(path.join(run, 'server.log'));
const report = JSON.parse(reportBytes);
const entries = journalBytes.toString('utf8').trim().split('\n').map(JSON.parse);
const resourceSamples = resourcesBytes.toString('utf8').trim().split('\n').map(JSON.parse);
assert.equal(report.experiment, 'reg-010-v6-next-context-paired-v1');
assert.equal(report.status, 'complete_observations_unreviewed');
assert.equal(report.identity.git_head, '42af7c48677d97372999a5147811f7ea87f01235');
assert.equal(report.identity.git_status, 'M docs/architecture/014-result-history-selection.md');
assert.deepEqual(report.budget.cue_ids, [1, 129, 257, 513, 769]);
assert.deepEqual(report.budget.seeds, [101, 202, 303]);
assert.deepEqual(report.budget.arms, ['baseline', 'no_next_context']);
assert.equal(report.budget.chat_requests, 30);
assert.equal(report.requests.length, 30);
assert.equal(entries.length, 30);
assert.equal(report.failures.length, 0);
assert(report.wall_elapsed_ms < report.budget.total_wall_ms);
assert.deepEqual(resourceSamples, report.resources.samples);
assert(resourceSamples.length > 0);
assert(resourceSamples.every(row => row.errors.length === 0));
for (const [index, entry] of entries.entries()) {
  const summary = report.requests[index];
  const planned = report.planned_requests[index];
  assert.equal(entry.cue_id, summary.cue_id);
  assert.equal(entry.seed, summary.seed);
  assert.equal(entry.arm, summary.arm);
  assert.equal(entry.request_sha256, digest(Buffer.from(JSON.stringify(entry.request))));
  assert.equal(entry.request_sha256, planned.request_sha256);
  assert.equal(entry.prompt_sha256, planned.prompt_sha256);
  assert.equal(entry.accepted_candidate, summary.accepted_candidate);
  assert.equal(entry.target_time_preserved, summary.target_time_preserved);
  assert.equal(entry.identifier_preserved, summary.identifier_preserved);
  assert.equal(entry.next_cue_phrase_copied, summary.next_cue_phrase_copied);
  assert.equal(entry.structural_outcome, 'valid_unreviewed');
  assert.equal(entry.finish_reason, 'stop');
  assert.equal(entry.http_status, 200);
  assert(!/\p{Script=Cyrillic}/u.test(entry.request.messages[0].content));
}
const marker = 'Input JSON:\n';
for (const cue of report.budget.cue_ids) for (const seed of report.budget.seeds) {
  const pair = entries.filter(row => row.cue_id === cue && row.seed === seed);
  assert.equal(pair.length, 2);
  const baseline = pair.find(row => row.arm === 'baseline');
  const changed = pair.find(row => row.arm === 'no_next_context');
  assert(baseline && changed);
  const [prefix, body] = baseline.request.messages[0].content.split(marker);
  const input = JSON.parse(body);
  assert.equal(input.source_context.length, 1);
  assert.equal(input.source_context[0].segment_id, cue + 1);
  assert(input.source_context[0].lines[0].includes('不要打开这扇门'));
  input.source_context = [];
  assert.equal(changed.request.messages[0].content,
    `${prefix}${marker}${JSON.stringify(input)}`);
  const restored = structuredClone(changed.request);
  restored.messages[0].content = baseline.request.messages[0].content;
  assert.deepEqual(restored, baseline.request);
}
const byArm = arm => {
  const rows = report.requests.filter(row => row.arm === arm);
  assert.equal(rows.length, 15);
  return {
    requests: rows.length,
    structurally_valid: rows.filter(row => row.structural_outcome === 'valid_unreviewed').length,
    exact_identifier: rows.filter(row => row.identifier_preserved).length,
    source_time: rows.filter(row => row.target_time_preserved).length,
    exact_next_cue_phrase: rows.filter(row => row.next_cue_phrase_copied).length,
    prompt_tokens: rows.reduce((sum, row) => sum + row.usage.prompt_tokens, 0),
    completion_tokens: rows.reduce((sum, row) => sum + row.usage.completion_tokens, 0),
    request_elapsed_sum_ms: rows.reduce((sum, row) => sum + row.elapsed_ms, 0),
  };
};
const baseline = byArm('baseline');
const noNextContext = byArm('no_next_context');
assert.equal(baseline.exact_identifier, 15);
assert.equal(noNextContext.exact_identifier, 15);
assert.equal(baseline.source_time, 15);
assert.equal(noNextContext.source_time, 15);
assert.equal(baseline.exact_next_cue_phrase, 0);
assert.equal(noNextContext.exact_next_cue_phrase, 0);
const compressedRequests = gzipSync(journalBytes);
const compressedResources = gzipSync(resourcesBytes);
const summary = {
  schema_version: 1, experiment: report.experiment,
  outcome: 'inconclusive_no_baseline_recurrence_unreviewed',
  source_group: report.source_group, sealed_holdout: false, human_review: 'missing',
  quality_verdict: 'unreviewed', release_gate: 'open',
  git_head: report.identity.git_head, git_dirty: report.identity.git_status,
  model_sha256: report.identity.model_sha256,
  server_sha256: report.identity.server_sha256,
  profile_sha256: report.identity.profile_sha256,
  harness_sha256: report.identity.harness_sha256,
  archive_sha256: report.identity.archive_sha256,
  budget: report.budget, started_at: report.started_at, finished_at: report.finished_at,
  wall_elapsed_ms: report.wall_elapsed_ms, baseline, no_next_context: noNextContext,
  resources: {
    sample_count: resourceSamples.length, sampling_errors: 0,
    peak_tracked_working_set_bytes: Math.max(...resourceSamples.flatMap(row =>
      row.processes.map(process => process.WorkingSet64))),
    peak_tracked_private_bytes: Math.max(...resourceSamples.flatMap(row =>
      row.processes.map(process => process.PrivateMemorySize64))),
    peak_device_gpu_mib: Math.max(...resourceSamples.map(row =>
      Number(row.gpu_device.split(',')[1]))),
    limitation: report.resources.limitations,
  },
  report_file: `${stem}-report.json`, report_sha256: digest(reportBytes),
  requests_file: `${stem}-requests.jsonl.gz`, requests_gzip_sha256: digest(compressedRequests),
  requests_uncompressed_sha256: digest(journalBytes),
  resources_file: `${stem}-resources.jsonl.gz`, resources_gzip_sha256: digest(compressedResources),
  server_log_local_sha256: digest(serverLogBytes),
};
await fs.writeFile(path.join(reports, summary.report_file), reportBytes, { flag: 'wx' });
await fs.writeFile(path.join(reports, summary.requests_file), compressedRequests, { flag: 'wx' });
await fs.writeFile(path.join(reports, summary.resources_file), compressedResources, { flag: 'wx' });
await fs.writeFile(path.join(reports, `${stem}-summary.json`),
  `${JSON.stringify(summary, null, 2)}\n`, { flag: 'wx' });
console.log(`REG-010 archived: both arms 15/15 exact code/time; baseline failure did not recur; ${entries.length} raw requests.`);
