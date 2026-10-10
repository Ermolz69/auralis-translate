import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parsePinnedSrt } from './cross-source-relation-screen.mjs';
import { sourceRelationWarningsV3 } from './source-relation-review-v3.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const sourceRoot = process.env.AURALIS_EVAL_SOURCE_ROOT;
const draftRoot = process.env.AURALIS_EVAL_DRAFT_ROOT;
assert(sourceRoot && path.isAbsolute(sourceRoot));
assert(draftRoot && path.isAbsolute(draftRoot));
const sha = value => createHash('sha256').update(value).digest('hex');
const read = relative => fs.readFile(path.join(root, relative));
const [packBytes, reviewBytes, reportBytes] = await Promise.all([
  read('eval/regressions/reg-083-asus-hall-stick-substitution-v1.json'),
  read('eval/reports/2026-10-10-asus-source-relations-v3-ai-review.json'),
  read('eval/reports/2026-10-10-asus-source-relations-v3.json'),
]);
const pack = JSON.parse(packBytes);
const review = JSON.parse(reviewBytes);
const report = JSON.parse(reportBytes);
assert.equal(pack.id, 'REG-083');
assert.equal(pack.machine_report_sha256, sha(reportBytes));
assert.equal(pack.ai_review_sha256, sha(reviewBytes));
assert.equal(review.machine_report_sha256, sha(reportBytes));
assert.equal(review.human_bilingual_reviews, 0);
assert.deepEqual(review.reviewed_cue_ids, [24, 226, 253]);
assert.equal(review.cases[0].ai_judgment,
  'major_technical_term_substitution');
assert.equal(report.observations.recognized_new_fact_count, 3);
assert.equal(report.observations.warning_count, 0);
assert.equal(pack.related_controls.length, 3);
assert.equal(pack.negative_controls.length, 3);
assert.equal(pack.control_model_runs, 0);

async function privateSrt(base, relative, expected) {
  const bytes = await fs.readFile(path.join(base, relative));
  assert.equal(sha(bytes), expected);
  return parsePinnedSrt(bytes);
}

const source = await privateSrt(sourceRoot,
  '.cache/eval/commons-asus-rog-ally-892592485/source.zh.srt',
  pack.minimal_reproducer.source_srt_sha256);
const target = await privateSrt(draftRoot,
  '.cache/eval/v8-asus-single-target-v1/attempt-dVT3zA/7b/candidate.ru.srt',
  pack.minimal_reproducer.retained_draft_sha256);
assert.equal(source.length, 268);
assert.equal(target.length, 268);
const cue = source[23];
const translated = target[23];
assert.equal(cue.id, 24);
assert.equal(translated.id, cue.id);
assert.equal(cue.timing, translated.timing);
assert.equal(sha(cue.text), pack.minimal_reproducer.source_text_sha256);
assert.equal(sha(translated.text),
  pack.minimal_reproducer.accepted_text_sha256);
assert.equal(translated.text.includes('гальванометрическим'), true);
assert.equal(sourceRelationWarningsV3(cue, source[22], source[24],
  translated.text).length, 0);
assert.equal(pack.minimal_reproducer.v3_warning_count, 0);
console.log(JSON.stringify({ status: 'verified_reg083_ai_labeled_miss',
  pack_sha256: sha(packBytes), source_cue_id: cue.id,
  v3_warnings: 0, new_related_controls: 3,
  new_negative_controls: 3, human_reviews: 0 }));
