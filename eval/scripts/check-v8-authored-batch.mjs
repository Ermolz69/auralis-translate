import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve('.');
const digest = bytes => createHash('sha256').update(bytes).digest('hex');
const summary = JSON.parse(fs.readFileSync(path.join(root,
  'eval/reports/2026-10-02-v8-authored-cli.json')));
const raw = fs.readFileSync(path.join(root, summary.private_report));
assert.equal(digest(raw), summary.private_report_sha256);
const report = JSON.parse(raw);
assert.equal(report.experiment, summary.experiment);
assert.equal(report.status, 'completed');
assert.equal(summary.status, 'completed_structural_needs_review');
assert.equal(summary.source_split, 'authored_development_not_holdout');
assert.equal(report.identities.source_sha256, summary.source_sha256);
assert.equal(report.identities.manifest_sha256, summary.manifest_sha256);
assert.equal(report.identities.model_sha256, summary.model_sha256);
assert.equal(report.identities.runtime_sha256, summary.runtime_sha256);
assert.equal(report.identities.cli_sha256, summary.release_cli_sha256);
assert.equal(digest(fs.readFileSync(path.join(root,
  'eval/corpora/v7-batch-development-v1.zh.srt'))), summary.source_sha256);
assert.equal(digest(fs.readFileSync(path.join(root,
  'models/manifests/hy_mt2_1_8b_q4_k_m.context_v8_target_first_batch4.experimental.json'))),
  summary.manifest_sha256);
assert.deepEqual(report.arms.map(arm => arm.size), [1, 4]);
assert.deepEqual(summary.arms.map(arm => arm.size), [1, 4]);
assert.equal(Math.round(report.wall_ms), summary.wall_ms_rounded);
assert(report.wall_ms <= report.budget.max_wall_ms);
const source = fs.readFileSync(path.join(root,
  'eval/corpora/v7-batch-development-v1.zh.srt'), 'utf8');
const sourceTimes = source.match(/\d\d:\d\d:\d\d,\d{3} --> \d\d:\d\d:\d\d,\d{3}/gu);
assert.equal(sourceTimes.length, 4);
for (const [index, arm] of report.arms.entries()) {
  const published = summary.arms[index];
  assert.equal(arm.status, 'completed');
  assert.equal(arm.chat_requests, published.chat_requests);
  assert.equal(arm.requests.length, published.chat_requests + published.preflight_requests);
  assert.equal(arm.checkpoints.length, published.checkpoints);
  assert.equal(arm.results.length, published.results);
  assert(arm.results.every(row => row.review_state === published.review_state));
  assert.equal(arm.source_after_sha256, summary.source_sha256);
  assert.equal(arm.source_after_sha256, published.source_after_sha256);
  assert.equal(arm.output_sha256, published.output_sha256);
  assert.equal(digest(Buffer.from(arm.output_text)), arm.output_sha256);
  assert.equal(arm.results[0].output_sha256, arm.output_sha256);
  assert.equal(Math.round(arm.elapsed_ms), published.cli_elapsed_ms_rounded);
  const outputTimes = arm.output_text.match(/\d\d:\d\d:\d\d,\d{3} --> \d\d:\d\d:\d\d,\d{3}/gu);
  assert.deepEqual(outputTimes, sourceTimes);
  const outputBlocks = arm.output_text.trimEnd().split(/\r?\n\r?\n/u);
  assert.equal(outputBlocks.length, 4);
  for (const [position, block] of outputBlocks.entries()) {
    const lines = block.split(/\r?\n/u);
    assert.equal(Number(lines[0]), position + 1);
    assert.equal(lines[2], published.cues[position]);
  }
  const chats = arm.requests.filter(row => row.request_kind === 'chat_completion');
  assert.equal(chats.length, published.chat_requests);
  assert.equal(chats.reduce((sum, row) => sum + row.prompt_tokens, 0),
    published.prompt_tokens);
  assert.equal(chats.reduce((sum, row) => sum + row.completion_tokens, 0),
    published.completion_tokens);
  assert.equal(chats.reduce((sum, row) => sum + row.elapsed_ms, 0),
    published.chat_http_ms);
  for (let chatIndex = 0; chatIndex < chats.length; chatIndex++) {
    const [template, tokenize, chat] = arm.requests.slice(chatIndex * 3, chatIndex * 3 + 3);
    assert.deepEqual([template.request_kind, tokenize.request_kind, chat.request_kind],
      ['apply_template', 'tokenize', 'chat_completion']);
    assert.equal(chat.outcome, 'validated_batch');
    assert.equal(template.outcome, 'parsed_preflight_json');
    assert.equal(tokenize.outcome, 'parsed_preflight_json');
    const rendered = JSON.parse(template.raw_response).prompt;
    assert.equal(JSON.parse(tokenize.rendered_request).content, rendered);
    assert.equal(JSON.parse(tokenize.raw_response).tokens.length, chat.prompt_tokens);
    const request = JSON.parse(chat.rendered_request);
    assert.equal(digest(Buffer.from(chat.rendered_request)), chat.request_sha256);
    assert.equal(request.messages.length, 1);
    const content = request.messages[0].content;
    const input = content.split('Input JSON:\n');
    assert.equal(input.length, 2);
    for (const cue of published.cues) assert(!content.includes(cue));
    assert(input[1].startsWith('{"schema_version":7,"target_slots":'));
    const envelope = JSON.parse(input[1]);
    assert.equal(envelope.target_slots.length, arm.size);
    assert.equal(request.response_format.schema.properties.translations.maxItems,
      arm.size);
    const response = JSON.parse(chat.raw_response);
    assert.equal(response.usage.prompt_tokens, chat.prompt_tokens);
    assert.equal(response.usage.completion_tokens, chat.completion_tokens);
    assert.equal(response.choices[0].finish_reason, 'stop');
    const candidate = JSON.parse(response.choices[0].message.content).translations;
    assert.equal(candidate.length, arm.size);
    assert.deepEqual(candidate.map(row => row.segment_id), arm.size === 1
      ? [chatIndex + 1] : [1, 2, 3, 4]);
    assert.equal(JSON.parse(chat.restored_candidate).length, arm.size);
  }
}
assert.notEqual(summary.arms[0].output_sha256, summary.arms[1].output_sha256);
assert.equal(report.resources.samples.length, summary.resource_observation.samples);
assert.equal(Math.max(...report.resources.samples.flatMap(sample => sample.processes
  .filter(process => process.Id === sample.tracked_pids[0])
  .map(process => process.WorkingSet64))),
summary.resource_observation.server_working_set_max_observed_bytes);
assert.equal(Math.max(...report.resources.samples.map(sample =>
  Number(sample.gpu_device.split(',')[1]))),
summary.resource_observation.gpu_device_max_observed_mib);
assert.equal(summary.human_bilingual_review_count, 0);
assert.equal(summary.accepted_language_quality, false);
assert.equal(summary.release_gate, 'open');
console.log('V8 real CLI: same four cues, both complete batch sizes, source preservation, target-first prompts and needs-review exports verified.');
