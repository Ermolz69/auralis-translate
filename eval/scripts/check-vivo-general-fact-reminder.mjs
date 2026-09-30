import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const variantDirectory = path.join(root,
  '.cache/eval/commons-vivo-general-fact-reminder-v1/run-pSegnt');
const baselineDirectory = path.join(root,
  '.cache/eval/commons-vivo-fact-model-screen-v1/run-uuRubD');
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const readPinned = async (file, expected) => {
  const bytes = await fs.readFile(file);
  assert.equal(hash(bytes), expected, file);
  return bytes;
};
const reportSha256 = '5923d2a0ee51daa545084a2602977452ccb3e944cf0a94c18c0a5626eb846519';
const journalSha256 = 'ec5e79a7fedc7554457d3b88c020958bc0eaed71bc67a4a7f62366820b990667';
const report = JSON.parse(await readPinned(path.join(variantDirectory, 'report.json'), reportSha256));
const raw = (await readPinned(path.join(variantDirectory, 'requests.jsonl'), journalSha256))
  .toString('utf8').trimEnd().split(/\r?\n/u).map(JSON.parse);
const baseline = (await readPinned(path.join(baselineDirectory, 'requests.jsonl'),
  '3b680456c4166ae54e2ce4cc7f374e85f68639c88a4f1b0a9d5730f30c58062d'))
  .toString('utf8').trimEnd().split(/\r?\n/u).map(JSON.parse)
  .filter(row => row.model === '7b');
const controls = JSON.parse(await readPinned(path.join(root,
  'eval/corpora/vivo-fact-controls-v1.json'),
  '3119d4d1c0b6489618d214808662195f0c1d6d0d47946a4726fcd5d7409a67ef'));
assert.equal(report.id, 'commons-vivo-general-fact-reminder-v1');
assert.equal(report.status, 'complete_structural_observations_unreviewed');
assert.equal(report.git_head, 'e2065219cb521c41e85248fd40b1afa4a9b51967');
assert.equal(report.git_status, 'M docs/architecture/014-result-history-selection.md');
assert.equal(report.harness_sha256, hash(await fs.readFile(path.join(root,
  'eval/scripts/probe-vivo-general-fact-reminder.mjs'))));
assert.equal(report.baseline_report_sha256,
  '1334cd24bd471f0c7ce9e9ac0d29459706b2da943939fbc1f4ddb830c3c3a7cd');
assert.equal(report.baseline_journal_sha256,
  '3b680456c4166ae54e2ce4cc7f374e85f68639c88a4f1b0a9d5730f30c58062d');
assert.equal(report.source_sha256,
  '8c41e66f52000a5b67ab27bfc319accd11d89290b60e50fc5c60f4ee8230a000');
assert.equal(report.model_sha256,
  '9f96256500f3fc1ab4d64336b58f52a949a95ad7516b0c229476eef782f9f77b');
assert.equal(report.runtime_sha256,
  '6f15be27bd80b6b4d52afefa49094e18fcfab55d5da354d717971f2d2537b2f4');
assert.equal(report.reminder_sha256,
  'be09abfed1206410d6e6f5d981536a1dde9ccdb2724eb665c2429a29fb835898');
assert.equal(report.limits.chat_requests, 28);
assert.equal(report.limits.retries, 0);
assert.equal(report.failures.length, 0);
assert.equal(report.planned_requests.length, 28);
assert.equal(report.requests.length, 28);
assert.equal(raw.length, 28);
assert.equal(baseline.length, 28);
let natural = 0;
let authored = 0;
for (let index = 0; index < raw.length; index++) {
  const row = raw[index];
  const previous = baseline[index];
  const observed = report.requests[index];
  const planned = report.planned_requests[index];
  assert.equal(row.case_id, previous.case_id);
  assert.equal(row.seed, previous.seed);
  assert.equal(row.source_zh, previous.source_zh);
  assert.equal(row.request.model, previous.request.model);
  assert.equal(row.baseline_request_sha256, previous.request_sha256);
  assert.equal(row.baseline_request_sha256, observed.baseline_request_sha256);
  assert.equal(row.variant_request_sha256, observed.variant_request_sha256);
  assert.equal(row.variant_request_sha256, planned.variant_request_sha256);
  assert.equal(hash(Buffer.from(JSON.stringify(row.request))), row.variant_request_sha256);
  const prompt = row.request.messages[0].content;
  assert.equal(hash(Buffer.from(prompt)), row.variant_prompt_sha256);
  const originalPrompt = previous.request.messages[0].content;
  assert.equal(prompt.replace(report.reminder, ''), originalPrompt);
  const requestWithoutReminder = structuredClone(row.request);
  requestWithoutReminder.messages[0].content = originalPrompt;
  assert.deepEqual(requestWithoutReminder, previous.request);
  assert(!/\p{Script=Cyrillic}/u.test(prompt));
  assert.equal(row.http_status, 200);
  assert.equal(row.finish_reason, 'stop');
  assert.equal(row.structural_outcome, 'valid_unreviewed');
  assert.equal(row.accepted_candidate, observed.accepted_candidate);
  const translation = JSON.parse(row.raw_candidate).translations;
  assert.equal(translation.length, 1);
  assert.equal(translation[0].segment_id, row.target_segment_id);
  assert.equal(translation[0].line_index, 0);
  assert.equal(translation[0].text, row.accepted_candidate);
  if (row.kind === 'natural') natural++;
  else {
    authored++;
    const control = controls.cases.find(item => item.id === row.case_id);
    assert(control);
    assert(!prompt.includes(control.expected_meaning_en));
  }
}
assert.equal(natural, 10);
assert.equal(authored, 18);
assert.equal(report.requests.reduce((sum, row) => sum + row.usage.prompt_tokens, 0), 8080);
assert.equal(report.requests.reduce((sum, row) => sum + row.usage.completion_tokens, 0), 1430);
assert.equal(report.requests.reduce((sum, row) => sum + row.elapsed_ms, 0), 24608);
assert.equal(report.wall_elapsed_ms, 30958);
assert.equal(report.resources.samples.length, 6);
assert.equal(Math.max(...report.resources.samples.map(item => item.processes[0].WorkingSet64)),
  5061095424);
assert.equal(Math.max(...report.resources.samples.map(item => Number(item.gpu_device.split(',')[1]))),
  5742);
const redacted = JSON.parse(await fs.readFile(path.join(root,
  'eval/reports/2026-09-30-vivo-general-fact-reminder-summary.json'), 'utf8'));
assert.equal(redacted.private_report_sha256, reportSha256);
assert.equal(redacted.private_raw_journal_sha256, journalSha256);
assert.equal(redacted.requests, raw.length);
assert.equal(redacted.natural_requests, natural);
assert.equal(redacted.authored_control_requests, authored);
assert.equal(redacted.structural_valid, raw.length);
assert.equal(redacted.prompt_tokens, 8080);
assert.equal(redacted.completion_tokens, 1430);
assert.equal(redacted.sum_chat_http_ms, 24608);
assert.equal(redacted.sampled_working_set_peak_bytes, 5061095424);
assert.equal(redacted.sampled_whole_device_gpu_used_peak_mib, 5742);
assert.equal(redacted.human_bilingual_reviewed_cases, 0);
assert.equal(redacted.promote_prompt, false);
console.log('General fact reminder verified: 28 exact one-sentence 7B variants, 28 valid slots, 10 natural/18 authored cases; human review missing.');
