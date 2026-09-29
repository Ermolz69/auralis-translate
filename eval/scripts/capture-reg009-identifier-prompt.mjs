import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { gzipSync } from 'node:zlib';
import { digest } from './flores-file-fixture.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const run = path.join(root, '.cache/eval/reg009-identifier-prompt/run-vcTqs6');
const reports = path.join(root, 'eval/reports');
const stem = '2026-09-29-reg-009-identifier-prompt';
const reportBytes = await fs.readFile(path.join(run, 'report.json'));
const journalBytes = await fs.readFile(path.join(run, 'requests.jsonl'));
const resourcesBytes = await fs.readFile(path.join(run, 'resources.jsonl'));
const serverLogBytes = await fs.readFile(path.join(run, 'server.log'));
const report = JSON.parse(reportBytes);
const entries = journalBytes.toString('utf8').trim().split('\n').map(JSON.parse);
assert.equal(report.experiment, 'reg-009-v6-identifier-reminder-paired-v1');
assert.equal(report.status, 'complete_observations_unreviewed');
assert.equal(report.budget.chat_requests, 16);
assert.deepEqual(report.budget.cue_ids, [1, 2, 514, 1000]);
assert.deepEqual(report.budget.seeds, [101, 202]);
assert.equal(report.requests.length, 16);
assert.equal(entries.length, 16);
assert.equal(report.failures.length, 0);
assert.equal(report.identity.git_head, 'c763807a985d84fe920c8d1361486d888743cb51');
assert.equal(report.identity.harness_sha256, '99707baa509773c1d707698e79c20796135ef6cff0df48b5ed44848df40bf516');
assert.equal(report.identity.git_status, 'M docs/architecture/014-result-history-selection.md');
assert(report.wall_elapsed_ms < report.budget.total_wall_ms);
for (const [index, row] of entries.entries()) {
  const summary = report.requests[index];
  const planned = report.planned_requests[index];
  assert.equal(row.cue_id, summary.cue_id);
  assert.equal(row.seed, summary.seed);
  assert.equal(row.arm, summary.arm);
  assert.equal(row.request_sha256, digest(Buffer.from(JSON.stringify(row.request))));
  assert.equal(row.request_sha256, planned.request_sha256);
  assert.equal(row.prompt_sha256, planned.prompt_sha256);
  assert.equal(row.accepted_candidate, summary.accepted_candidate);
  assert.equal(row.identifier_preserved, summary.identifier_preserved);
  assert.equal(row.structural_outcome, 'valid_unreviewed');
  assert.equal(row.finish_reason, 'stop');
  assert.equal(row.http_status, 200);
  assert(!/\p{Script=Cyrillic}/u.test(row.request.messages[0].content));
}
for (const cue of report.budget.cue_ids) for (const seed of report.budget.seeds) {
  const paired = entries.filter(row => row.cue_id === cue && row.seed === seed);
  assert.equal(paired.length, 2);
  const baseline = paired.find(row => row.arm === 'baseline');
  const changed = paired.find(row => row.arm === 'reminder');
  assert(baseline && changed);
  assert.equal(changed.source_zh, baseline.source_zh);
  assert.deepEqual(changed.expected_identifiers, baseline.expected_identifiers);
  assert.equal(changed.request.messages[0].content,
    baseline.request.messages[0].content.replace(
      'Return exactly one JSON object',
      'Preserve every ASCII identifier in the target source with uppercase letters, a hyphen and digits exactly once in the Russian text; copy its spelling and digits unchanged, and do not copy identifiers from context. Return exactly one JSON object'));
  const same = structuredClone(changed.request);
  same.messages[0].content = baseline.request.messages[0].content;
  assert.deepEqual(same, baseline.request);
}
const byArm = arm => {
  const rows = report.requests.filter(row => row.arm === arm);
  assert.equal(rows.length, 8);
  return {
    requests: rows.length,
    structurally_valid: rows.filter(row => row.structural_outcome === 'valid_unreviewed').length,
    exact_identifier: rows.filter(row => row.identifier_preserved).length,
    prompt_tokens: rows.reduce((sum, row) => sum + row.usage.prompt_tokens, 0),
    completion_tokens: rows.reduce((sum, row) => sum + row.usage.completion_tokens, 0),
    request_elapsed_sum_ms: rows.reduce((sum, row) => sum + row.elapsed_ms, 0),
  };
};
const baseline = byArm('baseline');
const reminder = byArm('reminder');
assert.equal(baseline.exact_identifier, 2);
assert.equal(reminder.exact_identifier, 2);
assert.equal(baseline.prompt_tokens, 2282);
assert.equal(reminder.prompt_tokens, 2594);
assert.equal(report.resources.samples.length, 10);
assert(report.resources.samples.every(row => row.errors.length === 0));
const workingSet = Math.max(...report.resources.samples.flatMap(sample =>
  sample.processes.map(process => process.WorkingSet64)));
const privateBytes = Math.max(...report.resources.samples.flatMap(sample =>
  sample.processes.map(process => process.PrivateMemorySize64)));
const deviceGpu = Math.max(...report.resources.samples.map(sample =>
  Number(sample.gpu_device.split(',')[1])));
const compressedRequests = gzipSync(journalBytes);
const compressedResources = gzipSync(resourcesBytes);
const summary = {
  schema_version: 1, experiment: report.experiment,
  outcome: 'no_identifier_gain_unreviewed',
  source_group: report.source_group, sealed_holdout: false, human_review: 'missing',
  git_head: report.identity.git_head, git_dirty: report.identity.git_status,
  model_sha256: report.identity.model_sha256,
  server_sha256: report.identity.server_sha256,
  profile_sha256: report.identity.profile_sha256,
  harness_sha256: report.identity.harness_sha256,
  archive_sha256: report.identity.archive_sha256,
  budget: report.budget, started_at: report.started_at, finished_at: report.finished_at,
  wall_elapsed_ms: report.wall_elapsed_ms,
  baseline, reminder, paired_code_gain: reminder.exact_identifier - baseline.exact_identifier,
  resources: { sample_count: report.resources.samples.length, sampling_errors: 0,
    peak_tracked_working_set_bytes: workingSet,
    peak_tracked_private_bytes: privateBytes,
    peak_device_gpu_mib: deviceGpu,
    limitation: report.resources.limitations },
  report_file: `${stem}-report.json`, report_sha256: digest(reportBytes),
  requests_file: `${stem}-requests.jsonl.gz`, requests_gzip_sha256: digest(compressedRequests),
  requests_uncompressed_sha256: digest(journalBytes),
  resources_file: `${stem}-resources.jsonl.gz`, resources_gzip_sha256: digest(compressedResources),
  server_log_local_sha256: digest(serverLogBytes),
  release_gate: 'open',
};
await fs.writeFile(path.join(reports, summary.report_file), reportBytes, { flag: 'wx' });
await fs.writeFile(path.join(reports, summary.requests_file), compressedRequests, { flag: 'wx' });
await fs.writeFile(path.join(reports, summary.resources_file), compressedResources, { flag: 'wx' });
await fs.writeFile(path.join(reports, `${stem}-summary.json`),
  `${JSON.stringify(summary, null, 2)}\n`, { flag: 'wx' });
console.log(`REG-009 archived: baseline ${baseline.exact_identifier}/8, reminder ${reminder.exact_identifier}/8, no gain; 16 raw requests.`);
