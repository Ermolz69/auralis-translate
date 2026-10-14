import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { DatabaseSync } from 'node:sqlite';
import { performance } from 'node:perf_hooks';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const cli = path.join(root, 'target/release/auralis-translation-cli.exe');
const server = process.env.AURALIS_TEST_LLAMA_SERVER;
const model = process.env.AURALIS_TEST_GGUF;
const gpuLayers = process.env.AURALIS_LOCAL_E2E_GPU_LAYERS ?? '99';
const started = performance.now();
const maxWallMs = 900_000;
const digest = bytes => createHash('sha256').update(bytes).digest('hex');
const sourceBytes = {
  srt: Buffer.from('1\n00:00:00,000 --> 00:00:01,000\n你好。\n\n2\n00:00:01,500 --> 00:00:02,500\n再见。\n'),
  vtt: Buffer.from('WEBVTT\n\nfirst\n00:00:00.000 --> 00:00:01.000\n你好。\n\nsecond\n00:00:01.500 --> 00:00:02.500\n再见。\n'),
};
assert.equal(digest(sourceBytes.srt), 'e28a722eb38da1a1f3ebb2c941e78697e835ad7cd7d2d2949794f2028dc2746b');
assert.equal(digest(sourceBytes.vtt), '5c89f87be30c903460f70d73d458c84e0cfa02eb83120e23adbc367c2c961bbc');
assert(server && model && fs.statSync(server).isFile() && fs.statSync(model).isFile());
assert(fs.statSync(cli).isFile());

const manifestPath = path.join(root, 'models/manifests/hy_mt2_1_8b_q4_k_m.context_v8_target_first_batch1.experimental.json');
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
const profile = { ...manifest, context_before_segments: 0, context_after_segments: 0,
  max_context_bytes: 0 };
const profileBytes = Buffer.from(`${JSON.stringify(profile, null, 2)}\n`);
assert.equal(digest(profileBytes), '82b0d4d5a37ee742dd40697e01e60bb251b5230dbdec29313b05f702e1380193');
assert.equal(fs.statSync(model).size, profile.model_file_bytes);

const parent = path.join(root, '.cache/eval/token-count-local-e2e-v1');
fs.mkdirSync(parent, { recursive: true });
const workspace = fs.mkdtempSync(path.join(parent, 'attempt-'));
const profilePath = path.join(workspace, 'profile.json');
fs.writeFileSync(profilePath, profileBytes, { flag: 'wx' });
const report = {
  experiment: 'PERF-01-token-count-local-e2e-v1', started_at: new Date().toISOString(),
  status: 'running', profile_sha256: digest(profileBytes), model_sha256: profile.model_file_sha256,
  runtime_build: profile.runtime_build_info,
  budget: { max_wall_ms: maxWallMs, chat_requests: 6, preflight_requests: 6, retries: 0 },
  runs: [], errors: [],
};
function invoke(command, args, record) {
  const remaining = maxWallMs - (performance.now() - started);
  assert(remaining > 0, 'E2E wall budget exhausted');
  const begin = performance.now();
  const result = spawnSync(cli, [command, ...args], {
    cwd: root, encoding: 'utf8', timeout: Math.min(600_000, remaining),
    maxBuffer: 8 * 1024 * 1024, windowsHide: true,
  });
  record.calls.push({ command, exit_code: result.status, elapsed_ms: performance.now() - begin,
    stdout: result.stdout, stderr: result.stderr, error: result.error?.message ?? null });
  assert.ifError(result.error);
  assert.equal(result.status, 0, `${command}: ${result.stderr}`);
  return result;
}
try {
  for (const [index, format] of ['srt', 'vtt', 'srt'].entries()) {
    const directory = path.join(workspace, `run-${index + 1}-${format}`);
    fs.mkdirSync(directory);
    const source = path.join(directory, `source.${format}`);
    const output = path.join(directory, `result.ru.${format}`);
    const replay = path.join(directory, `replay.ru.${format}`);
    const state = path.join(directory, 'state');
    fs.writeFileSync(source, sourceBytes[format], { flag: 'wx' });
    const run = { format, source_sha256: digest(sourceBytes[format]), calls: [] };
    report.runs.push(run);
    const command = format === 'srt' ? 'translate-local' : 'translate-vtt-local';
    const initial = invoke(command, [source, state, profilePath, server, model, gpuLayers, output], run);
    const runId = initial.stdout.match(/run_id=([0-9a-f-]{36})/)?.[1];
    assert(runId, 'Durable run id missing');
    assert.match(initial.stdout, /result_id=[0-9a-f-]{36} review=needs_review/);
    const outputBytes = fs.readFileSync(output);
    assert.notEqual(digest(outputBytes), run.source_sha256);
    assert.equal(digest(fs.readFileSync(source)), run.source_sha256);
    const db = new DatabaseSync(path.join(state, 'auralis-translate.sqlite'), { readOnly: true });
    try {
      const kinds = db.prepare('SELECT request_kind AS kind, COUNT(*) AS count, SUM(elapsed_ms) AS elapsed_ms FROM inference_requests GROUP BY request_kind').all();
      run.inference = Object.fromEntries(kinds.map(({ kind, count, elapsed_ms }) =>
        [kind, { count, elapsed_ms }]));
      assert.equal(run.inference.count_input_tokens?.count, 2);
      assert.equal(run.inference.chat_completion?.count, 2);
      assert.equal(run.inference.apply_template, undefined);
      assert.equal(run.inference.tokenize, undefined);
    } finally { db.close(); }
    invoke('resume-local', [state, runId, profilePath, 'runtime-must-not-start',
      'model-must-not-open', gpuLayers, replay], run);
    assert.deepEqual(fs.readFileSync(replay), outputBytes);
    assert.equal(digest(fs.readFileSync(source)), run.source_sha256);
    run.output_sha256 = digest(outputBytes);
    run.offline_export_equal = true;
  }
  report.status = 'passed';
} catch (error) {
  report.status = 'failed';
  report.errors.push(String(error.stack ?? error));
} finally {
  report.finished_at = new Date().toISOString();
  report.elapsed_ms = performance.now() - started;
  fs.writeFileSync(path.join(workspace, 'report.json'), `${JSON.stringify(report, null, 2)}\n`);
  console.log(JSON.stringify({ status: report.status, workspace,
    formats: report.runs.map(run => run.format),
    count_requests: report.runs.reduce((sum, run) => sum + (run.inference?.count_input_tokens?.count ?? 0), 0),
    chat_requests: report.runs.reduce((sum, run) => sum + (run.inference?.chat_completion?.count ?? 0), 0),
    error: report.errors.at(0) ?? null }));
}
if (report.status !== 'passed') process.exitCode = 1;
