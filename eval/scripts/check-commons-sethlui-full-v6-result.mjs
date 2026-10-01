import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { readRunSnapshot } from './cli-run-state.mjs';
import { extractCliRunId } from './cli-run-id.mjs';

const root = path.resolve('.');
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const source = fs.readFileSync(path.join(root, '.cache/eval/commons-sethlui-derived-v1/source.zh.srt'));
assert.equal(sha(source), '4777e11caa115e893f2328c2a33c25a76c7391ace8ecf0ac4b9436635fc27964');
const sourceBlocks = source.toString('utf8').trimEnd().split(/\r?\n\r?\n+/u);
assert.equal(sourceBlocks.length, 263);

const arms = [
  { key: '1b', folder: 'run-Hp7iM7', report: 'f0f70079038380a4de9e39bd0408d422c62c1236ed85352cf121dbfb6ca9258e',
    db: '84090f6ac6824d0ce1162fbe5ff823d895749e7c4a7986cfb545f21ca345e40e',
    run: '391f20d1-1c2b-45d8-b4fe-4ac3725fd3e4', count: 263,
    profile: 'b30546f228ba230364ba79edae55456d62e7d7c5010e56fef38464c3531089c5',
    model: 'dc5f44fcf1fa496ee7ad725982c0c8c553a4de00259b53af84c4b89fb0c06699' },
  { key: '7b', folder: 'run-6Pa9oA', report: '81f5ece3871a6ce8b141a2022cee8218cb804274ab97c142f90e58d943bcb1dc',
    db: 'fdffbaf9f85ac971731f9b5785b4130a4130d54edbd3e00b02864b2df11262be',
    run: 'ef5f83be-05ab-4410-90ff-ddeb0c4a9c89', count: 62,
    profile: 'e7e2d7745cb283a88984da202eb511f0144b2bc51bc6eb01727515a51e7aa06f',
    model: '9f96256500f3fc1ab4d64336b58f52a949a95ad7516b0c229476eef782f9f77b' },
];
const summaries = [];
const reports = [];
for (const arm of arms) {
  const workspace = path.join(root, `.cache/eval/commons-sethlui-full-v6-${arm.key}-v1`, arm.folder);
  const reportBytes = fs.readFileSync(path.join(workspace, 'report.json'));
  assert.equal(sha(reportBytes), arm.report);
  const report = JSON.parse(reportBytes);
  reports.push(report);
  assert.equal(report.source_sha256, sha(source));
  assert.equal(report.profile_sha256, arm.profile);
  assert.equal(report.model_sha256_verified_by_doctor, arm.model);
  assert.equal(report.cli_sha256, '82df0fbd0167b9163f945c58d8387a1edf2c6eedfed9f38086f617f74914df1d');
  assert.equal(report.runtime_sha256, '6f15be27bd80b6b4d52afefa49094e18fcfab55d5da354d717971f2d2537b2f4');
  const requests = report.requests;
  const chats = requests.filter(row => row.path === '/v1/chat/completions');
  const templates = requests.filter(row => row.path === '/apply-template');
  const tokenizers = requests.filter(row => row.path === '/tokenize');
  assert.equal(requests.length, 3 + arm.count * 3);
  assert.deepEqual(requests.slice(0, 3).map(row => row.path), ['/health', '/props', '/v1/models']);
  assert.equal(chats.length, arm.count);
  assert.equal(templates.length, arm.count);
  assert.equal(tokenizers.length, arm.count);
  let promptTokens = 0;
  let completionTokens = 0;
  for (let index = 0; index < arm.count; index++) {
    const target = index + 1;
    const [template, tokenize, chat] = requests.slice(3 + index * 3, 6 + index * 3);
    assert.deepEqual([template.path, tokenize.path, chat.path],
      ['/apply-template', '/tokenize', '/v1/chat/completions']);
    for (const row of [template, tokenize, chat]) assert.equal(row.http_status, 200);
    assert.equal(template.rendered_prompt_sha256, tokenize.rendered_prompt_sha256);
    assert.equal(tokenize.token_count, chat.usage.prompt_tokens);
    assert.equal(chat.request_sha256, sha(Buffer.from(JSON.stringify(chat.request))));
    assert.equal(chat.raw_candidate, JSON.parse(chat.raw_response).choices[0].message.content);
    const envelope = JSON.parse(chat.request.messages[0].content.split('Input JSON:\n')[1]);
    assert.equal(envelope.target_slots.length, 1);
    assert.equal(envelope.target_slots[0].segment_id, target);
    assert.equal(envelope.target_slots[0].source_original, sourceBlocks[index].split(/\r?\n/u)[2]);
    assert.deepEqual(envelope.approved_terms, []);
    assert.equal(chat.request.response_format.schema.properties.translations.items.properties.segment_id.const, target);
    const candidate = JSON.parse(chat.raw_candidate).translations;
    assert.equal(candidate.length, 1);
    assert.equal(candidate[0].segment_id, target);
    assert.equal(candidate[0].line_index, 0);
    assert.equal(typeof candidate[0].text, 'string');
    promptTokens += chat.usage.prompt_tokens;
    completionTokens += chat.usage.completion_tokens;
  }
  const dbPath = path.join(workspace, 'state/auralis-translate.sqlite');
  assert.equal(sha(fs.readFileSync(dbPath)), arm.db);
  const snapshot = readRunSnapshot(dbPath, arm.run);
  assert(snapshot.run);
  assert.deepEqual(snapshot.checkpoints.map(row => row.block_index),
    Array.from({ length: arm.key === '1b' ? 263 : 61 }, (_, index) => index));
  assert.equal(snapshot.attempts.length, 1);
  const commandText = report.commands.map(row => `${row.stdout}\n${row.stderr}`).join('\n');
  assert(commandText.includes(arm.run));
  const translationCommand = report.commands.find(row => row.args[0] === 'translate-v5-scene');
  assert.equal(extractCliRunId(translationCommand.stdout, translationCommand.stderr), arm.run);
  if (arm.key === '1b') {
    assert.equal(report.status, 'passed_structural_probe');
    assert.equal(report.run_id, arm.run);
    assert.equal(report.translation_elapsed_ms, 165453);
    assert.equal(snapshot.results.length, 1);
    assert.equal(snapshot.results[0].review_state, 'needs_review');
    const output = fs.readFileSync(path.join(workspace, 'candidate.ru.srt'));
    assert.equal(sha(output), '042c0ffffd67a4ea6f562645655ffe9db823866d7505b4ed64708e0ff829df4d');
    assert.equal(sha(fs.readFileSync(path.join(workspace, 'offline.ru.srt'))), sha(output));
    assert.equal(report.accepted_lines.length, 263);
    assert.equal(report.offline_reexport, 'byte_identical');
    assert.equal(report.failures.length, 0);
    for (const [index, block] of output.toString('utf8').trimEnd().split(/\r?\n\r?\n+/u).entries()) {
      const oldLines = sourceBlocks[index].split(/\r?\n/u);
      const newLines = block.split(/\r?\n/u);
      assert.deepEqual(newLines.slice(0, 2), oldLines.slice(0, 2));
      assert.equal(newLines.length, oldLines.length);
      assert.equal(newLines[2], report.accepted_lines[index]);
    }
  } else {
    assert.equal(report.status, 'failed');
    assert.equal(snapshot.results.length, 0);
    assert.equal(report.run_id, undefined);
    assert(!fs.existsSync(path.join(workspace, 'candidate.ru.srt')));
    assert(commandText.includes('SRT target line violates supported text grammar'));
    assert.equal(chats[61].request_sha256,
      '3d0abf06162144d4b64da48633340020c2670b7b08904747b3252d434a9a1e7c');
    assert.equal(JSON.parse(chats[61].raw_candidate).translations[0].text,
      'По сравнению с другими кухнями, кантонская кухня」}]}');
  }
  summaries.push({ model: arm.key, source_cues: 263, chat_requests: chats.length,
    template_preflights: templates.length, tokenizer_preflights: tokenizers.length,
    prompt_tokens: promptTokens, completion_tokens: completionTokens,
    elapsed_chat_ms: Math.round(chats.reduce((sum, row) => sum + row.elapsed_ms, 0)),
    doctor_elapsed_ms: Math.round(report.commands.find(row => row.args[0] === 'doctor').elapsed_ms),
    translation_command_elapsed_ms: Math.round(report.commands.find(row => row.args[0] === 'translate-v5-scene').elapsed_ms),
    sampled_peak_server_working_set_bytes: Math.max(0, ...report.resource_samples.map(row => row.working_set_bytes ?? 0)),
    sampled_peak_gpu_used_mib: Math.max(0, ...report.resource_samples.map(row =>
      Number(String(row.gpu ?? '').match(/^\s*(\d+)/u)?.[1] ?? 0))),
    resource_sample_count: report.resource_samples.length,
    checkpoints: snapshot.checkpoints.length, results: snapshot.results.length,
    terminal_status: report.status, report_sha256: arm.report, state_sha256: arm.db });
}
for (let index = 0; index < 61; index++) {
  const left = structuredClone(reports[0].requests[3 + index * 3 + 2].request);
  const right = structuredClone(reports[1].requests[3 + index * 3 + 2].request);
  delete left.model;
  delete right.model;
  assert.deepEqual(left, right, `Model arms differ beyond identity at cue ${index + 1}`);
}
const publicSummary = JSON.parse(fs.readFileSync(path.join(root,
  'eval/reports/2026-10-01-sethlui-full-v6-summary.json')));
