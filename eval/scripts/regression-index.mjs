import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { digest } from './flores-file-fixture.mjs';

const REPORTS = {
  failed: 'v5-envelope-placeholder-2026-09-28.json',
  regression: 'v5-schema-regression-2026-09-28.json',
  control: 'v5-schema-control-2026-09-28.json',
};

function exactKeys(value, names, at) {
  assert(value && typeof value === 'object' && !Array.isArray(value), `${at} must be an object`);
  assert.deepEqual(Object.keys(value).sort(), [...names].sort(), `${at} fields differ`);
}

function ids(value, length, at) {
  assert(Array.isArray(value) && value.length === length, `${at} count differs`);
  assert.equal(new Set(value).size, value.length, `${at} repeats an ID`);
  assert(value.every(id => typeof id === 'string' && /^[a-z0-9]+$/u.test(id)), `${at} has an invalid ID`);
}

export function modelInputForRegressionCase(item) {
  return { case_id: item.id, source_zh: item.source };
}

export function validateRegressionIndex(index, demo, cases, reports, hashes) {
  exactKeys(index, ['schema_version', 'index_id', 'entries'], 'index');
  assert.equal(index.schema_version, 1);
  assert.equal(index.index_id, 'zh-ru-development-regressions-v1');
  assert(Array.isArray(index.entries) && index.entries.length > 0);
  const seen = new Set();
  for (const entry of index.entries) {
    exactKeys(entry, [
      'id', 'source_family', 'split', 'category', 'severity', 'status',
      'failure_source_ids', 'reproduction_case_ids', 'related_case_ids',
      'negative_case_ids', 'expected_invariant', 'failure_literal',
      'affected_profile_sha256', 'checked_profile_sha256',
      'failed_report_sha256', 'regression_report_sha256', 'control_report_sha256',
      'last_outcome', 'evidence_record',
    ], entry.id);
    assert(/^REG-\d{3}$/u.test(entry.id) && !seen.has(entry.id), 'regression IDs must be unique');
    seen.add(entry.id);
    assert.equal(entry.source_family, 'authored-dialogue');
    assert.equal(entry.split, 'development');
    assert.equal(entry.category, 'prompt_output_copy');
    assert.equal(entry.severity, 'major');
    assert.equal(entry.status, 'observed_absent_in_schema_profile');
    assert.equal(entry.failure_literal, 'Русский текст');
    assert(entry.expected_invariant.length > 20 && entry.last_outcome.length > 20);
    assert(/^eval\/experiments\/[a-z0-9-]+\.md$/u.test(entry.evidence_record));
    ids(entry.failure_source_ids, 2, 'failure sources');
    ids(entry.reproduction_case_ids, 2, 'reproductions');
    ids(entry.related_case_ids, 2, 'related controls');
    ids(entry.negative_case_ids, 1, 'negative controls');
    const allCases = [...entry.reproduction_case_ids, ...entry.related_case_ids, ...entry.negative_case_ids];
    assert.equal(new Set(allCases).size, allCases.length, 'control families overlap');
    for (const id of allCases) assert.equal(cases.examples.filter(item => item.id === id).length, 1, `missing ${id}`);
    for (const [sourceId, reproductionId] of entry.failure_source_ids.map((id, i) => [id, entry.reproduction_case_ids[i]])) {
      assert.equal(demo.examples.find(item => item.id === sourceId)?.source, cases.examples.find(item => item.id === reproductionId)?.source);
    }
    assert.equal(entry.affected_profile_sha256, reports.failed.profile_sha256);
    assert.equal(entry.checked_profile_sha256, reports.control.profile_sha256);
    assert.equal(entry.checked_profile_sha256, reports.regression.profile_sha256);
    assert.equal(entry.failed_report_sha256, hashes.failed);
    assert.equal(entry.regression_report_sha256, hashes.regression);
    assert.equal(entry.control_report_sha256, hashes.control);
    assert.equal(reports.failed.requests.filter(request => entry.failure_source_ids.includes(request.example_id) && request.accepted_candidate === entry.failure_literal).length, 6);
    assert.equal(reports.regression.requests.length, 15);
    assert.equal(reports.control.requests.length, 60);
    for (const id of allCases) assert.equal(reports.regression.requests.filter(request => request.example_id === id).length, 3, `${id} not repeated three times`);
    assert(reports.regression.requests.every(request => request.accepted_candidate !== entry.failure_literal));
    assert(reports.control.requests.every(request => request.accepted_candidate !== entry.failure_literal));
    assert.equal(reports.regression.source_preservation, 'byte_identical');
    assert.equal(reports.control.source_preservation, 'byte_identical');
  }
  return { regression_count: seen.size, failed_copies: 6, related_cases: 2, negative_cases: 1 };
}

export async function loadRegressionIndex(root) {
  const index = JSON.parse(await fs.readFile(path.join(root, 'eval/regressions/index-v1.json')));
  const demo = JSON.parse(await fs.readFile(path.join(root, 'eval/corpora/public-demo-v1.json')));
  const cases = JSON.parse(await fs.readFile(path.join(root, 'eval/corpora/v5-placeholder-regression-v1.json')));
  const reports = {}, hashes = {};
  for (const [key, file] of Object.entries(REPORTS)) {
    const bytes = await fs.readFile(path.join(root, 'eval/reports', file));
    reports[key] = JSON.parse(bytes);
    hashes[key] = digest(bytes);
  }
  for (const entry of index.entries) await fs.access(path.join(root, entry.evidence_record));
  return { index, demo, cases, reports, hashes };
}
