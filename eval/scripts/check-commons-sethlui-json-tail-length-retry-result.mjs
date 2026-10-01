import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { readRunSnapshot } from './cli-run-state.mjs';

const root = path.resolve('.');
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const source = fs.readFileSync(path.join(root, '.cache/eval/commons-sethlui-derived-v1/source.zh.srt'));
const sourceHash = '4777e11caa115e893f2328c2a33c25a76c7391ace8ecf0ac4b9436635fc27964';
assert.equal(sha(source), sourceHash);
const sourceBlocks = source.toString('utf8').trimEnd().split(/\r?\n\r?\n+/u);
assert.equal(sourceBlocks.length, 263);
const oldReport = fs.readFileSync(path.join(root,
  '.cache/eval/commons-sethlui-json-tail-retry-7b-v1/run-VmeFjB/report.json'));
assert.equal(sha(oldReport), '2f98318d0480bf9af354250175d74a85b51604a4c97f36bdeb25587fcba580b7');

const parent = path.join(root, '.cache/eval/commons-sethlui-json-tail-length-retry-7b-v2');
const workspace = fs.readFileSync(path.join(parent, 'latest.txt'), 'utf8').trim();
assert.equal(path.dirname(workspace), parent);
assert(/^run-[A-Za-z0-9]+$/u.test(path.basename(workspace)));
const reportBytes = fs.readFileSync(path.join(workspace, 'report.json'));
const report = JSON.parse(reportBytes);
const summary = JSON.parse(fs.readFileSync(path.join(root,
  'eval/reports/2026-10-01-sethlui-json-tail-length-retry-summary.json')));
assert.equal(sha(reportBytes), summary.private_report_sha256);
assert.equal(report.experiment, 'commons-sethlui-json-tail-length-retry-7b-v2');
assert.equal(report.source_sha256, sourceHash);
assert.equal(report.source_cues, 263);
assert.equal(report.profile_sha256,
  '268c4d00eee8994936d7019d4cad47a5193a01e459ad9ed4214ea30facd102f9');
assert.equal(report.model_sha256_verified_by_doctor,
  '9f96256500f3fc1ab4d64336b58f52a949a95ad7516b0c229476eef782f9f77b');
assert.equal(report.runtime_sha256,
  '6f15be27bd80b6b4d52afefa49094e18fcfab55d5da354d717971f2d2537b2f4');
assert.equal(report.status, summary.status);
assert.equal(report.cli_sha256, summary.cli_sha256);
assert.equal(report.build_receipt_sha256, summary.build_receipt_sha256);
assert.equal(report.source_commit, summary.source_commit);
assert.deepEqual(report.limits, { chat_requests: 526, all_http_requests: 1600,
  model_wall_ms: 1_200_000, readiness_ms: 180_000, doctor_ms: 600_000,
  upstream_ms: 130_000, repetitions: 1 });
assert(report.run_id);
assert(report.translation_elapsed_ms > 0);

const requests = report.requests;
const chats = requests.filter(row => row.path === '/v1/chat/completions');
assert.equal(chats.length, summary.chat_requests);
assert(chats.length <= report.limits.chat_requests);
assert(requests.length <= report.limits.all_http_requests);
assert.deepEqual(requests.slice(0, 3).map(row => row.path), ['/health', '/props', '/v1/models']);
assert.equal(requests.length, 3 + chats.length * 3);
const seen = new Map();
let promptTokens = 0;
let completionTokens = 0;
for (let index = 0; index < chats.length; index++) {
  const [template, tokenizer, chat] = requests.slice(3 + index * 3, 6 + index * 3);
  assert.deepEqual([template.path, tokenizer.path, chat.path],
    ['/apply-template', '/tokenize', '/v1/chat/completions']);
  for (const row of [template, tokenizer, chat]) assert.equal(row.http_status, 200);
  assert.equal(template.rendered_prompt_sha256, tokenizer.rendered_prompt_sha256);
  assert.equal(tokenizer.token_count, chat.usage.prompt_tokens);
  assert.equal(chat.request_sha256, sha(Buffer.from(JSON.stringify(chat.request))));
  assert.equal(chat.raw_candidate, JSON.parse(chat.raw_response).choices[0].message.content);
  const envelope = JSON.parse(chat.request.messages[0].content.split('Input JSON:\n')[1]);
  const target = envelope.target_slots[0].segment_id;
  assert(target >= 1 && target <= 263);
  assert.equal(envelope.target_slots.length, 1);
  assert.equal(envelope.target_slots[0].source_original,
    sourceBlocks[target - 1].split(/\r?\n/u)[2]);
  assert.deepEqual(envelope.approved_terms, []);
  assert.equal(chat.request.response_format.schema.properties.translations.items
    .properties.segment_id.const, target);
  const prior = seen.get(target) ?? 0;
  assert(prior < 2, `More than two chats for cue ${target}`);
  assert.equal(target, seen.size + (prior === 0 ? 1 : 0));
  seen.set(target, prior + 1);
  let answer;
  try {
    answer = JSON.parse(chat.raw_candidate).translations;
  } catch {
    assert.equal(index, chats.length - 1, 'Only the terminal candidate may be malformed');
    assert.equal(JSON.parse(chat.raw_response).choices[0].finish_reason, 'length');
  }
  if (answer) {
    assert.equal(answer.length, 1);
    assert.equal(answer[0].segment_id, target);
    assert.equal(answer[0].line_index, 0);
    assert.equal(typeof answer[0].text, 'string');
  }
  promptTokens += chat.usage.prompt_tokens;
  completionTokens += chat.usage.completion_tokens;
}
const retriedIds = [...seen].filter(([, count]) => count === 2).map(([id]) => id);
const dbPath = path.join(workspace, 'state/auralis-translate.sqlite');
assert.equal(sha(fs.readFileSync(dbPath)), summary.state_sha256);
const snapshot = readRunSnapshot(dbPath, report.run_id);
assert(snapshot.run);
assert.equal(snapshot.checkpoints.length, summary.checkpoints);
assert.deepEqual(snapshot.checkpoints.map(row => row.block_index),
  Array.from({ length: summary.checkpoints }, (_, index) => index));
