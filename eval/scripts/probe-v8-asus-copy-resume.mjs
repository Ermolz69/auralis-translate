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
import { runtimeSampler } from './runtime-sampler.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const preflight = process.argv.length === 3 && process.argv[2] === '--preflight';
assert(process.argv.length === 2 || preflight);
assert.equal(process.platform, 'win32');
const initial = JSON.parse(await fs.readFile(path.join(root,
  'eval/reports/2026-10-02-v8-asus-natural-long.json'), 'utf8'));
assert.equal(initial.status, 'completed_with_failure');
const sourcePath = path.join(root, '.cache/eval/commons-asus-rog-ally-892592485/source.zh.srt');
const mediaPath = path.join(root,
  '.cache/eval/commons-geekerwan-two-media/asus-rog-ally-fd0d9bf6-f2b4-4329-a8cf-ad0b5becf72e/source.240p.webm');
const runtimePath = process.env.AURALIS_TEST_LLAMA_SERVER;
const cliPath = path.join(root, 'target/release/auralis-translation-cli.exe');
const previous = path.join(root, '.cache/eval/v8-asus-natural-long-v1/attempt-UhjJZn');
const specs = [
  { id: '1_8b', runId: '2ac914d6-fdad-4d7a-a4d0-0939d6c7270b',
    translationId: '2d3d0fe9-ea24-4478-b669-f0b7336a30cb',
    modelPath: process.env.AURALIS_TEST_GGUF_SMALL,
    manifestPath: path.join(root,
      'models/manifests/hy_mt2_1_8b_q4_k_m.context_v8_target_first_batch4.experimental.json') },
  { id: '7b', runId: '2d879217-8b22-40fe-9d3f-fa4f73b7d0a2',
    translationId: 'dd2284c6-6ef9-4d18-af50-6bbf4bf14264',
    modelPath: process.env.AURALIS_TEST_GGUF_LARGE,
    manifestPath: path.join(root,
      'models/manifests/hy_mt2_7b_q4_k_m.context_v8_target_first_batch4.experimental.json') },
];
const limits = { max_new_chats: 268, max_new_preflights: 536,
  max_cli_ms: 900000, readiness_ms: 180000, max_wall_ms: 2400000,
  resume_commands_per_arm: 1, model_retries: 0 };
const hashFile = async file => {
  const digest = createHash('sha256');
  for await (const chunk of createReadStream(file)) digest.update(chunk);
  return digest.digest('hex');
};
const hashBytes = bytes => createHash('sha256').update(bytes).digest('hex');
assert(runtimePath && path.isAbsolute(runtimePath));
assert(specs.every(spec => spec.modelPath && path.isAbsolute(spec.modelPath)));
assert.equal(await hashFile(sourcePath), initial.source_sha256);
assert.equal(await hashFile(mediaPath), initial.media_sha256);
assert.equal(await hashFile(runtimePath), initial.runtime_sha256);
const cliSha = await hashFile(cliPath);
for (const [index, spec] of specs.entries()) {
  assert.equal(await hashFile(spec.modelPath), initial.arms[index].model_sha256);
  assert.equal(await hashFile(spec.manifestPath), initial.arms[index].manifest_sha256);
  spec.alias = JSON.parse(await fs.readFile(spec.manifestPath, 'utf8')).model_alias;
  assert.equal(await hashFile(path.join(previous, spec.id, 'state/sources',
    `${spec.translationId}.srt`)), initial.source_sha256);
  const db = new DatabaseSync(path.join(previous, spec.id, 'state/auralis-translate.sqlite'),
    { readOnly: true });
  try {
    const run = db.prepare('SELECT run_id, state, profile_fingerprint FROM runs').get();
    assert.equal(run.run_id, spec.runId);
    assert.equal(run.state, 'failed');
    assert.equal(run.profile_fingerprint, initial.arms[index].manifest_sha256);
    assert.equal(db.prepare('SELECT COUNT(*) AS n FROM block_checkpoints').get().n,
      initial.arms[index].validated_checkpoints);
  } finally { db.close(); }
}
if (preflight) {
  console.log(JSON.stringify({ status: 'verified', source_sha256: initial.source_sha256,
    runtime_sha256: initial.runtime_sha256, cli_sha256: cliSha, limits,
    original_prefixes: initial.arms.map(arm => arm.covered_prefix_cues) }));
  process.exit(0);
}

