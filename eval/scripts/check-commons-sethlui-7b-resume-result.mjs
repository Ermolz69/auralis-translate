import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { assertSavedPrefix, readRunSnapshot } from './cli-run-state.mjs';

const root = path.resolve('.');
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const original = path.join(root, '.cache/eval/commons-sethlui-full-v6-7b-v1/run-6Pa9oA');
const continued = path.join(root, '.cache/eval/commons-sethlui-full-v6-7b-resume-v1/run-oWMFtv');
const source = fs.readFileSync(path.join(root, '.cache/eval/commons-sethlui-derived-v1/source.zh.srt'));
const reportBytes = fs.readFileSync(path.join(continued, 'report.json'));
assert.equal(sha(reportBytes), '16b1e806d52ce9bdd0d7a088e1b4e289802dc4b745bb149a429ccdea595e8c81');
const report = JSON.parse(reportBytes);
assert.equal(report.experiment, 'commons-sethlui-full-v6-7b-resume-v1');
assert.equal(report.status, 'failed');
assert.equal(report.revision, 'c5ca1f6bc8b627b838dfba8eccf741f08beef198');
assert.equal(report.source_sha256, sha(source));
assert.equal(report.source_cues, 263);
assert.equal(report.profile_sha256, 'e7e2d7745cb283a88984da202eb511f0144b2bc51bc6eb01727515a51e7aa06f');
assert.equal(report.model_sha256_verified_by_doctor,
  '9f96256500f3fc1ab4d64336b58f52a949a95ad7516b0c229476eef782f9f77b');
assert.equal(report.cli_sha256, '82df0fbd0167b9163f945c58d8387a1edf2c6eedfed9f38086f617f74914df1d');
assert.equal(report.runtime_sha256, '6f15be27bd80b6b4d52afefa49094e18fcfab55d5da354d717971f2d2537b2f4');
assert.equal(report.resume_of.failed_report_sha256,
  '81f5ece3871a6ce8b141a2022cee8218cb804274ab97c142f90e58d943bcb1dc');
assert.equal(report.resume_of.saved_blocks, 61);
assert.equal(report.resume_of.copied_source_relocated, true);
assert.equal(report.run_id, 'ef5f83be-05ab-4410-90ff-ddeb0c4a9c89');
assert(report.translation_elapsed_ms > 0);
const originalDb = path.join(original, 'state/auralis-translate.sqlite');
const copiedDb = path.join(continued, 'state/auralis-translate.sqlite');
assert.equal(sha(fs.readFileSync(originalDb)),
  'fdffbaf9f85ac971731f9b5785b4130a4130d54edbd3e00b02864b2df11262be');
assert.equal(sha(fs.readFileSync(`${originalDb}-shm`)),
  'fd4c9fda9cd3f9ae7c962b0ddf37232294d55580e1aa165aa06129b8549389eb');
assert.equal(sha(fs.readFileSync(`${originalDb}-wal`)),
  'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855');
assert.equal(sha(fs.readFileSync(copiedDb)),
  'e470d7ba6c01f34d93c490dde8b0c0ed7110da21bb9b3a02e99683a4ee2b57c8');
const before = readRunSnapshot(originalDb, report.run_id);
const after = readRunSnapshot(copiedDb, report.run_id);
assert.equal(before.checkpoints.length, 61);
assert.equal(after.checkpoints.length, 99);
assertSavedPrefix(before, after);
assert.deepEqual(after.checkpoints.map(row => row.block_index),
  Array.from({ length: 99 }, (_, index) => index));