assert(snapshot.checkpoints.every(row => row.attempt_count >= 1 && row.attempt_count <= 2));
assert.equal(snapshot.results.length, summary.result_rows);
const db = new DatabaseSync(dbPath, { readOnly: true });
const journal = db.prepare('SELECT segment_id, line_index, request_sha256, rendered_request, '
  + 'outcome, raw_response, prompt_tokens, completion_tokens FROM inference_requests '
  + "WHERE run_id = ? AND request_kind = 'chat_completion' ORDER BY sequence").all(report.run_id);
db.close();
assert.equal(journal.length, chats.length);
for (const [index, row] of journal.entries()) {
  const chat = chats[index];
  const envelope = JSON.parse(chat.request.messages[0].content.split('Input JSON:\n')[1]);
  assert.equal(row.segment_id, envelope.target_slots[0].segment_id);
  assert.equal(row.line_index, 0);
  assert.equal(row.request_sha256, chat.request_sha256);
  assert.equal(sha(row.rendered_request), chat.request_sha256);
  assert.equal(Buffer.from(row.raw_response).toString('utf8'), chat.raw_response);
  assert.equal(row.prompt_tokens, chat.usage.prompt_tokens);
  assert.equal(row.completion_tokens, chat.usage.completion_tokens);
  assert(['validated_line', 'invalid_candidate'].includes(row.outcome));
}
assert.equal(promptTokens, summary.prompt_tokens);
assert.equal(completionTokens, summary.completion_tokens);
assert.deepEqual(retriedIds, summary.retried_cue_ids);
assert.equal(report.translation_elapsed_ms, summary.translation_elapsed_ms);
const outputPath = path.join(workspace, 'candidate.ru.srt');
if (report.status === 'passed_structural_probe') {
  assert.equal(snapshot.checkpoints.length, 263);
  assert.equal(snapshot.results.length, 1);
  assert.equal(summary.output_sha256, sha(fs.readFileSync(outputPath)));
  assert.equal(summary.output_sha256, sha(fs.readFileSync(path.join(workspace, 'offline.ru.srt'))));
  assert.equal(report.output_sha256, summary.output_sha256);
  assert.equal(report.accepted_lines.length, 263);
  for (const [index, block] of fs.readFileSync(outputPath, 'utf8').trimEnd()
    .split(/\r?\n\r?\n+/u).entries()) {
    const original = sourceBlocks[index].split(/\r?\n/u);
    const translated = block.split(/\r?\n/u);
    assert.deepEqual(translated.slice(0, 2), original.slice(0, 2));
    assert.equal(translated.length, original.length);
    assert.equal(translated[2], report.accepted_lines[index]);
  }
} else {
  assert.equal(report.status, 'failed');
  assert.equal(snapshot.results.length, 0);
  assert(!fs.existsSync(outputPath));
  assert.equal(summary.output_sha256, null);
  assert.equal(summary.failure_cue, snapshot.checkpoints.length + 1);
  assert.equal(summary.failure_finish_reason,
    JSON.parse(chats.at(-1).raw_response).choices[0].finish_reason);
  assert.equal(summary.failure_candidate_sha256, sha(Buffer.from(chats.at(-1).raw_candidate)));
}
console.log(JSON.stringify({ private_report_sha256: sha(reportBytes),
  source_sha256: sourceHash, chat_requests: chats.length,
  retried_cue_ids: retriedIds, prompt_tokens: promptTokens,
  completion_tokens: completionTokens, checkpoints: snapshot.checkpoints.length,
  result_rows: snapshot.results.length, status: report.status }, null, 2));
