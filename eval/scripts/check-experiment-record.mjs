import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateExperimentRecord } from './experiment-record.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const reportPath = process.argv[2];
if (!reportPath) throw new Error('usage: node check-experiment-record.mjs REPORT_JSON');
const report = JSON.parse(await readFile(path.resolve(root, reportPath), 'utf8'));
const counts = validateExperimentRecord(report);
console.log(`Experiment record verified: ${counts.attempts} attempts, ${counts.accepted} accepted, ${counts.paired_cells} paired cells; fixture-only=${report.fixture_only}.`);
