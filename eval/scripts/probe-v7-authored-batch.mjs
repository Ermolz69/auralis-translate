import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { createReadStream } from 'node:fs';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { performance } from 'node:perf_hooks';
import { fileURLToPath } from 'node:url';
import { digest } from './flores-file-fixture.mjs';
import { freeLoopbackPort, startProcess, stopProcess, waitForExit, waitForHealthyServer } from './local-process.mjs';
import { runtimeSampler } from './runtime-sampler.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const sourcePath = path.join(root, 'eval/corpora/v7-batch-development-v1.zh.srt');
const manifestPath = path.join(root, 'models/manifests/hy_mt2_1_8b_q4_k_m.context_v7_batch4.experimental.json');
const modelPath = process.env.AURALIS_TEST_GGUF;
const serverPath = process.env.AURALIS_TEST_LLAMA_SERVER;
const cliPath = path.join(root, 'target/release/auralis-translation-cli.exe');
const preflight = process.argv.length === 3 && process.argv[2] === '--preflight';
assert(process.argv.length === 2 || preflight, 'Only --preflight is supported');
assert.equal(process.platform, 'win32');
assert(modelPath && serverPath && path.isAbsolute(modelPath) && path.isAbsolute(serverPath));

async function hashFile(file) {
  const hash = createHash('sha256');
  for await (const chunk of createReadStream(file)) hash.update(chunk);
  return hash.digest('hex');
}

const source = await fs.readFile(sourcePath);
const manifestBytes = await fs.readFile(manifestPath);
const manifest = JSON.parse(manifestBytes);
const identities = {
  source_sha256: digest(source), manifest_sha256: digest(manifestBytes),
  model_sha256: await hashFile(modelPath), runtime_sha256: await hashFile(serverPath),
  cli_sha256: await hashFile(cliPath),
};
assert.equal(identities.model_sha256, manifest.model_file_sha256);
assert.equal(identities.runtime_sha256,
  '6f15be27bd80b6b4d52afefa49094e18fcfab55d5da354d717971f2d2537b2f4');
assert.equal(manifest.prompt_version, 7);
assert.equal(manifest.target_segments_per_block, 4);
assert.equal(manifest.min_context_tokens, 2048);
if (preflight) {
  console.log(JSON.stringify({ status: 'verified', identities, budget: { chat_requests: 8, wall_ms: 600000 } }));
  process.exit(0);
}

