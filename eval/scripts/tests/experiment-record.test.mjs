import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { nearestRank, validateExperimentRecord } from '../experiment-record.mjs';

const example = JSON.parse(await readFile(new URL('../../reports/experiment-record-example-v1.json', import.meta.url), 'utf8'));
const copy = () => structuredClone(example);
const hash = 'a'.repeat(64);

function measured() {
  const report = copy();
  report.fixture_only = false;
  report.status = 'complete';
  delete report.stop_reason;
  report.finished_at = '2026-09-28T00:00:01Z';
  report.plan.source_manifest_sha256 = hash;
  report.plan.cases[0].reference_sha256 = hash;
  for (const key of Object.keys(report.plan.variants[0])) if (key.endsWith('_sha256')) report.plan.variants[0][key] = hash;
  report.environment = { git_commit: 'a'.repeat(40), dirty: false, code_sha256: null, hardware: 'synthetic test host', os: 'synthetic test OS', resource_sample_interval_ms: 1000 };
  report.attempts = [{
    id: 'attempt-1', variant_id: 'fixture-variant-1', case_id: 'fixture-case-1', repetition: 1,
    attempt_number: 1, context_ids: [], batch_position: 'single', started_at: '2026-09-28T00:00:00Z', elapsed_ms: 25,
    rendered_input_sha256: hash, rendered_input: 'Translate this authored test cue.', rendered_input_storage: null,
    reference_excluded_from_prompt: true, raw_output: '{"text":"Привет"}',
    restored_candidate: 'Привет', accepted_output: 'Привет', checkpoint_sha256: hash, outcome: 'accepted', error_code: null,
    usage: { input_tokens: 12, output_tokens: 8, unknown_reason: null },
    memory: { process_peak_mib: 100, device_peak_mib: 0, unknown_reason: null }
  }];
  report.measurements = {
    file_elapsed_ms: 25,
    stage_ms: { admission: 1, hash_load: 2, prompt_eval: 3, decode: 10, validation: 2, checkpoint: 3, export: 4 },
    stage_unknown_reason: null,
    resource_samples: [{ at_ms: 10, process_rss_mib: 100, device_total_used_mib: 0 }],
    resource_unknown_reason: null
  };
  report.summary = { attempted: 1, accepted: 1, rejected: 0, unknown_token_attempts: 0, elapsed_p50_ms: 25, elapsed_p95_ms: 25, quantile_method: 'nearest_rank' };
  return report;
}

test('a fixture records no inference or human score', () => {
  assert.deepEqual(validateExperimentRecord(copy()), { attempts: 0, accepted: 0, paired_cells: 0, unknown_token_attempts: 0 });
  const falseClaim = copy();
  falseClaim.status = 'complete';
  assert.throws(() => validateExperimentRecord(falseClaim), /schema fixture cannot be a completed experiment/u);
});

test('a measured shape retains raw, restored and accepted outputs with exact quantiles', () => {
  assert.deepEqual(validateExperimentRecord(measured()), { attempts: 1, accepted: 1, paired_cells: 1, unknown_token_attempts: 0 });
  const precise = measured();
  precise.started_at = '2026-09-28T00:00:00.000Z';
  precise.attempts[0].started_at = '2026-09-28T00:00:00.125Z';
  precise.finished_at = '2026-09-28T00:00:01.000Z';
  assert.equal(validateExperimentRecord(precise).accepted, 1);
  assert.equal(nearestRank([5, 9, 100], 0.95), 100);
});

test('incomplete paired coverage and request budget fail validation', () => {
  const missing = measured();
  missing.plan.variants.push({ ...missing.plan.variants[0], id: 'fixture-variant-2' });
  assert.throws(() => validateExperimentRecord(missing), /incomplete paired case coverage/u);
  const budget = measured();
  budget.plan.max_requests = 0;
  assert.throws(() => validateExperimentRecord(budget), /max_requests/u);
});

test('a rejected candidate keeps raw evidence and cannot publish accepted text', () => {
  const report = measured();
  const attempt = report.attempts[0];
  attempt.outcome = 'invalid_candidate';
  attempt.error_code = 'missing_slot';
  attempt.accepted_output = null;
  attempt.checkpoint_sha256 = null;
  report.summary.accepted = 0;
  report.summary.rejected = 1;
  assert.equal(validateExperimentRecord(report).accepted, 0);
  attempt.raw_output = null;
  assert.throws(() => validateExperimentRecord(report), /must retain raw output/u);
});

test('review provenance cannot silently turn an AI or absent review into human coverage', () => {
  const report = measured();
  report.review = { kind: 'none', reviewer_id: null, eligible: 1, reviewed: 1, critical_unresolved: 0, source_aware: false };
  assert.throws(() => validateExperimentRecord(report), /no-review report/u);
  report.review = { kind: 'human', reviewer_id: null, eligible: 1, reviewed: 1, critical_unresolved: 0, source_aware: true };
  assert.throws(() => validateExperimentRecord(report), /reviewer_id/u);
  report.review = { kind: 'ai', reviewer_id: 'ulya-ai', eligible: 1, reviewed: 1, critical_unresolved: 0, source_aware: true };
  assert.equal(validateExperimentRecord(report).attempts, 1);
});

test('changed summary, tokens and duplicate retries cannot hide a failed attempt', () => {
  const summary = measured();
  summary.summary.elapsed_p95_ms = 24;
  assert.throws(() => validateExperimentRecord(summary), /quantiles differ/u);
  const tokens = measured();
  tokens.plan.max_total_tokens = 1;
  assert.throws(() => validateExperimentRecord(tokens), /token budget/u);
  const retry = measured();
  retry.attempts.push({ ...retry.attempts[0], id: 'attempt-2' });
  assert.throws(() => validateExperimentRecord(retry), /duplicates a case attempt/u);
});

test('real reports reject fixture hashes and unexplained measurement gaps', () => {
  const placeholder = measured();
  placeholder.plan.variants[0].tokenizer_sha256 = '0'.repeat(64);
  assert.throws(() => validateExperimentRecord(placeholder), /fixture sentinel/u);
  const stage = measured();
  stage.measurements.stage_ms.decode = null;
  assert.throws(() => validateExperimentRecord(stage), /stage_unknown_reason/u);
  const resource = measured();
  resource.measurements.resource_samples = [];
  assert.throws(() => validateExperimentRecord(resource), /resource_unknown_reason/u);
  const prompt = measured();
  prompt.attempts[0].rendered_input = null;
  assert.throws(() => validateExperimentRecord(prompt), /rendered_input_storage/u);
});
