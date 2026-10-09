import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { createReadStream } from 'node:fs';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { performance } from 'node:perf_hooks';
import { fileURLToPath } from 'node:url';
import { freeLoopbackPort, startProcess, stopProcess, waitForExit, waitForHealthyServer } from './local-process.mjs';
import { relocateCopiedSource } from './relocate-copied-source.mjs';
import { runtimeSampler } from './runtime-sampler.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const assetRoot = process.env.AURALIS_EVAL_ASSET_ROOT ?? root;
const preflight = process.argv.length === 3 && process.argv[2] === '--preflight';
assert(process.argv.length === 2 || preflight);
assert.equal(process.platform, 'win32');
const originalRun = path.join(root, '.cache/eval/v8-vivo-original-long-v1/attempt-MAaX5T');
const originalState = path.join(originalRun, '1_8b/state');
const outputRoot = path.join(root, '.cache/eval/reg065-vivo-copy-recovery-v1');
const modelPath = path.join(assetRoot, '.cache/models/Hy-MT2-1.8B-Q4_K_M.gguf');
const runtimePath = path.join(assetRoot, '.cache/runtime/llama/llama-server.exe');
const cliPath = path.join(root, 'target/release/auralis-translation-cli.exe');
const manifestPath = path.join(root,
  'models/manifests/hy_mt2_1_8b_q4_k_m.context_v8_target_first_batch4.experimental.json');
const expected = {
  original_report: '84a737e1cc8c7b468ea66718f2507882929344f259d7824d9071953d24c1a5b5',
  original_db: '9b631a1edf5e9e3fa6e1b660a35c414d8b34b2f35f522ea2def4a8d4705666b1',
  source: 'b100803367b95fa55fc638b1ff39a0abfa0d5b8183ebe58d58b1a87242d9d8c4',
  model: 'dc5f44fcf1fa496ee7ad725982c0c8c553a4de00259b53af84c4b89fb0c06699',
  manifest: '1803aeb68428e1b138a17ed72b01abe1cc5fbc5845b5bca66a402b8936b1081f',
  runtime: '6f15be27bd80b6b4d52afefa49094e18fcfab55d5da354d717971f2d2537b2f4',
  cli: '0a5620b6f2b733dafe5a6d5c58771a6bfffc8f6f2069d01ce8d93d66ab04213f',
  run_id: 'fbcd29fb-b556-490c-b956-2b91d37a3edd',
};
const limits = { initial_batches: 28, expected_batches: 117,
  max_new_chats: 89, max_new_preflights: 178,
  max_new_tokens: 150000, readiness_ms: 180000,
  max_cli_ms: 900000, max_wall_ms: 1200000, repetitions: 1, retries: 0 };
const hashFile = async file => {
  const hash = createHash('sha256');
  for await (const chunk of createReadStream(file)) hash.update(chunk);
  return hash.digest('hex');
};
assert.equal(await hashFile(path.join(originalRun, 'report.json')), expected.original_report);
assert.equal(await hashFile(path.join(originalState, 'auralis-translate.sqlite')), expected.original_db);
assert.equal(await hashFile(modelPath), expected.model);
assert.equal(await hashFile(runtimePath), expected.runtime);
assert.equal(await hashFile(cliPath), expected.cli);
assert.equal(await hashFile(manifestPath), expected.manifest);
const manifest = JSON.parse(await fs.readFile(manifestPath, 'utf8'));
assert.equal(manifest.prompt_version, 8);
assert.equal(manifest.target_segments_per_block, 4);
assert.equal(manifest.model_file_sha256, expected.model);
const oldDb = new DatabaseSync(path.join(originalState, 'auralis-translate.sqlite'),
  { readOnly: true });
