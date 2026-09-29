import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { gzipSync } from 'node:zlib';
import { DatabaseSync } from 'node:sqlite';
import { digest } from './flores-file-fixture.mjs';
import { assertSavedPrefix, readRunSnapshot } from './cli-run-state.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const workspaceArg = process.argv[2];
assert(workspaceArg);
const workspace = path.resolve(workspaceArg);
assert(workspace.startsWith(path.join(root, '.cache/eval/long-v6-scene-runs') + path.sep));
const srtDir = path.join(workspace, 'srt');
const stem = '2026-09-29-long-v6-scene-timeout';
const failureBytes = await fs.readFile(path.join(srtDir, 'failure.json'));
const failure = JSON.parse(failureBytes);
assert.match(failure.error, /^Error: Process timeout\n/u);
const interrupted = JSON.parse(await fs.readFile(path.join(srtDir, 'interrupted-snapshot.json')));
interrupted.checkpoints = interrupted.checkpoints.map((row) => Object.assign(Object.create(null), row));
const snapshot = readRunSnapshot(path.join(srtDir, 'state/auralis-translate.sqlite'), interrupted.run.run_id);
const source = await fs.readFile(path.join(srtDir, 'source.srt'));
const reference = await fs.readFile(path.join(srtDir, 'reference.ru.srt'));
const profile = await fs.readFile(path.join(srtDir, 'profile.json'));
const sceneMap = await fs.readFile(path.join(srtDir, 'scene-map.json'));
const fixture = await fs.readFile(path.join(workspace, 'fixture-manifest.json'));
const resourceBytes = await fs.readFile(path.join(srtDir, 'resources.jsonl'));
const cliLog = await fs.readFile(path.join(srtDir, 'cli.log'));
const serverLogs = await Promise.all([1, 2].map((index) =>
  fs.readFile(path.join(srtDir, `server-${index}.log`))));
assert.equal(snapshot.run.state, 'running');
assert.equal(interrupted.checkpoints.length, 16);
assert(snapshot.checkpoints.length >= 16 && snapshot.checkpoints.length < 1024);
assertSavedPrefix(interrupted, snapshot);
assert.equal(snapshot.results.length, 0);
assert.equal(await fs.stat(path.join(srtDir, 'candidate.ru.srt')).catch(() => null), null);
assert.deepEqual(await fs.readFile(snapshot.source.source_locator), source);
assert.equal(digest(source), 'e9b760bdcce97de9f29f5fe671dbb927088f5a15119ebe3200e73e0408391bb3');
assert.equal(digest(fixture), '0527cab3c4ea38aa91ae65c6f4e52103d7e0c5cde1ab778dc7e9da1a46c43986');
assert.equal(digest(profile), 'b30546f228ba230364ba79edae55456d62e7d7c5010e56fef38464c3531089c5');
assert.match(cliLog.toString('utf8'), /saved_blocks=9\d\d\/1024/u);
const db = new DatabaseSync(path.join(srtDir, 'state/auralis-translate.sqlite'), { readOnly: true });
let requests;
try {
  requests = db.prepare('SELECT * FROM inference_requests WHERE run_id = ? ORDER BY sequence').all(snapshot.run.run_id)
    .map((row) => ({ ...row,
      rendered_request: Buffer.from(row.rendered_request).toString('utf8'),
      raw_response: row.raw_response === null ? null : Buffer.from(row.raw_response).toString('utf8'),
    }));
} finally { db.close(); }
assert(requests.length > 0);
assert(requests.every((request, index) => index === 0 || request.sequence > requests[index - 1].sequence));
const resources = resourceBytes.toString('utf8').trim().split(/\r?\n/u).map((line) => JSON.parse(line));
assert(resources.length > 0);
const peakTracked = (field) => Math.max(...resources.map((sample) =>
  sample.processes.reduce((sum, process) => sum + (process[field] ?? 0), 0)));
const gpu = resources.map((sample) => Number(sample.gpu_device?.split(',')[1]?.trim()))
  .filter(Number.isFinite);
