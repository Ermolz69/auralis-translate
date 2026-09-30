import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve('.');
const run = path.join(root, '.cache/eval/commons-asus-full-v6-slot-v1/run-7XjHrR');
const output = path.join(root, '.cache/eval/asus-v6-token-budget-audit-v1/report.json');
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
const reportBytes = fs.readFileSync(path.join(run, 'report.json'));
assert.equal(sha256(reportBytes), '1d8addf0860cb88f0161ac6eeed3fc45351ab9912aaf0eff2b39a76772a26413');
const sourceBytes = fs.readFileSync(path.join(root, '.cache/eval/commons-asus-rog-ally-892592485/source.zh.srt'));
assert.equal(sha256(sourceBytes), '923aed3991c2308d92b89c45181cea8ec7ece74e9b4d3a3ce0234d95e329913b');
const runReport = JSON.parse(reportBytes);
assert.equal(runReport.status, 'passed_structural_probe');
assert.equal(runReport.source_cues, 268);
assert.equal(runReport.profile_sha256, 'b30546f228ba230364ba79edae55456d62e7d7c5010e56fef38464c3531089c5');
assert.equal(runReport.model_sha256_verified_by_doctor, 'dc5f44fcf1fa496ee7ad725982c0c8c553a4de00259b53af84c4b89fb0c06699');
const sceneMapBytes = fs.readFileSync(path.join(run, 'scene-map.json'));
assert.equal(sha256(sceneMapBytes), runReport.scene_map_sha256);
const sceneMap = JSON.parse(sceneMapBytes);
assert.deepEqual(sceneMap.scene_end_ids, [268]);
assert.equal(sceneMap.source_sha256, runReport.source_sha256);

const requestPaths = ['/apply-template', '/tokenize', '/v1/chat/completions'];
const requests = runReport.requests.filter(request => requestPaths.includes(request.path));
assert.equal(requests.length, 268 * requestPaths.length);
const promptCeiling = 2048 - 256 - 64;
const rows = [];
for (let index = 0; index < 268; index++) {
  const [template, tokenize, chat] = requests.slice(index * 3, index * 3 + 3);
  assert.deepEqual([template.path, tokenize.path, chat.path], requestPaths);
  assert.equal(template.http_status, 200);
  assert.equal(tokenize.http_status, 200);
  assert.equal(chat.http_status, 200);
  assert.deepEqual(template.request.messages, chat.request.messages);
  assert.deepEqual(template.request.response_format, chat.request.response_format);
  assert.equal(template.rendered_prompt_sha256, tokenize.rendered_prompt_sha256);
  assert.equal(tokenize.token_count, chat.usage.prompt_tokens);
  assert.equal(chat.request.max_tokens, 256);
  const envelope = JSON.parse(chat.request.messages[0].content.split('Input JSON:\n')[1]);
  assert.equal(envelope.target_slots.length, 1);
  const id = index + 1;
  assert.equal(envelope.target_slots[0].segment_id, id);
  assert.equal(envelope.target_slots[0].line_index, 0);
  const allowedContext = [id - 1, id + 1].filter(value => value >= 1 && value <= 268);
  const contextIds = envelope.source_context.map(cue => cue.segment_id);
  assert(contextIds.every(value => allowedContext.includes(value)));
  assert.equal(new Set(contextIds).size, contextIds.length);
  assert(tokenize.token_count <= promptCeiling);
  rows.push({
    cue_id: id,
    prompt_tokens: tokenize.token_count,
    completion_tokens: chat.usage.completion_tokens,
    context_cues: contextIds.length,
    context_trimmed: allowedContext.length - contextIds.length,
  });
}

const counts = rows.map(row => row.prompt_tokens).sort((a, b) => a - b);
const nearestRank = proportion => counts[Math.ceil(proportion * counts.length) - 1];
const max = counts.at(-1);
const boundaryIds = [1, 2, 133, 134, 267, 268];
const summary = {
  schema_version: 1,
  id: 'asus-v6-rendered-token-audit-v1',
  source_sha256: runReport.source_sha256,
  input_report_sha256: sha256(reportBytes),
  model_sha256: runReport.model_sha256_verified_by_doctor,
  profile_sha256: runReport.profile_sha256,
  scene_map_sha256: runReport.scene_map_sha256,
  cue_count: rows.length,
  context_tokens: 2048,
  response_reserve_tokens: 256,
  safety_margin_tokens: 64,
  prompt_ceiling_tokens: promptCeiling,
  prompt_min_tokens: counts[0],
  prompt_median_tokens: nearestRank(0.5),
  prompt_p95_tokens: nearestRank(0.95),
  prompt_max_tokens: max,
  prompt_max_cue_ids: rows.filter(row => row.prompt_tokens === max).map(row => row.cue_id),
  minimum_headroom_tokens: promptCeiling - max,
  prompt_total_tokens: rows.reduce((sum, row) => sum + row.prompt_tokens, 0),
  completion_total_tokens: rows.reduce((sum, row) => sum + row.completion_tokens, 0),
  context_trimmed_cues: rows.reduce((sum, row) => sum + row.context_trimmed, 0),
  boundary_rows: rows.filter(row => boundaryIds.includes(row.cue_id)),
  model_requests: 0,
};
assert.equal(summary.prompt_total_tokens, 73766);
assert.equal(summary.completion_total_tokens, 12155);
const bytes = Buffer.from(`${JSON.stringify(summary, null, 2)}\n`);
if (fs.existsSync(output)) {
  assert.deepEqual(fs.readFileSync(output), bytes, 'existing audit output changed');
} else {
  fs.mkdirSync(path.dirname(output), { recursive: true });
  fs.writeFileSync(output, bytes, { flag: 'wx' });
}
console.log(JSON.stringify({ ...summary, output_sha256: sha256(bytes) }));
