import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parsePinnedSrt } from './cross-source-relation-screen.mjs';
import { hasExplicitSourceQuantityV2, sourceQuantityFeatureV2Identity } from
  './source-quantity-feature-v2.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const mode = process.argv[2];
assert(['--preflight', '--capture', '--check'].includes(mode) &&
  process.argv.length === 3);
const assetRoot = process.env.AURALIS_EVAL_ASSET_ROOT;
assert(assetRoot && path.isAbsolute(assetRoot));
const sourcePath = path.join(assetRoot,
  '.cache/eval/v8-vivo-original-long-v1/attempt-MAaX5T/7b/source.zh.srt');
const reportPath = path.join(root,
  'eval/reports/2026-10-10-vivo-source-quantity-feature-v2.json');
const digest = bytes => createHash('sha256').update(bytes).digest('hex');
const [sourceBytes, v1Bytes, packBytes, featureBytes] = await Promise.all([
  fs.readFile(sourcePath), fs.readFile(path.join(root,
    'eval/reports/2026-10-10-vivo-source-quantity-feature-v1.json')),
  fs.readFile(path.join(root,
    'eval/regressions/reg-074-source-quantity-false-positives-v1.json')),
  fs.readFile(path.join(root,
    'eval/scripts/source-quantity-feature-v2.mjs')),
]);
assert.equal(digest(sourceBytes),
  'b100803367b95fa55fc638b1ff39a0abfa0d5b8183ebe58d58b1a87242d9d8c4');
assert.equal(digest(v1Bytes),
  'f13d6efcd08e0a166055551050d110a2b8b81c9f42e62b12d210a764477d64ec');
const v1 = JSON.parse(v1Bytes);
const pack = JSON.parse(packBytes);
assert.equal(pack.v1_report_sha256, digest(v1Bytes));
const cues = parsePinnedSrt(sourceBytes);
assert.equal(cues.length, 467);
assert.equal(v1.source_cues, cues.length);
for (const caseFile of pack.minimal_reproducers) {
  const source = cues[caseFile.cue_id - 1];
  assert.equal(source.id, caseFile.cue_id);
  assert.equal(digest(Buffer.from(source.text)), caseFile.source_text_sha256);
  assert(v1.matches.some(row => row.id === source.id &&
    row.source_text_sha256 === caseFile.source_text_sha256));
}
if (mode === '--preflight') {
  console.log(JSON.stringify({ status: 'source_and_v1_verified',
    source_cues: cues.length, v1_matches: v1.matched_cues,
    pinned_false_positives: pack.minimal_reproducers.length }));
  process.exit(0);
}
const matches = cues.filter(cue => hasExplicitSourceQuantityV2(cue.text))
  .map(cue => ({ id: cue.id,
    source_text_sha256: digest(Buffer.from(cue.text)) }));
const v1Ids = new Set(v1.matches.map(row => row.id));
const v2Ids = new Set(matches.map(row => row.id));
const removedIds = [...v1Ids].filter(id => !v2Ids.has(id)).sort((a, b) => a - b);
const addedIds = [...v2Ids].filter(id => !v1Ids.has(id)).sort((a, b) => a - b);
const knownFalsePositives = pack.minimal_reproducers.map(row => ({
  id: row.cue_id, v1_match: row.v1_match,
  expected_v2_match: row.expected_v2_match,
  observed_v2_match: v2Ids.has(row.cue_id) }));
for (const row of knownFalsePositives)
  assert.equal(row.observed_v2_match, row.expected_v2_match,
    `REG-074 cue ${row.id} still misclassified`);
const thirds = [
  { name: 'beginning', first: 1, last: 156 },
  { name: 'middle', first: 157, last: 312 },
  { name: 'end', first: 313, last: 467 },
].map(({ name, first, last }) => ({ name, first, last,
  matched_cues: matches.filter(row => row.id >= first && row.id <= last).length }));
const report = { schema_version: 1,
  experiment: 'VIVO-SOURCE-QUANTITY-FEATURE-2026-10-10-v2',
  split: 'same_exposed_source_development_not_holdout',
  source_sha256: digest(sourceBytes), v1_report_sha256: digest(v1Bytes),
  regression_pack_sha256: digest(packBytes),
  feature_source_sha256: digest(featureBytes),
  feature_identity: sourceQuantityFeatureV2Identity,
  source_cues: cues.length, v1_matched_cues: v1.matched_cues,
  v2_matched_cues: matches.length, thirds, removed_ids: removedIds,
  added_ids: addedIds, known_false_positives: knownFalsePositives,
  matches, translation_drafts_read: 0, model_requests: 0,
  asr_requests: 0, tts_requests: 0, human_bilingual_reviews: 0,
  accepted_translation: false };
const output = `${JSON.stringify(report, null, 2)}\n`;
if (mode === '--capture') await fs.writeFile(reportPath, output, { flag: 'wx' });
else assert.equal(await fs.readFile(reportPath, 'utf8'), output);
console.log(JSON.stringify({ status: mode === '--capture' ? 'captured' : 'verified',
  source_cues: cues.length, v1_matched_cues: v1.matched_cues,
  v2_matched_cues: matches.length, removed_ids: removedIds,
  added_ids: addedIds, report_sha256: digest(Buffer.from(output)) }));
