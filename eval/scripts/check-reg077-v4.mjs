import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { decodeTechnicalSenseReply } from './vivo-technical-senses-v2.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const mode = process.argv[2];
assert(['--capture', '--check'].includes(mode) && process.argv.length === 3);
const privateRoot = path.join(root,
  '.cache/eval/reg-077-referent-v4/attempt-VnDmEU');
const outputPath = path.join(root,
  'eval/reports/2026-10-10-reg077-v4.json');
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const [freezeBytes, privateReportBytes, journalBytes] = await Promise.all([
  fs.readFile(path.join(root,
    'eval/experiments/2026-10-10-reg-077-referent-v4-freeze.json')),
  fs.readFile(path.join(privateRoot, 'report.json')),
  fs.readFile(path.join(privateRoot, 'requests.jsonl')),
]);
assert.equal(sha(freezeBytes),
  '95d3548ff895c9da654bc646aa3dac44a505f0f9a8896843f164bc204cea42dd');
assert.equal(sha(privateReportBytes),
  '1cee30df4e89a518007c3885b6d5668f68bf4c2aee4b44de4f3f36568242267c');
assert.equal(sha(journalBytes),
  'eb246cbe4431f972673b2898c80cfabb93b881f305dc3181ac4c326d9c27d5f0');
const freeze = JSON.parse(freezeBytes);
const privateReport = JSON.parse(privateReportBytes);
const journal = journalBytes.toString('utf8').trimEnd().split(/\r?\n/u)
  .map(JSON.parse);
assert.equal(privateReport.experiment, freeze.experiment);
assert.equal(privateReport.freeze_sha256, sha(freezeBytes));
assert.equal(privateReport.status,
  'complete_structural_observations_unreviewed');
assert.equal(privateReport.requests.length, freeze.limits.chats);
assert.equal(journal.length, freeze.limits.chats);
assert.equal(privateReport.failures.length, 0);
assert.equal(privateReport.total_tokens, 52206);
assert.equal(privateReport.git_head,
  'ef1742ab006703dba3bbfa588065a54c51007479');
assert.equal(privateReport.git_status, '');
assert(privateReport.wall_elapsed_ms <= freeze.limits.max_wall_ms);
assert(privateReport.total_tokens <= freeze.limits.max_total_tokens);
const rows = [];
for (const [index, raw] of journal.entries()) {
  const expected = freeze.planned[index];
  const summary = privateReport.requests[index];
  assert.equal(raw.case_id, expected.case_id);
  assert.equal(raw.arm, expected.arm);
  assert.equal(raw.seed, expected.seed);
  assert.equal(raw.target_id, expected.target_id);
  assert.equal(raw.request_sha256, expected.request_sha256);
  assert.equal(raw.prompt_sha256, expected.prompt_sha256);
  assert.equal(raw.source_text_sha256, expected.source_text_sha256);
  assert.equal(raw.source_inventory_sha256,
    expected.source_inventory_sha256);
  assert.equal(sha(Buffer.from(JSON.stringify(raw.request))),
    raw.request_sha256);
  assert.equal(sha(Buffer.from(raw.request.messages[0].content)),
    raw.prompt_sha256);
  assert.equal(raw.preflight.length, 2);
  assert.equal(raw.status, 'valid_unreviewed');
  assert.equal(raw.chat.http_status, 200);
  assert.equal(raw.chat.request_sha256, raw.request_sha256);
  assert.equal(decodeTechnicalSenseReply(raw.chat.raw_response,
    raw.target_id), raw.accepted_text);
  assert.equal(sha(Buffer.from(raw.accepted_text)),
    raw.accepted_text_sha256);
  assert.equal(summary.request_sha256, raw.request_sha256);
  assert.equal(summary.seed, raw.seed);
  assert.equal(summary.accepted_text_sha256,
    raw.accepted_text_sha256);
  assert.equal(summary.preflight_count, 2);
  rows.push({ case_id: raw.case_id, family: raw.family, arm: raw.arm,
    seed: raw.seed,
    target_id: raw.target_id, eligible_terms: raw.eligible_terms,
    baseline_identical: raw.baseline_identical,
    source_text_sha256: raw.source_text_sha256,
    source_inventory_sha256: raw.source_inventory_sha256,
    request_sha256: raw.request_sha256,
    prompt_sha256: raw.prompt_sha256,
    raw_http_sha256: sha(Buffer.from(raw.chat.raw_response)),
    accepted_text_sha256: raw.accepted_text_sha256,
    prompt_tokens_preflight: raw.prompt_tokens_preflight,
    prompt_tokens: raw.usage.prompt_tokens,
    completion_tokens: raw.usage.completion_tokens,
    chat_elapsed_ms: raw.chat.elapsed_ms, status: raw.status });
}
assert.equal(new Set(rows.map(row => row.case_id)).size,
  freeze.limits.cases);
