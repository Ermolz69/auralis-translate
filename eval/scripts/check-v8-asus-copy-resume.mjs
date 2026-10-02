import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const write = process.argv.length === 3 && process.argv[2] === '--write';
assert(process.argv.length === 2 || write);
const privateParent = path.join(root, '.cache/eval/v8-asus-copy-resume-v1');
const digest = bytes => createHash('sha256').update(bytes).digest('hex');
const attempts = (await fs.readdir(privateParent)).filter(name => name.startsWith('attempt-'));
assert.equal(attempts.length, 2, 'One zero-model infrastructure failure and one model attempt');
const failedPath = path.join(privateParent, 'attempt-SRzHv4/report.json');
const failedBytes = await fs.readFile(failedPath);
assert.equal(digest(failedBytes),
  '42c6d87324b8b6d73fecb82f99989ced186745ab46cbf4bef138f30c72737c27');
const failed = JSON.parse(failedBytes);
assert.equal(failed.status, 'failed');
assert.deepEqual(failed.arms, []);
assert.deepEqual(failed.errors, ['Error: spawn EPERM']);
const modelAttempt = attempts.find(name => name !== 'attempt-SRzHv4');
const privatePath = path.join(privateParent, modelAttempt, 'report.json');
const privateBytes = await fs.readFile(privatePath);
const privateReport = JSON.parse(privateBytes);
assert.equal(privateReport.experiment, 'v8-asus-copy-resume-v1');
assert(['completed', 'completed_with_failure'].includes(privateReport.status));
assert.equal(privateReport.arms.length, 2);
assert.equal(privateReport.limits.resume_commands_per_arm, 1);
assert.equal(privateReport.limits.model_retries, 0);
const initial = JSON.parse(await fs.readFile(path.join(root,
  'eval/reports/2026-10-02-v8-asus-natural-long.json')));
assert.equal(privateReport.original_report_sha256, digest(await fs.readFile(path.join(root,
  'eval/reports/2026-10-02-v8-asus-natural-long.json'))));
assert.equal(privateReport.source_sha256, initial.source_sha256);
assert.equal(privateReport.runtime_sha256, initial.runtime_sha256);
assert.equal(privateReport.harness_sha256, digest(await fs.readFile(path.join(root,
  'eval/scripts/probe-v8-asus-copy-resume.mjs'))));
const sourceBytes = await fs.readFile(path.join(root,
  '.cache/eval/commons-asus-rog-ally-892592485/source.zh.srt'));
assert.equal(digest(sourceBytes), initial.source_sha256);
const cueHeaders = bytes => bytes.toString('utf8').replaceAll('\r\n', '\n')
  .trimEnd().split('\n\n').map(block => block.split('\n').slice(0, 2));
