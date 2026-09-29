import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateSourceInventory } from './source-inventory.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const manifestPath = process.argv[2];
if (!manifestPath) throw new Error('usage: node check-source-inventory.mjs MANIFEST_JSON');
const requireCandidateBytes = process.argv[3] === '--require-candidate-bytes';
if (process.argv.length > (requireCandidateBytes ? 4 : 3)) throw new Error('unexpected source inventory arguments');
const inventory = JSON.parse(await readFile(path.resolve(root, manifestPath), 'utf8'));
const counts = validateSourceInventory(inventory);
for (const source of inventory.sources) {
  const localPath = source.local_fixture_path ?? source.local_candidate_path;
  if (!localPath) {
    if (requireCandidateBytes && source.state === 'inspected_candidate') throw new Error(`${source.id}: candidate byte path is required`);
    continue;
  }
  if (source.local_candidate_path && !requireCandidateBytes) continue;
  const bytes = await readFile(path.resolve(root, localPath));
  const digest = createHash('sha256').update(bytes).digest('hex');
  if (digest !== source.sha256) throw new Error(`${source.id}: local source hash differs from the inventory`);
}
console.log(`Source inventory verified: ${counts.source_count} source(s), ${counts.group_count} group(s), ${counts.inspected_candidate_cues} inspected candidate cue(s), ${counts.eligible_cues} eligible cue(s); candidate bytes=${requireCandidateBytes ? 'checked' : 'not checked'}; fixture-only=${inventory.fixture_only}.`);
