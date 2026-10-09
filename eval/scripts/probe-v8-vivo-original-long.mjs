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
const assetRoot = process.env.AURALIS_EVAL_ASSET_ROOT ?? root;
const preflight = process.argv.length === 3 && process.argv[2] === '--preflight';
assert(process.argv.length === 2 || preflight, 'Only --preflight is supported');
assert.equal(process.platform, 'win32');
const sourcePath = path.join(root,
  '.cache/eval/youtube-geekerwan-vivo-original-caption/attempt-LQWxgw/source.zh.srt');
const mediaPath = path.join(root,
  '.cache/eval/commons-vivo-media/media-46745446-cc07-4cff-b5e3-f98fe08262f0/source.240p.webm');
const runtimePath = path.join(assetRoot, '.cache/runtime/llama/llama-server.exe');
const cliPath = path.join(root, 'target/release/auralis-translation-cli.exe');
const arms = [
  { id: '1_8b', modelPath: path.join(assetRoot, '.cache/models/Hy-MT2-1.8B-Q4_K_M.gguf'),
    modelSha: 'dc5f44fcf1fa496ee7ad725982c0c8c553a4de00259b53af84c4b89fb0c06699',
    manifestPath: path.join(root,
      'models/manifests/hy_mt2_1_8b_q4_k_m.context_v8_target_first_batch4.experimental.json'),
    manifestSha: '1803aeb68428e1b138a17ed72b01abe1cc5fbc5845b5bca66a402b8936b1081f' },
  { id: '7b', modelPath: path.join(assetRoot, '.cache/models/Hy-MT2-7B-Q4_K_M.gguf'),
    modelSha: '9f96256500f3fc1ab4d64336b58f52a949a95ad7516b0c229476eef782f9f77b',
    manifestPath: path.join(root,
      'models/manifests/hy_mt2_7b_q4_k_m.context_v8_target_first_batch4.experimental.json'),
    manifestSha: 'c287c53efbb4ce78471b64648ea3dd2f521363df0e168b7a61df1fdd6ae0479a' },
];
assert(path.isAbsolute(assetRoot));
assert(runtimePath && path.isAbsolute(runtimePath));
assert(arms.every(arm => arm.modelPath && path.isAbsolute(arm.modelPath)));
const expected = {
  source: 'b100803367b95fa55fc638b1ff39a0abfa0d5b8183ebe58d58b1a87242d9d8c4',
  media: '7ad0484b31a6788c31632616649c51e6aaf6cdcdd7d90083d88e1d5ee66e1507',
  runtime: '6f15be27bd80b6b4d52afefa49094e18fcfab55d5da354d717971f2d2537b2f4',
  cli: '5cb2a5a7187944f685bb16656a4dd65f29f166bdd5745f0693e59739998e8ed8',
};
const limits = { cues: 467, max_chat_requests_per_arm: 117,
  max_preflights_per_arm: 234, max_cli_ms_per_arm: 900000,
  readiness_ms_per_arm: 180000, max_wall_ms: 2400000,
  model_retries: 0, repetitions: 1, max_total_tokens: 720000 };
const hashFile = async file => {
  const hash = createHash('sha256');
  for await (const chunk of createReadStream(file)) hash.update(chunk);
  return hash.digest('hex');
};
const source = await fs.readFile(sourcePath);
assert.equal(createHash('sha256').update(source).digest('hex'), expected.source);
assert.equal(source.toString('utf8').trimEnd().split(/\r?\n\r?\n/u).length, limits.cues);
assert.equal(await hashFile(mediaPath), expected.media);
assert.equal(await hashFile(runtimePath), expected.runtime);
assert.equal(await hashFile(cliPath), expected.cli);
for (const arm of arms) {
  assert.equal(await hashFile(arm.modelPath), arm.modelSha);
  assert.equal(await hashFile(arm.manifestPath), arm.manifestSha);
  const manifest = JSON.parse(await fs.readFile(arm.manifestPath, 'utf8'));
  assert.equal(manifest.prompt_version, 8);
  assert.equal(manifest.target_segments_per_block, 4);
  assert.equal(manifest.model_file_sha256, arm.modelSha);
  assert.equal(manifest.prompt_template_sha256,
    '3e59c7dd662eb0260f12c785386ac447349cf1472cfe23b46d060a57f1c1c9d9');
  arm.alias = manifest.model_alias;
}
if (preflight) {
  console.log(JSON.stringify({ status: 'verified', expected, limits,
    arms: arms.map(({ id, modelSha, manifestSha, alias }) =>
      ({ id, modelSha, manifestSha, alias })) }));
  process.exit(0);
}