const journalBytes = Buffer.from(`${JSON.stringify({
  schema_version: 1, run_id: snapshot.run.run_id, run: snapshot.run,
  attempts: snapshot.attempts, interrupted_checkpoints: interrupted.checkpoints,
  checkpoints: snapshot.checkpoints, requests,
  source_srt_utf8: source.toString('utf8'),
  reference_srt_utf8: reference.toString('utf8'),
}, null, 2)}\n`);
const journalGzip = gzipSync(journalBytes, { mtime: 0 });
const summary = {
  schema_version: 1, experiment: 'long-v6-slot-scene-1024-v1',
  outcome: 'failed_runner_resume_process_timeout',
  captured_at: new Date().toISOString(), code_commit: '5c557cc6e8a0d87d9a9fb96c065d62b612ac437b',
  task: 'task eval:cli:long:v6:scene', run_id: snapshot.run.run_id,
  source_sha256: digest(source), reference_sha256: digest(reference),
  fixture_manifest_sha256: digest(fixture), profile_sha256: digest(profile),
  scene_map_sha256: digest(sceneMap), model_sha256: JSON.parse(profile).model_file_sha256,
  requested_gpu_layers: 99, runtime_build: JSON.parse(profile).runtime_build_info,
  resumed_process_timeout_ms: 3_600_000, declared_total_wall_budget_ms: 7_200_000,
  interrupted_blocks: interrupted.checkpoints.length, saved_blocks: snapshot.checkpoints.length,
  planned_blocks: JSON.parse(snapshot.run.block_plan_json).length,
  saved_prefix_preserved: true, result_count: snapshot.results.length,
  partial_output_present: false, request_count: requests.length,
  requests_by_kind_outcome: Object.entries(Object.groupBy(requests,
    (request) => `${request.request_kind}:${request.outcome}`))
    .map(([key, rows]) => ({ key, count: rows.length })),
  pending_request_count: requests.filter((request) => request.outcome === 'pending').length,
  chat_prompt_tokens_recorded: requests.filter((request) => request.request_kind === 'chat_completion')
    .reduce((sum, request) => sum + (request.prompt_tokens ?? 0), 0),
  chat_completion_tokens_recorded: requests.filter((request) => request.request_kind === 'chat_completion')
    .reduce((sum, request) => sum + (request.completion_tokens ?? 0), 0),
  resource_sample_count: resources.length,
  resource_sampling_error_count: resources.reduce((sum, sample) => sum + sample.errors.length, 0),
  peak_tracked_working_set_bytes: peakTracked('WorkingSet64'),
  peak_tracked_private_bytes: peakTracked('PrivateMemorySize64'),
  peak_device_gpu_mib: gpu.length ? Math.max(...gpu) : null,
  first_resource_sample_at: resources[0].created_at,
  last_resource_sample_at: resources.at(-1).created_at,
  failure_sha256: digest(failureBytes), resources_sha256: digest(resourceBytes),
  cli_log_sha256: digest(cliLog), server_log_sha256: serverLogs.map(digest),
  journal_uncompressed_sha256: digest(journalBytes), journal_gzip_sha256: digest(journalGzip),
  journal_file: `${stem}-journal.json.gz`,
  subtitle_holdout: false, bilingual_reviewed: false, quality_verdict: 'unreviewed',
};
const outputDir = path.join(root, 'eval/reports');
for (const file of [`${stem}.json`, `${stem}-journal.json.gz`]) {
  assert.equal(await fs.stat(path.join(outputDir, file)).catch(() => null), null, `${file} already exists`);
}
await fs.writeFile(path.join(outputDir, `${stem}-journal.json.gz`), journalGzip, { flag: 'wx' });
await fs.writeFile(path.join(outputDir, `${stem}.json`), `${JSON.stringify(summary, null, 2)}\n`, { flag: 'wx' });
console.log(`Archived v6 timeout: ${summary.saved_blocks}/${summary.planned_blocks} blocks, ${requests.length} requests, no result or output`);
