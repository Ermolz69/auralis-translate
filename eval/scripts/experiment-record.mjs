import { validateMeasurements } from './experiment-measurements.mjs';

const SHA256 = /^[a-f0-9]{64}$/u;
const EMPTY_SHA256 = '0'.repeat(64);
const GIT_SHA = /^(?:[a-f0-9]{40}|[a-f0-9]{64})$/u;
const ID = /^[a-z0-9][a-z0-9._-]*$/u;
const OUTCOMES = new Set(['accepted', 'invalid_candidate', 'transport_error', 'timeout', 'oom', 'paused', 'budget_rejected']);

function fail(path, message) { throw new Error(`${path}: ${message}`); }
function obj(value, path) { if (!value || typeof value !== 'object' || Array.isArray(value)) fail(path, 'must be an object'); return value; }
function keys(value, required, optional, path) {
  obj(value, path);
  for (const key of required) if (!Object.hasOwn(value, key)) fail(`${path}.${key}`, 'is required');
  for (const key of Object.keys(value)) if (![...required, ...optional].includes(key)) fail(`${path}.${key}`, 'is unknown');
}
function id(value, path) { if (typeof value !== 'string' || !ID.test(value)) fail(path, 'must be a stable lowercase ID'); }
function sha(value, path) { if (typeof value !== 'string' || !SHA256.test(value)) fail(path, 'must be a lowercase SHA-256'); }
function evidenceSha(value, path, fixtureOnly) { sha(value, path); if (!fixtureOnly && value === EMPTY_SHA256) fail(path, 'cannot use a fixture sentinel in real evidence'); }
function str(value, path) { if (typeof value !== 'string' || !value.trim()) fail(path, 'must be nonempty text'); }
function integer(value, min, path) { if (!Number.isSafeInteger(value) || value < min) fail(path, `must be an integer >= ${min}`); }
function time(value, path) { if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,9})?Z$/u.test(value) || Number.isNaN(Date.parse(value))) fail(path, 'must be UTC ISO time'); }
function uniqueIds(values, path) {
  if (!Array.isArray(values) || !values.length) fail(path, 'must be a nonempty array');
  const seen = new Set();
  for (const value of values) { id(value, path); if (seen.has(value)) fail(path, 'contains duplicate IDs'); seen.add(value); }
  return seen;
}
export function nearestRank(values, fraction) {
  if (!values.length) return null;
  const sorted = [...values].sort((left, right) => left - right);
  return sorted[Math.ceil(fraction * sorted.length) - 1];
}

