import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadRegressionIndex, validateRegressionIndex } from './regression-index.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const evidence = await loadRegressionIndex(root);
const result = validateRegressionIndex(evidence.index, evidence.demo, evidence.cases, evidence.reports, evidence.hashes);
console.log(`Regression index verified: ${result.regression_count} retained bug, ${result.failed_copies} failed copies, ${result.related_cases} related and ${result.negative_cases} negative controls.`);
