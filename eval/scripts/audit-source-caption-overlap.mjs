import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateSourceInventory } from './source-inventory.mjs';
import { validateCrossInventorySourceGroups } from './cross-inventory-source-groups.mjs';
import { CAPTION_WINDOW_CODEPOINTS, MIN_SHARED_WINDOWS, MIN_SMALLER_SHARE,
  parseSrtText, screenCrossGroupCaptionOverlap } from './source-caption-overlap.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const mode = process.argv[2];
if (!['--build', '--check', '--build-v2', '--check-v2'].includes(mode)
    || process.argv.length !== 3) {
  throw new Error('usage: node audit-source-caption-overlap.mjs --build|--check|--build-v2|--check-v2');
}
const version = mode.endsWith('-v2') ? 'v2' : 'v1';
const reportPath = path.join(root, `eval/reports/source-caption-overlap-${version}.json`);
const manifestPaths = [
  'eval/corpora/commons-inspected-candidates-v2.json',
  'eval/corpora/commons-cc-commerce-candidate-v1.json',
  'eval/corpora/youtube-mingfay-candidate-v1.json',
  'eval/corpora/commons-ying-candidate-v1.json',
  'eval/corpora/commons-vivo-candidate-v1.json',
  'eval/corpora/commons-geekerwan-two-scenes-candidate-v2.json',
  'eval/corpora/commons-sethlui-candidate-v1.json',
  'eval/corpora/paywall-chinese-candidate-v1.json',
  'eval/corpora/youtube-geekerwan-kirin-original-candidate-v1.json',
];
if (version === 'v2') {
  manifestPaths.push('eval/corpora/commons-wikipedia-lesson-candidate-v1.json');
}
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');

const manifestRecords = await Promise.all(manifestPaths.map(async file => {
  const bytes = await readFile(path.join(root, file));
  const inventory = JSON.parse(bytes.toString('utf8'));
  validateSourceInventory(inventory);
  return { path: file, sha256: sha256(bytes), inventory };
}));
const inventories = manifestRecords.map(record => record.inventory);
const identity = validateCrossInventorySourceGroups(inventories);
const sourceRecords = await Promise.all(inventories.flatMap(inventory => inventory.sources).map(async source => {
  const bytes = await readFile(path.join(root, source.local_candidate_path));
  const hash = sha256(bytes);
  assert.equal(hash, source.sha256, `${source.id}: source bytes differ from manifest`);
  const parsed = parseSrtText(bytes.toString('utf8'));
  assert.equal(parsed.cue_count, source.cue_count, `${source.id}: cue count differs from manifest`);
  return { id: source.id, group_id: source.group_id, sha256: hash,
    cue_count: parsed.cue_count, text: parsed.text };
}));
const screen = screenCrossGroupCaptionOverlap(sourceRecords);
const report = {
  schema_version: 1,
  method: { normalization: 'NFC lowercase Unicode letters and numbers; concatenate cue text',
    window_codepoints: CAPTION_WINDOW_CODEPOINTS, min_shared_windows: MIN_SHARED_WINDOWS,
    min_smaller_share: MIN_SMALLER_SHARE },
  manifests: manifestRecords.map(({ path: file, sha256: hash }) => ({ path: file, sha256: hash })),
  source_count: identity.source_count,
  media_group_count: identity.group_count,
  compared_pairs: screen.compared_pairs,
  sources: screen.sources.map(item => {
    const original = sourceRecords.find(source => source.id === item.id);
    return { ...item, sha256: original.sha256, cue_count: original.cue_count };
  }),
  flagged_pairs: screen.flagged_pairs,
  same_group_pairs: screen.same_group_pairs,
};
const serialized = `${JSON.stringify(report, null, 2)}\n`;
if (mode.startsWith('--build')) await writeFile(reportPath, serialized);
else assert.equal(await readFile(reportPath, 'utf8'), serialized, 'caption-overlap report differs from current source bytes');
console.log(`Caption overlap ${mode}: ${report.source_count} tracks, ${report.media_group_count} media groups, ${report.compared_pairs} cross-group pairs, ${report.flagged_pairs.length} flagged.`);
if (report.flagged_pairs.length) {
  throw new Error(`cross-group caption overlap needs adjudication: ${JSON.stringify(report.flagged_pairs)}`);
}
