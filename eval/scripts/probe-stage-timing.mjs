import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { performance } from 'node:perf_hooks';
import { fileURLToPath } from 'node:url';
import { freeLoopbackPort, startProcess, stopProcess, waitForExit, waitForHealthyServer } from './local-process.mjs';
import { runtimeSampler } from './runtime-sampler.mjs';
import { sha256, summarizeDatabase, summarizeTiming } from './stage-timing-analysis.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const sourcePath = path.join(root, '.cache/eval/commons-asus-rog-ally-892592485/source.zh.srt');
const serverPath = process.env.AURALIS_TEST_LLAMA_SERVER;
const cliPath = path.join(root, 'target/release/auralis-translation-cli.exe');
const started = performance.now();
const maxWallMs = 45 * 60_000;
const expected = {
  source: '923aed3991c2308d92b89c45181cea8ec7ece74e9b4d3a3ce0234d95e329913b',
  prefix: 'fd6cd05e2a2fcf223a25216122161be75e940ec0f43068b217ea51c04587cd73',
  runtime: '6f15be27bd80b6b4d52afefa49094e18fcfab55d5da354d717971f2d2537b2f4',
};
const specs = [
  { id: '1_8b', modelPath: process.env.AURALIS_TEST_GGUF_SMALL,
    modelSha: 'dc5f44fcf1fa496ee7ad725982c0c8c553a4de00259b53af84c4b89fb0c06699',
    profilePath: path.join(root, 'models/manifests/hy_mt2_1_8b_q4_k_m.context_v8_target_first_batch4.experimental.json'),
    profileSha: '1803aeb68428e1b138a17ed72b01abe1cc5fbc5845b5bca66a402b8936b1081f',
    localProfileSha: '32b6269105bc73de973cee0b0c8163b1289cd217b844eb0e719c48465425c432' },
  { id: '7b', modelPath: process.env.AURALIS_TEST_GGUF_LARGE,
    modelSha: '9f96256500f3fc1ab4d64336b58f52a949a95ad7516b0c229476eef782f9f77b',
    profilePath: path.join(root, 'models/manifests/hy_mt2_7b_q4_k_m.context_v8_target_first_batch4.experimental.json'),
    profileSha: 'c287c53efbb4ce78471b64648ea3dd2f521363df0e168b7a61df1fdd6ae0479a',
    localProfileSha: 'a7850c4eb44b52597e1c3ba53d3342009d86373d8c320dd136e58dff563bfbf9' },
];
const digest = bytes => createHash('sha256').update(bytes).digest('hex');
const remaining = () => {
  const value = maxWallMs - (performance.now() - started);
  assert(value > 0, 'Overall wall budget exhausted');
  return value;
};
const events = process => process.stdout.split(/\r?\n/u).filter(Boolean)
  .map(line => JSON.parse(line));
async function waitForReviewedExit(process, timeoutMs) {
  try {
    await waitForExit(process, timeoutMs);
  } catch (error) {
    if (process.child.exitCode !== 3 || !events(process).some(event => event.event === 'result')) {
      throw error;
    }
  }
}

assert.equal(process.platform, 'win32');
assert(serverPath && path.isAbsolute(serverPath));
assert(specs.every(spec => spec.modelPath && path.isAbsolute(spec.modelPath)));
const source = await fs.readFile(sourcePath);
assert.equal(digest(source), expected.source);
assert.equal(await sha256(serverPath), expected.runtime);
const blocks = source.toString('utf8').trimEnd().split(/\r?\n\r?\n/u);
assert.equal(blocks.length, 268);
const prefix = Buffer.from(`${blocks.slice(0, 32).join('\n\n')}\n`);
assert.equal(digest(prefix), expected.prefix);
for (const spec of specs) {
  assert.equal(await sha256(spec.modelPath), spec.modelSha);
  assert.equal(await sha256(spec.profilePath), spec.profileSha);
}

