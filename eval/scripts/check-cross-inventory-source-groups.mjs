import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateSourceInventory } from './source-inventory.mjs';
import { validateCrossInventorySourceGroups } from './cross-inventory-source-groups.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const paths = process.argv.slice(2);
if (!paths.length || paths.some(file => !/^eval\/corpora\/[a-z0-9._-]+\.json$/u.test(file))) {
  throw new Error('pass one or more repository source-inventory JSON paths');
}
const inventories = await Promise.all(paths.map(async file => {
  const inventory = JSON.parse(await readFile(path.join(root, file), 'utf8'));
  validateSourceInventory(inventory);
  return inventory;
}));
const counts = validateCrossInventorySourceGroups(inventories);
console.log(`Cross-inventory identities verified: ${counts.source_count} source(s), ${counts.group_count} group(s), ${inventories.length} manifest(s).`);
