import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { gzipSync, gunzipSync } from 'node:zlib';
import { DatabaseSync } from 'node:sqlite';
import { digest } from './flores-file-fixture.mjs';
import { readRunSnapshot } from './cli-run-state.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const stem = '2026-09-29-reg009-long-cli-prefix-repair';
const reports = path.join(root, 'eval/reports');
const summaryPath = path.join(reports, `${stem}-summary.json`);
const archivePath = path.join(reports, `${stem}-archive.json.gz`);
const correctionPath = path.join(reports, `${stem}-capture-correction.json`);
const sourceSha = 'e9b760bdcce97de9f29f5fe671dbb927088f5a15119ebe3200e73e0408391bb3';
const profileSha = 'e80c80b0cf1db26d62ce5f644091f30e42fea752d27a0ce201fcab33f29ecb69';
const fixtureSha = '0527cab3c4ea38aa91ae65c6f4e52103d7e0c5cde1ab778dc7e9da1a46c43986';
const countBy = (rows, key) => Object.fromEntries(Object.entries(Object.groupBy(rows, key))
  .map(([label, group]) => [label, group.length]));
const sum = (rows, field) => rows.reduce((total, row) => total + (row[field] ?? 0), 0);
const percentile = (numbers, fraction) => numbers.length
  ? [...numbers].sort((a, b) => a - b)[Math.ceil(fraction * numbers.length) - 1] : null;
const readMaybe = async file => fs.readFile(file).catch(error => {
  if (error.code === 'ENOENT') return null;
  throw error;
});

if (process.argv[2] === '--resources') {
  const archive = JSON.parse(gunzipSync(await fs.readFile(archivePath)));
  const samples = archive.samples;
  const diagnostics = archive.snapshot.checkpoints.flatMap(checkpoint =>
    JSON.parse(checkpoint.diagnostics_json));
  const trackedPeak = field => Math.max(0, ...samples.map(sample =>
    (sample.processes ?? []).reduce((total, process) => total + (process[field] ?? 0), 0)));
  const gpuMiB = samples.map(sample => Number(sample.gpu_device?.split(',')[1]?.trim()))
    .filter(Number.isFinite);
  console.log(JSON.stringify({
    samples: samples.length,
    interval_ms: 5000,
    sample_errors: samples.reduce((total, sample) => total + (sample.errors?.length ?? 0), 0),
    tracked_working_set_peak_bytes: trackedPeak('WorkingSet64'),
    tracked_private_peak_bytes: trackedPeak('PrivateMemorySize64'),
    device_wide_gpu_peak_mib: gpuMiB.length ? Math.max(...gpuMiB) : null,
    gpu_offload_observed: false,
    diagnostics_by_code: countBy(diagnostics, row => row.code),
  }, null, 2));
  process.exit(0);
}

if (process.argv[2] === '--correct') {
  const oldBytes = await fs.readFile(summaryPath);
  const old = JSON.parse(oldBytes);
  const archive = JSON.parse(gunzipSync(await fs.readFile(archivePath)));
  assert.equal(old.outcome, 'failed_retained');
  assert.equal(old.no_partial_publication, false);
  assert.equal(old.offline_reexport_identical, false);
  assert.equal(archive.snapshot.results.length, 0);
  assert.equal(archive.output_srt_base64, null);
  const correction = {
    schema_version: 1,
    experiment: old.experiment,
    corrected_at: new Date().toISOString(),
    original_summary_sha256: digest(oldBytes),
    archive_sha256: old.archive_sha256,
    original_fields: {
      no_partial_publication: old.no_partial_publication,
      offline_reexport_identical: old.offline_reexport_identical,
    },
    corrected_fields: { no_partial_publication: true, offline_reexport_identical: null },
    evidence: { persisted_results: 0, published_output: false, checkpoints: archive.snapshot.checkpoints.length },
    reason: 'The first capture derived failure fields from a success-only report instead of the retained SQLite result count and output-file absence.',
  };
  await fs.writeFile(correctionPath, `${JSON.stringify(correction, null, 2)}\n`, { flag: 'wx' });
  console.log(`Retained capture correction; original summary SHA-256 ${correction.original_summary_sha256}.`);
  process.exit(0);
}