const parent = path.join(root, '.cache/eval/v8-asus-copy-resume-v1');
await fs.mkdir(parent, { recursive: true });
const workspace = await fs.mkdtemp(path.join(parent, 'attempt-'));
const started = performance.now();
const reportPath = path.join(workspace, 'report.json');
const report = { schema_version: 1, experiment: 'v8-asus-copy-resume-v1',
  status: 'running', started_at: new Date().toISOString(),
  original_report_sha256: await hashFile(path.join(root,
    'eval/reports/2026-10-02-v8-asus-natural-long.json')),
  source_sha256: initial.source_sha256, media_sha256: initial.media_sha256,
  runtime_sha256: initial.runtime_sha256, cli_sha256: cliSha,
  harness_sha256: await hashFile(fileURLToPath(import.meta.url)),
  platform: { os: `${os.type()} ${os.release()} ${os.arch()}`,
    cpu: os.cpus()[0].model, ram_bytes: os.totalmem() },
  limits, arms: [], errors: [] };
const save = () => fs.writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`);
const remaining = () => {
  const ms = limits.max_wall_ms - (performance.now() - started);
  assert(ms > 0, 'Declared wall budget exhausted');
  return ms;
};
try {
  const head = (await fs.readFile(path.join(root, '.git/HEAD'), 'utf8')).trim();
  assert(head.startsWith('ref: '));
  report.code_commit = (await fs.readFile(path.join(root, '.git', head.slice(5)), 'utf8')).trim();
  await save();
  for (const [index, spec] of specs.entries()) {
    const prior = initial.arms[index];
    const arm = { id: spec.id, run_id: spec.runId, model_sha256: prior.model_sha256,
      manifest_sha256: prior.manifest_sha256, status: 'preparing',
      previous_checkpoints: prior.validated_checkpoints,
      previous_chats: prior.chat_requests,
      previous_preflights: prior.template_token_preflight_calls,
      errors: [] };
    report.arms.push(arm);
    const directory = path.join(workspace, spec.id);
    const originalState = path.join(previous, spec.id, 'state');
    const state = path.join(directory, 'state');
    const output = path.join(directory, 'candidate.ru.srt');
    await fs.mkdir(directory);
    const originalDbSha = await hashFile(path.join(originalState, 'auralis-translate.sqlite'));
    await fs.cp(originalState, state, { recursive: true, errorOnExist: true, force: false });
    const copiedSource = path.join(state, 'sources', `${spec.translationId}.srt`);
    assert.equal(await hashFile(copiedSource), initial.source_sha256);
    const dbPath = path.join(state, 'auralis-translate.sqlite');
    const db = new DatabaseSync(dbPath);
    try {
      const translation = db.prepare('SELECT source_locator FROM translations').get();
      assert(translation.source_locator.includes(spec.translationId));
      db.prepare('UPDATE translations SET source_locator = ?').run(await fs.realpath(copiedSource));
      assert.equal(db.prepare('SELECT COUNT(*) AS n FROM block_checkpoints').get().n,
        prior.validated_checkpoints);
    } finally { db.close(); }
    arm.copied_source_sha256 = await hashFile(copiedSource);
    arm.original_db_sha256_before = originalDbSha;
    let server, cli, sampler;
    try {
      const port = await freeLoopbackPort();
      const url = `http://127.0.0.1:${port}/`;
      const args = ['--model', spec.modelPath, '--alias', spec.alias,
        '--host', '127.0.0.1', '--port', String(port), '-c', '2048', '-ngl', '99',
        '--parallel', '1', '--jinja', '--cache-ram', '0'];
      const env = { ...process.env, PATH: `${path.dirname(runtimePath)};${path.join(root,
        '.cache/runtime/cudart')};${process.env.PATH}` };
      server = startProcess(runtimePath, args, root, env,
        { maxCaptureCharacters: 4 * 1024 * 1024 });
      await waitForHealthyServer(url, server,
        Math.min(limits.readiness_ms, remaining()));
      sampler = runtimeSampler(path.join(directory, 'resources.jsonl'), root,
        () => [server, cli].filter(process => process && process.child.exitCode === null &&
          process.child.signalCode === null).map(process => process.child.pid));
      arm.status = 'running';
      await save();
      const began = performance.now();
      cli = startProcess(cliPath, ['resume', state, spec.runId,
        spec.manifestPath, url, output], root, process.env,
      { maxCaptureCharacters: 4 * 1024 * 1024 });
      try {
        await waitForExit(cli, Math.min(limits.max_cli_ms, remaining()));
        arm.status = 'completed';
      } catch (error) {
        arm.status = 'failed';
        arm.errors.push(String(error));
      }
      arm.cli_elapsed_ms = Math.round(performance.now() - began);
      arm.cli_exit_code = cli.child.exitCode;
      arm.cli_stdout = cli.stdout;
      arm.cli_stderr = cli.stderr;
    } catch (error) {
      arm.status = 'infrastructure_failed';
      arm.errors.push(String(error));
    } finally {
      arm.resources = sampler ? await sampler.stop() : null;
      await stopProcess(cli);
      await stopProcess(server);
      if (server) {
        await fs.writeFile(path.join(directory, 'server.stdout.log'), server.stdout);
        await fs.writeFile(path.join(directory, 'server.stderr.log'), server.stderr);
      }
      arm.copied_source_after_sha256 = await hashFile(copiedSource);
      arm.original_db_sha256_after = await hashFile(path.join(originalState,
        'auralis-translate.sqlite'));
      arm.output_sha256 = await hashFile(output).catch(() => null);
      const readDb = new DatabaseSync(dbPath, { readOnly: true });
      try {
        arm.run_state = readDb.prepare('SELECT state FROM runs').get().state;
        arm.checkpoints = readDb.prepare('SELECT block_index FROM block_checkpoints ORDER BY block_index').all().length;
        arm.result_count = readDb.prepare('SELECT COUNT(*) AS n FROM results').get().n;
        const requests = readDb.prepare('SELECT sequence, request_kind, outcome, request_sha256, raw_response, prompt_tokens, completion_tokens, elapsed_ms, error_detail FROM inference_requests ORDER BY sequence').all();
        arm.chat_requests = requests.filter(row => row.request_kind === 'chat_completion').length;
        arm.preflight_requests = requests.filter(row => row.request_kind !== 'chat_completion').length;
        arm.new_chat_requests = arm.chat_requests - prior.chat_requests;
        arm.new_preflight_requests = arm.preflight_requests - prior.template_token_preflight_calls;
        const newChats = requests.filter(row => row.request_kind === 'chat_completion'
          && row.sequence > prior.chat_requests + prior.template_token_preflight_calls);
        arm.new_prompt_tokens = newChats.reduce((n, row) => n + (row.prompt_tokens ?? 0), 0);
        arm.new_completion_tokens = newChats.reduce((n, row) => n + (row.completion_tokens ?? 0), 0);
        arm.new_chat_http_ms = newChats.reduce((n, row) => n + (row.elapsed_ms ?? 0), 0);
        const last = newChats.at(-1);
        arm.last_chat = last ? { sequence: last.sequence, outcome: last.outcome,
          request_sha256: last.request_sha256,
          raw_response_sha256: last.raw_response === null ? null :
            hashBytes(Buffer.from(last.raw_response)),
          error_detail: last.error_detail } : null;
      } finally { readDb.close(); }
      assert(arm.new_chat_requests >= 0 && arm.new_chat_requests <= limits.max_new_chats);
      assert(arm.new_preflight_requests >= 0 && arm.new_preflight_requests <= limits.max_new_preflights);
      assert.equal(arm.copied_source_after_sha256, initial.source_sha256);
      assert.equal(arm.original_db_sha256_after, arm.original_db_sha256_before);
      assert(arm.checkpoints >= arm.previous_checkpoints && arm.checkpoints <= 67);
      if (arm.status === 'completed' && (!arm.output_sha256 || arm.result_count !== 1)) {
        arm.status = 'failed';
        arm.errors.push('CLI exited zero without one full result');
      }
      if (arm.status !== 'completed') assert.equal(arm.output_sha256, null);
      arm.finished_at = new Date().toISOString();
      await save();
      console.log(`${spec.id}: ${arm.status}; new chats=${arm.new_chat_requests}; checkpoints=${arm.checkpoints}/67; output=${arm.output_sha256 ?? 'none'}`);
    }
    if (arm.status === 'infrastructure_failed') break;
  }
  report.status = report.arms.length === 2 && report.arms.every(arm => arm.status === 'completed')
    ? 'completed' : 'completed_with_failure';
  if (report.status !== 'completed') process.exitCode = 1;
} catch (error) {
  report.status = 'failed';
  report.errors.push(String(error));
  process.exitCode = 1;
} finally {
  report.finished_at = new Date().toISOString();
  report.wall_elapsed_ms = Math.round(performance.now() - started);
  await save();
  console.log(`v8 copy resume ${report.status}: ${reportPath}`);
}
