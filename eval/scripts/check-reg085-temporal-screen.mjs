import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { decodeTechnicalSenseReply } from './vivo-technical-senses-v2.mjs';

const mode = process.argv[2];
assert(['--capture', '--check'].includes(mode) && process.argv.length === 3);
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const attempt = path.join(root,
  '.cache/eval/official-zh-ru-reference-2026/attempt-v3-cCX12t');
const reportPath = path.join(root,
  'eval/reports/2026-10-10-reg085-temporal-controls-v1.json');
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const pinned = {
  regression: 'd89cc593114654ed5ebd6af4be5989b5df834142465e28c135277d217fed94e7',
  freeze: '75862fed29a22fb05c33a1b9e44055ba18ee5ecaf4caf769e4f68a0cdfd0b671',
  journal: 'b89ffdebe24a28c69b833e4d7904acb086f0960ffb00a062ea8f9b3fcc8d45f7',
  attempt_report: '2a173d3f56ebdb88be2ebdde205da63378397407d1f726e0ee6bfd10b8669e44',
};
const paths = {
  regression: path.join(root,
    'eval/regressions/reg-085-retrospective-context-tense-v1.json'),
  freeze: path.join(root,
    'eval/experiments/2026-10-10-official-zh-ru-reference-v3-freeze.json'),
  journal: path.join(attempt, 'requests.jsonl'),
  attempt_report: path.join(attempt, 'report.json'),
};
const data = {};
for (const [key, file] of Object.entries(paths)) {
  const bytes = await fs.readFile(file);
  assert.equal(sha(bytes), pinned[key], `Pinned ${key} changed`);
  data[key] = bytes.toString('utf8');
}
const regression = JSON.parse(data.regression);
const freeze = JSON.parse(data.freeze);
const raw = data.journal.trimEnd().split(/\r?\n/u).map(JSON.parse);
const run = JSON.parse(data.attempt_report);
const controls = [...regression.related_controls,
  ...regression.negative_controls];
assert.equal(run.status, 'complete_unreviewed');
assert.deepEqual(run.failures, []);
assert.equal(run.git_status, '');
assert.equal(run.freeze_sha256, pinned.freeze);
assert.equal(freeze.experiment, 'REG-085-TEMPORAL-CONTROLS-v1');
assert.equal(freeze.expected.source, pinned.regression);
assert.equal(freeze.limits.chats, 6);
assert.equal(freeze.limits.retries, 0);
assert.equal(raw.length, 6);
assert.deepEqual(raw.map(row => row.id), controls.map(row => row.id));
assert.deepEqual(raw.map(row => row.id), freeze.planned.map(row => row.id));
assert.equal(run.requests.length, raw.length);
for (const [index, row] of raw.entries()) {
  const expected = freeze.planned[index];
  assert.equal(row.status, 'valid_unreviewed');
  assert.equal(row.target_id, expected.target_id);
  assert.equal(row.source_sha256, expected.source_sha256);
  assert.equal(row.request_sha256, expected.request_sha256);
  assert.equal(sha(Buffer.from(JSON.stringify(row.request))),
    row.request_sha256);
  assert.equal(row.accepted_text,
    decodeTechnicalSenseReply(row.chat.raw_response, row.target_id));
  assert.equal(sha(Buffer.from(row.accepted_text)),
    row.accepted_text_sha256);
  assert.equal(row.preflight.length, 2);
  assert(!JSON.stringify(row.request).includes(controls[index].expected_fact),
    `Expected fact leaked into ${row.id}`);
  assert(!/[А-Яа-яЁё]/u.test(JSON.stringify(row.request)),
    `Russian text leaked into ${row.id}`);
  assert.equal(run.requests[index].accepted_text_sha256,
    row.accepted_text_sha256);
}
const samples = run.resources.server.samples.flatMap(row => row.processes);
const summary = {
  schema_version: 1, experiment: freeze.experiment,
  split: freeze.split, status: 'complete_ai_review_separate',
  pinned, raw_attempt_git_head: run.git_head,
  model_sha256: freeze.expected.model,
  runtime_sha256: freeze.expected.runtime,
  profile_sha256: freeze.expected.manifest,
  source_cases: raw.length,
  complete_answers: raw.filter(row => row.status === 'valid_unreviewed').length,
  preflights: raw.reduce((sum, row) => sum + row.preflight.length, 0),
  reported_total_tokens: run.total_tokens,
  wall_ms: run.elapsed_ms,
  chat_elapsed_ms: raw.reduce((sum, row) => sum + row.chat.elapsed_ms, 0),
  peak_sampled_process_working_set_bytes:
    Math.max(...samples.map(row => row.WorkingSet64)),
  cases: raw.map(row => ({ id: row.id,
    source_sha256: row.source_sha256,
    request_sha256: row.request_sha256,
    accepted_text_sha256: row.accepted_text_sha256,
    reported_tokens: row.usage.total_tokens,
    chat_elapsed_ms: row.chat.elapsed_ms })),
  human_model_output_reviews: 0, model_calls_in_this_checker: 0,
};
const output = `${JSON.stringify(summary, null, 2)}\n`;
const review = JSON.parse(await fs.readFile(path.join(root,
  'eval/reports/2026-10-10-reg085-temporal-controls-v1-ai-review.json'),
  'utf8'));
assert.equal(review.machine_report_sha256, sha(Buffer.from(output)));
assert.equal(review.human_reviews_of_model_output, 0);
assert.deepEqual(review.case_reviews.map(row => row.id),
  raw.map(row => row.id));
for (const [index, row] of raw.entries())
  assert.equal(review.case_reviews[index].accepted_model_text,
    row.accepted_text);
if (mode === '--capture')
  await fs.writeFile(reportPath, output, { flag: 'wx' });
else assert.equal(await fs.readFile(reportPath, 'utf8'), output);
console.log(`REG-085 temporal ${mode}: ${raw.length} raw replies verified`);