if (process.argv[2] === '--failure') {
  const archive = JSON.parse(gunzipSync(await fs.readFile(archivePath)));
  assert.equal(archive.wrapper.status, 'failed_retained');
  const chats = archive.requests.filter(row => row.request_kind === 'chat_completion');
  const recent = chats.slice(-1).map(row => ({
    sequence: row.sequence,
    request_sha256: row.request_sha256,
    raw_response_sha256: row.raw_response_sha256,
    segment_id: row.segment_id,
    line_index: row.line_index,
    outcome: row.outcome,
    rendered_request: Buffer.from(row.rendered_request_base64, 'base64').toString('utf8'),
    raw_response: row.raw_response_base64 === null ? null
      : Buffer.from(row.raw_response_base64, 'base64').toString('utf8'),
    restored_candidate: row.restored_candidate,
    error_detail: row.error_detail,
    prompt_tokens: row.prompt_tokens,
    completion_tokens: row.completion_tokens,
    elapsed_ms: row.elapsed_ms,
  }));
  console.log(JSON.stringify({
    run_id: archive.snapshot?.run.run_id ?? null,
    checkpoint_count: archive.snapshot?.checkpoints.length ?? 0,
    recent,
  }, null, 2));
  process.exit(0);
}

if (process.argv[2] === '--check') {
  const summaryBytes = await fs.readFile(summaryPath);
  const summary = JSON.parse(summaryBytes);
  const compressed = await fs.readFile(archivePath);
  assert.equal(digest(compressed), summary.archive_sha256);
  const uncompressed = gunzipSync(compressed);
  assert.equal(digest(uncompressed), summary.archive_uncompressed_sha256);
  const archive = JSON.parse(uncompressed);
  assert.equal(archive.schema_version, 1);
  assert.equal(archive.wrapper.experiment, 'long-v6-prefix-repair-1024-v1');
  assert.equal(archive.wrapper.status, summary.outcome);
  assert.equal(archive.wrapper.source_sha256, sourceSha);
  assert.equal(archive.wrapper.profile_sha256, profileSha);
  assert.equal(digest(Buffer.from(archive.source_srt_base64, 'base64')), sourceSha);
  assert.equal(digest(Buffer.from(archive.profile_base64, 'base64')), profileSha);
  assert.equal(archive.requests.length, summary.request_count);
  assert.equal(archive.snapshot?.checkpoints.length ?? 0, summary.checkpoint_count);
  assert.equal(archive.requests.filter(row => row.request_kind === 'chat_completion').length,
    summary.chat_request_count);
  assert.equal(archive.requests.filter(row => row.request_kind !== 'chat_completion').length,
    summary.preflight_request_count);
  for (const request of archive.requests) {
    assert.equal(digest(Buffer.from(request.rendered_request_base64, 'base64')), request.request_sha256);
    assert.equal(request.raw_response_base64 === null, request.raw_response_sha256 === null);
    if (request.raw_response_base64 !== null) assert.equal(
      digest(Buffer.from(request.raw_response_base64, 'base64')), request.raw_response_sha256);
  }
  if (summary.outcome === 'structural_pass_meaning_unreviewed') {
    assert.equal(archive.snapshot.run.state, 'validated');
    assert.equal(archive.snapshot.checkpoints.length, 1024);
    assert.equal(archive.snapshot.results.length, 1);
    assert.equal(digest(Buffer.from(archive.output_srt_base64, 'base64')), summary.output_sha256);
    assert.equal(archive.report.code_preserved_cues, summary.code_preserved_cues);
    assert.equal(archive.report.offline_reexport, 'byte_identical');
  } else {
    assert.equal(summary.outcome, 'failed_retained');
    assert(archive.wrapper.error);
  }
  const correctionBytes = await readMaybe(correctionPath);
  if (correctionBytes !== null) {
    const correction = JSON.parse(correctionBytes);
    assert.equal(correction.original_summary_sha256, digest(summaryBytes));
    assert.equal(correction.archive_sha256, summary.archive_sha256);
    assert.equal(correction.corrected_fields.no_partial_publication,
      archive.snapshot.results.length === 0 && archive.output_srt_base64 === null);
    assert.equal(correction.evidence.checkpoints, summary.checkpoint_count);
  }
  console.log(`Verified REG-009 long CLI archive: ${summary.outcome}; ${summary.checkpoint_count}/1024 checkpoints, ${summary.request_count} raw requests.`);
  process.exit(0);
}

