import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const directory = path.join(root, '.cache/eval/commons-vivo-fact-model-screen-v1/run-uuRubD');
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const readPinned = async (file, expected) => {
  const bytes = await fs.readFile(file);
  assert.equal(hash(bytes), expected, file);
  return bytes;
};
const report = JSON.parse(await readPinned(path.join(directory, 'report.json'),
  '1334cd24bd471f0c7ce9e9ac0d29459706b2da943939fbc1f4ddb830c3c3a7cd'));
const journalBytes = await readPinned(path.join(directory, 'requests.jsonl'),
  '3b680456c4166ae54e2ce4cc7f374e85f68639c88a4f1b0a9d5730f30c58062d');
const raw = journalBytes.toString('utf8').trimEnd().split(/\r?\n/u).map(JSON.parse);
const corpus = JSON.parse(await readPinned(path.join(root,
  'eval/corpora/vivo-fact-controls-v1.json'),
  '3119d4d1c0b6489618d214808662195f0c1d6d0d47946a4726fcd5d7409a67ef'));
assert.equal(report.id, 'commons-vivo-fact-model-screen-v1');
assert.equal(report.status, 'complete_with_failures_unreviewed');
assert.equal(report.git_head, 'c187a83fefa5b76c146d422e75d2015f2ee3e0f3');
assert.equal(report.harness_sha256, hash(await fs.readFile(path.join(root,
  'eval/scripts/probe-vivo-fact-model-screen.mjs'))));
assert.equal(report.source_sha256,
  '8c41e66f52000a5b67ab27bfc319accd11d89290b60e50fc5c60f4ee8230a000');
assert.equal(report.control_sha256,
  '3119d4d1c0b6489618d214808662195f0c1d6d0d47946a4726fcd5d7409a67ef');
assert.equal(report.limits.chat_requests, 56);
assert.equal(report.limits.retries, 0);
assert.equal(report.planned_requests.length, 56);
assert.equal(report.requests.length, 56);
assert.equal(raw.length, 56);
assert.equal(report.failures.length, 0);
const aliases = { '1b': 'auralis-hy-mt2-1.8b-q4', '7b': 'auralis-hy-mt2-7b-q4' };
for (let index = 0; index < raw.length; index++) {
  const item = raw[index];
  const observed = report.requests[index];
  const planned = report.planned_requests[index];
  assert.equal(item.request.model, aliases[item.model]);
  assert.equal(hash(Buffer.from(JSON.stringify(item.request))), item.request_sha256);
  assert.equal(hash(Buffer.from(item.request.messages[0].content)), item.prompt_sha256);
  assert.equal(item.request_sha256, observed.request_sha256);
  assert.equal(item.request_sha256, planned.request_sha256);
  assert.equal(item.prompt_sha256, observed.prompt_sha256);
  assert.equal(item.prompt_sha256, planned.prompt_sha256);
  assert.equal(item.case_id, observed.case_id);
  assert.equal(item.seed, observed.seed);
  assert.equal(item.http_status, 200);
  assert.equal(item.finish_reason, 'stop');
  assert.equal(item.structural_outcome, observed.structural_outcome);
  assert.equal(item.accepted_candidate ?? null, observed.accepted_candidate);
  assert(!/\p{Script=Cyrillic}/u.test(item.request.messages[0].content));
  const envelope = JSON.parse(item.request.messages[0].content.split('Input JSON:\n')[1]);
  assert.equal(envelope.target_slots.length, 1);
  assert.equal(envelope.target_slots[0].source_original, item.source_zh);
  if (item.kind !== 'natural') {
    const control = corpus.cases.find(row => row.id === item.case_id);
    assert(control);
    assert.equal(control.source_zh, item.source_zh);
    assert(!item.request.messages[0].content.includes(control.expected_meaning_en));
  }
}
for (const first of raw.filter(item => item.model === '1b')) {
  const second = raw.find(item => item.model === '7b'
    && item.case_id === first.case_id && item.seed === first.seed);
  assert(second);
  const same = structuredClone(second.request);
  same.model = first.request.model;
  assert.deepEqual(same, first.request);
}
const failed = raw.filter(item => item.structural_outcome !== 'valid_unreviewed');
assert.equal(failed.length, 1);
assert.equal(failed[0].model, '1b');
assert.equal(failed[0].case_id, 'vivo-280');
assert.equal(failed[0].seed, 101);
assert.equal(failed[0].request_sha256,
  '992c2ff2cea18a81ebe4e14d539f745e52949d0bfc63248f45f9923bdf920d76');
assert.equal(hash(Buffer.from(failed[0].raw_response)),
  'ce9a1b853e40c10d3bcba257d1b37912e0d3c9fac0aecd6b931a036026b1eec2');
assert.equal(hash(Buffer.from(failed[0].raw_candidate)),
  'b858492372a10d365099d9d39ddf79123c5f4e4d06b378fd3239430b7fe57729');
assert.equal(JSON.parse(failed[0].raw_candidate).translations[0].segment_id, 281);
assert.equal(JSON.parse(failed[0].request.messages[0].content.split('Input JSON:\n')[1])
  .target_slots[0].segment_id, 280);
for (const [model, expected] of Object.entries({
  '1b': { count: 28, valid: 27, prompt: 6441, completion: 1337, http_ms: 11135,
    working_set: 1543995392, gpu_mib: 2231 },
  '7b': { count: 28, valid: 28, prompt: 6512, completion: 1412, http_ms: 24492,
    working_set: 5060325376, gpu_mib: 5749 },
})) {
  const rows = report.requests.filter(item => item.model === model);
  assert.equal(rows.length, expected.count);
  assert.equal(rows.filter(item => item.structural_outcome === 'valid_unreviewed').length,
    expected.valid);
  assert.equal(rows.reduce((sum, item) => sum + item.usage.prompt_tokens, 0), expected.prompt);
  assert.equal(rows.reduce((sum, item) => sum + item.usage.completion_tokens, 0),
    expected.completion);
  assert.equal(rows.reduce((sum, item) => sum + item.elapsed_ms, 0), expected.http_ms);
  const samples = report.resources[model].samples;
  assert.equal(Math.max(...samples.map(item => item.processes[0].WorkingSet64)),
    expected.working_set);
  assert.equal(Math.max(...samples.map(item => Number(item.gpu_device.split(',')[1]))),
    expected.gpu_mib);
}
console.log('Vivo paired fact screen verified: 56 exact raw requests, 55 valid JSON slots, one safely rejected neighbor ID; human review missing.');