assert.equal(publicSummary.source_sha256, sha(source));
assert.equal(publicSummary.matched_request_prefix, 61);
assert.equal(publicSummary.review.independent_human_cues, 0);
assert.equal(publicSummary.release_decision, 'no_candidate_selected');
for (const [index, arm] of publicSummary.arms.entries()) {
  const privateRow = summaries[index];
  assert.equal(arm.private_report_sha256, privateRow.report_sha256);
  assert.equal(arm.chat_requests, privateRow.chat_requests);
  assert.equal(arm.prompt_tokens, privateRow.prompt_tokens);
  assert.equal(arm.completion_tokens, privateRow.completion_tokens);
  assert.equal(arm.translation_command_ms, privateRow.translation_command_elapsed_ms);
  assert.equal(arm.summed_chat_http_ms, privateRow.elapsed_chat_ms);
  assert.equal(arm.peak_sampled_working_set_bytes, privateRow.sampled_peak_server_working_set_bytes);
  assert.equal(arm.peak_sampled_device_gpu_used_mib, privateRow.sampled_peak_gpu_used_mib);
  assert.equal(arm.checkpoints, privateRow.checkpoints);
  assert.equal(arm.result_rows, privateRow.results);
}
console.log(JSON.stringify({ source_sha256: sha(source), paired_identical_requests: 61,
  independent_human_reviews: 0, arms: summaries }, null, 2));
const focusIds = [11, 12, 22, 32, 35, 62, 70, 80, 119, 122, 125, 128, 130, 215, 219, 223, 254, 262];
for (const id of focusIds) {
  const sourceLine = sourceBlocks[id - 1].split(/\r?\n/u)[2];
  const answers = reports.map(report => {
    const chat = report.requests.filter(row => row.path === '/v1/chat/completions')[id - 1];
    return chat ? JSON.parse(chat.raw_candidate).translations[0].text : null;
  });
  console.log(JSON.stringify({ id, source: sourceLine, source_sha256: sha(Buffer.from(sourceLine)),
    one_b: answers[0], one_b_sha256: sha(Buffer.from(answers[0])),
    seven_b: answers[1], seven_b_sha256: answers[1] && sha(Buffer.from(answers[1])) }));
}