assert.equal(rows.length, freeze.limits.chats);
for (const caseId of new Set(rows.map(row => row.case_id))) {
  for (const seed of freeze.limits.seeds) {
    const pair = rows.filter(row => row.case_id === caseId &&
      row.seed === seed);
    assert.equal(pair.length, 2);
    assert.deepEqual(pair.map(row => row.arm).sort(),
      ['baseline', 'candidate']);
    assert.equal(pair[0].source_inventory_sha256,
      pair[1].source_inventory_sha256);
    const candidate = pair.find(row => row.arm === 'candidate');
    if (candidate.baseline_identical) assert.equal(
      candidate.request_sha256,
      pair.find(row => row.arm === 'baseline').request_sha256);
  }
}
assert.equal(rows.reduce((sum, row) => sum + row.prompt_tokens +
  row.completion_tokens, 0), privateReport.total_tokens);
const oldRaw = await fs.readFile(path.join(root,
  'eval/reports/2026-10-10-reg076-v3.json'));
assert.equal(sha(oldRaw),
  'f16cea2e2840d87e3f1230ae9cf85e2fd80901fc3e6bb90df738ce75bc63cecb');
const oldRows = JSON.parse(oldRaw).rows;
let priorCells = 0;
let identicalOldRequestsAndOutputs = 0;
for (const row of rows) {
  const old = oldRows.find(item => item.case_id === row.case_id &&
    item.seed === row.seed && item.arm === row.arm);
  if (!old) continue;
  priorCells++;
  if (row.case_id === 'not_multicore_but_separate_chips' &&
    row.arm === 'candidate') {
    assert.notEqual(row.request_sha256, old.request_sha256);
    continue;
  }
  assert.equal(row.request_sha256, old.request_sha256);
  assert.equal(row.accepted_text_sha256, old.accepted_text_sha256);
  identicalOldRequestsAndOutputs++;
}
assert.equal(priorCells, 120);
assert.equal(identicalOldRequestsAndOutputs, 117);
const arms = Object.fromEntries(['baseline', 'candidate'].map(arm => {
  const own = rows.filter(row => row.arm === arm);
  return [arm, { chats: own.length,
    prompt_tokens: own.reduce((sum, row) => sum + row.prompt_tokens, 0),
    completion_tokens: own.reduce((sum, row) =>
      sum + row.completion_tokens, 0),
    summed_chat_elapsed_ms: own.reduce((sum, row) =>
      sum + row.chat_elapsed_ms, 0) }];
}));
const samples = privateReport.resources.server.samples;
assert(samples.length > 0);
const report = { schema_version: 1,
  experiment: freeze.experiment,
  split: freeze.split, source_sha256: freeze.pinned.source,
  model_sha256: freeze.pinned.model,
  runtime_sha256: freeze.pinned.runtime,
  manifest_sha256: freeze.pinned.manifest,
  freeze_sha256: sha(freezeBytes),
  private_attempt: 'attempt-VnDmEU',
  private_report_sha256: sha(privateReportBytes),
  private_journal_sha256: sha(journalBytes),
  started_at: privateReport.started_at,
  finished_at: privateReport.finished_at,
  git_head: privateReport.git_head,
  git_status: privateReport.git_status,
  chats: rows.length, preflights: rows.length * 2,
  total_tokens: privateReport.total_tokens,
  wall_elapsed_ms: privateReport.wall_elapsed_ms,
  arms, rows, prior_cells: priorCells,
  identical_prior_requests_and_outputs: identicalOldRequestsAndOutputs,
  resources: { sample_interval_ms:
      privateReport.resources.server.interval_ms,
    samples: samples.length,
    server_working_set_bytes_max: Math.max(...samples.flatMap(sample =>
      sample.processes.map(process => process.WorkingSet64))),
    device_wide_gpu_mib_max: Math.max(...samples.map(sample =>
      Number(sample.gpu_device?.split(',')[1]?.trim())).filter(Number.isFinite)),
    sample_errors: samples.flatMap(sample => sample.errors).length,
    limitation: privateReport.resources.server.limitations },
  human_bilingual_reviews: 0, accepted_translation: false,
  product_profile_changed: false };
const output = `${JSON.stringify(report, null, 2)}\n`;
if (mode === '--capture') await fs.writeFile(outputPath, output, { flag: 'wx' });
else assert.equal(await fs.readFile(outputPath, 'utf8'), output);
console.log(JSON.stringify({ status: mode === '--capture' ? 'captured' : 'verified',
  chats: rows.length, preflights: rows.length * 2,
  total_tokens: report.total_tokens,
  report_sha256: sha(Buffer.from(output)) }));
