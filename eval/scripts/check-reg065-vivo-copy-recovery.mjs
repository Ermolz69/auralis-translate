import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { createReadStream } from 'node:fs';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const assetRoot = process.env.AURALIS_EVAL_ASSET_ROOT ?? root;
const capture = process.argv.length === 3 && process.argv[2] === '--capture';
assert(process.argv.length === 2 || capture);
const parent = path.join(root, '.cache/eval/v8-vivo-original-long-v1/attempt-MAaX5T');
const recovery = path.join(root, '.cache/eval/reg065-vivo-copy-recovery-v1/attempt-mVbgXB');
const sourcePath = path.join(root,
  '.cache/eval/youtube-geekerwan-vivo-original-caption/attempt-LQWxgw/source.zh.srt');
const privatePath = path.join(recovery, 'report.json');
const publicPath = path.join(root, 'eval/reports/2026-10-09-reg065-vivo-copy-recovery.json');
const digest = bytes => createHash('sha256').update(bytes).digest('hex');
const hashFile = async file => {
  const hash = createHash('sha256');
  for await (const chunk of createReadStream(file)) hash.update(chunk);
  return hash.digest('hex');
};
const [bytes, oldBytes, sourceBytes, harnessBytes] = await Promise.all([
  fs.readFile(privatePath), fs.readFile(path.join(parent, 'report.json')),
  fs.readFile(sourcePath), fs.readFile(path.join(root,
    'eval/scripts/probe-reg065-vivo-copy-recovery.mjs')),
]);
const privateSha = 'b2cee86b74b0e60a9316c3ef27d0a599113972a6862fbae9d7560583952cf54b';
assert.equal(digest(bytes), privateSha);
const raw = JSON.parse(bytes);
const old = JSON.parse(oldBytes);
assert.equal(raw.experiment, 'REG-065-vivo-v8-1.8b-copy-recovery-2026-10-09-v1');
assert.equal(raw.code_commit, '4002aec0b27f4b3e72b27659741e3108b28c4414');
assert.equal(raw.git_status, '');
assert.equal(raw.harness_sha256, digest(harnessBytes));
assert.equal(raw.expected.original_report, digest(oldBytes));
assert.equal(raw.expected.original_db, raw.original_db_after_sha256);
assert.equal(raw.expected.original_report, raw.original_report_after_sha256);
assert.equal(raw.expected.source, digest(sourceBytes));
assert.equal(raw.expected.runtime, await hashFile(path.join(assetRoot,
  '.cache/runtime/llama/llama-server.exe')));
assert.equal(raw.expected.model, await hashFile(path.join(assetRoot,
  '.cache/models/Hy-MT2-1.8B-Q4_K_M.gguf')));
assert.equal(raw.expected.manifest, await hashFile(path.join(root,
  'models/manifests/hy_mt2_1_8b_q4_k_m.context_v8_target_first_batch4.experimental.json')));
assert.equal(raw.expected.cli, await hashFile(path.join(root,
  'target/release/auralis-translation-cli.exe')));
assert.equal(raw.initial.checkpoints, 28);
assert.equal(raw.initial.chats, 29);
assert.equal(raw.initial.preflights, 58);
assert.equal(raw.initial.results, 0);
assert.equal(raw.limits.retries, 0);
assert.equal(raw.limits.repetitions, 1);
assert(raw.wall_elapsed_ms <= raw.limits.max_wall_ms);
assert(raw.new_chats <= raw.limits.max_new_chats);
assert(raw.new_preflights <= raw.limits.max_new_preflights);
assert(raw.new_tokens <= raw.limits.max_new_tokens);
assert.deepEqual(raw.checkpoints.slice(0, 28), old.arms[0].checkpoints);
assert.deepEqual(raw.checkpoints.map(row => row.block_index),
  Array.from({ length: raw.checkpoints.length }, (_, index) => index));
