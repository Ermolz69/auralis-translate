import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parsePinnedSrt } from './cross-source-relation-screen.mjs';
import { selectVivoBlindspotWindows } from './vivo-blindspot-selector-v1.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const assetRoot = process.env.AURALIS_EVAL_ASSET_ROOT;
const mode = process.argv[2];
assert(['--freeze', '--check'].includes(mode) && process.argv.length === 3);
assert(assetRoot && path.isAbsolute(assetRoot));
const sourcePath = path.join(assetRoot,
  '.cache/eval/v8-vivo-original-long-v1/attempt-MAaX5T/7b/source.zh.srt');
const outputPath = path.join(root,
  'eval/experiments/2026-10-10-vivo-stratified-blindspot-v1-freeze.json');
const digest = bytes => createHash('sha256').update(bytes).digest('hex');
const [sourceBytes, selectorBytes, harnessBytes] = await Promise.all([
  fs.readFile(sourcePath),
  fs.readFile(path.join(root, 'eval/scripts/vivo-blindspot-selector-v1.mjs')),
  fs.readFile(fileURLToPath(import.meta.url)),
]);
const sourceSha =
  'b100803367b95fa55fc638b1ff39a0abfa0d5b8183ebe58d58b1a87242d9d8c4';
assert.equal(digest(sourceBytes), sourceSha);
const cues = parsePinnedSrt(sourceBytes);
assert.equal(cues.length, 467);
const selected = selectVivoBlindspotWindows(cues);
const freeze = { schema_version: 1,
  experiment: 'VIVO-STRATIFIED-BLINDSPOT-2026-10-10-v1',
  split: 'source_only_selection_exposed_development_not_holdout',
  source_sha256: sourceSha,
  selector_sha256: digest(selectorBytes),
  selection_harness_sha256: digest(harnessBytes),
  draft_files_opened_during_selection: 0,
  unique_source_cues: 45, planned_source_target_pairs: 90,
  ...selected };
const bytes = `${JSON.stringify(freeze, null, 2)}\n`;
if (mode === '--freeze') await fs.writeFile(outputPath, bytes, { flag: 'wx' });
else assert.equal(await fs.readFile(outputPath, 'utf8'), bytes);
console.log(JSON.stringify({ status: mode === '--freeze' ? 'frozen' : 'verified',
  freeze_sha256: digest(Buffer.from(bytes)),
  windows: selected.windows.map(({ third, kind, start, end,
    feature_met }) => ({ third, kind, start, end, feature_met })) }));
