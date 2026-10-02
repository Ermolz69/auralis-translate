import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const write = process.argv.length === 3 && process.argv[2] === '--write';
assert(process.argv.length === 2 || write);
const digest = bytes => createHash('sha256').update(bytes).digest('hex');
const privatePath = path.join(root,
  '.cache/eval/reg-058-paired-controls-v2/attempt-3FxuHu/report.json');
const privateBytes = await fs.readFile(privatePath);
const privateSha = 'a855c4d3d00aae4281ed5fa5d3b1f6b61b8e8ab600dda25f9eee9f100f6c126b';
assert.equal(digest(privateBytes), privateSha);
const raw = JSON.parse(privateBytes);
assert.equal(raw.experiment, 'reg-058-paired-controls-v2');
assert.equal(raw.status, 'complete_outer_json_unreviewed');
assert.equal(raw.arms.length, 2);
assert.equal(raw.harness_sha256,
  digest(await fs.readFile(path.join(root, 'eval/scripts/probe-reg-058-paired-controls-v2.mjs'))));
const packBytes = await fs.readFile(path.join(root,
  'eval/regressions/v8-natural-7b-semantic-risk-v1.json'));
assert.equal(digest(packBytes), raw.expected.pack);
const pack = JSON.parse(packBytes);
const priorBytes = await fs.readFile(path.join(root,
  '.cache/eval/v8-asus-single-target-v1/attempt-dVT3zA/report.json'));
assert.equal(digest(priorBytes), raw.expected.prior);
const prior = JSON.parse(priorBytes);
const controls = new Map([...pack.related_controls, ...pack.negative_controls]
  .map(row => [row.id, row]));
assert.equal(controls.size, 12);
const expectedOrder = pack.minimal_reproducers.flatMap((row, index) => {
  const positive = pack.related_controls.find(item => item.for === row.id);
  const negative = pack.negative_controls.find(item => item.for === row.id);
  assert(positive && negative);
  return index % 2 === 0 ? [positive.id, negative.id] : [negative.id, positive.id];
});

