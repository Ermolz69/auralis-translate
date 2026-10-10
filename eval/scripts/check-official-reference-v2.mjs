import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { decodeTechnicalSenseReply } from './vivo-technical-senses-v2.mjs';

const mode = process.argv[2];
assert(['--capture', '--check'].includes(mode) && process.argv.length === 3);
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const privateRoot = path.join(root, '.cache/eval/official-zh-ru-reference-2026');
const reportPath = path.join(root,
  'eval/reports/2026-10-10-official-reference-v2.json');
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const read = relative => fs.readFile(path.join(root, relative));
const pinned = {
  v1_journal: '6a8997c45c0a1817ef88c0d89a21d469acb7ab93cca581c2b48d631372293b49',
  v1_report: '4f9cfc9d5a418007367b33eb4d8c1e5c481603a28020efa17c8a0b8edc844562',
  v2_journal: 'ab9b33335feead4def7c48037ccddf72213177ad2d8680d356d2ab2a63244748',
  v2_report: 'd0080ae186385f34651ad540f2481bd837546f421de835ba9a7a40c35048fbaf',
  reference_pairs: 'f3d2b1e4454c2869bf0d81d0f5babe17bce6e266ebc6bb50122d1df3754759f1',
  source: '026b7189bea819b0b4ccdcde8480cb1da4483305207ac5c5f6e4554ead2e00fa',
  pdf: 'dc029d7ebc4b43d599348943dca8229108df81d3c932df2ccbb72df43da82ea8',
  freeze: 'cae2a4ad7cbc314d00aa021051b21aae1f5b04c2e1129627ff78aabc81c66629',
};
const paths = {
  v1_journal: path.join(privateRoot, 'attempt-6yYSEh/requests.jsonl'),
  v1_report: path.join(privateRoot, 'attempt-6yYSEh/report.json'),
  v2_journal: path.join(privateRoot, 'attempt-v2-r7mfWG/requests.jsonl'),
  v2_report: path.join(privateRoot, 'attempt-v2-r7mfWG/report.json'),
  reference_pairs: path.join(privateRoot, 'reference-pairs-v2.json'),
  source: path.join(privateRoot, 'source-cases-v2.json'),
  pdf: path.join(privateRoot, 'source-reference.pdf'),
  freeze: path.join(root,
    'eval/experiments/2026-10-10-official-zh-ru-reference-v2-freeze.json'),
};
const bytes = {};
for (const [key, file] of Object.entries(paths)) {
  bytes[key] = await fs.readFile(file);
  assert.equal(sha(bytes[key]), pinned[key], `Pinned ${key} changed`);
}
const freeze = JSON.parse(bytes.freeze);
const source = JSON.parse(bytes.source);
const references = JSON.parse(bytes.reference_pairs);
const v1 = bytes.v1_journal.toString('utf8').trimEnd().split(/\r?\n/u)
  .map(JSON.parse);
const v2 = bytes.v2_journal.toString('utf8').trimEnd().split(/\r?\n/u)
  .map(JSON.parse);
const run = JSON.parse(bytes.v2_report);
assert.equal(run.status, 'complete_unreviewed');
assert.deepEqual(run.failures, []);
assert.equal(run.freeze_sha256, pinned.freeze);
assert.equal(v2.length, 6);
assert.equal(run.requests.length, v2.length);
assert.deepEqual(v2.map(row => row.id), source.cases.map(row => row.id));
assert.deepEqual(v2.map(row => row.id), freeze.planned.map(row => row.id));
assert.deepEqual(references.pairs.map(row => row.id),
  source.cases.map(row => row.id));
assert.equal(references.source_pdf_sha256, pinned.pdf);
for (const [index, row] of v2.entries()) {
  const identity = freeze.planned[index];
  assert.equal(row.status, 'valid_unreviewed');
  assert.equal(row.source_sha256, identity.source_sha256);
  assert.equal(row.request_sha256, identity.request_sha256);
  assert.equal(sha(Buffer.from(JSON.stringify(row.request))),
    row.request_sha256);
  assert.equal(row.accepted_text,
    decodeTechnicalSenseReply(row.chat.raw_response, row.target_id));
  assert.equal(sha(Buffer.from(row.accepted_text)),
    row.accepted_text_sha256);
  assert.equal(row.preflight.length, 2);
  assert(!/[А-Яа-яЁё]/u.test(JSON.stringify(row.request)),
    'Published Russian reference leaked into a model request');
  assert.equal(references.pairs[index].source_sha256,
    row.source_sha256);
}
const previous = v1.find(row => row.id === 'policy_stability');
assert(previous);
assert.equal(previous.accepted_text_sha256,
  v2.find(row => row.id === 'policy_stability').accepted_text_sha256);
const samples = run.resources.server.samples.flatMap(row => row.processes);
const summary = {
  schema_version: 1, experiment: freeze.experiment,
  split: freeze.split, outcome: 'technical_complete_ai_review_pending',
  pinned, raw_attempt_git_head: run.git_head,
  source_cases: v2.length, complete_answers: v2.length,
  preflights: v2.reduce((sum, row) => sum + row.preflight.length, 0),
  reported_total_tokens: run.total_tokens,
  wall_ms: run.elapsed_ms,
  chat_elapsed_ms: v2.reduce((sum, row) => sum + row.chat.elapsed_ms, 0),
  peak_sampled_process_working_set_bytes: Math.max(...samples.map(row =>
    row.WorkingSet64)),
  cases: v2.map(row => ({ id: row.id, page: row.page,
    source_sha256: row.source_sha256,
    request_sha256: row.request_sha256,
    accepted_text_sha256: row.accepted_text_sha256,
    reported_tokens: row.usage.total_tokens,
    chat_elapsed_ms: row.chat.elapsed_ms })),
  previous_policy_answer_byte_identical: true,
  published_reference_pairs: references.pairs.length,
  human_model_output_reviews: 0,
  model_calls_in_this_checker: 0,
};
const output = `${JSON.stringify(summary, null, 2)}\n`;
if (mode === '--capture')
  await fs.writeFile(reportPath, output, { flag: 'wx' });
else assert.equal(await fs.readFile(reportPath, 'utf8'), output);
console.log(`Official reference v2 ${mode}: ${v2.length} pinned raw replies verified`);
