import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { gzipSync } from 'node:zlib';
import { digest } from './flores-file-fixture.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const run = path.resolve(process.argv[2] ?? '');
const parent = path.join(root, '.cache/eval/long-v6-code-model-screen');
assert(run.startsWith(`${parent}${path.sep}`) && path.basename(run).startsWith('run-'));
const reports = path.join(root, 'eval/reports');
const stem = '2026-09-29-long-v6-code-model-screen';
const reportBytes = await fs.readFile(path.join(run, 'report.json'));
const journalBytes = await fs.readFile(path.join(run, 'requests.jsonl'));
const report = JSON.parse(reportBytes);
const entries = journalBytes.toString('utf8').trim().split('\n').map(JSON.parse);
assert.equal(report.experiment, 'long-v6-code-model-1b-7b-paired-v1');
assert.equal(report.status, 'complete_observations_unreviewed');
assert.deepEqual(report.budget.models, ['1b', '7b']);
assert.deepEqual(report.budget.seeds, [101, 202, 303]);
assert.equal(report.budget.cue_ids.length, 27);
assert.equal(report.budget.chat_requests, 162);
assert.equal(report.requests.length, 162);
assert.equal(entries.length, 162);
assert.equal(report.failures.length, 0);
assert(report.wall_elapsed_ms < report.budget.total_wall_ms);
for (const [index, entry] of entries.entries()) {
  const planned = report.planned_requests[index];
  const observed = report.requests[index];
  assert.equal(entry.model, planned.model);
  assert.equal(entry.cue_id, planned.cue_id);
  assert.equal(entry.seed, planned.seed);
  assert.equal(entry.request_sha256, digest(Buffer.from(JSON.stringify(entry.request))));
  assert.equal(entry.request_sha256, planned.request_sha256);
  assert.equal(entry.prompt_sha256, planned.prompt_sha256);
  assert.equal(entry.request_sha256, observed.request_sha256);
  assert.equal(entry.structural_outcome, observed.structural_outcome);
  assert.equal(entry.accepted_candidate ?? null, observed.accepted_candidate);
  assert.equal(entry.identifier_preserved ?? null, observed.identifier_preserved);
  assert.equal(entry.numeric_facts_preserved ?? null, observed.numeric_facts_preserved);
  assert.doesNotMatch(entry.request.messages[0].content, /\p{Script=Cyrillic}/u);
}
for (const cue of report.budget.cue_ids) for (const seed of report.budget.seeds) {
  const pair = entries.filter(row => row.cue_id === cue && row.seed === seed);
  assert.equal(pair.length, 2);
  const small = pair.find(row => row.model === '1b');
  const large = pair.find(row => row.model === '7b');
  assert(small && large);
  assert.equal(small.source_zh, large.source_zh);
  assert.deepEqual(small.expected_identifiers, large.expected_identifiers);
  assert.deepEqual(small.expected_numeric_facts, large.expected_numeric_facts);
  const matched = structuredClone(large.request);
  matched.model = small.request.model;
  assert.deepEqual(matched, small.request);
}
const percentile = (values, fraction) => {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.ceil(fraction * sorted.length) - 1];
};
const modelSummary = key => {
  const rows = report.requests.filter(row => row.model === key);
  assert.equal(rows.length, 81);
  const valid = rows.filter(row => row.structural_outcome === 'valid_unreviewed');
  const samples = report.resources[key].samples;
  assert(samples.length > 0);
  const resources = {
    sample_count: samples.length,
    sampling_errors: samples.reduce((sum, row) => sum + row.errors.length, 0),
    peak_tracked_working_set_bytes: Math.max(...samples.flatMap(row =>
      row.processes.map(process => process.WorkingSet64))),
    peak_tracked_private_bytes: Math.max(...samples.flatMap(row =>
      row.processes.map(process => process.PrivateMemorySize64))),
    peak_device_gpu_mib: Math.max(...samples.map(row =>
      Number(row.gpu_device.split(',')[1]))),
    limitation: report.resources[key].limitations,
  };
  return {
    requests: rows.length,
    structurally_valid: valid.length,
    exact_identifier: valid.filter(row => row.identifier_preserved).length,
    exact_numeric_facts: valid.filter(row => row.numeric_facts_preserved).length,
    prompt_tokens: rows.reduce((sum, row) => sum + (row.usage?.prompt_tokens ?? 0), 0),
    completion_tokens: rows.reduce((sum, row) => sum + (row.usage?.completion_tokens ?? 0), 0),
    request_elapsed_sum_ms: rows.reduce((sum, row) => sum + row.elapsed_ms, 0),
    request_elapsed_p50_ms: percentile(rows.map(row => row.elapsed_ms), 0.5),
    request_elapsed_p95_ms: percentile(rows.map(row => row.elapsed_ms), 0.95),
    resources,
  };
};
const oneB = modelSummary('1b');
const sevenB = modelSummary('7b');
const paired = { code_better_7b: 0, code_worse_7b: 0, code_same: 0,
  numeric_better_7b: 0, numeric_worse_7b: 0, numeric_same: 0 };