const parent = path.join(root, '.cache/eval/v8-vivo-original-long-v1');
await fs.mkdir(parent, { recursive: true });
const workspace = await fs.mkdtemp(path.join(parent, 'attempt-'));
const started = performance.now();
const report = { schema_version: 1,
  experiment: 'LONG-04-vivo-original-v8-batch4-paired-2026-10-09-v1',
  status: 'running', started_at: new Date().toISOString(),
  code_commit: null, git_status: null, expected, limits,
  harness_sha256: await hashFile(fileURLToPath(import.meta.url)),
  platform: { os: `${os.type()} ${os.release()} ${os.arch()}`,
    cpu: os.cpus()[0].model, ram_bytes: os.totalmem() },
  arms: [], errors: [] };
const reportPath = path.join(workspace, 'report.json');
const save = () => fs.writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`);
const remaining = () => {
  const ms = limits.max_wall_ms - (performance.now() - started);
  assert(ms > 0, 'Declared total wall budget exhausted');
  return ms;
};
try {
  const git = await waitForExit(startProcess('git', ['rev-parse', 'HEAD'], root), 10000);
  report.code_commit = git.stdout.trim();
  const status = await waitForExit(startProcess('git', ['status', '--short'], root), 10000);
  report.git_status = status.stdout.trim();
  await save();
  for (const spec of arms) {
    const arm = { id: spec.id, model_sha256: spec.modelSha,
      manifest_sha256: spec.manifestSha, alias: spec.alias,
      status: 'preparing', started_at: new Date().toISOString(),
      errors: [] };
    report.arms.push(arm);
    const directory = path.join(workspace, spec.id);
    await fs.mkdir(directory);
    const input = path.join(directory, 'source.zh.srt');
    const output = path.join(directory, 'candidate.ru.srt');
    const state = path.join(directory, 'state');
    const scene = path.join(directory, 'scene-map.json');
    const sceneMap = { schema_version: 1, source_sha256: expected.source,
      evidence_id: 'youtube-vivo-provisional-one-video-scene-v1', scene_end_ids: [467] };
    await fs.writeFile(input, source, { flag: 'wx' });
    await fs.writeFile(scene, `${JSON.stringify(sceneMap)}\n`, { flag: 'wx' });
    arm.scene_map_sha256 = await hashFile(scene);
    let server, cli, sampler;
    try {
      const port = await freeLoopbackPort();
      const url = `http://127.0.0.1:${port}/`;
      const args = ['--model', spec.modelPath, '--alias', spec.alias,
        '--host', '127.0.0.1', '--port', String(port), '-c', '2048', '-ngl', '99',
        '--parallel', '1', '--jinja', '--cache-ram', '0'];
      arm.server_args = args.map(arg => arg === spec.modelPath ? '<pinned-model>' : arg);
      const env = { ...process.env, PATH: `${path.dirname(runtimePath)};${path.join(assetRoot,
        '.cache/runtime/cudart')};${process.env.PATH}` };
      server = startProcess(runtimePath, args, root, env,
        { maxCaptureCharacters: 4 * 1024 * 1024 });
      await waitForHealthyServer(url, server,
        Math.min(limits.readiness_ms_per_arm, remaining()));
      sampler = runtimeSampler(path.join(directory, 'resources.jsonl'), root,
        () => [server, cli].filter(process => process && process.child.exitCode === null &&
          process.child.signalCode === null).map(process => process.child.pid));
      arm.status = 'running';
      await save();
      const began = performance.now();
      cli = startProcess(cliPath, ['translate-v5-scene', input, state,
        spec.manifestPath, scene, url, output], root, process.env,
      { maxCaptureCharacters: 4 * 1024 * 1024 });
      try {
        await waitForExit(cli, Math.min(limits.max_cli_ms_per_arm, remaining()));
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
      arm.preflight_requests = arm.requests?.filter(row =>
        row.request_kind === 'apply_template' || row.request_kind === 'tokenize').length ?? 0;
      if (arm.status === 'completed' && (!arm.output_sha256 || arm.results?.length !== 1)) {
        arm.status = 'failed';
        arm.errors.push('CLI exited zero without exactly one full result');
      }
      assert(arm.chat_requests <= limits.max_chat_requests_per_arm);
      assert(arm.preflight_requests <= limits.max_preflights_per_arm);
      arm.total_tokens = arm.requests?.filter(row => row.request_kind === 'chat_completion')
        .reduce((sum, row) => sum + (row.prompt_tokens ?? 0) +
          (row.completion_tokens ?? 0), 0) ?? 0;
      assert(arm.total_tokens <= limits.max_total_tokens);
      assert.equal(arm.source_after_sha256, expected.source);
      arm.finished_at = new Date().toISOString();
      await save();
      console.log(`${spec.id}: ${arm.status}; chats=${arm.chat_requests}; checkpoints=${arm.checkpoints?.length ?? 0}; output=${arm.output_sha256 ?? 'none'}`);
    }
    if (arm.status === 'infrastructure_failed') break;
  }
  assert(report.arms.reduce((sum, arm) => sum + (arm.total_tokens ?? 0), 0)
    <= limits.max_total_tokens);
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
  console.log(`v8 Vivo original long ${report.status}: ${reportPath}`);
}
