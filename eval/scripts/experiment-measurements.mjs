const STAGES = ['admission', 'hash_load', 'prompt_eval', 'decode', 'validation', 'checkpoint', 'export'];

function fail(path, message) { throw new Error(`${path}: ${message}`); }
function finiteNonnegative(value, path) { if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) fail(path, 'must be a nonnegative finite measurement'); }

export function validateMeasurements(measurements, fixtureOnly) {
  if (measurements === null) {
    if (!fixtureOnly) fail('report.measurements', 'real evidence needs measurements');
    return;
  }
  if (!measurements || typeof measurements !== 'object' || Array.isArray(measurements)) fail('report.measurements', 'must be an object');
  const expected = ['file_elapsed_ms', 'stage_ms', 'stage_unknown_reason', 'resource_samples', 'resource_unknown_reason'];
  if (Object.keys(measurements).some(key => !expected.includes(key)) || expected.some(key => !Object.hasOwn(measurements, key))) fail('report.measurements', 'has missing or unknown fields');
  finiteNonnegative(measurements.file_elapsed_ms, 'report.measurements.file_elapsed_ms');
  if (!measurements.stage_ms || typeof measurements.stage_ms !== 'object' || Array.isArray(measurements.stage_ms)) fail('report.measurements.stage_ms', 'must be an object');
  if (Object.keys(measurements.stage_ms).some(key => !STAGES.includes(key)) || STAGES.some(key => !Object.hasOwn(measurements.stage_ms, key))) fail('report.measurements.stage_ms', 'has missing or unknown stages');
  let unknownStage = false;
  for (const stage of STAGES) {
    const value = measurements.stage_ms[stage];
    if (value === null) unknownStage = true;
    else finiteNonnegative(value, `report.measurements.stage_ms.${stage}`);
  }
  if (unknownStage && (typeof measurements.stage_unknown_reason !== 'string' || !measurements.stage_unknown_reason.trim())) fail('report.measurements.stage_unknown_reason', 'must explain uninstrumented stages');
  if (!unknownStage && measurements.stage_unknown_reason !== null) fail('report.measurements.stage_unknown_reason', 'must be null when all stages are measured');
  if (!Array.isArray(measurements.resource_samples)) fail('report.measurements.resource_samples', 'must be an array');
  let previousAt = -1;
  for (const [index, sample] of measurements.resource_samples.entries()) {
    const at = `report.measurements.resource_samples[${index}]`;
    if (!sample || typeof sample !== 'object' || Array.isArray(sample)
        || Object.keys(sample).some(key => !['at_ms', 'process_rss_mib', 'device_total_used_mib'].includes(key))
        || !['at_ms', 'process_rss_mib', 'device_total_used_mib'].every(key => Object.hasOwn(sample, key))) fail(at, 'has missing or unknown fields');
    finiteNonnegative(sample.at_ms, `${at}.at_ms`);
    if (sample.at_ms <= previousAt || sample.at_ms > measurements.file_elapsed_ms) fail(`${at}.at_ms`, 'must increase within the run');
    previousAt = sample.at_ms;
    for (const field of ['process_rss_mib', 'device_total_used_mib']) if (sample[field] !== null) finiteNonnegative(sample[field], `${at}.${field}`);
  }
  const unknownResources = !measurements.resource_samples.length || measurements.resource_samples.some(sample => sample.process_rss_mib === null || sample.device_total_used_mib === null);
  if (unknownResources && (typeof measurements.resource_unknown_reason !== 'string' || !measurements.resource_unknown_reason.trim())) fail('report.measurements.resource_unknown_reason', 'must explain missing resource observations');
  if (!unknownResources && measurements.resource_unknown_reason !== null) fail('report.measurements.resource_unknown_reason', 'must be null when sampled');
}