const sourceHeaders = cueHeaders(sourceBytes);
assert.equal(sourceHeaders.length, 268);
const checkedArms = [];
for (const [index, arm] of privateReport.arms.entries()) {
  const before = initial.arms[index];
  assert.equal(arm.id, before.id);
  assert.equal(arm.previous_checkpoints, before.validated_checkpoints);
  assert.equal(arm.previous_chats, before.chat_requests);
  assert.equal(arm.previous_preflights, before.template_token_preflight_calls);
  assert.equal(arm.model_sha256, before.model_sha256);
  assert.equal(arm.manifest_sha256, before.manifest_sha256);
  assert.equal(arm.copied_source_sha256, initial.source_sha256);
  assert.equal(arm.copied_source_after_sha256, initial.source_sha256);
  assert.equal(arm.original_db_sha256_after, arm.original_db_sha256_before);
  assert(arm.new_chat_requests >= 1 && arm.new_chat_requests <= 268);
  assert.equal(arm.new_preflight_requests, arm.new_chat_requests * 2);
  assert(arm.checkpoints >= arm.previous_checkpoints && arm.checkpoints <= 67);
  const directory = path.join(privateParent, modelAttempt, arm.id);
  const originalDb = path.join(root, '.cache/eval/v8-asus-natural-long-v1/attempt-UhjJZn',
    arm.id, 'state/auralis-translate.sqlite');
  assert.equal(digest(await fs.readFile(originalDb)), arm.original_db_sha256_before);
  const copiedDb = path.join(directory, 'state/auralis-translate.sqlite');
  const db = new DatabaseSync(copiedDb, { readOnly: true });
  try {
    const checkpoints = db.prepare('SELECT block_index FROM block_checkpoints ORDER BY block_index').all();
    assert.equal(checkpoints.length, arm.checkpoints);
    assert.deepEqual(checkpoints.map(row => row.block_index),
      Array.from({ length: arm.checkpoints }, (_, value) => value));
    assert.equal(db.prepare('SELECT COUNT(*) AS n FROM results').get().n, arm.result_count);
    const rows = db.prepare('SELECT sequence, request_kind, outcome, raw_response, request_sha256, prompt_tokens, completion_tokens, elapsed_ms FROM inference_requests ORDER BY sequence').all();
    const chats = rows.filter(row => row.request_kind === 'chat_completion');
    assert.equal(chats.length, arm.chat_requests);
    assert.equal(chats.length - before.chat_requests, arm.new_chat_requests);
    const originalLast = chats[before.chat_requests - 1];
    assert.equal(originalLast.request_sha256, before.final_chat_request_sha256);
    assert.equal(digest(Buffer.from(originalLast.raw_response)), before.final_raw_response_sha256);
    const resumed = chats.slice(before.chat_requests);
    assert.equal(resumed.length, arm.new_chat_requests);
    assert.equal(resumed.reduce((sum, row) => sum + (row.prompt_tokens ?? 0), 0),
      arm.new_prompt_tokens);
    assert.equal(resumed.reduce((sum, row) => sum + (row.completion_tokens ?? 0), 0),
      arm.new_completion_tokens);
    assert.equal(resumed.reduce((sum, row) => sum + (row.elapsed_ms ?? 0), 0),
      arm.new_chat_http_ms);
    const last = resumed.at(-1);
    assert.equal(arm.last_chat.sequence, last.sequence);
    assert.equal(arm.last_chat.outcome, last.outcome);
    assert.equal(arm.last_chat.request_sha256, last.request_sha256);
    assert.equal(arm.last_chat.raw_response_sha256, last.raw_response === null ? null :
      digest(Buffer.from(last.raw_response)));
  } finally { db.close(); }
  if (arm.status === 'completed') {
    assert.equal(arm.checkpoints, 67);
    assert.equal(arm.result_count, 1);
    const outputBytes = await fs.readFile(path.join(directory, 'candidate.ru.srt'));
    assert.equal(digest(outputBytes), arm.output_sha256);
    assert.deepEqual(cueHeaders(outputBytes), sourceHeaders);
    for (const id of [1, 2, 133, 134, 267, 268])
      assert.equal(cueHeaders(outputBytes)[id - 1][0], String(id));
  } else {
    assert.equal(arm.status, 'failed');
    assert.equal(arm.result_count, 0);
    assert.equal(arm.output_sha256, null);
    await assert.rejects(fs.stat(path.join(directory, 'candidate.ru.srt')));
  }
  checkedArms.push({ id: arm.id, status: arm.status,
    model_sha256: arm.model_sha256, manifest_sha256: arm.manifest_sha256,
    initial_checkpoints: arm.previous_checkpoints, total_checkpoints: arm.checkpoints,
    initial_cues: before.covered_prefix_cues, total_cues: arm.checkpoints * 4,
    new_chat_requests: arm.new_chat_requests,
    new_preflight_requests: arm.new_preflight_requests,
    new_prompt_tokens: arm.new_prompt_tokens,
    new_completion_tokens: arm.new_completion_tokens,
    new_chat_http_ms: arm.new_chat_http_ms,
    cli_elapsed_ms: arm.cli_elapsed_ms,
    result_count: arm.result_count, output_sha256: arm.output_sha256,
    last_chat: arm.last_chat,
    resource_observation: arm.resources });
}
const publicReport = { schema_version: 1, experiment: privateReport.experiment,
  split: 'known_natural_development_not_holdout',
  initial_report_sha256: privateReport.original_report_sha256,
  code_commit: privateReport.code_commit,
  source_sha256: privateReport.source_sha256,
  media_sha256: privateReport.media_sha256,
  runtime_sha256: privateReport.runtime_sha256,
  cli_sha256: privateReport.cli_sha256,
  harness_sha256: privateReport.harness_sha256,
  private_report: path.relative(root, privatePath).replaceAll('\\', '/'),
  private_report_sha256: digest(privateBytes),
  zero_model_infrastructure_failure_report_sha256: digest(failedBytes),
  status: privateReport.status, source_cues: 268,
  wall_elapsed_ms: privateReport.wall_elapsed_ms,
  human_bilingual_review_count: 0, accepted_language_quality: false,
  arms: checkedArms, release_gate: 'open' };
const publicPath = path.join(root, 'eval/reports/2026-10-02-v8-asus-copy-resume.json');
if (write) await fs.writeFile(publicPath, `${JSON.stringify(publicReport, null, 2)}\n`);
else assert.deepEqual(JSON.parse(await fs.readFile(publicPath)), publicReport);
console.log(`Copy-only recovery checked: ${checkedArms.map(arm =>
  `${arm.id} ${arm.total_checkpoints}/67 ${arm.status}`).join(', ')}.`);