const workspaceArg = process.argv[2];
assert(workspaceArg);
const workspace = await fs.realpath(path.resolve(workspaceArg));
assert(workspace.startsWith(path.join(root, '.cache/eval/long-v6-prefix-repair-runs') + path.sep));
const srt = path.join(workspace, 'srt');
const wrapper = JSON.parse(await fs.readFile(path.join(workspace, 'summary.json')));
assert.equal(wrapper.experiment, 'long-v6-prefix-repair-1024-v1');
assert(wrapper.ended_at && wrapper.status !== 'running');
assert.equal(wrapper.source_sha256, sourceSha);
assert.equal(wrapper.profile_sha256, profileSha);
assert.equal(wrapper.fixture_sha256, fixtureSha);
const source = await fs.readFile(path.join(srt, 'source.srt'));
const profile = await fs.readFile(path.join(srt, 'profile.json'));
const fixture = await fs.readFile(path.join(workspace, 'fixture-manifest.json'));
assert.equal(digest(source), sourceSha);
assert.equal(digest(profile), profileSha);
assert.equal(digest(fixture), fixtureSha);
const output = await readMaybe(path.join(srt, 'candidate.ru.srt'));
const reportBytes = await readMaybe(path.join(srt, 'report.json'));
const report = reportBytes === null ? null : JSON.parse(reportBytes);
const interruptedBytes = await readMaybe(path.join(srt, 'interrupted-snapshot.json'));
const interrupted = interruptedBytes === null ? null : JSON.parse(interruptedBytes);
const dbPath = path.join(srt, 'state/auralis-translate.sqlite');
const dbExists = await fs.stat(dbPath).catch(() => null);
let snapshot = null;
let requests = [];
if (dbExists) {
  const db = new DatabaseSync(dbPath, { readOnly: true });
  try {
    const run = db.prepare('SELECT run_id FROM runs LIMIT 1').get();
    if (run) {
      snapshot = readRunSnapshot(dbPath, run.run_id);
      requests = db.prepare('SELECT * FROM inference_requests WHERE run_id = ? ORDER BY sequence')
        .all(run.run_id).map(row => {
          const rendered = Buffer.from(row.rendered_request);
          const raw = row.raw_response === null ? null : Buffer.from(row.raw_response);
          return {
            ...row,
            rendered_request: undefined,
            raw_response: undefined,
            rendered_request_base64: rendered.toString('base64'),
            raw_response_base64: raw?.toString('base64') ?? null,
            raw_response_sha256: raw === null ? null : digest(raw),
          };
        });
    }
  } finally { db.close(); }
}
assert(requests.every((row, index) => index === 0 || row.sequence > requests[index - 1].sequence));
const chat = requests.filter(row => row.request_kind === 'chat_completion');
const preflight = requests.filter(row => row.request_kind !== 'chat_completion');
assert(chat.length <= wrapper.budget.maximum_chat_requests);
assert(preflight.length <= wrapper.budget.maximum_preflight_requests);
const outputBytes = output ?? null;
if (wrapper.status === 'structural_pass_meaning_unreviewed') {
  assert(report && interrupted && snapshot && outputBytes);
  assert.equal(wrapper.report_sha256, digest(reportBytes));
  assert.equal(report.source_sha256, sourceSha);
  assert.equal(report.profile_sha256, profileSha);
  assert.equal(report.output_sha256, digest(outputBytes));
  assert.equal(snapshot.run.state, 'validated');
  assert.equal(snapshot.checkpoints.length, 1024);
  assert.equal(snapshot.results.length, 1);
  assert.equal(report.offline_reexport, 'byte_identical');
  assert.equal(report.structural_checks, 'passed');
  assert.equal(report.rows.length, 1024);
} else {
  assert.equal(wrapper.status, 'failed_retained');
  assert(wrapper.error);
}
const samplesBytes = await readMaybe(path.join(srt, 'resources.jsonl'));
const samples = samplesBytes === null ? [] : samplesBytes.toString('utf8').trim().split('\n')
  .filter(Boolean).map(line => JSON.parse(line));
