import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parsePinnedSrt } from './cross-source-relation-screen.mjs';
import { hasExplicitSourceQuantity, sourceQuantityFeatureVersion } from
  './source-quantity-feature-v1.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const mode = process.argv[2];
assert(['--preflight', '--capture', '--check'].includes(mode) &&
  process.argv.length === 3);
const assetRoot = process.env.AURALIS_EVAL_ASSET_ROOT;
assert(assetRoot && path.isAbsolute(assetRoot));
const sourcePath = path.join(assetRoot,
  '.cache/eval/v8-vivo-original-long-v1/attempt-MAaX5T/7b/source.zh.srt');
const reportPath = path.join(root,
  'eval/reports/2026-10-10-vivo-source-quantity-feature-v1.json');
const digest = bytes => createHash('sha256').update(bytes).digest('hex');
const sourceBytes = await fs.readFile(sourcePath);
const sourceSha256 = digest(sourceBytes);
assert.equal(sourceSha256,
  'b100803367b95fa55fc638b1ff39a0abfa0d5b8183ebe58d58b1a87242d9d8c4');
const cues = parsePinnedSrt(sourceBytes);
assert.equal(cues.length, 467);
assert.deepEqual(cues.map(cue => cue.id),
  Array.from({ length: 467 }, (_, index) => index + 1));
const featureSourceSha256 = digest(await fs.readFile(path.join(root,
  'eval/scripts/source-quantity-feature-v1.mjs')));
if (mode === '--preflight') {
  console.log(JSON.stringify({ status: 'source_verified', source_cues: cues.length,
    source_sha256: sourceSha256 }));
  process.exit(0);
}
const matches = cues.filter(cue => hasExplicitSourceQuantity(cue.text))
  .map(cue => ({ id: cue.id, source_text_sha256: digest(Buffer.from(cue.text)) }));
const thirds = [
  { name: 'beginning', first: 1, last: 156 },
  { name: 'middle', first: 157, last: 312 },
  { name: 'end', first: 313, last: 467 },
].map(({ name, first, last }) => ({ name, first, last,
  matched_cues: matches.filter(row => row.id >= first && row.id <= last).length }));
const priorGenericIds = [267, 455];
const priorGeneric = priorGenericIds.map(id => ({ id,
  has_explicit_quantity: hasExplicitSourceQuantity(cues[id - 1].text),
  source_text_sha256: digest(Buffer.from(cues[id - 1].text)) }));
const report = { schema_version: 1,
  experiment: 'VIVO-SOURCE-QUANTITY-FEATURE-2026-10-10-v1',
  scope: 'source_only_future_sampler_diagnostic_not_reg073_reselection',
  source_sha256: sourceSha256,
  feature_source_sha256: featureSourceSha256,
  feature_identity: sourceQuantityFeatureVersion,
  source_cues: cues.length, matched_cues: matches.length,
  thirds, prior_generic_examples: priorGeneric, matches,
  translation_drafts_read: 0, model_requests: 0,
  asr_requests: 0, tts_requests: 0,
  human_bilingual_reviews: 0, accepted_translation: false };
const output = `${JSON.stringify(report, null, 2)}\n`;
if (mode === '--capture') await fs.writeFile(reportPath, output, { flag: 'wx' });
else assert.equal(await fs.readFile(reportPath, 'utf8'), output);
console.log(JSON.stringify({ status: mode === '--capture' ? 'captured' : 'verified',
  source_cues: cues.length, matched_cues: matches.length,
  prior_generic_examples: priorGeneric.map(row => ({ id: row.id,
    has_explicit_quantity: row.has_explicit_quantity })),
  report_sha256: digest(Buffer.from(output)) }));
