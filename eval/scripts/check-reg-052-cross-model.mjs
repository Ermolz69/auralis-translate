import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const write = process.argv.length === 3 && process.argv[2] === '--write';
assert(process.argv.length === 2 || write, 'Only --write is supported');
const priorDir = path.join(root, '.cache/eval/reg-052-v8-controls-v1/attempt-uQZQXg');
const currentDir = path.join(root, '.cache/eval/reg-052-cross-model-v1/attempt-4tsjM7');
const publicPath = path.join(root, 'eval/reports/2026-10-02-reg-052-cross-model.json');
const digest = bytes => createHash('sha256').update(bytes).digest('hex');
const [priorBytes, priorJournal, currentBytes, currentJournal, packBytes] = await Promise.all([
  fs.readFile(path.join(priorDir, 'report.json')),
  fs.readFile(path.join(priorDir, 'requests.jsonl'), 'utf8'),
  fs.readFile(path.join(currentDir, 'report.json')),
  fs.readFile(path.join(currentDir, 'requests.jsonl'), 'utf8'),
  fs.readFile(path.join(root, 'eval/regressions/v8-name-question-controls-v1.json')),
]);
const priorSha = '96ac8d1b1b6c126b3e66052702560ff9b1aca30d0809ac1b59ce0f5a2b161ebf';
const currentSha = '4bf314497b25413a1b8d522ef191dff4ed1fd8a2795295810aedaa4326097cf1';
assert.equal(digest(priorBytes), priorSha);
assert.equal(digest(currentBytes), currentSha);
assert.equal(digest(packBytes), '23ecdaeb253d281e7651d5b76acdf10fd672793b428fd13262d38672a2ac82ed');
const prior = JSON.parse(priorBytes);
const current = JSON.parse(currentBytes);
const pack = JSON.parse(packBytes);
assert.equal(prior.status, 'complete_outer_json_unreviewed');
assert.equal(current.status, 'complete_outer_json_unreviewed');
assert.equal(current.code_commit, '6abea73e42060eb226e556039e0fad4d8301d07c');
assert.equal(current.harness_sha256, '46bfc91327395e02740f644a79063744f09b691268dd2f5fd71f3b0427250e94');
assert.equal(digest(await fs.readFile(path.join(root,
  'eval/scripts/probe-reg-052-cross-model.mjs'))), current.harness_sha256);
assert.equal(current.failures.length, 0);
assert.equal(current.requests.length, 12);
const priorEntries = priorJournal.trim().split('\n').map(line => JSON.parse(line));
const entries = currentJournal.trim().split('\n').map(line => JSON.parse(line));
assert.equal(priorEntries.length, 24);
assert.equal(entries.length, 12);
const cases = [...pack.related_controls, ...pack.negative_controls];
const rows = [];
for (const [index, entry] of entries.entries()) {
  const summary = current.requests[index];
  const priorEntry = priorEntries.find(row => row.case_id === entry.case_id
    && row.seed === entry.seed && row.context === 'on');
  assert(priorEntry);
  const testCase = cases.find(row => row.id === entry.case_id);
  assert(testCase);
  assert.equal(entry.prior_request_sha256, priorEntry.request_sha256);
  assert.equal(entry.prior_raw_response_sha256, priorEntry.raw_response_sha256);
  assert.equal(entry.prior_candidate, priorEntry.parsed_candidate);
  assert.equal(entry.prompt_sha256, priorEntry.prompt_sha256);
  assert.equal(entry.request.messages[0].content, priorEntry.request.messages[0].content);
  const normalized = structuredClone(entry.request);
  normalized.model = priorEntry.request.model;
  assert.deepEqual(normalized, priorEntry.request);
  assert.equal(entry.request_sha256, summary.request_sha256);
  assert.equal(digest(Buffer.from(JSON.stringify(entry.request))), entry.request_sha256);
  assert.equal(digest(Buffer.from(entry.raw_response)), entry.raw_response_sha256);
  assert.equal(entry.raw_response_sha256, summary.raw_response_sha256);
  assert.equal(entry.preflight.length, 2);
  for (const flight of entry.preflight) {
    assert.equal(flight.http_status, 200);
    assert.equal(digest(Buffer.from(JSON.stringify(flight.request))), flight.request_sha256);
    assert.equal(digest(Buffer.from(flight.raw_response)), flight.raw_response_sha256);
  }
  assert.equal(entry.usage.prompt_tokens, entry.prompt_tokens_preflight);
  assert.equal(entry.usage.prompt_tokens, summary.prompt_tokens_preflight);
  assert.equal(entry.structural_outcome, 'outer_json_valid_unreviewed');
  assert.equal(entry.parsed_candidate, summary.parsed_candidate);
  assert.equal(JSON.parse(entry.raw_candidate).translations[0].text, entry.parsed_candidate);
  assert.equal(entry.finish_reason, 'stop');
  assert.equal(entry.http_status, 200);
  assert(!entry.request.messages[0].content.includes(testCase.expected_meaning));
  rows.push({ case_id: entry.case_id, seed: entry.seed,
    prompt_sha256: entry.prompt_sha256,
    small_request_sha256: priorEntry.request_sha256,
    large_request_sha256: entry.request_sha256,
    small_raw_response_sha256: priorEntry.raw_response_sha256,
    large_raw_response_sha256: entry.raw_response_sha256,
    small_raw_candidate: priorEntry.parsed_candidate,
    large_raw_candidate: entry.parsed_candidate,
    small_prompt_tokens: priorEntry.usage.prompt_tokens,
    large_prompt_tokens: entry.usage.prompt_tokens,
    small_completion_tokens: priorEntry.usage.completion_tokens,
    large_completion_tokens: entry.usage.completion_tokens,
    small_chat_ms: priorEntry.chat_elapsed_ms,
    large_chat_ms: entry.chat_elapsed_ms });
}
assert.deepEqual(rows.map(row => `${row.case_id}:${row.seed}`),
  cases.flatMap(row => [`${row.id}:101`, `${row.id}:202`]));
