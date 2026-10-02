import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve('.');
const digest = bytes => createHash('sha256').update(bytes).digest('hex');
const summary = JSON.parse(fs.readFileSync(path.join(root,
  'eval/reports/2026-10-02-v7-target-first-order.json')));
const bytes = fs.readFileSync(path.join(root, summary.private_report));
assert.equal(digest(bytes), summary.private_report_sha256);
const report = JSON.parse(bytes);
assert.equal(report.experiment, summary.experiment);
assert.equal(report.status, summary.status);
assert.equal(report.expected.fixture, summary.fixture_sha256);
assert.equal(report.expected.model, summary.model_sha256);
assert.equal(report.expected.runtime, summary.runtime_sha256);
assert.equal(report.expected.manifest, summary.manifest_sha256);
assert.equal(report.expected.baseline_request, summary.baseline_request_sha256);
assert.equal(digest(fs.readFileSync(path.join(root,
  'eval/corpora/v7-target-first-controls-v1.json'))), summary.fixture_sha256);
assert.equal(digest(fs.readFileSync(path.join(root,
  'eval/scripts/probe-v7-target-first-order.mjs'))), report.harness_sha256);
assert.equal(report.requests.length, summary.chat_requests);
assert.equal(report.requests.length, summary.rows.length);
assert.equal(report.limits.chats, 12);
assert.equal(report.limits.preflights, 24);
assert.equal(report.limits.retries, 0);
assert(report.wall_elapsed_ms <= report.limits.wall_ms);
assert.equal(report.failures.length, 0);
assert.equal(summary.accepted_product_results, 0);
assert.equal(summary.published_subtitle_files, 0);
assert.equal(summary.human_review_count, 0);
assert.equal(summary.release_gate, 'open');
const journal = fs.readFileSync(path.join(root,
  path.dirname(summary.private_report), 'requests.jsonl'), 'utf8')
  .trimEnd().split(/\r?\n/u).map(JSON.parse);
assert.equal(journal.length, summary.chat_requests);
const marker = 'Input JSON:\n';
for (const [index, entry] of journal.entries()) {
  const row = report.requests[index];
  const publicRow = summary.rows[index];
  for (const key of ['case_id', 'seed', 'order']) {
    assert.equal(entry[key], publicRow[key]);
    assert.equal(entry[key], row[key]);
  }
  assert.equal(entry.request_sha256, digest(Buffer.from(JSON.stringify(entry.request))));
  assert.equal(entry.request_sha256, row.request_sha256);
  assert.equal(entry.prompt_sha256, digest(Buffer.from(entry.request.messages[0].content)));
  assert.equal(entry.prompt_sha256, row.prompt_sha256);
  assert.equal(entry.raw_response_sha256, digest(Buffer.from(entry.raw_response)));
  assert.equal(entry.raw_response_sha256, row.raw_response_sha256);
  assert.equal(entry.http_status, 200);
  assert.equal(entry.finish_reason, 'stop');
  assert.equal(entry.structural_outcome, 'outer_json_valid_unreviewed');
  assert.equal(entry.preflight.length, 2);
  assert.deepEqual(entry.preflight.map(item => item.path), ['/apply-template', '/tokenize']);
  assert(entry.preflight.every(item => item.http_status === 200));
  const rendered = JSON.parse(entry.preflight[0].raw_response).prompt;
  assert.equal(entry.preflight[1].request.content, rendered);
  assert.deepEqual(entry.preflight[0].request.response_format, entry.request.response_format);
  const tokens = JSON.parse(entry.preflight[1].raw_response).tokens;
  assert.equal(tokens.length, entry.usage.prompt_tokens);
  assert.equal(tokens.length, entry.prompt_tokens_preflight);
  assert.equal(tokens.length, publicRow.prompt_tokens);
  assert.equal(entry.usage.completion_tokens, publicRow.completion_tokens);
  assert.equal(entry.chat_elapsed_ms, publicRow.chat_ms);
  const parsed = JSON.parse(entry.raw_response);
  const rows = JSON.parse(parsed.choices[0].message.content).translations;
  assert.equal(rows.length, 1);
  assert.equal(rows[0].segment_id, 1);
  assert.equal(rows[0].line_index, 0);
  assert.equal(rows[0].text, publicRow.text);
  assert.equal(entry.parsed_candidate, publicRow.text);
  const prompt = entry.request.messages[0].content;
  assert.equal(prompt.split(marker).length, 2);
  assert(!/\p{Script=Cyrillic}/u.test(prompt));
  const envelope = JSON.parse(prompt.split(marker)[1]);
  assert.deepEqual(Object.keys(envelope), entry.order === 'target_first'
    ? ['schema_version', 'target_slots', 'source_context']
    : ['schema_version', 'source_context', 'target_slots']);
  assert.equal(envelope.target_slots.length, 1);
  assert.equal(envelope.source_context.length, 1);
  assert.equal(envelope.target_slots[0].segment_id, 1);
  assert.equal(envelope.source_context[0].segment_id, 2);
}
const fixture = JSON.parse(fs.readFileSync(path.join(root,
  'eval/corpora/v7-target-first-controls-v1.json')));
