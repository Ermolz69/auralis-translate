import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const write = process.argv.length === 3 && process.argv[2] === '--write';
assert(process.argv.length === 2 || write, 'Only --write is supported');
const privatePath = path.join(root,
  '.cache/eval/v8-asus-natural-long-v1/attempt-UhjJZn/report.json');
const publicPath = path.join(root, 'eval/reports/2026-10-02-v8-asus-natural-long.json');
const sourcePath = path.join(root,
  '.cache/eval/commons-asus-rog-ally-892592485/source.zh.srt');
const digest = bytes => createHash('sha256').update(bytes).digest('hex');
const [privateBytes, sourceBytes, harnessBytes] = await Promise.all([
  fs.readFile(privatePath), fs.readFile(sourcePath),
  fs.readFile(path.join(root, 'eval/scripts/probe-v8-asus-natural-long.mjs')),
]);
const privateSha = 'e67560c2cf31bd8571df5d73cbc5d4b9f8c4ff8e0343f549d03ddee703c1657e';
assert.equal(digest(privateBytes), privateSha);
const raw = JSON.parse(privateBytes);
assert.equal(raw.experiment, 'v8-asus-natural-long-v1');
assert.equal(raw.status, 'completed_with_failure');
assert.equal(raw.code_commit, 'd593e1a48328596d0f72ae06c52bc16ef80c983f');
assert.equal(raw.errors.length, 0);
assert.equal(raw.harness_sha256, digest(harnessBytes));
assert.equal(raw.expected.source, digest(sourceBytes));
assert.equal(raw.arms.length, 2);
assert.deepEqual(raw.arms.map(arm => arm.id), ['1_8b', '7b']);
assert(raw.wall_elapsed_ms <= raw.limits.max_wall_ms);
const sourceBlocks = sourceBytes.toString('utf8').trimEnd().split(/\r?\n\r?\n/u);
assert.equal(sourceBlocks.length, 268);
const sourceLines = sourceBlocks.map(block => block.split(/\r?\n/u).slice(2).join('\n'));
const expected = [
  { id: '1_8b', chats: 55, checkpoints: 54, first_failed_id: 217,
    final_outcome: 'invalid_candidate', last_error: 'v7 response contains invalid target text' },
  { id: '7b', chats: 36, checkpoints: 35, first_failed_id: 141,
    final_outcome: 'validated_batch', last_error: 'SRT target line violates supported text grammar' },
];
const arms = raw.arms.map((arm, index) => {
  const wanted = expected[index];
  assert.equal(arm.id, wanted.id);
  assert.equal(arm.status, 'failed');
  assert.equal(arm.cli_exit_code, 1);
  assert.equal(arm.chat_requests, wanted.chats);
  assert.equal(arm.preflight_requests, wanted.chats * 2);
  assert.equal(arm.checkpoints.length, wanted.checkpoints);
  assert.equal(arm.results.length, 0);
  assert.equal(arm.output_sha256, null);
  assert.equal(arm.output_text, null);
  assert.equal(arm.source_after_sha256, raw.expected.source);
  assert(arm.cli_stderr.includes(wanted.last_error));
  assert.deepEqual(arm.checkpoints.map(row => row.block_index),
    Array.from({ length: wanted.checkpoints }, (_, position) => position));
  assert.equal(arm.requests.length, wanted.chats * 3);
  const chats = [];
  for (let requestIndex = 0; requestIndex < wanted.chats; requestIndex++) {
    const [template, tokenize, chat] = arm.requests.slice(requestIndex * 3, requestIndex * 3 + 3);
    assert.deepEqual([template.request_kind, tokenize.request_kind, chat.request_kind],
      ['apply_template', 'tokenize', 'chat_completion']);
    assert.equal(template.outcome, 'parsed_preflight_json');
    assert.equal(tokenize.outcome, 'parsed_preflight_json');
    const rendered = JSON.parse(template.raw_response).prompt;
    assert.equal(JSON.parse(tokenize.rendered_request).content, rendered);
    assert.equal(JSON.parse(tokenize.raw_response).tokens.length, chat.prompt_tokens);
    assert.equal(digest(Buffer.from(chat.rendered_request)), chat.request_sha256);
    const request = JSON.parse(chat.rendered_request);
    const input = request.messages[0].content.split('Input JSON:\n');
    assert.equal(input.length, 2);
    const envelope = JSON.parse(input[1]);
    assert.deepEqual(Object.keys(envelope), ['schema_version', 'target_slots', 'source_context']);
    assert.equal(envelope.target_slots.length, 4);
    for (const [offset, target] of envelope.target_slots.entries()) {
      const id = requestIndex * 4 + offset + 1;
      assert.equal(target.segment_id, id);
      assert.equal(target.source_original, sourceLines[id - 1]);
    }
    const response = JSON.parse(chat.raw_response);
    assert.equal(response.usage.prompt_tokens, chat.prompt_tokens);
    assert.equal(response.usage.completion_tokens, chat.completion_tokens);
    assert.equal(response.choices[0].finish_reason, 'stop');
    if (requestIndex < wanted.checkpoints) {
      assert.equal(chat.outcome, 'validated_batch');
      assert(chat.restored_candidate);
    }
    chats.push(chat);
  }
  const last = chats.at(-1);
  assert.equal(last.segment_id, wanted.first_failed_id);
  assert.equal(last.outcome, wanted.final_outcome);
  assert.equal(last.error_detail, index === 0 ? wanted.last_error : null);
  if (index === 0) assert.equal(last.restored_candidate, null);
  else {
    const candidate = JSON.parse(last.restored_candidate);
    assert.equal(candidate.length, 4);
    assert(candidate.some(text => text.includes('{') || text.includes('}')));
  }
  const samples = arm.resources.samples;
  return { id: arm.id, status: arm.status,
    model_sha256: arm.model_sha256, manifest_sha256: arm.manifest_sha256,
    scene_map_sha256: arm.scene_map_sha256,
    source_after_sha256: arm.source_after_sha256,
    chat_requests: arm.chat_requests,
    template_token_preflight_calls: arm.preflight_requests,
    validated_checkpoints: arm.checkpoints.length,
    covered_prefix_cues: arm.checkpoints.length * 4,
    first_failed_target_id: wanted.first_failed_id,
    final_chat_outcome: last.outcome,
    final_chat_request_sha256: last.request_sha256,
    final_raw_response_sha256: digest(Buffer.from(last.raw_response)),
    final_error_detail: wanted.last_error,
    published_results: arm.results.length,
    output_sha256: arm.output_sha256,
    prompt_tokens: chats.reduce((sum, chat) => sum + chat.prompt_tokens, 0),
    completion_tokens: chats.reduce((sum, chat) => sum + chat.completion_tokens, 0),
    chat_http_ms: chats.reduce((sum, chat) => sum + chat.elapsed_ms, 0),
    cli_elapsed_ms: arm.cli_elapsed_ms,
    resource_observation: { samples: samples.length,
      server_working_set_max_observed_bytes: Math.max(...samples.flatMap(sample =>
        sample.processes.filter(process => process.Id === sample.tracked_pids[0])
          .map(process => process.WorkingSet64))),
      gpu_device_max_observed_mib: Math.max(...samples.map(sample =>
        Number(sample.gpu_device.split(',')[1]))),
      limitation: arm.resources.limitations },
  };
});
assert.equal(arms[0].scene_map_sha256, arms[1].scene_map_sha256);
const report = { schema_version: 1, experiment: raw.experiment,
  task_ids: ['LONG-01', 'LONG-02', 'EVAL-04'],
  split: 'known_natural_development_not_holdout',
  code_commit: raw.code_commit, source_sha256: raw.expected.source,
  media_sha256: raw.expected.media, runtime_sha256: raw.expected.runtime,
  release_cli_sha256: raw.expected.cli, harness_sha256: raw.harness_sha256,
  private_report: '.cache/eval/v8-asus-natural-long-v1/attempt-UhjJZn/report.json',
  private_report_sha256: privateSha, source_cues: 268,
  status: raw.status, wall_elapsed_ms: raw.wall_elapsed_ms,
  human_bilingual_review_count: 0, accepted_language_quality: false,
  arms, release_gate: 'open' };
const output = `${JSON.stringify(report, null, 2)}\n`;
if (write) await fs.writeFile(publicPath, output);
else assert.equal(await fs.readFile(publicPath, 'utf8'), output);
console.log(`Natural v8: 1.8B ${arms[0].validated_checkpoints}/67 and 7B ${arms[1].validated_checkpoints}/67 checkpoints, zero published SRT; ${write ? 'wrote' : 'verified'} source-free report.`);