const totals = (prefix) => rows.reduce((sum, row) => ({
  chats: sum.chats + 1,
  prompt_tokens: sum.prompt_tokens + row[`${prefix}_prompt_tokens`],
  completion_tokens: sum.completion_tokens + row[`${prefix}_completion_tokens`],
  chat_http_ms: sum.chat_http_ms + row[`${prefix}_chat_ms`],
}), { chats: 0, prompt_tokens: 0, completion_tokens: 0, chat_http_ms: 0 });
const samples = current.resources.samples;
const report = {
  schema_version: 1,
  experiment: current.experiment,
  task_ids: ['EVAL-04'],
  split: 'known_authored_development_regression_not_holdout',
  code_commit: current.code_commit,
  pack_sha256: current.expected.pack,
  small_model_sha256: prior.expected.model,
  large_model_sha256: current.expected.model,
  runtime_sha256: current.expected.runtime,
  large_identity_manifest_sha256: current.expected.manifest,
  large_harness_sha256: current.harness_sha256,
  small_private_report_sha256: priorSha,
  large_private_report: '.cache/eval/reg-052-cross-model-v1/attempt-4tsjM7/report.json',
  large_private_report_sha256: currentSha,
  status: current.status,
  paired_chats: rows.length,
  large_preflight_calls: entries.reduce((sum, row) => sum + row.preflight.length, 0),
  large_wall_elapsed_ms: current.wall_elapsed_ms,
  human_bilingual_review_count: 0,
  accepted_product_results: 0,
  small_totals: totals('small'),
  large_totals: totals('large'),
  rows,
  large_resource_observation: {
    samples: samples.length,
    server_working_set_max_observed_bytes: Math.max(...samples.flatMap(sample =>
      sample.processes.map(process => process.WorkingSet64))),
    gpu_device_max_observed_mib: Math.max(...samples.map(sample =>
      Number(sample.gpu_device.split(',')[1]))),
    limitation: current.resources.limitations,
  },
  quality_claim: 'source_aware_ai_triage_only',
  release_gate: 'open',
};
const rendered = `${JSON.stringify(report, null, 2)}\n`;
if (write) await fs.writeFile(publicPath, rendered);
else assert.equal(await fs.readFile(publicPath, 'utf8'), rendered);
console.log(`REG-052 cross-model: ${rows.length} paired real chats, 24 7B preflights and zero human reviews; ${write ? 'wrote' : 'verified'} report.`);
