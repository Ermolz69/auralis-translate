import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateSourceInventory } from './source-inventory.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const manifestPath = process.argv[2];
if (!manifestPath) throw new Error('usage: node check-source-inventory.mjs MANIFEST_JSON');
const inventory = JSON.parse(await readFile(path.resolve(root, manifestPath), 'utf8'));
const counts = validateSourceInventory(inventory);
for (const source of inventory.sources) {
  if (!source.local_fixture_path) continue;
  const bytes = await readFile(path.resolve(root, source.local_fixture_path));
  const digest = createHash('sha256').update(bytes).digest('hex');
  if (digest !== source.sha256) throw new Error(`${source.id}: local fixture hash differs from the inventory`);
}
console.log(`Source inventory verified: ${counts.source_count} source(s), ${counts.group_count} group(s), ${counts.eligible_cues} eligible cue(s); fixture-only=${inventory.fixture_only}.`);