export function validateExperimentRecord(report) {
  keys(report, ['schema_version', 'experiment_id', 'fixture_only', 'status', 'started_at', 'finished_at', 'plan', 'environment', 'attempts', 'measurements', 'summary', 'review'], ['stop_reason'], 'report');
  if (report.schema_version !== 1) fail('report.schema_version', 'is unsupported');
  id(report.experiment_id, 'report.experiment_id');
  if (typeof report.fixture_only !== 'boolean') fail('report.fixture_only', 'must be boolean');
  if (!['complete', 'stopped'].includes(report.status)) fail('report.status', 'must be complete or stopped');
  if (report.fixture_only && report.status !== 'stopped') fail('report.status', 'a schema fixture cannot be a completed experiment');
  time(report.started_at, 'report.started_at');
  time(report.finished_at, 'report.finished_at');
  if (Date.parse(report.finished_at) < Date.parse(report.started_at)) fail('report.finished_at', 'precedes start');
  if (report.status === 'stopped') str(report.stop_reason, 'report.stop_reason');

  const plan = report.plan;
  keys(plan, ['frozen_at', 'task_ids', 'question', 'source_manifest_sha256', 'split', 'cases', 'variants', 'repetitions', 'max_requests', 'max_total_tokens', 'max_wall_ms', 'stop_criteria'], [], 'report.plan');
  time(plan.frozen_at, 'report.plan.frozen_at');
  if (Date.parse(plan.frozen_at) > Date.parse(report.started_at)) fail('report.plan.frozen_at', 'must precede execution');
  uniqueIds(plan.task_ids, 'report.plan.task_ids');
  str(plan.question, 'report.plan.question');
  evidenceSha(plan.source_manifest_sha256, 'report.plan.source_manifest_sha256', report.fixture_only);
  if (!['development', 'holdout', 'synthetic'].includes(plan.split)) fail('report.plan.split', 'is unknown');
  integer(plan.repetitions, 1, 'report.plan.repetitions');
  integer(plan.max_requests, 1, 'report.plan.max_requests');
  integer(plan.max_total_tokens, 1, 'report.plan.max_total_tokens');
  integer(plan.max_wall_ms, 1, 'report.plan.max_wall_ms');
  str(plan.stop_criteria, 'report.plan.stop_criteria');
  if (!Array.isArray(plan.cases) || !plan.cases.length) fail('report.plan.cases', 'must be nonempty');
  const cases = new Set();
  for (const [index, item] of plan.cases.entries()) {
    const at = `report.plan.cases[${index}]`;
    keys(item, ['id', 'source_id', 'scene_id', 'target_id', 'source_sha256', 'reference_sha256', 'expected_meaning', 'prohibited_facts'], [], at);
    for (const key of ['id', 'source_id', 'scene_id', 'target_id']) id(item[key], `${at}.${key}`);
    evidenceSha(item.source_sha256, `${at}.source_sha256`, report.fixture_only);
    evidenceSha(item.reference_sha256, `${at}.reference_sha256`, report.fixture_only);
    str(item.expected_meaning, `${at}.expected_meaning`);
    if (!Array.isArray(item.prohibited_facts) || item.prohibited_facts.some(fact => typeof fact !== 'string' || !fact.trim())) fail(`${at}.prohibited_facts`, 'must be an array of facts');
    if (cases.has(item.id)) fail(`${at}.id`, 'is duplicated');
    cases.add(item.id);
  }
  if (!Array.isArray(plan.variants) || !plan.variants.length) fail('report.plan.variants', 'must be nonempty');
  const variants = new Set();
  for (const [index, variant] of plan.variants.entries()) {
    const at = `report.plan.variants[${index}]`;
    keys(variant, ['id', 'model_sha256', 'profile_sha256', 'prompt_sha256', 'runtime_sha256', 'tokenizer_sha256', 'context_policy_sha256', 'terms_sha256', 'decoding'], [], at);
    id(variant.id, `${at}.id`);
    if (variants.has(variant.id)) fail(`${at}.id`, 'is duplicated');
    variants.add(variant.id);
    for (const key of ['model_sha256', 'profile_sha256', 'prompt_sha256', 'runtime_sha256', 'tokenizer_sha256', 'context_policy_sha256', 'terms_sha256']) evidenceSha(variant[key], `${at}.${key}`, report.fixture_only);
    obj(variant.decoding, `${at}.decoding`);
  }

  const env = report.environment;
  if (env === null && !report.fixture_only) fail('report.environment', 'real evidence needs an environment');
  if (env !== null) {
    keys(env, ['git_commit', 'dirty', 'code_sha256', 'hardware', 'os', 'resource_sample_interval_ms'], [], 'report.environment');
    if (typeof env.git_commit !== 'string' || !GIT_SHA.test(env.git_commit)) fail('report.environment.git_commit', 'must be a full Git commit');
    if (typeof env.dirty !== 'boolean') fail('report.environment.dirty', 'must be boolean');
    if (env.dirty) sha(env.code_sha256, 'report.environment.code_sha256');
    else if (env.code_sha256 !== null) fail('report.environment.code_sha256', 'must be null for clean code');
    str(env.hardware, 'report.environment.hardware');
    str(env.os, 'report.environment.os');
    integer(env.resource_sample_interval_ms, 1, 'report.environment.resource_sample_interval_ms');
  }

  if (!Array.isArray(report.attempts)) fail('report.attempts', 'must be an array');
  if (report.fixture_only && report.attempts.length) fail('report.attempts', 'a schema fixture cannot claim model attempts');
  if (report.attempts.length > plan.max_requests) fail('report.attempts', 'exceeds predeclared request budget');
  const attemptIds = new Set();
  const attemptKeys = new Set();
  const coverage = new Set();
  const durations = [];
  let tokenSum = 0;
  let unknownTokens = 0;
  let accepted = 0;
  for (const [index, attempt] of report.attempts.entries()) {
    const at = `report.attempts[${index}]`;
    keys(attempt, ['id', 'variant_id', 'case_id', 'repetition', 'attempt_number', 'context_ids', 'batch_position', 'started_at', 'elapsed_ms', 'rendered_input_sha256', 'rendered_input', 'rendered_input_storage', 'reference_excluded_from_prompt', 'raw_output', 'restored_candidate', 'accepted_output', 'checkpoint_sha256', 'outcome', 'error_code', 'usage', 'memory'], [], at);
    id(attempt.id, `${at}.id`);
    if (attemptIds.has(attempt.id)) fail(`${at}.id`, 'is duplicated');
    attemptIds.add(attempt.id);
    if (!variants.has(attempt.variant_id) || !cases.has(attempt.case_id)) fail(at, 'references an unknown variant or case');
    integer(attempt.repetition, 1, `${at}.repetition`);
    if (attempt.repetition > plan.repetitions) fail(`${at}.repetition`, 'exceeds plan');
    integer(attempt.attempt_number, 1, `${at}.attempt_number`);
    if (!Array.isArray(attempt.context_ids)) fail(`${at}.context_ids`, 'must be an array');
    for (const contextId of attempt.context_ids) id(contextId, `${at}.context_ids`);
    if (!['single', 'seam', 'interior'].includes(attempt.batch_position)) fail(`${at}.batch_position`, 'is unknown');
    const key = `${attempt.variant_id}/${attempt.case_id}/${attempt.repetition}`;
    const attemptKey = `${key}/${attempt.attempt_number}`;
    if (attemptKeys.has(attemptKey)) fail(`${at}.attempt_number`, 'duplicates a case attempt');
    attemptKeys.add(attemptKey);
    coverage.add(key);
    time(attempt.started_at, `${at}.started_at`);
    if (Date.parse(attempt.started_at) < Date.parse(report.started_at) || Date.parse(attempt.started_at) > Date.parse(report.finished_at)) fail(`${at}.started_at`, 'outside report interval');
    if (typeof attempt.elapsed_ms !== 'number' || !Number.isFinite(attempt.elapsed_ms) || attempt.elapsed_ms < 0) fail(`${at}.elapsed_ms`, 'must be nonnegative finite');
    durations.push(attempt.elapsed_ms);
    evidenceSha(attempt.rendered_input_sha256, `${at}.rendered_input_sha256`, report.fixture_only);
    if (attempt.rendered_input !== null) str(attempt.rendered_input, `${at}.rendered_input`);
    if (attempt.rendered_input === null) str(attempt.rendered_input_storage, `${at}.rendered_input_storage`);
    else if (attempt.rendered_input_storage !== null) fail(`${at}.rendered_input_storage`, 'must be null when input is embedded');
    if (attempt.reference_excluded_from_prompt !== true) fail(`${at}.reference_excluded_from_prompt`, 'must be attested true');
    if (!OUTCOMES.has(attempt.outcome)) fail(`${at}.outcome`, 'is unknown');
    for (const field of ['raw_output', 'restored_candidate', 'accepted_output']) {
      if (attempt[field] !== null && typeof attempt[field] !== 'string') fail(`${at}.${field}`, 'must be string or null');
    }
    if (attempt.outcome === 'accepted') {
      if (!attempt.raw_output || !attempt.restored_candidate || !attempt.accepted_output || attempt.error_code !== null) fail(at, 'accepted attempt lacks raw/restored/accepted evidence');
      evidenceSha(attempt.checkpoint_sha256, `${at}.checkpoint_sha256`, report.fixture_only);
      accepted += 1;
    } else {
      if (attempt.accepted_output !== null) fail(at, 'rejected attempt cannot publish output');
      if (attempt.checkpoint_sha256 !== null) fail(at, 'rejected attempt cannot claim a checkpoint');
      str(attempt.error_code, `${at}.error_code`);
      if (attempt.outcome === 'invalid_candidate' && attempt.raw_output === null) fail(at, 'invalid candidate must retain raw output');
    }
    keys(attempt.usage, ['input_tokens', 'output_tokens', 'unknown_reason'], [], `${at}.usage`);
    if (attempt.usage.input_tokens === null || attempt.usage.output_tokens === null) {
      unknownTokens += 1;
      str(attempt.usage.unknown_reason, `${at}.usage.unknown_reason`);
    } else {
      integer(attempt.usage.input_tokens, 0, `${at}.usage.input_tokens`);
      integer(attempt.usage.output_tokens, 0, `${at}.usage.output_tokens`);
      tokenSum += attempt.usage.input_tokens + attempt.usage.output_tokens;
      if (attempt.usage.unknown_reason !== null) fail(`${at}.usage.unknown_reason`, 'must be null when tokens are measured');
    }
    keys(attempt.memory, ['process_peak_mib', 'device_peak_mib', 'unknown_reason'], [], `${at}.memory`);
    if (attempt.memory.process_peak_mib === null || attempt.memory.device_peak_mib === null) str(attempt.memory.unknown_reason, `${at}.memory.unknown_reason`);
    else {
      for (const field of ['process_peak_mib', 'device_peak_mib']) if (!Number.isFinite(attempt.memory[field]) || attempt.memory[field] < 0) fail(`${at}.memory.${field}`, 'must be nonnegative finite');
      if (attempt.memory.unknown_reason !== null) fail(`${at}.memory.unknown_reason`, 'must be null when sampled');
    }
  }
  if (tokenSum > plan.max_total_tokens) fail('report.attempts', 'exceeds predeclared token budget');
  if (Date.parse(report.finished_at) - Date.parse(report.started_at) > plan.max_wall_ms) fail('report.finished_at', 'exceeds predeclared wall budget');
  if (report.status === 'complete' && coverage.size !== cases.size * variants.size * plan.repetitions) fail('report.attempts', 'incomplete paired case coverage');

  validateMeasurements(report.measurements, report.fixture_only);

  const summary = report.summary;
  keys(summary, ['attempted', 'accepted', 'rejected', 'unknown_token_attempts', 'elapsed_p50_ms', 'elapsed_p95_ms', 'quantile_method'], [], 'report.summary');
  if (summary.attempted !== report.attempts.length || summary.accepted !== accepted || summary.rejected !== report.attempts.length - accepted || summary.unknown_token_attempts !== unknownTokens) fail('report.summary', 'counts differ from retained attempts');
  if (summary.quantile_method !== 'nearest_rank') fail('report.summary.quantile_method', 'must be nearest_rank');
  if (summary.elapsed_p50_ms !== nearestRank(durations, 0.5) || summary.elapsed_p95_ms !== nearestRank(durations, 0.95)) fail('report.summary', 'quantiles differ from raw attempts');

  const review = report.review;
  keys(review, ['kind', 'reviewer_id', 'eligible', 'reviewed', 'critical_unresolved', 'source_aware'], [], 'report.review');
  if (!['none', 'ai', 'human'].includes(review.kind)) fail('report.review.kind', 'is unknown');
  if (report.fixture_only && review.kind !== 'none') fail('report.review', 'a schema fixture cannot claim review');
  integer(review.eligible, 0, 'report.review.eligible');
  integer(review.reviewed, 0, 'report.review.reviewed');
  integer(review.critical_unresolved, 0, 'report.review.critical_unresolved');
  if (review.reviewed > review.eligible) fail('report.review.reviewed', 'exceeds eligible');
  if (review.kind === 'human') {
    if (report.fixture_only) fail('report.review', 'a schema fixture cannot claim human review');
    id(review.reviewer_id, 'report.review.reviewer_id');
    if (review.source_aware !== true) fail('report.review.source_aware', 'human gate requires source-aware review');
  } else if (review.kind === 'ai') {
    id(review.reviewer_id, 'report.review.reviewer_id');
    if (typeof review.source_aware !== 'boolean') fail('report.review.source_aware', 'must be boolean');
  } else if (review.reviewer_id !== null || review.source_aware !== false || review.reviewed !== 0) {
    fail('report.review', 'no-review report cannot claim reviewer coverage');
  }
  return { attempts: report.attempts.length, accepted, paired_cells: coverage.size, unknown_token_attempts: unknownTokens };
}