assert.equal(raw.total_chats, raw.initial.chats + raw.new_chats);
assert.equal(raw.total_preflights, raw.initial.preflights + raw.new_preflights);
assert.equal(raw.total_preflights, raw.total_chats * 2);
assert.equal(raw.requests.length, raw.total_chats * 3);
const sourceBlocks = sourceBytes.toString('utf8').trimEnd().split(/\r?\n\r?\n/u);
assert.equal(sourceBlocks.length, 467);
const sourceLines = sourceBlocks.map((block, index) => {
  const [id, timing, ...lines] = block.split(/\r?\n/u);
  assert.equal(Number(id), index + 1);
  return { id, timing, text: lines.join('\n') };
});
let newPromptTokens = 0;
let newCompletionTokens = 0;
for (let index = 0; index < raw.total_chats; index++) {
  const [template, tokenize, chat] = raw.requests.slice(index * 3, index * 3 + 3);
  assert.deepEqual([template.request_kind, tokenize.request_kind, chat.request_kind],
    ['apply_template', 'tokenize', 'chat_completion']);
  assert.equal(template.outcome, 'parsed_preflight_json');
  assert.equal(tokenize.outcome, 'parsed_preflight_json');
  assert.equal(JSON.parse(tokenize.rendered_request).content,
    JSON.parse(template.raw_response).prompt);
  assert.equal(JSON.parse(tokenize.raw_response).tokens.length, chat.prompt_tokens);
  assert.equal(digest(Buffer.from(chat.rendered_request)), chat.request_sha256);
  const request = JSON.parse(chat.rendered_request);
  const parts = request.messages[0].content.split('Input JSON:\n');
  assert.equal(parts.length, 2);
  assert(!/\p{Script=Cyrillic}/u.test(parts[1]));
  const envelope = JSON.parse(parts[1]);
  const start = chat.segment_id;
  assert.deepEqual(envelope.target_slots.map(slot => slot.segment_id),
    Array.from({ length: Math.min(4, 468 - start) }, (_, offset) => start + offset));
  for (const slot of [...envelope.target_slots, ...envelope.source_context]) {
    assert.equal(slot.source_original, sourceLines[slot.segment_id - 1].text);
  }
  if (index === 28) {
    assert.equal(chat.outcome, 'invalid_candidate');
    assert.equal(chat.segment_id, 113);
  } else if (index < 28 || index >= 29) {
    assert.equal(chat.outcome, 'validated_batch');
  }
  if (index >= 29) {
    newPromptTokens += chat.prompt_tokens;
    newCompletionTokens += chat.completion_tokens;
  }
}
assert.equal(newPromptTokens + newCompletionTokens, raw.new_tokens);
const complete = raw.status === 'completed';
if (complete) {
  assert.equal(raw.cli_exit_code, 0);
  assert.equal(raw.checkpoints.length, 117);
  assert.equal(raw.results.length, 1);
  assert.equal(raw.results[0].review_state, 'needs_review');
  assert.equal(raw.results[0].output_sha256, raw.output_sha256);
  assert.equal(raw.new_chats, 89);
  assert.equal(raw.new_preflights, 178);
  const output = await fs.readFile(path.join(recovery, 'candidate.ru.srt'), 'utf8');
  assert.equal(digest(Buffer.from(output)), raw.output_sha256);
  const outputBlocks = output.trimEnd().split(/\r?\n\r?\n/u);
  assert.equal(outputBlocks.length, 467);
  for (const [index, block] of outputBlocks.entries()) {
    const [id, timing, ...lines] = block.split(/\r?\n/u);
    assert.equal(id, sourceLines[index].id);
    assert.equal(timing, sourceLines[index].timing);
    assert(lines.length > 0 && lines.every(line => line.length > 0));
  }
} else {
  assert.equal(raw.results.length, 0);
  assert.equal(raw.output_sha256, null);
}
const samples = raw.resources?.samples ?? [];
const workingSets = samples.flatMap(sample => sample.processes
  .filter(item => sample.tracked_pids.includes(item.Id))
  .map(item => item.WorkingSet64));
const gpuMiB = samples.map(sample => Number(sample.gpu_device.split(',')[1]));
const report = { schema_version: 1, experiment: raw.experiment,
  task_ids: ['LONG-02', 'LONG-04', 'EVAL-04'],
  split: 'known_natural_development_not_holdout',
  source_url: 'https://www.youtube.com/watch?v=_G4e2p1p-is',
  source_sha256: raw.expected.source, source_cues: 467,
  original_report_sha256: raw.expected.original_report,
  original_db_sha256: raw.expected.original_db,
  private_report_sha256: privateSha, code_commit: raw.code_commit,
  model_sha256: raw.expected.model, runtime_sha256: raw.expected.runtime,
  cli_sha256: raw.expected.cli, harness_sha256: raw.harness_sha256,
  status: raw.status, old_checkpoints: 28,
  total_checkpoints: raw.checkpoints.length,
  new_chat_requests: raw.new_chats, new_preflight_requests: raw.new_preflights,
  new_prompt_tokens: newPromptTokens, new_completion_tokens: newCompletionTokens,
  cli_elapsed_ms: raw.cli_elapsed_ms, wall_elapsed_ms: raw.wall_elapsed_ms,
  output_sha256: raw.output_sha256,
  review_state: raw.results[0]?.review_state ?? null,
  human_bilingual_reviews: 0, accepted_language_quality: false,
  source_admission: 'inspected_candidate_zero_eligible',
  resource_observation: {
    samples: samples.length,
    max_tracked_working_set_bytes: workingSets.length ? Math.max(...workingSets) : null,
    max_whole_device_gpu_mib: gpuMiB.length ? Math.max(...gpuMiB) : null,
    limitation: raw.resources?.limitations ?? [],
  }, release_gate: 'open' };
const publicBytes = `${JSON.stringify(report, null, 2)}\n`;
if (capture) await fs.writeFile(publicPath, publicBytes);
else assert.equal(await fs.readFile(publicPath, 'utf8'), publicBytes);
console.log(`REG-065 Vivo recovery checked: ${raw.checkpoints.length}/117 batches, ${complete ? 'one needs_review SRT' : 'no full result'}.`);
