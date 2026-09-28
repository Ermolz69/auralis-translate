import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateContextCases } from './context-cases.mjs';
import { renderContextCorpus } from './context-case-build.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const file = process.argv[2];
if (!file) throw new Error('usage: node check-context-cases.mjs CORPUS_JSON');
const bytes = await readFile(path.resolve(root, file));
const corpus = JSON.parse(bytes.toString('utf8'));
if (bytes.toString('utf8') !== renderContextCorpus()) throw new Error('frozen corpus differs from authored seeds');
const counts = validateContextCases(corpus);
const digest = createHash('sha256').update(bytes).digest('hex');
console.log(`Context corpus verified: ${counts.target_count} targets, ${counts.scenario_count} scenarios, 12 per category; sha256=${digest}; provenance=${corpus.provenance}.`);
