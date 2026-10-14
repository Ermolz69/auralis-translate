import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { inventory, sha256, summarizeDatabase, summarizeTiming } from './stage-timing-analysis.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const privateRoot = path.join(root, '.cache/eval/stage-timing-v1');
const publicPath = path.join(root, 'eval/reports/2026-10-14-translation-stage-timing.json');
const attemptIds = ['attempt-YLA2o8', 'attempt-VhgCi9'];

function resourceSummary(resources, kind) {
  if (!resources) return null;
  const samples = resources.samples ?? [];
  const totals = samples.map(sample =>
    (sample.processes ?? []).reduce((sum, process) => sum + Number(process.WorkingSet64 ?? 0), 0));
  const gpu = samples.map(sample => sample.gpu_device?.match(/,\s*(\d+),\s*(\d+)$/u))
    .filter(Boolean);
  return {
    sample_count: samples.length,
    interval_ms: resources.interval_ms,
    tracked_working_set_peak_bytes: totals.length ? Math.max(...totals) : null,
    device_gpu_used_peak_mib: gpu.length ? Math.max(...gpu.map(match => Number(match[1]))) : null,
    device_gpu_total_mib: gpu.length ? Number(gpu[0][2]) : null,
    sampler_error_count: samples.reduce((sum, sample) => sum + (sample.errors?.length ?? 0), 0),
    limitation: kind === 'local_prefix'
      ? 'The CLI process was sampled but its local server child was not tracked; device GPU use includes other processes.'
      : 'Sampled process memory is a lower-bound peak; device GPU use includes other processes.',
  };
}

async function publicArm(arm) {
  if (arm.database_path) {
    assert.deepEqual(summarizeDatabase(arm.database_path), arm.database_summary);
    assert.equal(await sha256(arm.database_path), arm.database_sha256);
  }
  if (arm.cli_stderr !== undefined) {
    assert.deepEqual(summarizeTiming(arm.cli_stderr), arm.timing_summary);
  }
  const invalid = arm.database_summary?.outcomes?.invalid_candidate ?? 0;
  const failure = arm.status === 'completed' ? null
    : arm.cli_exit_code === 2 && !arm.database_summary ? 'unsupported_machine_command'
      : invalid > 0 ? 'invalid_candidate' : 'other_incomplete';
  return {
    model: arm.model,
    kind: arm.kind,
    status: arm.status,
    failure,
    cli_exit_code: arm.cli_exit_code ?? null,
    model_sha256: arm.model_sha256,
    profile_sha256: arm.profile_sha256,
    input_sha256: arm.input_sha256,
    source_preserved: arm.source_after_sha256 === arm.input_sha256,
    output_sha256: arm.output_sha256 ?? null,
    database_sha256: arm.database_sha256 ?? null,
    offline_reexport_equal: arm.offline_reexport_equal ?? null,
    cli_wall_ms: arm.cli_wall_ms ?? null,
    external_spawn_to_ready_ms: arm.external_spawn_to_ready_ms ?? null,
    database: arm.database_summary ?? null,
    timing: arm.timing_summary ?? null,
    resources: resourceSummary(arm.resources, arm.kind),
  };
}

async function buildReport() {
  const historical = [];
  for (const [id, relative, expected] of inventory) {
    const file = path.join(root, '.cache/eval', relative);
    assert.equal(await sha256(file), expected);
    historical.push({ id, database_sha256: expected, database: summarizeDatabase(file) });
  }
  const attempts = [];
  for (const id of attemptIds) {
    const file = path.join(privateRoot, id, 'report.json');
    const raw = JSON.parse(await fs.readFile(file, 'utf8'));
    assert.equal(raw.arms.length, 4);
    attempts.push({
      id,
      private_report_sha256: await sha256(file),
      status: raw.status,
      code_commit: raw.code_commit,
      harness_sha256: raw.harness_sha256,
      runtime_sha256: raw.runtime_sha256,
      source_sha256: raw.source_sha256,
      started_at_utc: raw.started_at,
      finished_at_utc: raw.finished_at,
      wall_ms: raw.wall_ms,
      arms: await Promise.all(raw.arms.map(publicArm)),
    });
  }
  return {
    schema_version: 1,
    report_id: 'PERF-02-translation-stage-timing-v1',
    units: { request_and_cli_duration: 'ms', phase_duration: 'us', tokens: 'tokens' },
    quantiles: 'nearest-rank, sorted index ceil(p*n)-1',
    note: 'Nested spans overlap; do not sum request or storage phases with translation_execute. Natural translation attempts stopped on invalid candidates and are partial.',
    historical,
    attempts,
  };
}

const operation = process.argv[2];
const report = await buildReport();
if (operation === '--write') {
  await fs.writeFile(publicPath, `${JSON.stringify(report, null, 2)}\n`);
  console.log(JSON.stringify({ status: 'written', historical: report.historical.length,
    attempts: report.attempts.length, file: path.relative(root, publicPath) }));
} else if (operation === '--check') {
  assert.deepEqual(JSON.parse(await fs.readFile(publicPath, 'utf8')), report);
  console.log(JSON.stringify({ status: 'passed', historical: report.historical.length,
    attempts: report.attempts.length }));
} else {
  throw new Error('Use --write or --check');
}