const parent = path.join(root, '.cache/eval/v7-authored-batch-v1');
await fs.mkdir(parent, { recursive: true });
const workspace = await fs.mkdtemp(path.join(parent, 'attempt-'));
const started = performance.now();
const report = {
  schema_version: 1, experiment: 'v7-authored-batch-v1', started_at: new Date().toISOString(),
  status: 'running', code_commit: null, dirty_code: true, identities,
  platform: { os: `${os.type()} ${os.release()} ${os.arch()}`,
    cpu: os.cpus()[0].model, ram_bytes: os.totalmem() },
  budget: { max_chat_requests: 8, max_wall_ms: 600000, per_arm_ms: 240000,
    arms: [1, 4], repetitions: 1, automatic_retries: 0 },
  arms: [], errors: [],
};
let server, sampler, cli;
const remaining = () => {
  const time = report.budget.max_wall_ms - (performance.now() - started);
  if (time <= 0) throw new Error('v7 authored screen wall budget exhausted');
  return time;
};
try {
  const git = startProcess('git', ['rev-parse', 'HEAD'], root);
  await waitForExit(git, 10000);
  report.code_commit = git.stdout.trim();
  const port = await freeLoopbackPort();
  const url = `http://127.0.0.1:${port}/`;
  const serverArgs = ['--model', modelPath, '--alias', manifest.model_alias,
    '--host', '127.0.0.1', '--port', String(port), '-c', '2048', '-ngl', '99',
    '--parallel', '1', '--jinja', '--cache-ram', '0'];
  report.server_args = serverArgs.map(arg => arg === modelPath ? '<pinned-model>' : arg);
  const serverEnv = { ...process.env,
    PATH: `${path.dirname(serverPath)};${path.join(root, '.cache/runtime/cudart')};${process.env.PATH}` };
  server = startProcess(serverPath, serverArgs, root, serverEnv, { maxCaptureCharacters: 4 * 1024 * 1024 });
  await waitForHealthyServer(url, server, Math.min(180000, remaining()));
  sampler = runtimeSampler(path.join(workspace, 'resources.jsonl'), root,
    () => [server, cli].filter(process => process && process.child.exitCode === null &&
      process.child.signalCode === null).map(process => process.child.pid));
  for (const size of report.budget.arms) {
    const arm = { size, started_at: new Date().toISOString(), status: 'running' };
    report.arms.push(arm);
    const dir = path.join(workspace, `batch-${size}`);
    await fs.mkdir(dir);
    const input = path.join(dir, 'source.zh.srt');
    const output = path.join(dir, 'candidate.ru.srt');
    const state = path.join(dir, 'state');
    const profilePath = path.join(dir, 'profile.json');
    const scenePath = path.join(dir, 'scene-map.json');
    const profile = { ...manifest, target_segments_per_block: size };
    await fs.writeFile(input, source, { flag: 'wx' });
    await fs.writeFile(profilePath, `${JSON.stringify(profile, null, 2)}\n`, { flag: 'wx' });
    await fs.writeFile(scenePath, `${JSON.stringify({ schema_version: 1,
      source_sha256: identities.source_sha256, evidence_id: 'authored-v7-dev-scene',
      scene_end_ids: [4] }, null, 2)}\n`, { flag: 'wx' });
    arm.profile_sha256 = await hashFile(profilePath);
    arm.scene_map_sha256 = await hashFile(scenePath);
    const armStarted = performance.now();
    cli = startProcess(cliPath, ['translate-v5-scene', input, state, profilePath,
      scenePath, url, output], root, process.env, { maxCaptureCharacters: 4 * 1024 * 1024 });
    try {
      await waitForExit(cli, Math.min(report.budget.per_arm_ms, remaining()));
      arm.status = 'completed';
    } catch (error) {
      arm.status = 'failed';
      arm.error = error.message;
    }
    arm.elapsed_ms = performance.now() - armStarted;
    arm.stdout = cli.stdout;
    arm.stderr = cli.stderr;
    arm.exit_code = cli.child.exitCode;
    arm.source_after_sha256 = await hashFile(input);
    arm.output_sha256 = await hashFile(output).catch(() => null);
    arm.output_text = await fs.readFile(output, 'utf8').catch(() => null);
    const dbPath = path.join(state, 'auralis-translate.sqlite');
    if (await fs.stat(dbPath).catch(() => null)) {
      const db = new DatabaseSync(dbPath, { readOnly: true });
      try {
        arm.run = db.prepare('SELECT * FROM runs LIMIT 1').get() ?? null;
        arm.checkpoints = db.prepare('SELECT block_index, input_fingerprint, accepted_json, attempt_count FROM block_checkpoints ORDER BY block_index').all();
        arm.results = db.prepare('SELECT result_id, output_sha256, review_state FROM results').all();
        arm.requests = db.prepare('SELECT sequence, request_kind, batch_fingerprint, segment_id, line_index, request_sha256, rendered_request, outcome, raw_response, restored_candidate, prompt_tokens, completion_tokens, elapsed_ms, error_detail FROM inference_requests ORDER BY sequence').all().map(row => ({
          ...row, rendered_request: Buffer.from(row.rendered_request).toString('utf8'),
          raw_response: row.raw_response === null ? null : Buffer.from(row.raw_response).toString('utf8'),
        }));
      } finally { db.close(); }
    }
    arm.chat_requests = arm.requests?.filter(row => row.request_kind === 'chat_completion').length ?? 0;
    assert(arm.chat_requests <= 4, `Arm ${size} exceeded chat budget`);
    assert.equal(arm.source_after_sha256, identities.source_sha256);
    console.log(`v7 size=${size} ${arm.status}; chats=${arm.chat_requests}; elapsed=${Math.round(arm.elapsed_ms)} ms`);
    if (arm.status !== 'completed') break;
  }
  assert(report.arms.reduce((sum, arm) => sum + arm.chat_requests, 0) <= 8);
  report.status = report.arms.length === 2 && report.arms.every(arm => arm.status === 'completed')
    ? 'completed' : 'completed_with_failure';
  if (report.status !== 'completed') process.exitCode = 1;
} catch (error) {
  report.status = 'failed';
  report.errors.push(error.message);
  process.exitCode = 1;
} finally {
  report.resources = sampler ? await sampler.stop() : null;
  await stopProcess(server);
  if (server) {
    await fs.writeFile(path.join(workspace, 'server.stdout.log'), server.stdout);
    await fs.writeFile(path.join(workspace, 'server.stderr.log'), server.stderr);
  }
  report.ended_at = new Date().toISOString();
  report.wall_ms = performance.now() - started;
  const reportPath = path.join(workspace, 'report.json');
  await fs.writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, { flag: 'wx' });
  console.log(`v7 authored batch ${report.status}: ${reportPath}`);
}
