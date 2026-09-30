import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const workspace = path.join(root, '.cache/eval/natural-json-tail-temperature-zero-v1/run-whBpv0');
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const pinned = async (file, expected) => {
  const bytes = await fs.readFile(file);
  assert.equal(hash(bytes), expected, file);
  return bytes;
};
const report = JSON.parse(await pinned(path.join(workspace, 'report.json'),
  'b33c8ba858bba4c5b9957884b7b312ea90997993afee3e32e1394b73c7e19664'));
const raw = (await pinned(path.join(workspace, 'requests.jsonl'),
  '1d2e9a1fab3d0419ebe074a655b2bc93e19c07114cd944527c73a7eae2f82355'))
  .toString('utf8').trimEnd().split(/\r?\n/u).map(JSON.parse);
const summary = JSON.parse(await fs.readFile(path.join(root,
  'eval/reports/2026-09-30-json-tail-temperature-summary.json')));
assert.equal(report.status, 'complete_screen_unreviewed');
assert.equal(report.git_head, 'f196dd76086dac95ebf461dfb678c4f57c3f4729');
assert.equal(report.harness_sha256, hash(await fs.readFile(path.join(root,
  'eval/scripts/probe-json-tail-temperature.mjs'))));
assert.equal(report.model_sha256, summary.model_sha256);
assert.equal(report.profile_sha256, summary.profile_sha256);
assert.deepEqual(report.changed_factor,
  { field: 'temperature', baseline: 0.7, variant: 0 });
assert.equal(report.limits.chat_requests, 8);
assert.equal(report.limits.retries, 0);
assert.equal(report.failures.length, 0);
assert.equal(report.planned.length, 8);
assert.equal(report.requests.length, 8);
assert.equal(raw.length, 8);
assert.equal(summary.private_report_sha256,
  'b33c8ba858bba4c5b9957884b7b312ea90997993afee3e32e1394b73c7e19664');
assert.equal(summary.private_requests_jsonl_sha256,
  '1d2e9a1fab3d0419ebe074a655b2bc93e19c07114cd944527c73a7eae2f82355');
const baselines = new Map();
for (const identity of report.source_identities) {
  const file = identity.id === 'asus'
    ? '.cache/eval/commons-asus-full-7b-v1/run-nCoZTy/report.json'
    : '.cache/eval/commons-vivo-full-7b-v1/run-zxrN7F/report.json';
  const baseline = JSON.parse(await pinned(path.join(root, file), identity.report_sha256));
  baselines.set(identity.id,
    baseline.requests.filter(row => row.path === '/v1/chat/completions'));
}
let promptTokens = 0;
let completionTokens = 0;
let summedHttpMs = 0;
let valid = 0;
const byId = new Map();
for (let index = 0; index < raw.length; index++) {
  const row = raw[index];
  const observed = report.requests[index];
  const planned = report.planned[index];
  assert.equal(row.id, planned.id);
  assert.equal(row.repetition, planned.repetition);
  assert.equal(row.id, observed.id);
  assert.equal(row.request_sha256, observed.request_sha256);
  assert.equal(row.request_sha256, planned.request_sha256);
  assert.equal(hash(Buffer.from(JSON.stringify(row.request))), row.request_sha256);
  const baseline = baselines.get(row.source_id)[row.cue - 1];
  assert.equal(row.baseline_request_sha256, baseline.request_sha256);
  assert.equal(row.baseline_raw_candidate_sha256, hash(Buffer.from(baseline.raw_candidate)));
  const original = structuredClone(row.request);
  assert.equal(original.temperature, 0);
  original.temperature = 0.7;
  assert.deepEqual(original, baseline.request);
  assert.equal(row.http_status, 200);
  assert.equal(row.finish_reason, 'stop');
  const candidate = JSON.parse(row.raw_candidate).translations;
  assert.equal(candidate.length, 1);
  assert.equal(candidate[0].segment_id, row.cue);
  assert.equal(candidate[0].line_index, 0);
  assert.equal(candidate[0].text, row.candidate_text);
  assert.equal(observed.raw_candidate_sha256, hash(Buffer.from(row.raw_candidate)));
  assert.equal(observed.structural_outcome, row.structural_outcome);
  if (row.id === 'asus-227') {
    assert.equal(row.structural_outcome, 'invalid_srt');
    assert(row.candidate_text.endsWith('」}]}'));
    assert.match(row.validation_error, /UnsupportedMarkup/u);
  } else {
    assert.equal(row.structural_outcome, 'valid_unreviewed');
    valid++;
  }
  assert(!/\p{Script=Cyrillic}/u.test(row.request.messages[0].content));
  promptTokens += row.usage.prompt_tokens;
  completionTokens += row.usage.completion_tokens;
  summedHttpMs += row.elapsed_ms;
  byId.set(row.id, (byId.get(row.id) ?? 0) + 1);
}
assert.deepEqual([...byId.values()], [2, 2, 2, 2]);
assert.equal(valid, summary.variant_structural_valid);
assert.equal(raw.length, summary.variant_requests);
assert.equal(promptTokens, summary.prompt_tokens);
assert.equal(completionTokens, summary.completion_tokens);
assert.equal(summedHttpMs, summary.summed_chat_http_ms);
assert.equal(report.wall_elapsed_ms, summary.wall_elapsed_ms);
assert.equal(report.resources.samples.length, summary.resource_sample_count);
const workingSet = Math.max(...report.resources.samples.flatMap(sample =>
  sample.processes.map(row => row.WorkingSet64)));
assert.equal(workingSet, summary.sampled_server_working_set_peak_bytes);
const gpu = Math.max(...report.resources.samples.map(sample =>
  Number(sample.gpu_device.split(',')[1].trim())));
assert.equal(gpu, summary.sampled_whole_device_gpu_memory_peak_mib);
assert.equal(summary.human_reviewed_cues, 0);
assert.equal(summary.profile_promoted, false);
assert.equal(summary.raw_source_or_candidate_published, false);
console.log('Temperature-only screen verified: 8/8 raw calls, ASUS tail 2/2 persisted, Vivo tail 0/2, 6/8 SRT-valid; no quality score or profile promotion.');
