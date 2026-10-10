import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const privateRoot = path.join(root, '.cache/eval/official-zh-ru-reference-2026');
const pack = JSON.parse(await fs.readFile(path.join(root,
  'eval/regressions/reg-085-retrospective-context-tense-v1.json')));
const reviewBytes = await fs.readFile(path.join(root,
  'eval/reports/2026-10-10-official-reference-v2-ai-review.json'));
const reportBytes = await fs.readFile(path.join(root,
  'eval/reports/2026-10-10-official-reference-v2.json'));
const source = JSON.parse(await fs.readFile(path.join(privateRoot,
  'source-cases-v2.json')));
const raw = (await fs.readFile(path.join(privateRoot,
  'attempt-v2-r7mfWG/requests.jsonl'), 'utf8')).trimEnd()
  .split(/\r?\n/u).map(JSON.parse);
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
assert.equal(pack.id, 'REG-085');
assert.equal(pack.machine_report_sha256, sha(reportBytes));
const review = JSON.parse(reviewBytes);
assert.equal(review.machine_report_sha256, sha(reportBytes));
assert.equal(review.ai_major_errors, 1);
assert.equal(review.human_reviews_of_model_output, 0);
const observed = raw.find(row => row.id === 'policy_stability');
const input = source.cases.find(row => row.id === observed.id);
assert(observed && input);
assert.equal(observed.status, 'valid_unreviewed');
assert.equal(pack.minimal_reproducer.context_source_sha256,
  sha(Buffer.from(input.context)));
assert.equal(pack.minimal_reproducer.target_source_sha256,
  sha(Buffer.from(input.source)));
assert.equal(pack.minimal_reproducer.request_sha256,
  observed.request_sha256);
assert.equal(pack.minimal_reproducer.accepted_text_sha256,
  observed.accepted_text_sha256);
assert.equal(pack.related_controls.length, 3);
assert.equal(pack.negative_controls.length, 3);
assert.equal(pack.control_model_runs, 0);
const controls = [...pack.related_controls, ...pack.negative_controls];
assert.equal(new Set(controls.map(row => row.id)).size, controls.length);
for (const control of controls) {
  assert(/[\u4e00-\u9fff]/u.test(control.source_line));
  assert.equal(typeof control.expected_fact, 'string');
  assert(control.expected_fact.length > 15);
}
assert(pack.related_controls.some(row => row.context.includes('2025')));
assert(pack.negative_controls.some(row => row.context.includes('2026')));
assert(pack.negative_controls.some(row => row.source_line.includes('将')));
console.log('REG-085 verified: one pinned reproducer, six unrun polarity/context controls');
