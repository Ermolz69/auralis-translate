import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { createReadStream } from 'node:fs';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const assetRoot = process.env.AURALIS_EVAL_ASSET_ROOT ?? root;
const capture = process.argv.length === 3 && process.argv[2] === '--capture';
assert(process.argv.length === 2 || capture, 'Only --capture is supported');
const sourcePath = path.join(root,
  '.cache/eval/youtube-geekerwan-vivo-original-caption/attempt-LQWxgw/source.zh.srt');
const mediaPath = path.join(root,
  '.cache/eval/commons-vivo-media/media-46745446-cc07-4cff-b5e3-f98fe08262f0/source.240p.webm');
const harnessPath = path.join(root, 'eval/scripts/probe-v8-vivo-original-long.mjs');
const privatePath = path.join(root,
  '.cache/eval/v8-vivo-original-long-v1/attempt-MAaX5T/report.json');
const firstFailurePath = path.join(root,
  '.cache/eval/v8-vivo-original-long-v1/attempt-k0peWA/report.json');
const failedExportPath = path.join(root,
  '.cache/eval/v8-vivo-original-long-v1/offline-export-v1/report.json');
const passedExportPath = path.join(root,
  '.cache/eval/v8-vivo-original-long-v1/offline-export-v2/report.json');
const publicPath = path.join(root, 'eval/reports/2026-10-09-v8-vivo-original-long.json');
const digest = bytes => createHash('sha256').update(bytes).digest('hex');
const hashFile = async file => {
  const hash = createHash('sha256');
  for await (const chunk of createReadStream(file)) hash.update(chunk);
  return hash.digest('hex');
};
const [privateBytes, firstFailureBytes, failedExportBytes, passedExportBytes,
  sourceBytes, harnessBytes] = await Promise.all([
  fs.readFile(privatePath), fs.readFile(firstFailurePath),
  fs.readFile(failedExportPath), fs.readFile(passedExportPath),
  fs.readFile(sourcePath), fs.readFile(harnessPath),
]);
const privateSha = '84a737e1cc8c7b468ea66718f2507882929344f259d7824d9071953d24c1a5b5';
const firstFailureSha = '3a8ea031258fd13ffeb3e7ccb7105f016385117dc9133dd155529cf7c58be643';
assert.equal(digest(privateBytes), privateSha);
assert.equal(digest(firstFailureBytes), firstFailureSha);
const failedExportSha = '034922b0f4d048cd68f5e832395a353f7d2bee865c04e2851e924390d47d767f';
const passedExportSha = 'c218ebe91ee4c7930a5505f946a480baff12538ee300045b8f9abb8e95e21eec';
assert.equal(digest(failedExportBytes), failedExportSha);
assert.equal(digest(passedExportBytes), passedExportSha);
const firstFailure = JSON.parse(firstFailureBytes);
assert.equal(firstFailure.status, 'failed');
assert.deepEqual(firstFailure.arms, []);
assert(firstFailure.errors.some(error => error.includes('spawn EPERM')));
const failedExport = JSON.parse(failedExportBytes);
const passedExport = JSON.parse(passedExportBytes);
assert.equal(failedExport.status, 'failed');
assert(failedExport.error.includes('managed source lies outside the state directory'));
assert.equal(passedExport.status, 'passed');
assert.equal(passedExport.model_requests, 0);
assert.equal(passedExport.copied_source_relocated, true);
assert.equal(passedExport.output_sha256, passedExport.expected_output_sha256);
assert.equal(await hashFile(path.join(root,
  '.cache/eval/v8-vivo-original-long-v1/offline-export-v2/reexport.ru.srt')),
  passedExport.output_sha256);
const raw = JSON.parse(privateBytes);
assert.equal(raw.experiment, 'LONG-04-vivo-original-v8-batch4-paired-2026-10-09-v1');
assert.equal(raw.code_commit, '713b5d2d221e60f5ad33cb4d2a0d186300411b4c');
assert.equal(raw.status, 'completed_with_failure');
assert.equal(raw.git_status, '');
assert.deepEqual(raw.errors, []);
assert.equal(raw.harness_sha256, digest(harnessBytes));
assert.equal(raw.expected.source, digest(sourceBytes));
assert.equal(raw.expected.media, await hashFile(mediaPath));
assert.equal(raw.expected.runtime,
  await hashFile(path.join(assetRoot, '.cache/runtime/llama/llama-server.exe')));
// The historical CLI was replaced by the REG-065 build in the same target path.
assert.equal(raw.expected.cli,
  '5cb2a5a7187944f685bb16656a4dd65f29f166bdd5745f0693e59739998e8ed8');
assert.equal(raw.limits.cues, 467);
assert.equal(raw.limits.model_retries, 0);
assert(raw.wall_elapsed_ms <= raw.limits.max_wall_ms);
assert.equal(raw.arms.length, 2);
assert.deepEqual(raw.arms.map(arm => arm.id), ['1_8b', '7b']);
assert.equal(passedExport.source_run_report_sha256, privateSha);
assert.equal(passedExport.output_sha256, raw.arms[1].output_sha256);