let initial;
try {
  initial = {
    checkpoints: oldDb.prepare('SELECT count(*) AS count FROM block_checkpoints').get().count,
    chats: oldDb.prepare("SELECT count(*) AS count FROM inference_requests WHERE request_kind = 'chat_completion'").get().count,
    preflights: oldDb.prepare("SELECT count(*) AS count FROM inference_requests WHERE request_kind IN ('apply_template', 'tokenize')").get().count,
    results: oldDb.prepare('SELECT count(*) AS count FROM results').get().count,
    run: oldDb.prepare('SELECT * FROM runs WHERE run_id = ?').get(expected.run_id),
  };
} finally { oldDb.close(); }
assert.equal(initial.checkpoints, limits.initial_batches);
assert.equal(initial.chats, 29);
assert.equal(initial.preflights, 58);
assert.equal(initial.results, 0);
assert.equal(initial.run.source_sha256, expected.source);
if (preflight) {
  console.log(JSON.stringify({ status: 'verified', expected, limits, initial,
    model_alias: manifest.model_alias }));
  process.exit(0);
}

await fs.mkdir(outputRoot, { recursive: true });
const workspace = await fs.mkdtemp(path.join(outputRoot, 'attempt-'));
const state = path.join(workspace, 'state');
const output = path.join(workspace, 'candidate.ru.srt');
const reportPath = path.join(workspace, 'report.json');
const started = performance.now();
const report = { schema_version: 1,
  experiment: 'REG-065-vivo-v8-1.8b-copy-recovery-2026-10-09-v1',
  status: 'running', started_at: new Date().toISOString(), expected, limits,
  initial: { checkpoints: initial.checkpoints, chats: initial.chats,
    preflights: initial.preflights, results: initial.results },
  code_commit: null, git_status: null,
  harness_sha256: await hashFile(fileURLToPath(import.meta.url)),
  platform: { os: `${os.type()} ${os.release()} ${os.arch()}`,
    cpu: os.cpus()[0].model, ram_bytes: os.totalmem() } };
