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
  '.cache/eval/reg-058-paired-controls-v1/attempt-QdwzSQ/report.json');
const privateBytes = await fs.readFile(privatePath);
const privateSha = 'd9a9229940e9474ab6cc75a25819300ac5bd7a76bde4fcbe8114196faf4eade2';
assert.equal(digest(privateBytes), privateSha);
const raw = JSON.parse(privateBytes);
assert.equal(raw.experiment, 'reg-058-paired-controls-v1');
assert.equal(raw.status, 'complete_outer_json_unreviewed');
assert.equal(raw.arms.length, 2);
assert.equal(raw.expected.pack,
  digest(await fs.readFile(path.join(root, 'eval/regressions/v8-natural-7b-semantic-risk-v1.json'))));
assert.equal(raw.harness_sha256,
  digest(await fs.readFile(path.join(root, 'eval/scripts/probe-reg-058-paired-controls.mjs'))));
const pack = JSON.parse(await fs.readFile(path.join(root,
  'eval/regressions/v8-natural-7b-semantic-risk-v1.json')));
const original = JSON.parse(await fs.readFile(path.join(root,
  '.cache/eval/v8-asus-single-target-v1/attempt-dVT3zA/report.json')));
const controls = new Map([...pack.related_controls, ...pack.negative_controls]
  .map(row => [row.id, row]));
const arms = [];
for (const arm of raw.arms) {
  assert.equal(arm.requests.length, 12);
  const entries = (await fs.readFile(path.join(path.dirname(privatePath),
    arm.id, 'requests.jsonl'), 'utf8')).trim().split('\n').map(JSON.parse);
  assert.equal(entries.length, 12);
  let mismatchCount = 0;
  let promptTokens = 0;
  let completionTokens = 0;
  let preflights = 0;
  for (const [index, entry] of entries.entries()) {
    const row = arm.requests[index];
    const control = controls.get(entry.control_id);
    assert(control);
    assert.equal(row.request_sha256, digest(Buffer.from(JSON.stringify(entry.request))));
    assert.equal(row.raw_response_sha256, entry.chat.raw_response_sha256);
    assert.equal(digest(Buffer.from(entry.chat.raw_response)), entry.chat.raw_response_sha256);
    assert.equal(entry.preflight.length, 2);
    preflights += entry.preflight.length;
    promptTokens += entry.usage.prompt_tokens;
    completionTokens += entry.usage.completion_tokens;
    const prompt = entry.request.messages[0].content.split('Input JSON:\n');
    assert.equal(prompt.length, 2);
    const target = JSON.parse(prompt[1]).target_slots[0];
    const originalEntry = original.arms[1].requests.find(item =>
      item.request_kind === 'chat_completion' && item.segment_id === entry.cue_id);
    assert(originalEntry);
    const originalTarget = JSON.parse(JSON.parse(originalEntry.rendered_request)
      .messages[0].content.split('Input JSON:\n')[1]).target_slots[0];
    assert.equal(target.source_original, control.source);
    assert.equal(target.source_for_translation, originalTarget.source_for_translation);
    assert.notEqual(target.source_for_translation, control.source);
    mismatchCount++;
  }
  assert.equal(mismatchCount, 12);
  assert.equal(preflights, 24);
  arms.push({ id: arm.id, chats: entries.length, preflights,
    target_field_mismatches: mismatchCount,
    prompt_tokens: promptTokens, completion_tokens: completionTokens,
    structural_invalid_responses: arm.requests.filter(row =>
      row.structural_outcome !== 'outer_json_valid_unreviewed').length,
    chat_request_sha256: entries.map(row => row.request_sha256),
    raw_response_sha256: entries.map(row => row.chat.raw_response_sha256) });
}
const report = { schema_version: 1, experiment: raw.experiment,
  status: 'invalid_harness_target_fields_disagree',
  split: 'authored_development_not_holdout',
  private_report: path.relative(root, privatePath).replaceAll('\\', '/'),
  private_report_sha256: privateSha,
  harness_sha256: raw.harness_sha256,
  pack_sha256: raw.expected.pack,
  prior_natural_report_sha256: raw.expected.prior,
  runtime_sha256: raw.expected.runtime,
  code_commit: raw.code_commit,
  wall_elapsed_ms: raw.wall_elapsed_ms,
  model_quality_comparison_valid: false,
  human_bilingual_review_count: 0,
  arms, release_gate: 'open' };
const publicPath = path.join(root,
  'eval/reports/2026-10-02-reg-058-paired-controls-invalid.json');
const output = `${JSON.stringify(report, null, 2)}\n`;
if (write) await fs.writeFile(publicPath, output);
else assert.equal(await fs.readFile(publicPath, 'utf8'), output);
console.log('REG-058 v1 control screen invalid: all 24 prompts kept the old source_for_translation; raw attempts retained.');
