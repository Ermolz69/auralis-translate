import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { gzipSync, gunzipSync } from 'node:zlib';
import { DatabaseSync } from 'node:sqlite';
import { digest } from './flores-file-fixture.mjs';
import { assertSavedPrefix, readRunSnapshot } from './cli-run-state.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const workspace = path.resolve(process.argv[2] ?? '');
assert(workspace.startsWith(path.join(root, '.cache/eval/long-v6-relocated-continuation-runs') + path.sep));
const srtDir = path.join(workspace, 'srt');
const runId = '86876d9c-bb84-4450-9214-8eb21f7d262c';
const source = await fs.readFile(path.join(srtDir, 'source.srt'));
const reference = await fs.readFile(path.join(srtDir, 'reference.ru.srt'));
const profile = await fs.readFile(path.join(srtDir, 'profile.json'));
const failure = await fs.readFile(path.join(srtDir, 'continuation-failure.json'));
const cliLog = await fs.readFile(path.join(srtDir, 'continuation-cli.log'));
const serverLog = await fs.readFile(path.join(srtDir, 'continuation-server.log'));
const resourceBytes = await fs.readFile(path.join(srtDir, 'continuation-resources.jsonl'));
const fixture = await fs.readFile(path.join(workspace, 'fixture-manifest.json'));
const snapshot = readRunSnapshot(path.join(srtDir, 'state/auralis-translate.sqlite'), runId);
const oldArchive = await fs.readFile(path.join(root, 'eval/reports/2026-09-29-long-v6-scene-timeout-journal.json.gz'));
const old = JSON.parse(gunzipSync(oldArchive));
assert.equal(snapshot.run.state, 'failed');
assert.equal(snapshot.checkpoints.length, 982);
assert.equal(snapshot.attempts.length, 3);
assert.equal(snapshot.attempts[2].stop_reason, 'translation failed');
assert.equal(snapshot.results.length, 0);
assert.equal(await fs.stat(path.join(srtDir, 'candidate.ru.srt')).catch(() => null), null);
assert.equal(old.checkpoints.length, 964);
assertSavedPrefix({ checkpoints: old.checkpoints.map(row => Object.assign(Object.create(null), row)) }, snapshot);
assert.deepEqual(await fs.readFile(snapshot.source.source_locator), source);
assert.equal(digest(source), 'e9b760bdcce97de9f29f5fe671dbb927088f5a15119ebe3200e73e0408391bb3');
assert.equal(digest(profile), 'b30546f228ba230364ba79edae55456d62e7d7c5010e56fef38464c3531089c5');
assert.equal(digest(fixture), '0527cab3c4ea38aa91ae65c6f4e52103d7e0c5cde1ab778dc7e9da1a46c43986');
assert.match(cliLog.toString('utf8'), /saved_blocks=982\/1024[\s\S]*llama\.cpp did not finish the response/u);
const db = new DatabaseSync(path.join(srtDir, 'state/auralis-translate.sqlite'), { readOnly: true });
let requests;
try {
  requests = db.prepare('SELECT * FROM inference_requests WHERE run_id = ? ORDER BY sequence').all(runId)
    .map(row => ({ ...row, rendered_request: Buffer.from(row.rendered_request).toString('utf8'),
      raw_response: row.raw_response === null ? null : Buffer.from(row.raw_response).toString('utf8') }));
} finally { db.close(); }
assert.equal(requests.length, 3688);
assert.equal(requests.filter(row => row.attempt_id === 3).length, 69);
assert.deepEqual(requests.slice(0, 3619).map(row => row.request_id), old.requests.map(row => row.request_id));
const failed = requests.at(-1);
assert.equal(failed.segment_id, 983);
assert.equal(failed.line_index, 0);
assert.equal(failed.request_kind, 'chat_completion');
assert.equal(failed.outcome, 'invalid_candidate');
assert.equal(failed.error_detail, 'llama.cpp did not finish the response');
const raw = JSON.parse(failed.raw_response);
assert.equal(raw.choices[0].finish_reason, 'length');
assert.equal(failed.completion_tokens, 256);
assert.equal(JSON.parse(failed.rendered_request).max_tokens, 256);
const samples = resourceBytes.toString('utf8').trim().split(/\r?\n/u).map(line => JSON.parse(line));
assert(samples.length > 0);
const peak = field => Math.max(...samples.map(sample =>
  sample.processes.reduce((sum, process) => sum + (process[field] ?? 0), 0)));
