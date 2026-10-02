import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const write = process.argv.length === 3 && process.argv[2] === '--write';
assert(process.argv.length === 2 || write, 'Only --write is supported');
const privateDir = path.join(root, '.cache/eval/reg-052-v8-controls-v1/attempt-uQZQXg');
const publicPath = path.join(root, 'eval/reports/2026-10-02-reg-052-v8-controls.json');
const digest = bytes => createHash('sha256').update(bytes).digest('hex');
const [privateBytes, journalText, packBytes] = await Promise.all([
  fs.readFile(path.join(privateDir, 'report.json')),
  fs.readFile(path.join(privateDir, 'requests.jsonl'), 'utf8'),
  fs.readFile(path.join(root, 'eval/regressions/v8-name-question-controls-v1.json')),
]);
const privateSha = '96ac8d1b1b6c126b3e66052702560ff9b1aca30d0809ac1b59ce0f5a2b161ebf';
assert.equal(digest(privateBytes), privateSha);
assert.equal(digest(packBytes), '23ecdaeb253d281e7651d5b76acdf10fd672793b428fd13262d38672a2ac82ed');
const source = JSON.parse(privateBytes);
const pack = JSON.parse(packBytes);
const cases = [...pack.related_controls, ...pack.negative_controls];
assert.equal(source.status, 'complete_outer_json_unreviewed');
assert.equal(source.code_commit, '4b5d9ecf30131a83f1fc72d2ebb28589c490c7ea');
assert.equal(source.harness_sha256, '1ca826e9f6811b53175447be3f12d4bec2b9ae079d16d100ee18f63112c0de1b');
assert.equal(digest(await fs.readFile(path.join(root,
  'eval/scripts/probe-reg-052-v8-controls.mjs'))), source.harness_sha256);
assert.equal(source.requests.length, 24);
assert.equal(source.failures.length, 0);
const entries = journalText.trim().split('\n').map(line => JSON.parse(line));
assert.equal(entries.length, 24);
for (const [index, entry] of entries.entries()) {
  const summary = source.requests[index];
  const testCase = cases.find(row => row.id === entry.case_id);
  assert(testCase);
  assert.equal(entry.request_sha256, summary.request_sha256);
  assert.equal(digest(Buffer.from(JSON.stringify(entry.request))), entry.request_sha256);
  assert.equal(entry.raw_response_sha256, summary.raw_response_sha256);
  assert.equal(digest(Buffer.from(entry.raw_response)), entry.raw_response_sha256);
  assert.equal(entry.preflight.length, 2);
  assert(entry.preflight.every(row => row.http_status === 200));
  for (const flight of entry.preflight) {
    assert.equal(digest(Buffer.from(JSON.stringify(flight.request))), flight.request_sha256);
    assert.equal(digest(Buffer.from(flight.raw_response)), flight.raw_response_sha256);
  }
  assert.equal(entry.usage.prompt_tokens, entry.prompt_tokens_preflight);
  assert.equal(summary.prompt_tokens_preflight, entry.prompt_tokens_preflight);
  assert.equal(summary.structural_outcome, 'outer_json_valid_unreviewed');
  assert.equal(summary.parsed_candidate, entry.parsed_candidate);
  assert.equal(JSON.parse(entry.raw_candidate).translations[0].text, entry.parsed_candidate);
  assert.equal(entry.finish_reason, 'stop');
  assert.equal(entry.http_status, 200);
  const prompt = entry.request.messages[0].content;
  assert(!prompt.includes(testCase.expected_meaning));
  const envelope = JSON.parse(prompt.split('Input JSON:\n')[1]);
  assert.deepEqual(Object.keys(envelope), ['schema_version', 'target_slots', 'source_context']);
  assert.equal(envelope.target_slots[0].source_original, testCase.source);
  assert.equal(envelope.target_slots[0].source_for_translation, testCase.source);
  assert.equal(envelope.source_context.length, entry.context === 'on' ? 2 : 0);
  assert.equal(entry.seed, summary.seed);
  assert.equal(entry.context, summary.context);
  assert.equal(entry.case_id, summary.case_id);
}
for (const testCase of cases) {
  const rows = source.requests.filter(row => row.case_id === testCase.id);
  assert.equal(rows.length, 4);
  assert.deepEqual(rows.map(row => `${row.seed}:${row.context}`),
    ['101:on', '101:off', '202:off', '202:on']);
}
const totals = rows => rows.reduce((sum, row) => ({
  chats: sum.chats + 1,
  prompt_tokens: sum.prompt_tokens + row.usage.prompt_tokens,
  completion_tokens: sum.completion_tokens + row.usage.completion_tokens,
  chat_http_ms: sum.chat_http_ms + row.chat_elapsed_ms,
}), { chats: 0, prompt_tokens: 0, completion_tokens: 0, chat_http_ms: 0 });
const samples = source.resources.samples;
const report = {
  schema_version: 1,
  experiment: source.experiment,
  task_ids: ['EVAL-04', 'LONG-02'],
  split: 'known_authored_development_regression_not_holdout',
  code_commit: source.code_commit,
  pack_sha256: source.expected.pack,
  model_sha256: source.expected.model,
  runtime_sha256: source.expected.runtime,
  manifest_sha256: source.expected.manifest,
  prior_request_sha256: source.expected.prior_request,
  harness_sha256: source.harness_sha256,
  private_report: '.cache/eval/reg-052-v8-controls-v1/attempt-uQZQXg/report.json',
  private_report_sha256: privateSha,
  status: source.status,
  chat_requests: source.requests.length,
  template_token_preflight_calls: entries.reduce((sum, row) => sum + row.preflight.length, 0),
  wall_elapsed_ms: source.wall_elapsed_ms,
  human_bilingual_review_count: 0,
  accepted_product_results: 0,
  context_on_totals: totals(source.requests.filter(row => row.context === 'on')),
  context_off_totals: totals(source.requests.filter(row => row.context === 'off')),
  rows: source.requests.map(row => ({
    case_id: row.case_id, seed: row.seed, context: row.context,
    request_sha256: row.request_sha256, raw_response_sha256: row.raw_response_sha256,
    prompt_tokens: row.usage.prompt_tokens,
    completion_tokens: row.usage.completion_tokens,
    chat_ms: row.chat_elapsed_ms,
    raw_candidate: row.parsed_candidate,
    structural_outcome: row.structural_outcome,
  })),
  resource_observation: {
    samples: samples.length,
    server_working_set_max_observed_bytes: Math.max(...samples.flatMap(sample =>
      sample.processes.map(process => process.WorkingSet64))),
    gpu_device_max_observed_mib: Math.max(...samples.map(sample =>
      Number(sample.gpu_device.split(',')[1]))),
    limitation: source.resources.limitations,
  },
  quality_claim: 'source_aware_ai_triage_only',
  release_gate: 'open',
};
const rendered = `${JSON.stringify(report, null, 2)}\n`;
if (write) await fs.writeFile(publicPath, rendered);
else assert.equal(await fs.readFile(publicPath, 'utf8'), rendered);
console.log(`REG-052: ${report.chat_requests} real chats, ${report.template_token_preflight_calls} preflights, zero human reviews; ${write ? 'wrote' : 'verified'} public report.`);