const sourceBlocks = sourceBytes.toString('utf8').trimEnd().split(/\r?\n\r?\n/u);
assert.equal(sourceBlocks.length, 467);
const sourceLines = sourceBlocks.map((block, index) => {
  const [id, timing, ...lines] = block.split(/\r?\n/u);
  assert.equal(Number(id), index + 1);
  assert(lines.length > 0);
  return { id, timing, text: lines.join('\n') };
});
const armSpecs = [
  { id: '1_8b', modelFile: 'Hy-MT2-1.8B-Q4_K_M.gguf',
    manifestFile: 'hy_mt2_1_8b_q4_k_m.context_v8_target_first_batch4.experimental.json',
    status: 'failed', chats: 29, checkpoints: 28, firstFailedCue: 113 },
  { id: '7b', modelFile: 'Hy-MT2-7B-Q4_K_M.gguf',
    manifestFile: 'hy_mt2_7b_q4_k_m.context_v8_target_first_batch4.experimental.json',
    status: 'completed', chats: 117, checkpoints: 117, firstFailedCue: null },
];
const arms = [];
for (const [index, spec] of armSpecs.entries()) {
  const arm = raw.arms[index];
  assert.equal(arm.id, spec.id);
  assert.equal(arm.status, spec.status);
  assert.equal(arm.model_sha256,
    await hashFile(path.join(assetRoot, '.cache/models', spec.modelFile)));
  assert.equal(arm.manifest_sha256,
    await hashFile(path.join(root, 'models/manifests', spec.manifestFile)));
  assert.equal(arm.source_after_sha256, raw.expected.source);
  assert.equal(arm.chat_requests, spec.chats);
  assert.equal(arm.preflight_requests, spec.chats * 2);
  assert.equal(arm.checkpoints.length, spec.checkpoints);
  assert(arm.cli_elapsed_ms <= raw.limits.max_cli_ms_per_arm);
  assert.deepEqual(arm.checkpoints.map(row => row.block_index),
    Array.from({ length: spec.checkpoints }, (_, position) => position));
  for (const checkpoint of arm.checkpoints) {
    assert.equal(checkpoint.attempt_count, 1);
    assert(JSON.parse(checkpoint.accepted_json));
  }
  assert.equal(arm.requests.length, spec.chats * 3);
  const chats = [];
  for (let requestIndex = 0; requestIndex < spec.chats; requestIndex++) {
    const [template, tokenize, chat] = arm.requests.slice(requestIndex * 3,
      requestIndex * 3 + 3);
    assert.deepEqual([template.request_kind, tokenize.request_kind, chat.request_kind],
      ['apply_template', 'tokenize', 'chat_completion']);
    assert.equal(template.outcome, 'parsed_preflight_json');
    assert.equal(tokenize.outcome, 'parsed_preflight_json');
    const rendered = JSON.parse(template.raw_response).prompt;
    assert.equal(JSON.parse(tokenize.rendered_request).content, rendered);
    assert.equal(JSON.parse(tokenize.raw_response).tokens.length, chat.prompt_tokens);
    assert.equal(digest(Buffer.from(chat.rendered_request)), chat.request_sha256);
    const request = JSON.parse(chat.rendered_request);
    assert.equal(request.model, arm.alias);
    const parts = request.messages[0].content.split('Input JSON:\n');
    assert.equal(parts.length, 2);
    assert(!/\p{Script=Cyrillic}/u.test(parts[1]));
    const envelope = JSON.parse(parts[1]);
    assert.deepEqual(Object.keys(envelope), ['schema_version', 'target_slots', 'source_context']);
    const expectedIds = Array.from({ length: Math.min(4, 467 - requestIndex * 4) },
      (_, offset) => requestIndex * 4 + offset + 1);
    assert.deepEqual(envelope.target_slots.map(slot => slot.segment_id), expectedIds);
    for (const slot of [...envelope.target_slots, ...envelope.source_context]) {
      assert.equal(slot.source_original, sourceLines[slot.segment_id - 1].text);
    }
    const response = JSON.parse(chat.raw_response);
    assert.equal(response.usage.prompt_tokens, chat.prompt_tokens);
    assert.equal(response.usage.completion_tokens, chat.completion_tokens);
    assert.equal(response.choices[0].finish_reason, 'stop');
    if (requestIndex < spec.checkpoints) {
      assert.equal(chat.outcome, 'validated_batch');
      assert.equal(JSON.parse(chat.restored_candidate).length, expectedIds.length);
    }
    chats.push(chat);
  }
  const promptTokens = chats.reduce((sum, row) => sum + row.prompt_tokens, 0);
  const completionTokens = chats.reduce((sum, row) => sum + row.completion_tokens, 0);
  assert.equal(arm.total_tokens, promptTokens + completionTokens);
  assert(arm.total_tokens <= raw.limits.max_total_tokens);
  const lastChat = chats.at(-1);
  if (spec.status === 'failed') {
    assert.equal(arm.cli_exit_code, 1);
    assert.equal(arm.results.length, 0);
    assert.equal(arm.output_sha256, null);
    assert.equal(arm.output_text, null);
    assert.equal(lastChat.segment_id, spec.firstFailedCue);
    assert.equal(lastChat.outcome, 'invalid_candidate');
    assert.equal(lastChat.error_detail, 'v7 response contains invalid target text');
    const failedContent = JSON.parse(lastChat.raw_response).choices[0].message.content;
    const parsedFailure = JSON.parse(failedContent);
    assert.deepEqual(parsedFailure.translations.map(row => row.segment_id),
      [113, 114, 115, 116]);
    assert(parsedFailure.translations.every(row => row.text.endsWith('\n')));
  } else {
    assert.equal(arm.cli_exit_code, 0);
    assert.equal(arm.results.length, 1);
    assert.equal(arm.results[0].review_state, 'needs_review');
    assert.equal(arm.output_sha256, digest(Buffer.from(arm.output_text)));
    assert.equal(arm.results[0].output_sha256, arm.output_sha256);
    assert.equal(lastChat.outcome, 'validated_batch');
    const outputBlocks = arm.output_text.trimEnd().split(/\r?\n\r?\n/u);
    assert.equal(outputBlocks.length, 467);
    for (const [cueIndex, block] of outputBlocks.entries()) {
      const [id, timing, ...lines] = block.split(/\r?\n/u);
      assert.equal(id, sourceLines[cueIndex].id);
      assert.equal(timing, sourceLines[cueIndex].timing);
      assert(lines.length > 0 && lines.every(line => line.length > 0));
    }
  }
  const samples = arm.resources.samples;
  assert(samples.length > 0);
  const workingSets = samples.flatMap(sample => sample.processes
    .filter(item => sample.tracked_pids.includes(item.Id))
    .map(item => item.WorkingSet64));
  const gpuMiB = samples.map(sample => Number(sample.gpu_device.split(',')[1]));
  arms.push({ id: arm.id, status: arm.status,
    model_sha256: arm.model_sha256, manifest_sha256: arm.manifest_sha256,
    scene_map_sha256: arm.scene_map_sha256,
    chat_requests: arm.chat_requests, template_token_preflight_calls: arm.preflight_requests,
    checkpoint_batches: arm.checkpoints.length,
    covered_prefix_cues: Math.min(arm.checkpoints.length * 4, 467),
    first_failed_cue: spec.firstFailedCue,
    final_chat_outcome: lastChat.outcome,
    final_chat_request_sha256: lastChat.request_sha256,
    final_raw_response_sha256: digest(Buffer.from(lastChat.raw_response)),
    published_results: arm.results.length, output_sha256: arm.output_sha256,
    review_state: arm.results[0]?.review_state ?? null,
    prompt_tokens: promptTokens, completion_tokens: completionTokens,
    chat_http_ms: chats.reduce((sum, row) => sum + row.elapsed_ms, 0),
    cli_elapsed_ms: arm.cli_elapsed_ms,
    resource_observation: {
      samples: samples.length,
      max_tracked_working_set_bytes: workingSets.length ? Math.max(...workingSets) : null,
      max_whole_device_gpu_mib: gpuMiB.length ? Math.max(...gpuMiB) : null,
      limitation: arm.resources.limitations,
    } });
}
assert.equal(arms[0].scene_map_sha256, arms[1].scene_map_sha256);
assert(arms.reduce((sum, arm) => sum + arm.prompt_tokens + arm.completion_tokens, 0)
  <= raw.limits.max_total_tokens);
