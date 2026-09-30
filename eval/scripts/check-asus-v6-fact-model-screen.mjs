import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const directory = path.join(root,
  '.cache/eval/commons-asus-v6-fact-model-screen-v1/run-bWDBNw');
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const pinned = async (file, expected) => {
  const bytes = await fs.readFile(file);
  assert.equal(hash(bytes), expected, file);
  return bytes;
};
const report = JSON.parse(await pinned(path.join(directory, 'report.json'),
  '23a12aa953b0e1cb43e0dfaec7061672c979d0f24e3a7fa04639b921ab25fdf9'));
const journal = (await pinned(path.join(directory, 'requests.jsonl'),
  '8bb9e021adea11cf09394b470c00afa556959be4d9a0baf47c37d8557163ea2f'))
  .toString('utf8').trimEnd().split(/\r?\n/u).map(JSON.parse);
const launch = JSON.parse(await pinned(path.join(root,
  '.cache/eval/commons-asus-v6-fact-model-screen-v1/run-w0QpqJ/launch-failure.json'),
  'f77a71e8a0e913511238c8924457880080e03835247ae54d94badc49c97a38f1'));
assert.equal(launch.status, 'zero_chat_launch_failure');
assert.equal(launch.chat_requests, 0);
assert.equal(launch.server_starts, 0);
assert.equal(report.id, 'commons-asus-v6-fact-model-screen-v1');
assert.equal(report.status, 'complete_structural_observations_unreviewed');
assert.equal(report.git_head, 'b8776ba055bc9b45371fa12baed4ca8e4fe0b882');
assert.equal(report.harness_sha256,
  'e79ca2f5ebedc8108e68f5c0abddedb4a83a3f091edbed1c71d1d8072145dd86');
assert.equal(report.limits.chats, 64);
assert.equal(report.limits.retries, 0);
assert.equal(report.human_review_count, 0);
assert.equal(report.planned_requests.length, 64);
assert.equal(report.requests.length, 64);
assert.equal(journal.length, 64);
assert.deepEqual(report.identity.models.map(model => model.profile_sha256), [
  'b30546f228ba230364ba79edae55456d62e7d7c5010e56fef38464c3531089c5',
  'e7e2d7745cb283a88984da202eb511f0144b2bc51bc6eb01727515a51e7aa06f',
]);
const aliases = { '1b': 'auralis-hy-mt2-1.8b-q4',
  '7b': 'auralis-hy-mt2-7b-q4' };
for (let index = 0; index < journal.length; index++) {
  const row = journal[index];
  const summary = report.requests[index];
  const planned = report.planned_requests[index];
  assert.equal(row.model, planned.model);
  assert.equal(row.case_id, planned.case_id);
  assert.equal(row.cue_id, planned.cue_id);
  assert.equal(row.request.model, aliases[row.model]);
  assert.equal(row.request.seed, 101);
  assert.equal(hash(Buffer.from(JSON.stringify(row.request))), planned.request_sha256);
  assert.equal(hash(Buffer.from(row.request.messages[0].content)), planned.prompt_sha256);
  assert.equal(row.request_sha256, summary.request_sha256);
  assert.equal(row.raw_response_sha256, hash(Buffer.from(row.raw_response)));
  assert.equal(row.raw_response_sha256, summary.raw_response_sha256);
  assert.equal(row.http_status, 200);
  assert.equal(row.finish_reason, 'stop');
  assert.equal(row.structural_outcome, 'valid_unreviewed');
  assert.equal(row.accepted_candidate, summary.accepted_candidate);
  assert.equal(row.accepted_candidate,
    JSON.parse(row.raw_candidate).translations[0].text);
  assert.doesNotMatch(row.request.messages[0].content, /\p{Script=Cyrillic}/u);
  const envelope = JSON.parse(row.request.messages[0].content.split('Input JSON:\n')[1]);
  assert.equal(envelope.target_slots[0].source_original, row.source_zh);
  assert.equal(envelope.target_slots[0].segment_id, row.cue_id);
  assert.equal(row.request.response_format.schema.properties.translations.items
    .properties.segment_id.const, row.cue_id);
}
for (let index = 0; index < 32; index++) {
  const first = journal[index];
  const second = journal[index + 32];
  assert.equal(first.case_id, second.case_id);
  const paired = structuredClone(second.request);
  paired.model = first.request.model;
  assert.deepEqual(paired, first.request);
}
for (const [model, expected] of Object.entries({
  '1b': { prompt: 7168, completion: 1409, http_ms: 10893,
    working_set: 1547878400, gpu_mib: 2004 },
  '7b': { prompt: 7219, completion: 1470, http_ms: 24188,
    working_set: 5062770688, gpu_mib: 5522 },
})) {
  const rows = report.requests.filter(row => row.model === model);
  assert.equal(rows.length, 32);
  assert.equal(rows.reduce((sum, row) => sum + row.usage.prompt_tokens, 0),
    expected.prompt);
  assert.equal(rows.reduce((sum, row) => sum + row.usage.completion_tokens, 0),
    expected.completion);
  assert.equal(rows.reduce((sum, row) => sum + row.elapsed_ms, 0),
    expected.http_ms);
  const samples = report.resources[model].samples;
  assert.equal(Math.max(...samples.map(row => row.processes[0].WorkingSet64)),
    expected.working_set);
  assert.equal(Math.max(...samples.map(row => Number(row.gpu_device.split(',')[1]))),
    expected.gpu_mib);
}
for (const caseId of ['asus-227', 'REG-032-negative-actual_phone_variant']) {
  const row = journal.find(item => item.model === '7b' && item.case_id === caseId);
  assert(row);
  assert.match(row.accepted_candidate, /」[}\]]{3,}$/u);
}
console.log('ASUS v6 paired fact screen verified: 64 exact raw responses, 64 target-bound slots, two leaked JSON-tail texts; zero human reviews.');
