import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import test from 'node:test';
import { digest } from '../flores-file-fixture.mjs';
import { profileVariants } from '../profile-matrix.mjs';
import { compareProfiles } from '../profile-comparison-report.mjs';

test('the pinned matrix cannot change weights, use holdouts, or reuse variant identities', async () => {
  const matrix = JSON.parse(await fs.readFile(new URL('../../profiles/hy-mt2-dev-decoding-v1.json', import.meta.url)));
  const base = await fs.readFile(new URL('../../../models/manifests/hy_mt2_1_8b_q4_k_m.checked.experimental.json', import.meta.url));
  const sample = await fs.readFile(new URL('../../corpora/flores200-file-probe-v1.json', import.meta.url));
  assert.equal(profileVariants(matrix, base, sample).length, 3);
  const changedWeights = structuredClone(matrix);
  changedWeights.variants[0].overrides.model_file_sha256 = '0'.repeat(64);
  assert.throws(() => profileVariants(changedWeights, base, sample), /cannot override model_file_sha256/u);
  assert.throws(() => profileVariants(matrix, Buffer.from('{}'), sample), /base profile changed/u);
  const holdout = Buffer.from(JSON.stringify({ ...JSON.parse(sample), split: 'devtest' }));
  assert.throws(() => profileVariants({ ...matrix, sample_manifest_sha256: digest(holdout) }, base, holdout), /cannot consume a holdout/u);
  assert.throws(() => profileVariants({ ...matrix, variants: [matrix.variants[0], matrix.variants[0]] }, base, sample), /Duplicate variant/u);
});

function report() {
  return {
    corpus_archive_sha256: 'corpus', sample_manifest_sha256: 'sample', source_sha256: 'source',
    model_sha256: 'model', runtime_build: 'runtime', gpu_layers: 99, split: 'dev', source_language: 'zho_Hans',
    row_ids: [1, 101], subtitle_holdout: false, bilingual_reviewed: false, quality_verdict: 'unreviewed',
    structural_checks: 'passed', source_preservation: 'byte_identical', offline_reexport: 'byte_identical', existing_output_protection: 'passed',
    run_id: 'first-run', profile: { target_segments_per_block: 1, model_file_sha256: 'model' },
    status: { state: 'validated', completed_blocks: 2, total_blocks: 2, source_sha256: 'source', run_id: 'first-run', selected_result_id: 'first-result' },
    rows: [1, 101].map((id, index) => ({ row_id: id, segment_id: index + 1, source: '你好。', reference_ru: 'Привет.', candidate_ru: 'Здравствуйте.' })),
  };
}

test('a comparison rejects changed data, missing invariants, and incomplete results', () => {
  const baseline = report();
  for (const mutate of [
    (candidate) => { candidate.source_sha256 = 'different'; },
    (candidate) => { candidate.rows[0].reference_ru = 'Changed reference'; },
    (candidate) => { candidate.rows.reverse(); },
    (candidate) => { candidate.rows.pop(); },
    (candidate) => { candidate.status.completed_blocks = 1; },
    (candidate) => { delete candidate.model_sha256; },
    (candidate) => { candidate.source_preservation = 'changed'; },
    (candidate) => { candidate.status.source_sha256 = 'wrong-original'; },
    (candidate) => { candidate.status.selected_result_id = null; },
  ]) {
    const changed = structuredClone(baseline);
    mutate(changed);
    assert.throws(() => compareProfiles([{ id: 'first', report: baseline }, { id: 'second', report: changed }], 'matrix'));
  }
});

test('a valid paired comparison retains different candidates without accepting shared state', () => {
  const first = report();
  const second = report();
  second.rows[0].candidate_ru = 'Привет.';
  assert.throws(() => compareProfiles([{ id: 'first', report: first }, { id: 'second', report: second }], 'matrix'), /reused durable run/u);
  second.run_id = 'second-run';
  second.status.run_id = 'second-run';
  second.status.selected_result_id = 'second-result';
  const result = compareProfiles([{ id: 'first', report: first }, { id: 'second', report: second }], 'matrix');
  assert.equal(result.all_transport_checks_passed, true);
  assert.equal(result.rows[0].candidates[1].candidate_ru, 'Привет.');
  assert.equal(result.winner, null);
});

test('failed variants stay in the denominator and wording diagnostics never select a quality winner', () => {
  const baseline = report();
  const comparison = compareProfiles([{ id: 'first', report: baseline }, { id: 'failed', error: 'Invalid model output' }], 'matrix');
  assert.equal(comparison.total_variants, 2);
  assert.equal(comparison.successful_variants, 1);
  assert.equal(comparison.all_transport_checks_passed, false);
  assert.equal(comparison.rows[0].candidates[1].candidate_ru, null);
  assert.equal(comparison.winner, null);
  assert.equal(comparison.quality_verdict, 'unreviewed');
  assert.throws(() => compareProfiles([{ id: 'first', report: baseline }, { id: 'first', report: baseline }], 'matrix'), /Duplicate comparison/u);
  assert.throws(() => compareProfiles([{ id: 'first', report: baseline }, { id: 'empty' }], 'matrix'), /exactly one/u);
});