const parent = path.join(root, '.cache/eval/stage-timing-v1');
await fs.mkdir(parent, { recursive: true });
const directory = await fs.mkdtemp(path.join(parent, 'attempt-'));
const reportPath = path.join(directory, 'report.json');
const report = {
  schema_version: 1, experiment: 'PERF-02-translation-stage-timing-v1',
  started_at: new Date().toISOString(), status: 'running',
  code_commit: execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim(),
  dirty_state: execFileSync('git', ['status', '--short'], { cwd: root, encoding: 'utf8' }).trim(),
  harness_sha256: await sha256(fileURLToPath(import.meta.url)),
  runtime_sha256: expected.runtime, source_sha256: expected.source,
  platform: { os: `${os.type()} ${os.release()} ${os.arch()}`, cpu: os.cpus()[0].model,
    ram_bytes: os.totalmem() },
  limits: { natural_wall_ms: 1_200_000, local_wall_ms: 600_000,
    total_wall_ms: maxWallMs, natural_chat_max: 268, natural_preflight_max: 1000,
    natural_tokens_max: 300_000, local_chat_max: 32, local_preflight_max: 128,
    repetitions: 1, retries: 0 },
  arms: [], errors: [],
};
const save = () => fs.writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`);
await save();

async function runArm(spec, kind) {
  const isLocal = kind === 'local_prefix';
  const armDirectory = path.join(directory, `${spec.id}-${kind}`);
  await fs.mkdir(armDirectory);
  const input = path.join(armDirectory, 'source.zh.srt');
  const output = path.join(armDirectory, 'candidate.ru.srt');
  const state = path.join(armDirectory, 'state');
  const scene = path.join(armDirectory, 'scene-map.json');
  const profilePath = path.join(armDirectory, 'profile.json');
  const arm = { model: spec.id, kind, status: 'preparing',
    model_sha256: spec.modelSha, profile_sha256: isLocal ? spec.localProfileSha : spec.profileSha,
    input_sha256: isLocal ? expected.prefix : expected.source,
    started_at: new Date().toISOString(), errors: [] };
  report.arms.push(arm);
  await fs.writeFile(input, isLocal ? prefix : source, { flag: 'wx' });
  if (isLocal) {
    const profile = JSON.parse(await fs.readFile(spec.profilePath, 'utf8'));
    profile.context_before_segments = 0;
    profile.context_after_segments = 0;
    profile.max_context_bytes = 0;
    const bytes = Buffer.from(`${JSON.stringify(profile, null, 2)}\n`);
    assert.equal(digest(bytes), spec.localProfileSha);
    await fs.writeFile(profilePath, bytes, { flag: 'wx' });
  } else {
    await fs.writeFile(scene, `${JSON.stringify({ schema_version: 1,
      source_sha256: expected.source,
      evidence_id: 'commons-asus-provisional-one-video-scene-v1', scene_end_ids: [268] })}\n`,
    { flag: 'wx' });
  }
  let server, cli, sampler;
  const env = { ...process.env, AURALIS_EVAL_TIMINGS: '1',
    PATH: `${path.dirname(serverPath)};${path.join(root, '.cache/runtime/cudart')};${process.env.PATH}` };
  try {
    let args;
    if (isLocal) {
      args = ['--jsonl', 'translate-local', input, state, profilePath, serverPath, spec.modelPath,
        '99', output];
    } else {
      const port = await freeLoopbackPort();
      const url = `http://127.0.0.1:${port}/`;
      const startedServer = performance.now();
      server = startProcess(serverPath, ['--model', spec.modelPath, '--alias',
        JSON.parse(await fs.readFile(spec.profilePath, 'utf8')).model_alias,
        '--host', '127.0.0.1', '--port', String(port), '-c', '2048', '-ngl', '99',
        '--parallel', '1', '--jinja', '--cache-ram', '0'], root, env,
      { maxCaptureCharacters: 4 * 1024 * 1024 });
      await waitForHealthyServer(url, server, Math.min(180_000, remaining()));
      arm.external_spawn_to_ready_ms = performance.now() - startedServer;
      args = ['--jsonl', 'translate-v5-scene', input, state, spec.profilePath, scene, url, output];
    }
    sampler = runtimeSampler(path.join(armDirectory, 'resources.jsonl'), root,
      () => [server, cli].filter(item => item && item.child.exitCode === null &&
        item.child.signalCode === null).map(item => item.child.pid));
    arm.status = 'running';
    await save();
    const began = performance.now();
    cli = startProcess(cliPath, args, root, env, { maxCaptureCharacters: 4 * 1024 * 1024 });
    try {
      await waitForReviewedExit(cli, Math.min(isLocal ? 600_000 : 1_200_000, remaining()));
      arm.status = 'completed';
    } catch (error) {
      arm.status = 'cli_failed';
      arm.errors.push(String(error));
    }
    arm.cli_wall_ms = performance.now() - began;
  } catch (error) {
    arm.status = 'infrastructure_failed';
    arm.errors.push(String(error.stack ?? error));
  } finally {
    arm.resources = sampler ? await sampler.stop() : null;
    if (cli) {
      arm.cli_stdout = cli.stdout;
      arm.cli_stderr = cli.stderr;
      arm.cli_exit_code = cli.child.exitCode;
      arm.stdout_truncated = cli.stdoutTruncated;
      arm.stderr_truncated = cli.stderrTruncated;
      arm.timing_summary = summarizeTiming(cli.stderr);
    }
    await stopProcess(cli);
    await stopProcess(server);
    arm.server_stderr = server?.stderr ?? null;
    arm.source_after_sha256 = await sha256(input);
    arm.output_sha256 = await sha256(output).catch(() => null);
    const databasePath = path.join(state, 'auralis-translate.sqlite');
    if (await fs.stat(databasePath).catch(() => null)) {
      arm.database_path = databasePath;
      arm.database_summary = summarizeDatabase(databasePath);
      arm.database_sha256 = await sha256(databasePath);
    }
    arm.finished_at = new Date().toISOString();
    await save();
  }
  assert.equal(arm.source_after_sha256, arm.input_sha256);
  assert(!arm.stderr_truncated, 'Timing stderr was truncated');
  if (arm.database_summary) {
    const summary = arm.database_summary;
    const preflights = Object.values(summary.preflight_kinds).reduce((sum, count) => sum + count, 0);
    assert(summary.chats <= (isLocal ? 32 : 268));
    assert(preflights <= (isLocal ? 128 : 1000));
    if (!isLocal) assert(summary.prompt_tokens.sum + summary.completion_tokens.sum <= 300_000);
    assert.equal(arm.timing_summary?.phases.journal_begin?.count, summary.chats + preflights);
    assert.equal(arm.timing_summary?.phases.journal_finish?.count, summary.chats + preflights);
  }
  if (isLocal && arm.status === 'completed') {
    assert.equal(arm.database_summary?.results, 1);
    assert(arm.output_sha256);
    const runId = events(cli).find(event => event.event === 'result')?.run_id;
    assert(runId, 'Missing local durable run ID');
    const replay = path.join(armDirectory, 'replay.ru.srt');
    const replayProcess = startProcess(cliPath, ['--jsonl', 'resume-local', state, runId, profilePath,
      'runtime-must-not-start', 'model-must-not-open', '99', replay], root, env);
    await waitForReviewedExit(replayProcess, Math.min(60_000, remaining()));
    assert.equal(await sha256(replay), arm.output_sha256);
    arm.offline_reexport_equal = true;
  }
  await save();
  console.log(JSON.stringify({ model: spec.id, kind, status: arm.status,
    chats: arm.database_summary?.chats ?? 0, results: arm.database_summary?.results ?? 0 }));
  return arm;
}

try {
  for (const spec of specs) {
    const natural = await runArm(spec, 'natural_scene');
    if (natural.status === 'infrastructure_failed') break;
    await runArm(spec, 'local_prefix');
  }
  const natural = report.arms.filter(arm => arm.kind === 'natural_scene');
  const local = report.arms.filter(arm => arm.kind === 'local_prefix');
  report.status = natural.length === 2 && local.length === 2
    && natural.every(arm => (arm.database_summary?.chats ?? 0) >= 30)
    && local.every(arm => arm.status === 'completed' && arm.offline_reexport_equal)
    ? 'measured' : 'incomplete';
} catch (error) {
  report.status = 'failed';
  report.errors.push(String(error.stack ?? error));
} finally {
  report.finished_at = new Date().toISOString();
  report.wall_ms = performance.now() - started;
  await save();
  await fs.writeFile(path.join(parent, 'latest.txt'), `${reportPath}\n`);
  console.log(JSON.stringify({ status: report.status, report_path: reportPath,
    arms: report.arms.length, errors: report.errors.length }));
}
if (report.status !== 'measured') process.exitCode = 1;