const logs = {};
for (const name of ['cli.log', 'server-1.log', 'server-2.log', 'failure.json']) {
  const bytes = await readMaybe(path.join(srt, name));
  logs[name] = bytes?.toString('utf8') ?? null;
}
const archive = {
  schema_version: 1,
  wrapper,
  report,
  interrupted,
  snapshot,
  requests,
  source_srt_base64: source.toString('base64'),
  profile_base64: profile.toString('base64'),
  scene_map_utf8: (await readMaybe(path.join(srt, 'scene-map.json')))?.toString('utf8') ?? null,
  output_srt_base64: outputBytes?.toString('base64') ?? null,
  samples,
  logs,
};
const raw = Buffer.from(`${JSON.stringify(archive)}\n`);
const compressed = gzipSync(raw, { mtime: 0 });
const elapsed = chat.map(row => row.elapsed_ms).filter(Number.isFinite);
const summary = {
  schema_version: 1,
  experiment: wrapper.experiment,
  outcome: wrapper.status,
  captured_at: new Date().toISOString(),
  code_commit: wrapper.git_head,
  git_status_at_start: wrapper.git_status,
  source_sha256: sourceSha,
  profile_sha256: profileSha,
  model_sha256: wrapper.model_sha256,
  runtime_sha256: wrapper.runtime_sha256,
  cli_sha256: wrapper.cli_sha256,
  run_id: snapshot?.run.run_id ?? null,
  result_id: snapshot?.results[0]?.result_id ?? null,
  output_sha256: outputBytes === null ? null : digest(outputBytes),
  checkpoint_count: snapshot?.checkpoints.length ?? 0,
  interrupted_checkpoint_count: interrupted?.checkpoints.length ?? null,
  request_count: requests.length,
  chat_request_count: chat.length,
  preflight_request_count: preflight.length,
  outcomes: countBy(requests, row => `${row.request_kind}:${row.outcome}`),
  prompt_tokens: sum(chat, 'prompt_tokens'),
  completion_tokens: sum(chat, 'completion_tokens'),
  chat_elapsed_sum_ms: sum(chat, 'elapsed_ms'),
  chat_elapsed_p50_ms: percentile(elapsed, 0.5),
  chat_elapsed_p95_ms: percentile(elapsed, 0.95),
  sample_count: samples.length,
  sample_error_count: samples.reduce((total, sample) => total + (sample.errors?.length ?? 0), 0),
  code_preserved_cues: report?.code_preserved_cues ?? null,
  no_partial_publication: report === null
    ? (snapshot?.results.length ?? 0) === 0 && outputBytes === null
    : report.partial_result === 'absent' && report.partial_output === 'absent',
  offline_reexport_identical: report === null ? null : report.offline_reexport === 'byte_identical',
  human_review: 'missing',
  source_group: wrapper.source_group,
  archive_file: path.basename(archivePath),
  archive_sha256: digest(compressed),
  archive_uncompressed_sha256: digest(raw),
};
for (const file of [summaryPath, archivePath]) assert.equal(await fs.stat(file).catch(() => null), null,
  `already captured: ${file}`);
await fs.writeFile(archivePath, compressed, { flag: 'wx' });
await fs.writeFile(summaryPath, `${JSON.stringify(summary, null, 2)}\n`, { flag: 'wx' });
console.log(`Captured REG-009 long CLI ${summary.outcome}: ${summary.checkpoint_count}/1024 checkpoints, ${summary.request_count} requests.`);
