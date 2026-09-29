import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { gzipSync } from 'node:zlib';
import { DatabaseSync } from 'node:sqlite';
import { digest } from './flores-file-fixture.mjs';
import { assertSavedPrefix, readRunSnapshot } from './cli-run-state.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const [workspaceArg, stem] = process.argv.slice(2);
assert(workspaceArg && stem === '2026-09-29-long-v6-scene');
const workspace = path.resolve(workspaceArg);
assert(workspace.startsWith(path.join(root, '.cache/eval/long-v6-scene-runs') + path.sep));
const srtDir = path.join(workspace, 'srt');
const reportBytes = await fs.readFile(path.join(srtDir, 'report.json'));
const report = JSON.parse(reportBytes);
const runnerSummary = JSON.parse(await fs.readFile(path.join(workspace, 'summary.json')));
const interrupted = JSON.parse(await fs.readFile(path.join(srtDir, 'interrupted-snapshot.json')));
const completed = readRunSnapshot(path.join(srtDir, 'state/auralis-translate.sqlite'), report.run_id);
const source = await fs.readFile(path.join(srtDir, 'source.srt'));
const output = await fs.readFile(path.join(srtDir, 'candidate.ru.srt'));
const reference = await fs.readFile(path.join(srtDir, 'reference.ru.srt'));
const profile = await fs.readFile(path.join(srtDir, 'profile.json'));
const sceneMap = await fs.readFile(path.join(srtDir, 'scene-map.json'));
const fixture = await fs.readFile(path.join(workspace, 'fixture-manifest.json'));

assert.equal(runnerSummary.experiment, 'long-v6-slot-scene-1024-v1');
assert.equal(runnerSummary.report_sha256, digest(reportBytes));
assert.equal(report.cue_count, 1024);
assert.equal(report.text_slot_count, 1280);
assert.equal(report.rows.length, 1024);
assert.equal(report.structural_checks, 'passed');
assert.equal(report.checkpoint_preservation, 'exact_saved_prefix');
assert.equal(report.quality_verdict, 'unreviewed');
assert.equal(report.subtitle_holdout, false);
assert.equal(report.bilingual_reviewed, false);
assert.equal(report.run_id, completed.run.run_id);
assert.equal(completed.run.state, 'validated');
assert.equal(completed.checkpoints.length, report.planned_blocks);
assert.equal(interrupted.checkpoints.length, report.interrupted_blocks);
assertSavedPrefix(interrupted, completed);
assert.equal(completed.results.length, 1);
assert.equal(completed.results[0].review_state, 'needs_review');
assert.equal(completed.results[0].output_sha256, digest(output));
assert.equal(report.source_sha256, digest(source));
assert.equal(report.output_sha256, digest(output));
assert.equal(report.profile_sha256, digest(profile));
assert.equal(report.model_sha256, JSON.parse(profile).model_file_sha256);
assert.equal(report.scene_map_sha256, digest(sceneMap));
assert.equal(report.fixture_manifest_sha256, digest(fixture));
const runtimeSha256 = digest(await fs.readFile(report.runtime_executable));
assert.equal(runtimeSha256, '6f15be27bd80b6b4d52afefa49094e18fcfab55d5da354d717971f2d2537b2f4');
assert.equal(runnerSummary.source_sha256, digest(source));
assert.equal(runnerSummary.output_sha256, digest(output));
assert.deepEqual(await fs.readFile(completed.source.source_locator), source);
assert.equal(report.attempts.length, 2);
assert.equal(report.partial_output, 'absent');
assert.equal(report.partial_result, 'absent');
assert.equal(report.offline_reexport, 'byte_identical');
assert.equal(report.existing_output_protection, 'passed');
assert.deepEqual(await fs.readFile(path.join(srtDir, 'offline-reexport.ru.srt')), output);

const db = new DatabaseSync(path.join(srtDir, 'state/auralis-translate.sqlite'), { readOnly: true });
let requests;
try {
  requests = db.prepare('SELECT * FROM inference_requests WHERE run_id = ? ORDER BY sequence').all(report.run_id)
    .map((row) => ({ ...row,
      rendered_request: Buffer.from(row.rendered_request).toString('utf8'),
      raw_response: row.raw_response === null ? null : Buffer.from(row.raw_response).toString('utf8'),
    }));
} finally { db.close(); }
assert(requests.length > 0);
assert(requests.every((request, index) => index === 0 || request.sequence > requests[index - 1].sequence));
const requestsByKindOutcome = Object.entries(Object.groupBy(requests, (row) => `${row.request_kind}:${row.outcome}`))
  .map(([key, rows]) => ({ key, count: rows.length }));
