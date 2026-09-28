import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import { loadRegressionIndex, modelInputForRegressionCase, validateRegressionIndex } from '../regression-index.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const evidence = await loadRegressionIndex(root);
const check = value => validateRegressionIndex(value, evidence.demo, evidence.cases, evidence.reports, evidence.hashes);

test('known prompt-copy bug retains failed and corrected raw evidence', () => {
  assert.deepEqual(check(evidence.index), { regression_count: 1, failed_copies: 6, related_cases: 2, negative_cases: 1 });
});

test('source-only regression model input excludes proposed Russian references and meanings', () => {
  for (const item of evidence.cases.examples) {
    const input = modelInputForRegressionCase(item);
    assert.deepEqual(Object.keys(input), ['case_id', 'source_zh']);
    assert.doesNotMatch(JSON.stringify(input), /\p{Script=Cyrillic}/u);
  }
});

test('a missing related or negative control invalidates the permanent regression', () => {
  const missingRelated = structuredClone(evidence.index);
  missingRelated.entries[0].related_case_ids.pop();
  assert.throws(() => check(missingRelated), /related controls count differs/u);
  const repeatedNegative = structuredClone(evidence.index);
  repeatedNegative.entries[0].negative_case_ids[0] = repeatedNegative.entries[0].related_case_ids[0];
  assert.throws(() => check(repeatedNegative), /control families overlap/u);
});

test('changed report identity or fabricated success cannot pass', () => {
  const changedHash = structuredClone(evidence.index);
  changedHash.entries[0].failed_report_sha256 = '0'.repeat(64);
  assert.throws(() => check(changedHash), /Expected values to be strictly equal/u);
  const altered = structuredClone(evidence.reports);
  altered.failed.requests.find(row => row.example_id === 'zh08').accepted_candidate = 'Перевод';
  assert.throws(() => validateRegressionIndex(evidence.index, evidence.demo, evidence.cases, altered, evidence.hashes), /Expected values to be strictly equal/u);
});
