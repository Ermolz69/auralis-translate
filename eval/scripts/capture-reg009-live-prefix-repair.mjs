import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { gzipSync } from 'node:zlib';
import { digest } from './flores-file-fixture.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const run = path.resolve(process.argv[2] ?? '');
const parent = path.join(root, '.cache/eval/reg009-live-prefix-repair');
assert(run.startsWith(`${parent}${path.sep}`) && path.basename(run).startsWith('run-'));
const reports = path.join(root, 'eval/reports');
const stem = '2026-09-29-reg009-live-prefix-repair';
const reportBytes = await fs.readFile(path.join(run, 'report.json'));
const journalBytes = await fs.readFile(path.join(run, 'requests.jsonl'));
const resourceBytes = await fs.readFile(path.join(run, 'resources.jsonl'));
const report = JSON.parse(reportBytes);
const entries = journalBytes.toString('utf8').trim().split('\n').map(JSON.parse);
const resources = resourceBytes.toString('utf8').trim().split('\n').map(JSON.parse);
assert.equal(report.experiment, 'reg009-live-prefix-repair-v1');
assert.equal(report.status, 'complete_observations_unreviewed');
assert.equal(report.identity.git_head, 'fcaf91128ff82d05cf24b9ad10c075f89e1028a3');
assert.equal(report.identity.harness_sha256,
  digest(await fs.readFile(path.join(root, 'eval/scripts/probe-reg009-live-prefix-repair.mjs'))));
assert.equal(report.identity.manifest_sha256,
  digest(await fs.readFile(path.join(root,
    'models/manifests/hy_mt2_1_8b_q4_k_m.context_v6_prefix_repair.experimental.json'))));
assert.deepEqual(report.budget.seeds, [101, 202, 303]);
assert.equal(report.budget.cue_ids.length, 27);
assert.equal(report.budget.chat_requests, 81);
assert.equal(report.requests.length, 81);
assert.equal(entries.length, 81);
assert.equal(report.failures.length, 0);
assert(report.wall_elapsed_ms < report.budget.wall_ms);
assert.deepEqual(resources, report.resources.samples);
assert(resources.length > 0);
const identifierPattern = /(?<![\p{L}\p{N}_])[A-Z]{2,}-[0-9]{2,8}(?![\p{L}\p{N}_])/gu;
const identifiers = text => text.match(identifierPattern)?.sort() ?? [];
const normalNumbers = text => text.replace(identifierPattern, '')
  .match(/\d{1,2}:\d{2}|\d+/gu)?.map(value =>
    /^\d{1,2}:\d{2}$/u.test(value) ? `${Number(value.split(':')[0])}:${value.split(':')[1]}` : value).sort() ?? [];