assert.equal(before.results.length, 0);
assert.equal(after.results.length, 0);
assert.equal(after.attempts.length, 2);
assert(!fs.existsSync(path.join(continued, 'candidate.ru.srt')));
const requests = report.requests;
assert.equal(requests.length, 120);
assert.deepEqual(requests.slice(0, 3).map(row => row.path), ['/health', '/props', '/v1/models']);
const chats = requests.filter(row => row.path === '/v1/chat/completions');
assert.equal(chats.length, 39);
let promptTokens = 0;
let completionTokens = 0;
for (let index = 0; index < 39; index++) {
  const target = 62 + index;
  const [template, tokenizer, chat] = requests.slice(3 + index * 3, 6 + index * 3);
  assert.deepEqual([template.path, tokenizer.path, chat.path],
    ['/apply-template', '/tokenize', '/v1/chat/completions']);
  for (const row of [template, tokenizer, chat]) assert.equal(row.http_status, 200);
  assert.equal(template.rendered_prompt_sha256, tokenizer.rendered_prompt_sha256);
  assert.equal(tokenizer.token_count, chat.usage.prompt_tokens);
  assert.equal(chat.request_sha256, sha(Buffer.from(JSON.stringify(chat.request))));
  assert.equal(chat.raw_candidate, JSON.parse(chat.raw_response).choices[0].message.content);
  const envelope = JSON.parse(chat.request.messages[0].content.split('Input JSON:\n')[1]);
  assert.equal(envelope.target_slots[0].segment_id, target);
  assert.equal(envelope.target_slots[0].source_original,
    source.toString('utf8').trimEnd().split(/\r?\n\r?\n+/u)[target - 1].split(/\r?\n/u)[2]);
  const row = JSON.parse(chat.raw_candidate).translations[0];
  assert.equal(row.segment_id, target);
  assert.equal(row.line_index, 0);
  promptTokens += chat.usage.prompt_tokens;
  completionTokens += chat.usage.completion_tokens;
}
const initial = JSON.parse(fs.readFileSync(path.join(original, 'report.json')));
const initialCue62 = initial.requests.filter(row => row.path === '/v1/chat/completions')[61];
assert.deepEqual(chats[0].request, initialCue62.request);
const failed = chats.at(-1);
const failedText = JSON.parse(failed.raw_candidate).translations[0].text;
assert.equal(failed.request_sha256,
  '764f2599a7d30b0ff3c1f7dbcbdbdfc2f4319e6975a3f7a33cbe072015624d74');
assert(failedText.endsWith('」}]}'));
assert(report.commands.find(row => row.args[0] === 'resume').stderr
  .includes('SRT target line violates supported text grammar'));
const sourceLine = source.toString('utf8').trimEnd().split(/\r?\n\r?\n+/u)[99].split(/\r?\n/u)[2];
const publicSummary = JSON.parse(fs.readFileSync(path.join(root,
  'eval/reports/2026-10-01-sethlui-7b-resume-summary.json')));
assert.equal(publicSummary.source_sha256, sha(source));
assert.equal(publicSummary.original_report_sha256, report.resume_of.failed_report_sha256);
assert.equal(publicSummary.continuation_report_sha256, sha(reportBytes));
assert.equal(publicSummary.initial_saved_checkpoints, before.checkpoints.length);
assert.equal(publicSummary.copied_final_checkpoints, after.checkpoints.length);
assert.equal(publicSummary.new_chat_requests, chats.length);
assert.equal(publicSummary.new_http_requests, requests.length);
assert.equal(publicSummary.new_prompt_tokens, promptTokens);
assert.equal(publicSummary.new_completion_tokens, completionTokens);
assert.equal(publicSummary.translation_command_ms, report.translation_elapsed_ms);
assert.equal(publicSummary.summed_chat_http_ms,
  Math.round(chats.reduce((sum, row) => sum + row.elapsed_ms, 0)));
assert.equal(publicSummary.peak_sampled_server_working_set_bytes,
  Math.max(...report.resource_samples.map(row => row.working_set_bytes ?? 0)));
assert.equal(publicSummary.peak_sampled_device_gpu_used_mib,
  Math.max(...report.resource_samples.map(row =>
    Number(String(row.gpu ?? '').match(/^\s*(\d+)/u)?.[1] ?? 0))));
assert.equal(publicSummary.resource_samples, report.resource_samples.length);
assert.equal(publicSummary.failure_cue, 100);
assert.equal(publicSummary.complete_result_rows, 0);
assert.equal(publicSummary.partial_srt_published, false);
console.log(JSON.stringify({ status: report.status, original_checkpoint_count: before.checkpoints.length,
  copied_checkpoint_count: after.checkpoints.length, new_chat_requests: chats.length,
  new_http_requests: requests.length, prompt_tokens: promptTokens,
  completion_tokens: completionTokens, translation_command_ms: report.translation_elapsed_ms,
  failed_cue: 100, failed_request_sha256: failed.request_sha256,
  source_text_sha256: sha(Buffer.from(sourceLine)),
  candidate_text_sha256: sha(Buffer.from(failedText)), source_text: sourceLine,
  rejected_candidate_text: failedText, private_report_sha256: sha(reportBytes) }, null, 2));