for (const testCase of fixture.cases) for (const seed of [101, 202]) {
  const pair = journal.filter(row => row.case_id === testCase.id && row.seed === seed);
  assert.deepEqual(pair.map(row => row.order), seed === 101
    ? ['baseline', 'target_first'] : ['target_first', 'baseline']);
  const [first, second] = pair.map(row => structuredClone(row.request));
  assert.deepEqual({ ...first, messages: [] }, { ...second, messages: [] });
  const firstPrompt = first.messages[0].content.split(marker);
  const secondPrompt = second.messages[0].content.split(marker);
  assert.equal(firstPrompt[0], secondPrompt[0]);
  const left = JSON.parse(firstPrompt[1]);
  const right = JSON.parse(secondPrompt[1]);
  assert.deepEqual(left, right);
  assert.equal(left.target_slots[0].source_original, testCase.target_source);
  assert.equal(left.source_context[0].source_original, testCase.context_source);
}
for (const order of ['baseline', 'target_first']) {
  const rows = journal.filter(row => row.order === order);
  const totals = summary[`${order}_totals`];
  assert.equal(rows.length, totals.chats);
  assert.equal(rows.reduce((sum, row) => sum + row.usage.prompt_tokens, 0),
    totals.prompt_tokens);
  assert.equal(rows.reduce((sum, row) => sum + row.usage.completion_tokens, 0),
    totals.completion_tokens);
  assert.equal(rows.reduce((sum, row) => sum + row.chat_elapsed_ms, 0),
    totals.chat_http_ms);
  assert.equal(rows.reduce((sum, row) =>
    sum + (row.usage.prompt_tokens_details?.cached_tokens ?? 0), 0),
  totals.cached_prompt_tokens);
}
assert.equal(summary.template_token_preflight_calls, journal.length * 2);
assert.equal(summary.resource_observation.samples, report.resources.samples.length);
assert.equal(summary.resource_observation.server_working_set_max_observed_bytes,
  Math.max(...report.resources.samples.map(sample => sample.processes[0].WorkingSet64)));
assert.equal(summary.resource_observation.gpu_device_max_observed_mib,
  Math.max(...report.resources.samples.map(sample => Number(sample.gpu_device.split(',')[1]))));
assert.deepEqual(summary.rows.filter(row => row.case_id === 'known_money_leak')
  .filter(row => row.order === 'baseline').map(row => row.source_aware_ai_classification),
['wrong_neighbor_money_content', 'wrong_neighbor_money_content']);
assert.deepEqual(summary.rows.filter(row => row.case_id === 'known_money_leak')
  .filter(row => row.order === 'target_first').map(row => row.source_aware_ai_classification),
['target_sense_rough_russian', 'target_sense_rough_russian']);
console.log('V7 target-first order: twelve pinned chats, twenty-four preflights and six one-factor pairs verified; no human quality claim.');