let rawExactCodes = 0;
let acceptedExactCodes = 0;
let inserted = 0;
let rejected = 0;
let rawExactNumbers = 0;
let acceptedExactNumbers = 0;
for (const [index, entry] of entries.entries()) {
  const planned = report.planned_requests[index];
  const observed = report.requests[index];
  assert.equal(entry.cue_id, planned.cue_id);
  assert.equal(entry.seed, planned.seed);
  assert.equal(entry.request_sha256, digest(Buffer.from(JSON.stringify(entry.request))));
  assert.equal(entry.request_sha256, planned.request_sha256);
  assert.equal(entry.request_sha256, observed.request_sha256);
  assert.equal(entry.prompt_sha256, planned.prompt_sha256);
  assert.equal(entry.policy_outcome, observed.policy_outcome);
  assert.equal(entry.http_status, 200);
  assert.equal(entry.finish_reason, 'stop');
  assert.doesNotMatch(entry.request.messages[0].content, /\p{Script=Cyrillic}/u);
  const slot = JSON.parse(entry.request.messages[0].content.split('Input JSON:\n')[1]).target_slots[0];
  assert.equal(slot.segment_id, entry.cue_id);
  assert.equal(slot.line_index, 0);
  assert.equal(slot.source_original, entry.source_zh);
  const response = JSON.parse(entry.raw_response);
  const rawLine = JSON.parse(response.choices[0].message.content).translations[0];
  assert.equal(rawLine.segment_id, entry.cue_id);
  assert.equal(rawLine.line_index, 0);
  assert.equal(rawLine.text, entry.restored_candidate);
  const expectedCodes = identifiers(entry.source_zh);
  assert.deepEqual(expectedCodes, [`AUR-${String(entry.cue_id).padStart(4, '0')}`]);
  if (JSON.stringify(identifiers(entry.restored_candidate)) === JSON.stringify(expectedCodes)) rawExactCodes++;
  if (JSON.stringify(normalNumbers(entry.restored_candidate)) ===
    JSON.stringify(normalNumbers(entry.source_zh))) rawExactNumbers++;
  if (entry.policy_outcome === 'accepted_inserted') {
    inserted++;
    assert.equal(entry.accepted_candidate,
      `${expectedCodes[0]}: ${entry.restored_candidate}`);
    assert.equal(entry.review_flag, true);
  } else if (entry.policy_outcome === 'accepted_exact') {
    assert.equal(entry.accepted_candidate, entry.restored_candidate);
    assert.equal(entry.review_flag, false);
  } else {
    rejected++;
    assert.equal(entry.accepted_candidate, null);
  }
  if (entry.accepted_candidate !== null) {
    if (JSON.stringify(identifiers(entry.accepted_candidate)) === JSON.stringify(expectedCodes))
      acceptedExactCodes++;
    if (JSON.stringify(normalNumbers(entry.accepted_candidate)) ===
      JSON.stringify(normalNumbers(entry.source_zh))) acceptedExactNumbers++;
  }
}
for (const cue of report.budget.cue_ids) for (const seed of report.budget.seeds) {
  assert.equal(entries.filter(entry => entry.cue_id === cue && entry.seed === seed).length, 1);
}
const percentile = (values, fraction) => {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.ceil(fraction * sorted.length) - 1];
};
const samples = report.resources.samples;
const summary = {
  schema_version: 1, experiment: report.experiment,
  outcome: 'development_fact_screen_unreviewed', release_gate: 'open',
  model_selection: 'unselected', human_review: 'missing',
  source_group: report.source_group, sealed_holdout: false,
  identity: report.identity, budget: report.budget,
  started_at: report.started_at, finished_at: report.finished_at,
  wall_elapsed_ms: report.wall_elapsed_ms,
  counts: { requests: entries.length, raw_exact_identifiers: rawExactCodes,
    accepted_exact_identifiers: acceptedExactCodes, inserted_review_required: inserted,
    rejected, raw_exact_numeric_facts: rawExactNumbers,
    accepted_exact_numeric_facts: acceptedExactNumbers },
  usage: { prompt_tokens: entries.reduce((sum, entry) => sum + (entry.usage?.prompt_tokens ?? 0), 0),
    completion_tokens: entries.reduce((sum, entry) => sum + (entry.usage?.completion_tokens ?? 0), 0),
    request_elapsed_sum_ms: entries.reduce((sum, entry) => sum + entry.elapsed_ms, 0),
    request_elapsed_p50_ms: percentile(entries.map(entry => entry.elapsed_ms), 0.5),
    request_elapsed_p95_ms: percentile(entries.map(entry => entry.elapsed_ms), 0.95) },
  resources: { sample_count: samples.length,
    sampling_errors: samples.reduce((sum, sample) => sum + sample.errors.length, 0),
    peak_tracked_working_set_bytes: Math.max(...samples.flatMap(sample =>
      sample.processes.map(process => process.WorkingSet64))),
    peak_tracked_private_bytes: Math.max(...samples.flatMap(sample =>
      sample.processes.map(process => process.PrivateMemorySize64))),
    peak_device_gpu_mib: Math.max(...samples.filter(sample => sample.gpu_device)
      .map(sample => Number(sample.gpu_device.split(',')[1]))),
    limitation: report.resources.limitations },
  report_file: `${stem}-report.json`, report_sha256: digest(reportBytes),
  requests_file: `${stem}-requests.jsonl.gz`,
  requests_gzip_sha256: digest(gzipSync(journalBytes)),
  requests_uncompressed_sha256: digest(journalBytes),
  resource_file: `${stem}-resources.jsonl.gz`,
  resources_gzip_sha256: digest(gzipSync(resourceBytes)),
  resources_uncompressed_sha256: digest(resourceBytes),
  local_server_log_sha256: digest(await fs.readFile(path.join(run, 'server.log'))),
};
await fs.writeFile(path.join(reports, summary.report_file), reportBytes, { flag: 'wx' });
await fs.writeFile(path.join(reports, summary.requests_file), gzipSync(journalBytes), { flag: 'wx' });
await fs.writeFile(path.join(reports, summary.resource_file), gzipSync(resourceBytes), { flag: 'wx' });
await fs.writeFile(path.join(reports, `${stem}-summary.json`),
  `${JSON.stringify(summary, null, 2)}\n`, { flag: 'wx' });
console.log(`REG-009 archived: raw ${rawExactCodes}/81 exact codes, projected ${acceptedExactCodes}/81, ${inserted} review flags, ${rejected} rejections.`);