const gpu = samples.map(sample => Number(sample.gpu_device?.split(',')[1]?.trim())).filter(Number.isFinite);
const journalBytes = Buffer.from(`${JSON.stringify({
  schema_version: 1, run_id: runId, run: snapshot.run, attempts: snapshot.attempts,
  checkpoints: snapshot.checkpoints, requests, source_srt_utf8: source.toString('utf8'),
  reference_srt_utf8: reference.toString('utf8'),
}, null, 2)}\n`);
const journalGzip = gzipSync(journalBytes, { mtime: 0 });
const stem = '2026-09-29-long-v6-relocated-continuation-failure';
const summary = {
  schema_version: 1, experiment: 'long-v6-timeout-relocated-continuation-1024-v2',
  outcome: 'failed_model_length_repetition', captured_at: new Date().toISOString(),
  code_commit: '432daaf', task: 'task eval:cli:long:v6:continue-relocated', run_id: runId,
  source_sha256: digest(source), reference_sha256: digest(reference),
  profile_sha256: digest(profile), fixture_manifest_sha256: digest(fixture),
  model_sha256: 'dc5f44fcf1fa496ee7ad725982c0c8c553a4de00259b53af84c4b89fb0c06699',
  cli_sha256: '76ab2844996a3d68e9be96035f22f32bfcad79e085a5eacdecddbfa27626452a',
  server_sha256: '6f15be27bd80b6b4d52afefa49094e18fcfab55d5da354d717971f2d2537b2f4',
  runtime_build: 'b10977-0ecb159c9', requested_gpu_layers: 99,
  initial_blocks: 964, saved_blocks: 982, planned_blocks: 1024,
  saved_prefix_preserved: true, attempts: 3, results: 0, partial_output_present: false,
  original_request_count: 3619, new_request_count: 69, total_request_count: requests.length,
  requests_by_kind_outcome: Object.entries(Object.groupBy(requests.filter(row => row.attempt_id === 3),
    row => `${row.request_kind}:${row.outcome}`)).map(([key, rows]) => ({ key, count: rows.length })),
  new_chat_prompt_tokens: requests.filter(row => row.attempt_id === 3 && row.request_kind === 'chat_completion')
    .reduce((sum, row) => sum + (row.prompt_tokens ?? 0), 0),
  new_chat_completion_tokens: requests.filter(row => row.attempt_id === 3 && row.request_kind === 'chat_completion')
    .reduce((sum, row) => sum + (row.completion_tokens ?? 0), 0),
  failed_request: { sequence: failed.sequence, segment_id: failed.segment_id, line_index: failed.line_index,
    request_sha256: failed.request_sha256, prompt_tokens: failed.prompt_tokens,
    completion_tokens: failed.completion_tokens, elapsed_ms: failed.elapsed_ms,
    finish_reason: raw.choices[0].finish_reason, error_detail: failed.error_detail,
    raw_content: raw.choices[0].message.content },
  resource_sample_count: samples.length,
  resource_sampling_error_count: samples.reduce((sum, sample) => sum + sample.errors.length, 0),
  peak_tracked_working_set_bytes: peak('WorkingSet64'),
  peak_tracked_private_bytes: peak('PrivateMemorySize64'),
  peak_device_gpu_mib: gpu.length ? Math.max(...gpu) : null,
  first_resource_sample_at: samples[0].created_at, last_resource_sample_at: samples.at(-1).created_at,
  failure_sha256: digest(failure), cli_log_sha256: digest(cliLog),
  server_log_sha256: digest(serverLog), resources_sha256: digest(resourceBytes),
  original_journal_gzip_sha256: digest(oldArchive), journal_uncompressed_sha256: digest(journalBytes),
  journal_gzip_sha256: digest(journalGzip), journal_file: `${stem}-journal.json.gz`,
  subtitle_holdout: false, bilingual_reviewed: false, quality_verdict: 'unreviewed',
};
const outputDir = path.join(root, 'eval/reports');
for (const name of [`${stem}.json`, `${stem}-journal.json.gz`]) {
  assert.equal(await fs.stat(path.join(outputDir, name)).catch(() => null), null);
}
await fs.writeFile(path.join(outputDir, `${stem}-journal.json.gz`), journalGzip, { flag: 'wx' });
await fs.writeFile(path.join(outputDir, `${stem}.json`), `${JSON.stringify(summary, null, 2)}\n`, { flag: 'wx' });
console.log(`Archived relocated continuation failure: ${snapshot.checkpoints.length}/1024 blocks, ${requests.length} total requests, no result/output.`);