const save = () => fs.writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`);
let server, cli, sampler;
try {
  const git = await waitForExit(startProcess('git', ['rev-parse', 'HEAD'], root), 10000);
  report.code_commit = git.stdout.trim();
  const status = await waitForExit(startProcess('git', ['status', '--short'], root), 10000);
  report.git_status = status.stdout.trim();
  await fs.cp(originalState, state, { recursive: true, force: false,
    errorOnExist: true });
  assert.equal(await hashFile(path.join(state, 'auralis-translate.sqlite')),
    expected.original_db);
  report.copied_source = await relocateCopiedSource({
    dbPath: path.join(state, 'auralis-translate.sqlite'),
    runId: expected.run_id, originalStateDir: originalState,
    copiedStateDir: state, expectedSourceSha256: expected.source,
  });
  await save();
  const port = await freeLoopbackPort();
  const url = `http://127.0.0.1:${port}/`;
  const serverArgs = ['--model', modelPath, '--alias', manifest.model_alias,
    '--host', '127.0.0.1', '--port', String(port), '-c', '2048', '-ngl', '99',
    '--parallel', '1', '--jinja', '--cache-ram', '0'];
  report.server_args = serverArgs.map(arg => arg === modelPath ? '<pinned-model>' : arg);
  const env = { ...process.env, PATH: `${path.dirname(runtimePath)};${path.join(assetRoot,
    '.cache/runtime/cudart')};${process.env.PATH}` };
  server = startProcess(runtimePath, serverArgs, root, env,
    { maxCaptureCharacters: 4 * 1024 * 1024 });
  await waitForHealthyServer(url, server, limits.readiness_ms);
  sampler = runtimeSampler(path.join(workspace, 'resources.jsonl'), root,
    () => [server, cli].filter(process => process && process.child.exitCode === null &&
      process.child.signalCode === null).map(process => process.child.pid));
  report.status = 'resuming';
  await save();
  const began = performance.now();
  cli = startProcess(cliPath, ['resume', state, expected.run_id,
    manifestPath, url, output], root, process.env,
  { maxCaptureCharacters: 4 * 1024 * 1024 });
  try {
    await waitForExit(cli, Math.min(limits.max_cli_ms,
      limits.max_wall_ms - (performance.now() - started)));
    report.status = 'completed';
  } catch (error) {
    report.status = 'model_or_cli_failed';
    report.error = String(error);
  }
  report.cli_elapsed_ms = Math.round(performance.now() - began);
  report.cli_exit_code = cli.child.exitCode;
  report.cli_stdout = cli.stdout;
  report.cli_stderr = cli.stderr;
} catch (error) {
  report.status = 'infrastructure_failed';
  report.error = String(error);
} finally {
  report.resources = sampler ? await sampler.stop() : null;
  await stopProcess(cli);
  await stopProcess(server);
  if (server) {
    await fs.writeFile(path.join(workspace, 'server.stdout.log'), server.stdout);
    await fs.writeFile(path.join(workspace, 'server.stderr.log'), server.stderr);
  }
  const dbPath = path.join(state, 'auralis-translate.sqlite');
  if (await fs.stat(dbPath).catch(() => null)) {
    const db = new DatabaseSync(dbPath, { readOnly: true });
    try {
      report.run = db.prepare('SELECT * FROM runs WHERE run_id = ?').get(expected.run_id);
      report.checkpoints = db.prepare('SELECT block_index, input_fingerprint, accepted_json, attempt_count FROM block_checkpoints ORDER BY block_index').all();
      report.results = db.prepare('SELECT result_id, output_sha256, review_state FROM results').all();
      report.requests = db.prepare('SELECT sequence, request_kind, batch_fingerprint, segment_id, line_index, request_sha256, rendered_request, outcome, raw_response, restored_candidate, prompt_tokens, completion_tokens, elapsed_ms, error_detail FROM inference_requests ORDER BY sequence').all().map(row => ({
        ...row, rendered_request: Buffer.from(row.rendered_request).toString('utf8'),
        raw_response: row.raw_response === null ? null : Buffer.from(row.raw_response).toString('utf8'),
      }));
    } finally { db.close(); }
  }
  report.total_chats = report.requests?.filter(row => row.request_kind === 'chat_completion').length ?? 0;
  report.total_preflights = report.requests?.filter(row =>
    row.request_kind === 'apply_template' || row.request_kind === 'tokenize').length ?? 0;
  report.new_chats = report.total_chats - initial.chats;
  report.new_preflights = report.total_preflights - initial.preflights;
  report.new_tokens = report.requests?.filter(row => row.request_kind === 'chat_completion' &&
    row.sequence > 3 * initial.chats).reduce((sum, row) => sum +
      (row.prompt_tokens ?? 0) + (row.completion_tokens ?? 0), 0) ?? 0;
  report.output_sha256 = await hashFile(output).catch(() => null);
  report.original_db_after_sha256 = await hashFile(path.join(originalState,
    'auralis-translate.sqlite'));
  report.original_report_after_sha256 = await hashFile(path.join(originalRun, 'report.json'));
  if (report.status === 'completed' && (!report.output_sha256 ||
    report.checkpoints?.length !== limits.expected_batches || report.results?.length !== 1)) {
    report.status = 'invalid_completion';
    report.error = 'Zero exit without complete validated result';
  }
  if (report.new_chats > limits.max_new_chats ||
    report.new_preflights > limits.max_new_preflights ||
    report.new_tokens > limits.max_new_tokens ||
    report.original_db_after_sha256 !== expected.original_db ||
    report.original_report_after_sha256 !== expected.original_report) {
    report.status = 'invariant_failed';
    report.error = 'Budget or source-state immutability invariant failed';
  }
  report.finished_at = new Date().toISOString();
  report.wall_elapsed_ms = Math.round(performance.now() - started);
  await save();
  if (report.status !== 'completed') process.exitCode = 1;
  console.log(`REG-065 copy recovery ${report.status}: ${reportPath}; new chats=${report.new_chats}, checkpoints=${report.checkpoints?.length ?? 0}, output=${report.output_sha256 ?? 'none'}`);
}
