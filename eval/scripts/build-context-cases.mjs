import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { renderContextCorpus } from './context-case-build.mjs';
import { validateContextCases } from './context-cases.mjs';
import { buildContextCorpus } from './context-case-build.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const counts = validateContextCases(buildContextCorpus());
await writeFile(path.join(root, 'eval/corpora/context-contrasts-v1.json'), renderContextCorpus(), 'utf8');
console.log(`Wrote authored context corpus: ${counts.target_count} targets, ${counts.scenario_count} scenarios.`);
