import assert from 'node:assert/strict';
import { digest } from './flores-file-fixture.mjs';

const ALLOWED_OVERRIDES = new Set(['target_segments_per_block', 'temperature', 'prompt_version', 'max_glossary_bytes', 'max_glossary_entries']);

export function profileVariants(matrix, baseBytes, sampleBytes) {
  assert.equal(matrix.schema_version, 1);
  assert.equal(matrix.purpose, 'auxiliary_dev_profile_comparison');
  assert.equal(matrix.subtitle_holdout, false);
  assert.equal(matrix.bilingual_reviewed, false);
  assert.equal(digest(baseBytes), matrix.base_profile_sha256, 'Frozen base profile changed');
  assert.equal(digest(sampleBytes), matrix.sample_manifest_sha256, 'Frozen sample manifest changed');
  const sample = JSON.parse(sampleBytes);
  assert.equal(sample.split, 'dev', 'Profile tuning cannot consume a holdout');
  const base = JSON.parse(baseBytes);
  assert(base.model_file_sha256 && base.model_file_bytes && base.runtime_build_info && base.min_context_tokens, 'Comparison requires a checked profile');
  assert(matrix.variants.length >= 2 && matrix.variants.length <= 8);
  assert.equal(new Set(matrix.variants.map((variant) => variant.id)).size, matrix.variants.length, 'Duplicate variant ID');
  return matrix.variants.map((variant) => {
    assert(/^[a-z][a-z0-9-]{0,63}$/u.test(variant.id), 'Invalid variant ID');
    assert(variant.overrides && typeof variant.overrides === 'object' && !Array.isArray(variant.overrides));
    for (const key of Object.keys(variant.overrides)) assert(ALLOWED_OVERRIDES.has(key), `Comparison cannot override ${key}`);
    const profile = { ...base, ...variant.overrides };
    assert.equal(profile.target_segments_per_block, 1, 'Compare one target per block in every variant');
    assert.equal(profile.context_before_segments ?? 0, 0, 'Unrelated sentences cannot serve as scene context');
    assert.equal(profile.context_after_segments ?? 0, 0);
    return { id: variant.id, profile };
  });
}