for (const small of report.requests.filter(row => row.model === '1b')) {
  const large = report.requests.find(row => row.model === '7b'
    && row.cue_id === small.cue_id && row.seed === small.seed);
  assert(large);
  const compare = (key, better, worse, same) => {
    if (large[key] === small[key]) paired[same]++;
    else if (large[key] === true) paired[better]++;
    else paired[worse]++;
  };
  compare('identifier_preserved', 'code_better_7b', 'code_worse_7b', 'code_same');
  compare('numeric_facts_preserved', 'numeric_better_7b',
    'numeric_worse_7b', 'numeric_same');
}
assert.equal(paired.code_better_7b + paired.code_worse_7b + paired.code_same, 81);
assert.equal(paired.numeric_better_7b + paired.numeric_worse_7b + paired.numeric_same, 81);
const compressedRequests = gzipSync(journalBytes);
const resourceArchives = {};
for (const key of ['1b', '7b']) {
  const bytes = await fs.readFile(path.join(run, `${key}-resources.jsonl`));
  const samples = bytes.toString('utf8').trim().split('\n').map(JSON.parse);
  assert.deepEqual(samples, report.resources[key].samples);
  resourceArchives[key] = { bytes: gzipSync(bytes), uncompressed_sha256: digest(bytes) };
}
const summary = {
  schema_version: 1, experiment: report.experiment,
  outcome: 'development_model_fact_screen_unreviewed',
  source_group: report.source_group, sealed_holdout: false,
  human_review: 'missing', quality_verdict: 'unreviewed',
  model_selection: 'unselected', release_gate: 'open',
  identity: report.identity, budget: report.budget,
  started_at: report.started_at, finished_at: report.finished_at,
  wall_elapsed_ms: report.wall_elapsed_ms,
  model_summaries: { '1b': oneB, '7b': sevenB }, paired,
  report_file: `${stem}-report.json`, report_sha256: digest(reportBytes),
  requests_file: `${stem}-requests.jsonl.gz`, requests_gzip_sha256: digest(compressedRequests),
  requests_uncompressed_sha256: digest(journalBytes),
  resources: Object.fromEntries(Object.entries(resourceArchives).map(([key, value]) =>
    [key, { file: `${stem}-${key}-resources.jsonl.gz`,
      gzip_sha256: digest(value.bytes), uncompressed_sha256: value.uncompressed_sha256 }])),
  local_server_log_sha256: Object.fromEntries(await Promise.all(['1b', '7b'].map(async key =>
    [key, digest(await fs.readFile(path.join(run, `${key}-server.log`)))]))),
};
await fs.writeFile(path.join(reports, summary.report_file), reportBytes, { flag: 'wx' });
await fs.writeFile(path.join(reports, summary.requests_file), compressedRequests, { flag: 'wx' });
for (const [key, value] of Object.entries(resourceArchives)) {
  await fs.writeFile(path.join(reports, summary.resources[key].file), value.bytes, { flag: 'wx' });
}
await fs.writeFile(path.join(reports, `${stem}-summary.json`),
  `${JSON.stringify(summary, null, 2)}\n`, { flag: 'wx' });
console.log(`Long v6 model screen archived: 1.8B ${oneB.exact_identifier}/81 codes, 7B ${sevenB.exact_identifier}/81; ${entries.length} raw attempts.`);
