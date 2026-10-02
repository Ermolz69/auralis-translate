import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const write = process.argv.length === 3 && process.argv[2] === '--write';
assert(process.argv.length === 2 || write);
const parent = path.join(root, '.cache/eval/v8-asus-single-target-v1');
const attempts = (await fs.readdir(parent)).filter(name => name.startsWith('attempt-'));
assert.equal(attempts.length, 1, 'The frozen experiment permits one attempt');
const privatePath = path.join(parent, attempts[0], 'report.json');
const publicPath = path.join(root, 'eval/reports/2026-10-02-v8-asus-single-target.json');
const digest = bytes => createHash('sha256').update(bytes).digest('hex');
const [privateBytes, sourceBytes, harnessBytes] = await Promise.all([
  fs.readFile(privatePath),
  fs.readFile(path.join(root, '.cache/eval/commons-asus-rog-ally-892592485/source.zh.srt')),
  fs.readFile(path.join(root, 'eval/scripts/probe-v8-asus-single-target.mjs')),
]);
const privateSha = digest(privateBytes);
const raw = JSON.parse(privateBytes);
assert.equal(raw.experiment, 'v8-asus-single-target-v1');
assert(['completed', 'completed_with_failure'].includes(raw.status));
assert.equal(raw.code_commit, '5308db31f51315d5cb839fab5423429c80bcd92b');
assert.deepEqual(raw.errors, []);
assert.equal(raw.harness_sha256, digest(harnessBytes));
assert.equal(raw.expected.source, digest(sourceBytes));
assert.equal(raw.expected.cli, '5cc85dee7751256ddf6963ed5606bac092d54ca91c1263001bcaf22898a158b3');
assert.equal(raw.arms.length, 2);
assert.deepEqual(raw.arms.map(arm => arm.id), ['1_8b', '7b']);
assert(raw.wall_elapsed_ms <= raw.limits.max_wall_ms);
const sourceBlocks = sourceBytes.toString('utf8').trimEnd().split(/\r?\n\r?\n/u);
assert.equal(sourceBlocks.length, 268);
const sourceHeaders = sourceBlocks.map(block => block.split(/\r?\n/u).slice(0, 2));
const sourceLines = sourceBlocks.map(block => block.split(/\r?\n/u).slice(2).join('\n'));
const arms = raw.arms.map((arm, index) => {
  assert(['completed', 'failed'].includes(arm.status));
  assert.equal(arm.model_sha256,
    index === 0 ? 'dc5f44fcf1fa496ee7ad725982c0c8c553a4de00259b53af84c4b89fb0c06699'
      : '9f96256500f3fc1ab4d64336b58f52a949a95ad7516b0c229476eef782f9f77b');
  assert.equal(arm.manifest_sha256,
    index === 0 ? '3762873e48f3e7864d3cf655e295d4ac383dd30ac5f7292f53f25fc5887761d7'
      : 'a748572cea20fc46c53ced5c39c5b8e3fb85887c2e90d559a27fd41ea818f2bc');
  assert.equal(arm.source_after_sha256, raw.expected.source);
  assert(arm.chat_requests >= 1 && arm.chat_requests <= 268);
  assert.equal(arm.preflight_requests, arm.chat_requests * 2);
  assert.equal(arm.requests.length, arm.chat_requests * 3);
  assert.equal(arm.checkpoints.length, arm.status === 'completed' ? 268 : arm.chat_requests - 1);
  assert.deepEqual(arm.checkpoints.map(row => row.block_index),
    Array.from({ length: arm.checkpoints.length }, (_, position) => position));
  const chats = [];
  for (let requestIndex = 0; requestIndex < arm.chat_requests; requestIndex++) {
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
    assert.equal(envelope.target_slots.length, 1);
    assert.equal(envelope.target_slots[0].segment_id, requestIndex + 1);
    assert.equal(envelope.target_slots[0].source_original, sourceLines[requestIndex]);
    const response = JSON.parse(chat.raw_response);
    assert.equal(response.usage.prompt_tokens, chat.prompt_tokens);
    assert.equal(response.usage.completion_tokens, chat.completion_tokens);
    if (requestIndex < arm.checkpoints.length) {
      assert.equal(chat.outcome, 'validated_batch');
      assert(chat.restored_candidate);
    }
    chats.push(chat);
  }
  const last = chats.at(-1);
  if (arm.status === 'completed') {
    assert.equal(arm.cli_exit_code, 0);
    assert.equal(arm.results.length, 1);
    assert(arm.output_sha256);
    assert.equal(digest(Buffer.from(arm.output_text)), arm.output_sha256);
    const resultHeaders = arm.output_text.trimEnd().split(/\r?\n\r?\n/u)
      .map(block => block.split(/\r?\n/u).slice(0, 2));
    assert.deepEqual(resultHeaders, sourceHeaders);
    for (const id of [1, 2, 79, 80, 133, 134, 141, 144, 245, 248, 267, 268])
      assert.equal(resultHeaders[id - 1][0], String(id));
  } else {
    assert.equal(arm.cli_exit_code, 1);
    assert.equal(arm.results.length, 0);
    assert.equal(arm.output_sha256, null);
    assert.equal(arm.output_text, null);
    assert.equal(last.outcome, 'invalid_candidate');
    assert.equal(last.restored_candidate, null);
  }
  const samples = arm.resources.samples;
  return { id: arm.id, status: arm.status,
    model_sha256: arm.model_sha256, manifest_sha256: arm.manifest_sha256,
    scene_map_sha256: arm.scene_map_sha256,
    source_after_sha256: arm.source_after_sha256,
    chat_requests: arm.chat_requests,
    template_token_preflight_calls: arm.preflight_requests,
    validated_checkpoints: arm.checkpoints.length,
    covered_prefix_cues: arm.checkpoints.length,
    first_failed_target_id: arm.status === 'failed' ? arm.checkpoints.length + 1 : null,
    final_chat_outcome: last.outcome,
    final_chat_request_sha256: last.request_sha256,
    final_raw_response_sha256: digest(Buffer.from(last.raw_response)),
    final_error_detail: last.error_detail,
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
  private_report: path.relative(root, privatePath).replaceAll('\\', '/'),
  private_report_sha256: privateSha, source_cues: 268,
  status: raw.status, wall_elapsed_ms: raw.wall_elapsed_ms,
  human_bilingual_review_count: 0, accepted_language_quality: false,
  arms, release_gate: 'open' };
const output = `${JSON.stringify(report, null, 2)}\n`;
if (write) await fs.writeFile(publicPath, output);
else assert.equal(await fs.readFile(publicPath, 'utf8'), output);
console.log(`Natural v8 single-target: ${arms.map(arm =>
  `${arm.id} ${arm.validated_checkpoints}/268 ${arm.status}`).join(', ')}; ${write ? 'wrote' : 'verified'} source-free report.`);