const arms = [];
for (const arm of raw.arms) {
  assert(['1_8b', '7b'].includes(arm.id));
  assert.equal(arm.status, 'complete_outer_json_unreviewed');
  assert.equal(arm.requests.length, 12);
  const entries = (await fs.readFile(path.join(path.dirname(privatePath),
    arm.id, 'requests.jsonl'), 'utf8')).trim().split('\n').map(JSON.parse);
  assert.equal(entries.length, 12);
  assert.deepEqual(entries.map(entry => entry.control_id), expectedOrder);
  let promptTokens = 0;
  let completionTokens = 0;
  let preflights = 0;
  const controlsOut = [];
  for (const [index, entry] of entries.entries()) {
    const row = arm.requests[index];
    const control = controls.get(entry.control_id);
    assert(control);
    assert.equal(row.control_id, entry.control_id);
    assert.equal(row.cue_id, entry.cue_id);
    assert.equal(row.request_sha256, digest(Buffer.from(JSON.stringify(entry.request))));
    assert.equal(entry.request_sha256, row.request_sha256);
    assert.equal(row.raw_response_sha256, entry.chat.raw_response_sha256);
    assert.equal(digest(Buffer.from(entry.chat.raw_response)), entry.chat.raw_response_sha256);
    assert.equal(entry.chat.http_status, 200);
    assert.equal(entry.preflight.length, 2);
    preflights += 2;
    assert(entry.usage && Number.isInteger(entry.usage.prompt_tokens));
    assert(Number.isInteger(entry.usage.completion_tokens));
    promptTokens += entry.usage.prompt_tokens;
    completionTokens += entry.usage.completion_tokens;

    const prompt = entry.request.messages[0].content.split('Input JSON:\n');
    assert.equal(prompt.length, 2);
    const envelope = JSON.parse(prompt[1]);
    assert.equal(envelope.target_slots.length, 1);
    const target = envelope.target_slots[0];
    assert.equal(target.segment_id, entry.cue_id);
    assert.equal(target.source_original, control.source);
    assert.equal(target.source_for_translation, control.source);
    assert.deepEqual(target.approved_terms, []);
    assert.deepEqual(target.protected_facts, []);
    assert(!entry.request.messages[0].content.includes(control.expected_meaning));
    const original = prior.arms[1].requests.find(item =>
      item.request_kind === 'chat_completion' && item.segment_id === entry.cue_id);
    assert(original);
    assert.equal(entry.original_request_sha256, original.request_sha256);
    const originalRequest = JSON.parse(original.rendered_request);
    const originalEnvelope = JSON.parse(originalRequest.messages[0].content
      .split('Input JSON:\n')[1]);
    originalEnvelope.target_slots[0].source_original = control.source;
    originalEnvelope.target_slots[0].source_for_translation = control.source;
    originalRequest.model = entry.request.model;
    originalRequest.messages[0].content =
      `${prompt[0]}Input JSON:\n${JSON.stringify(originalEnvelope)}`;
    assert.deepEqual(entry.request, originalRequest);

    const template = entry.preflight[0];
    assert.equal(template.http_status, 200);
    assert.equal(digest(Buffer.from(template.raw_response)), template.raw_response_sha256);
    const templateRequest = { model: entry.request.model,
      messages: entry.request.messages, response_format: entry.request.response_format };
    assert.equal(template.request_sha256, digest(Buffer.from(JSON.stringify(templateRequest))));
    const rendered = JSON.parse(template.raw_response).prompt;
    const tokenized = entry.preflight[1];
    assert.equal(tokenized.http_status, 200);
    assert.equal(digest(Buffer.from(tokenized.raw_response)), tokenized.raw_response_sha256);
    assert.equal(tokenized.request_sha256, digest(Buffer.from(JSON.stringify({
      content: rendered, add_special: false, parse_special: true }))));
    const tokens = JSON.parse(tokenized.raw_response).tokens;
    assert(Array.isArray(tokens) && tokens.every(Number.isInteger));
    assert.equal(tokens.length, entry.prompt_tokens_preflight);
    assert.equal(tokens.length, entry.usage.prompt_tokens);
    assert(tokens.length + raw.limits.response_tokens + raw.limits.safety_tokens
      <= raw.limits.context_tokens);

    const response = JSON.parse(entry.chat.raw_response);
    assert.equal(response.choices[0].finish_reason, row.finish_reason);
    assert.equal(response.usage.prompt_tokens, entry.usage.prompt_tokens);
    assert.equal(response.usage.completion_tokens, entry.usage.completion_tokens);
    const translation = JSON.parse(response.choices[0].message.content).translations;
    assert.equal(translation.length, 1);
    assert.equal(translation[0].segment_id, entry.cue_id);
    assert.equal(translation[0].line_index, 0);
    assert.equal(translation[0].text, entry.candidate);
    assert.equal(entry.candidate, row.candidate);
    const leakedJson = /[{}\[\]]/.test(entry.candidate) || /"\s*}\s*\]/.test(entry.candidate);
    controlsOut.push({ id: entry.control_id, polarity: entry.polarity,
      cue_id: entry.cue_id, expected_meaning: control.expected_meaning,
      candidate: entry.candidate, leaked_json_syntax: leakedJson,
      request_sha256: row.request_sha256,
      raw_response_sha256: row.raw_response_sha256,
      prompt_tokens: entry.usage.prompt_tokens,
      completion_tokens: entry.usage.completion_tokens,
      chat_elapsed_ms: entry.chat.elapsed_ms,
      finish_reason: row.finish_reason });
  }
  assert.equal(preflights, 24);
  arms.push({ id: arm.id, model_sha256: arm.model_sha256,
    manifest_sha256: arm.manifest_sha256, chats: entries.length, preflights,
    prompt_tokens: promptTokens, completion_tokens: completionTokens,
    sampled_max_process_working_set_bytes: Math.max(...arm.resources.samples
      .flatMap(sample => sample.processes.map(process => process.WorkingSet64))),
    sampled_max_device_gpu_mib: Math.max(...arm.resources.samples.map(sample =>
      Number(sample.gpu_device.split(', ')[1]))),
    controls: controlsOut });
}
assert.deepEqual(arms.map(arm => arm.id), ['1_8b', '7b']);
const report = { schema_version: 1, experiment: raw.experiment,
  status: 'paired_real_model_controls_validated_unreviewed_meaning',
  split: 'authored_development_not_holdout',
  private_report: path.relative(root, privatePath).replaceAll('\\', '/'),
  private_report_sha256: privateSha,
  harness_sha256: raw.harness_sha256,
  pack_sha256: raw.expected.pack,
  prior_natural_report_sha256: raw.expected.prior,
  runtime_sha256: raw.expected.runtime,
  code_commit: raw.code_commit,
  wall_elapsed_ms: raw.wall_elapsed_ms,
  paired_case_comparison_valid: true,
  population_quality_comparison_valid: false,
  meaning_assessment: 'pending_separate_AI_review',
  human_bilingual_review_count: 0,
  arms, release_gate: 'open' };
const publicPath = path.join(root,
  'eval/reports/2026-10-02-reg-058-paired-controls-v2.json');
const output = `${JSON.stringify(report, null, 2)}\n`;
if (write) await fs.writeFile(publicPath, output);
else assert.equal(await fs.readFile(publicPath, 'utf8'), output);
console.log('REG-058 v2: 24 exact authored targets and preflights verified; meaning remains separately reviewed.');