const chatRequests = requests.filter((request) => request.request_kind === 'chat_completion');
const sumKnown = (rows, field) => rows.reduce((sum, row) => sum + (row[field] ?? 0), 0);
const samples = report.resources.samples;
assert(samples.length > 0);
const peakTracked = (field) => Math.max(...samples.map((sample) =>
  sample.processes.reduce((sum, process) => sum + (process[field] ?? 0), 0)));
const gpuReadings = samples.map((sample) => Number(sample.gpu_device?.split(',')[1]?.trim()))
  .filter(Number.isFinite);
const peakGpuMiB = gpuReadings.length ? Math.max(...gpuReadings) : null;
const journal = Buffer.from(`${JSON.stringify({
  schema_version: 1, run_id: report.run_id, run: completed.run,
  attempts: completed.attempts, checkpoints: completed.checkpoints,
  result: completed.results[0], requests,
  source_srt_utf8: source.toString('utf8'),
  reference_srt_utf8: reference.toString('utf8'),
  output_srt_utf8: output.toString('utf8'),
}, null, 2)}\n`);
const journalGzip = gzipSync(journal, { mtime: 0 });
const summary = {
  schema_version: 1, experiment: runnerSummary.experiment,
  captured_at: new Date().toISOString(), outcome: 'passed_structural_unreviewed',
  code_commit: '5c557cc6e8a0d87d9a9fb96c065d62b612ac437b', task: 'task eval:cli:long:v6:scene',
  run_id: report.run_id, result_id: report.result_id,
  source_sha256: digest(source), output_sha256: digest(output),
  reference_sha256: digest(reference), profile_sha256: digest(profile),
  model_sha256: report.model_sha256, runtime_build: report.runtime_build,
  runtime_executable_sha256: runtimeSha256,
  cli_executable_sha256: report.cli_executable_sha256,
  scene_map_sha256: digest(sceneMap), fixture_manifest_sha256: digest(fixture),
  report_sha256: digest(reportBytes), report_file: `${stem}-rows.json`,
  journal_uncompressed_sha256: digest(journal), journal_gzip_sha256: digest(journalGzip),
  journal_file: `${stem}-journal.json.gz`,
  resources_sha256: digest(await fs.readFile(path.join(srtDir, 'resources.jsonl'))),
  cue_count: report.cue_count, text_slot_count: report.text_slot_count,
  interrupted_blocks: report.interrupted_blocks, planned_blocks: report.planned_blocks,
  request_count: requests.length, requests_by_kind_outcome: requestsByKindOutcome,
  pending_request_count: requests.filter((request) => request.outcome === 'pending').length,
  chat_request_count: chatRequests.length,
  chat_prompt_tokens_recorded: sumKnown(chatRequests, 'prompt_tokens'),
  chat_completion_tokens_recorded: sumKnown(chatRequests, 'completion_tokens'),
  chat_elapsed_ms_sum: sumKnown(chatRequests, 'elapsed_ms'),
  resource_sample_count: samples.length,
  resource_sampling_error_count: samples.reduce((sum, sample) => sum + sample.errors.length, 0),
  peak_tracked_working_set_bytes: peakTracked('WorkingSet64'),
  peak_tracked_private_bytes: peakTracked('PrivateMemorySize64'),
  peak_device_gpu_mib: peakGpuMiB,
  full_elapsed_ms: report.full_elapsed_ms, interruption_elapsed_ms: report.interruption_elapsed_ms,
  resume_elapsed_ms: report.resume_elapsed_ms, resources: report.resources,
  source_preserved: true, saved_prefix_preserved: true,
  no_partial_publication: true, offline_reexport_identical: true,
  subtitle_holdout: false, bilingual_reviewed: false, quality_verdict: 'unreviewed',
};
const outputDir = path.join(root, 'eval/reports');
for (const name of [`${stem}.json`, `${stem}-rows.json`, `${stem}-journal.json.gz`]) {
  assert.equal(await fs.stat(path.join(outputDir, name)).catch(() => null), null, `${name} already exists`);
}
await fs.writeFile(path.join(outputDir, `${stem}-journal.json.gz`), journalGzip, { flag: 'wx' });
await fs.writeFile(path.join(outputDir, `${stem}-rows.json`), reportBytes, { flag: 'wx' });
await fs.writeFile(path.join(outputDir, `${stem}.json`), `${JSON.stringify(summary, null, 2)}\n`, { flag: 'wx' });
console.log(`Archived ${report.cue_count} cues, ${requests.length} requests, ${completed.checkpoints.length} preserved checkpoints; quality unreviewed`);