const report = { schema_version: 1, experiment: raw.experiment,
  task_ids: ['CTX-02', 'LONG-01', 'LONG-02', 'LONG-04', 'EVAL-04', 'DECIDE-01'],
  split: 'known_natural_development_not_holdout',
  source_url: 'https://www.youtube.com/watch?v=_G4e2p1p-is',
  source_sha256: raw.expected.source, media_sha256: raw.expected.media,
  source_cues: 467, runtime_sha256: raw.expected.runtime,
  release_cli_sha256: raw.expected.cli, harness_sha256: raw.harness_sha256,
  code_commit: raw.code_commit, private_report_sha256: privateSha,
  first_pre_spawn_failure_sha256: firstFailureSha,
  offline_export: { initial_failure_sha256: failedExportSha,
    passed_report_sha256: passedExportSha, output_sha256: passedExport.output_sha256,
    model_requests: 0, copied_source_relocated: true },
  status: raw.status, wall_elapsed_ms: raw.wall_elapsed_ms,
  human_bilingual_reviews: 0, accepted_language_quality: false,
  source_admission: 'inspected_candidate_zero_eligible', arms,
  release_gate: 'open' };
const output = `${JSON.stringify(report, null, 2)}\n`;
if (capture) await fs.writeFile(publicPath, output);
else assert.equal(await fs.readFile(publicPath, 'utf8'), output);
console.log(`Original Vivo v8 checked: 1.8B ${arms[0].covered_prefix_cues}/467, 7B ${arms[1].covered_prefix_cues}/467; ${capture ? 'captured' : 'verified'} redacted report.`);
