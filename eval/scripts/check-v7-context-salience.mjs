import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve('.');
const digest = data => createHash('sha256').update(data).digest('hex');
const summary = JSON.parse(fs.readFileSync(path.join(root,
  'eval/reports/2026-10-02-v7-context-salience.json')));
const controls = JSON.parse(fs.readFileSync(path.join(root,
  'eval/regressions/v7-context-salience-controls-v1.json')));
assert.equal(controls.extends, 'REG-051');
assert.equal(controls.related_controls.length, 2);
assert.equal(controls.negative_controls.length, 2);
assert.equal(controls.human_review_count, 0);
assert.equal(summary.experiment, 'v7-context-salience-v1');
assert.equal(summary.source_split, 'authored_development_not_holdout');
assert.equal(summary.release_gate, 'open');
assert.equal(summary.attempts.length, 2);
const attempts = summary.attempts.map(item => {
  const bytes = fs.readFileSync(path.join(root, item.private_report));
  assert.equal(digest(bytes), item.private_report_sha256);
  return JSON.parse(bytes);
});
const [sandbox, report] = attempts;
assert.equal(sandbox.status, 'failed');
assert.match(sandbox.failures[0].message, /spawnSync git EPERM/u);
assert.equal(sandbox.requests.length, 0);
assert.equal(report.status, 'complete_outer_json_unreviewed');
assert.equal(report.requests.length, 4);
assert.deepEqual(report.requests.map(({ seed, context }) => [seed, context]),
  [[101, true], [101, false], [202, false], [202, true]]);
assert.equal(report.expected.source, summary.source_sha256);
assert.equal(report.expected.model, summary.model_sha256);
assert.equal(report.expected.runtime, summary.runtime_sha256);
assert.equal(report.expected.request, summary.baseline_request_sha256);
assert.equal(report.limits.chats, 4);
assert.equal(report.limits.retries, 0);
assert(report.wall_elapsed_ms <= report.limits.wall_ms);
assert.equal(report.failures.length, 0);
assert.equal(summary.attempts[1].wall_ms, report.wall_elapsed_ms);
assert.equal(summary.attempts[1].human_review_count, 0);

const prose = fs.readFileSync(path.join(root,
  'eval/experiments/2026-10-02-v7-context-salience-result.md'), 'utf8');
const lines = fs.readFileSync(path.join(root,
  'eval/corpora/v7-batch-development-v1.zh.srt'), 'utf8');
assert.equal(digest(Buffer.from(lines)), summary.source_sha256);
const marker = 'Input JSON:\n';
const journalPath = path.join(root, path.dirname(summary.attempts[1].private_report),
  'requests.jsonl');
const journal = fs.readFileSync(journalPath, 'utf8').trimEnd()
  .split(/\r?\n/u).map(JSON.parse);
assert.equal(journal.length, 4);
const expectedTexts = {
  true: 'Этот билет стоит десять юаней, не нужно платить сто юаней.',
  false: 'Менеджер Ванг сказал, что завтра не будет пятница.',
};
for (const [index, entry] of journal.entries()) {
  const row = report.requests[index];
  const published = summary.pairs.find(pair => pair.seed === entry.seed)
    [entry.context ? 'context_on' : 'context_off'];
  assert.equal(row.seed, entry.seed);
  assert.equal(row.context, entry.context);
  assert.equal(row.request_sha256, digest(Buffer.from(JSON.stringify(entry.request))));
  assert.equal(row.request_sha256, entry.request_sha256);
  assert.equal(row.prompt_sha256, digest(Buffer.from(entry.request.messages[0].content)));
  assert.equal(row.raw_response_sha256, digest(Buffer.from(entry.raw_response)));
  assert.equal(row.parsed_candidate, expectedTexts[String(entry.context)]);
  assert.equal(entry.parsed_candidate, expectedTexts[String(entry.context)]);
  assert.equal(entry.http_status, 200);
  assert.equal(entry.finish_reason, 'stop');
  assert.equal(entry.structural_outcome, 'outer_json_valid_unreviewed');
  assert.equal(entry.preflight.length, 2);
  assert.deepEqual(entry.preflight.map(item => item.path), ['/apply-template', '/tokenize']);
  assert(entry.preflight.every(item => item.http_status === 200));
  const rendered = JSON.parse(entry.preflight[0].raw_response).prompt;
  assert.equal(entry.preflight[1].request.content, rendered);
  const tokens = JSON.parse(entry.preflight[1].raw_response).tokens;
  assert.equal(tokens.length, row.prompt_tokens_preflight);
  assert.equal(tokens.length, entry.usage.prompt_tokens);
  assert.equal(tokens.length, published.prompt_tokens);
  assert.equal(entry.usage.completion_tokens, published.completion_tokens);
  assert.equal(entry.chat_elapsed_ms, published.chat_ms);
  const candidate = JSON.parse(JSON.parse(entry.raw_response).choices[0].message.content);
  assert.equal(candidate.translations[0].segment_id, 1);
  assert.equal(candidate.translations[0].line_index, 0);
  assert.equal(candidate.translations[0].text, expectedTexts[String(entry.context)]);
  const prompt = entry.request.messages[0].content;
  assert.equal(prompt.split(marker).length, 2);
  assert(!/\p{Script=Cyrillic}/u.test(prompt));
  const envelope = JSON.parse(prompt.split(marker)[1]);
  assert.equal(envelope.target_slots[0].source_original,
    '王经理说，明天不是星期五。');
  assert.deepEqual(envelope.source_context.map(item => item.segment_id),
    entry.context ? [2] : []);
  assert(prose.includes(entry.parsed_candidate));
}
for (const seed of [101, 202]) {
  const pair = journal.filter(entry => entry.seed === seed);
  assert.equal(pair.length, 2);
  const [first, second] = pair.map(entry => structuredClone(entry.request));
  const left = JSON.parse(first.messages[0].content.split(marker)[1]);
  const right = JSON.parse(second.messages[0].content.split(marker)[1]);
  assert.deepEqual({ ...left, source_context: [] }, { ...right, source_context: [] });
  assert.deepEqual({ ...first, messages: [] }, { ...second, messages: [] });
}
assert.equal(summary.resource_observation.samples, report.resources.samples.length);
assert.equal(summary.resource_observation.server_working_set_bytes,
  report.resources.samples[0].processes[0].WorkingSet64);
assert.equal(summary.resource_observation.gpu_device_used_mib,
  Number(report.resources.samples[0].gpu_device.split(',')[1]));
console.log('V7 context salience: four pinned real responses and both paired factors verified; human review remains zero.');
