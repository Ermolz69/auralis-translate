import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import { performance } from 'node:perf_hooks';
import { digest, verifyProtectedBytes } from './flores-file-fixture.mjs';
import { freeLoopbackPort, startProcess, stopProcess, waitForExit, waitForHealthyServer } from './local-process.mjs';
import { assertSavedPrefix, readRunSnapshot } from './cli-run-state.mjs';
import { relocateCopiedSource } from './relocate-copied-source.mjs';

assert.equal(process.argv.length, 2, 'This predeclared resume accepts no arguments');
assert.equal(process.platform, 'win32');
const root = path.resolve('.');
const experiment = 'commons-vivo-full-7b-resume-v1';
const failedWorkspace = path.join(root, '.cache/eval/commons-vivo-full-7b-v1/run-zxrN7F');
const failedReportSha256 = 'acce4016734648c500a4abeb5ae7619e138d1af46955c50232a39cb450ec59b2';
const runId = '58d6ae3d-ade0-4bcf-b375-640a2c27db0c';
const sourcePath = path.join(root, '.cache/eval/commons-vivo-979826861/source.zh.srt');
const sourceSha256 = '8c41e66f52000a5b67ab27bfc319accd11d89290b60e50fc5c60f4ee8230a000';
const profilePath = path.join(root, 'models/manifests/hy_mt2_7b_q4_k_m.context_v5_scene.experimental.json');
const modelPath = process.env.AURALIS_TEST_GGUF;
const serverPath = process.env.AURALIS_TEST_LLAMA_SERVER;
const cliPath = path.join(root, 'target/release/auralis-translation-cli.exe');
const limits = { chat_requests: 200, all_http_requests: 620,
  model_wall_ms: 1_200_000, readiness_ms: 180_000, doctor_ms: 600_000,
  upstream_ms: 130_000, repetitions: 1 };
assert(modelPath && path.isAbsolute(modelPath) && serverPath && path.isAbsolute(serverPath));
const source = await fs.readFile(sourcePath);
assert.equal(digest(source), sourceSha256);
assert.equal(source.toString('utf8').trimEnd().split(/\n\n+/u).length, 467);
const profileBytes = await fs.readFile(profilePath);
const profile = JSON.parse(profileBytes);
assert.equal(profile.prompt_version, 5);
const parent = path.join(root, `.cache/eval/${experiment}`);
await fs.mkdir(parent, { recursive: true });
const workspace = await fs.mkdtemp(path.join(parent, 'run-'));
const mapPath = path.join(workspace, 'scene-map.json');
const sceneMap = { schema_version: 1, source_sha256: sourceSha256,
  evidence_id: 'commons-vivo-provisional-one-interview-scene-v1', scene_end_ids: [467] };
await fs.writeFile(mapPath, `${JSON.stringify(sceneMap)}\n`, { flag: 'wx' });
const outputPath = path.join(workspace, 'candidate.ru.srt');
const statePath = path.join(workspace, 'state');
const report = { schema_version: 1, experiment, status: 'running',
  started_at: new Date().toISOString(), source_sha256: sourceSha256, source_cues: 467,
  media_sha256: '7ad0484b31a6788c31632616649c51e6aaf6cdcdd7d90083d88e1d5ee66e1507',
  scene_map_sha256: digest(await fs.readFile(mapPath)),
  profile_sha256: digest(profileBytes), cli_sha256: digest(await fs.readFile(cliPath)),
  runtime_sha256: digest(await fs.readFile(serverPath)),
  model_sha256_verified_by_doctor: profile.model_file_sha256,
  model_revision: profile.model_revision,
  hardware: { os: `${os.type()} ${os.release()} ${os.arch()}`,
    cpu: os.cpus()[0].model, total_ram_bytes: os.totalmem() },
  limits, requests: [], commands: [], failures: [] };
let server;
let sampler;
let proxy;
let runStart;
let activeCommand;
let deadlineTimer;
let savedPrefix;
try {
  const failedBytes = await fs.readFile(path.join(failedWorkspace, 'report.json'));
  assert.equal(digest(failedBytes), failedReportSha256, 'Retained failed run changed');
  const failed = JSON.parse(failedBytes);
  assert.equal(failed.status, 'failed');
  assert.equal(failed.source_sha256, sourceSha256);
  assert.equal(failed.profile_sha256, report.profile_sha256);
  assert.equal(failed.cli_sha256, report.cli_sha256);
  assert.equal(failed.runtime_sha256, report.runtime_sha256);
  assert.equal(failed.requests.filter(row => row.path === '/v1/chat/completions').length, 276);
  assert.equal(digest(await fs.readFile(path.join(failedWorkspace, 'scene-map.json'))),
    report.scene_map_sha256);
  const originalState = path.join(failedWorkspace, 'state');
  const originalDbSha256 = digest(await fs.readFile(path.join(originalState, 'auralis-translate.sqlite')));
  assert.equal(originalDbSha256,
    '4ae076bbdfa11a55d8f0e251604621eb41fad91f16aea78915ce0f14966ce90f');
  savedPrefix = readRunSnapshot(path.join(originalState, 'auralis-translate.sqlite'), runId);
  assert.equal(savedPrefix.checkpoints.length, 275);
  assert.equal(savedPrefix.results.length, 0);
  await fs.cp(originalState, statePath, { recursive: true, errorOnExist: true, force: false });
  assert.equal(digest(await fs.readFile(path.join(statePath, 'auralis-translate.sqlite'))),
    originalDbSha256);
  const relocated = await relocateCopiedSource({
    dbPath: path.join(statePath, 'auralis-translate.sqlite'), runId,
    originalStateDir: originalState, copiedStateDir: statePath,
    expectedSourceSha256: sourceSha256 });
  const afterRelocation = readRunSnapshot(path.join(statePath, 'auralis-translate.sqlite'), runId);
  assert.deepEqual(afterRelocation.run, savedPrefix.run);
  assert.deepEqual(afterRelocation.checkpoints, savedPrefix.checkpoints);
  assert.deepEqual(afterRelocation.attempts, savedPrefix.attempts);
  assert.deepEqual(afterRelocation.results, savedPrefix.results);
  assert.equal(afterRelocation.source.source_locator, relocated.copiedLocator);
  assert.equal(digest(await fs.readFile(path.join(originalState, 'auralis-translate.sqlite'))),
    originalDbSha256);
  report.resume_of = { failed_report_sha256: failedReportSha256,
    copied_state_db_sha256: originalDbSha256, copied_source_relocated: true,
    run_id: runId, saved_blocks: 275 };
  for (const file of [modelPath, serverPath, cliPath]) assert((await fs.stat(file)).isFile());
  const git = await waitForExit(startProcess('git', ['rev-parse', 'HEAD'], root), 10_000);
  report.revision = git.stdout.trim();
  const gitStatus = await waitForExit(startProcess('git', ['status', '--porcelain'], root), 10_000);
  report.git_status_porcelain = gitStatus.stdout.trim();
  const command = async (args, timeoutMs = 180_000) => {
    const started = performance.now();
    const child = startProcess(cliPath, args, root);
    activeCommand = child;
    try {
      await waitForExit(child, timeoutMs);
      assert(!child.stdoutTruncated && !child.stderrTruncated, 'CLI output truncated');
      return child.stdout;
    } finally {
      report.commands.push({ args: args.map(value => value === modelPath ? '<verified-model>' : value),
        stdout: child.stdout, stderr: child.stderr, elapsed_ms: performance.now() - started });
      activeCommand = null;
    }
  };
  report.doctor = await command(['doctor', profilePath, modelPath], limits.doctor_ms);
  const runtimePort = await freeLoopbackPort();
  const runtimeUrl = `http://127.0.0.1:${runtimePort}/`;
  proxy = http.createServer(async (request, response) => {
    const started = performance.now();
    const chunks = [];
    let size = 0;
    for await (const part of request) {
      size += part.length;
      if (size > 1024 * 1024) throw new Error('Proxy request exceeds one MiB');
      chunks.push(part);
    }
    const body = Buffer.concat(chunks);
    const entry = { path: request.url, at: new Date().toISOString(), request_sha256: digest(body) };
    try {
      if (report.requests.length >= limits.all_http_requests
          || (runStart !== undefined && performance.now() - runStart > limits.model_wall_ms))
        throw new Error('Predeclared HTTP or wall budget exceeded');
      const upstream = await fetch(new URL(request.url, runtimeUrl), {
        method: request.method,
        headers: body.length ? { 'content-type': 'application/json',
          'x-auralis-source-sha256': request.headers['x-auralis-source-sha256'] ?? '' } : undefined,
        body: body.length ? body : undefined, signal: AbortSignal.timeout(limits.upstream_ms) });
      const bytes = Buffer.from(await upstream.arrayBuffer());
      entry.http_status = upstream.status;
      entry.elapsed_ms = performance.now() - started;
      if (request.url === '/v1/chat/completions') {
        entry.request = JSON.parse(body);
        entry.raw_response = bytes.toString('utf8');
        const parsed = JSON.parse(bytes);
        entry.raw_candidate = parsed.choices?.[0]?.message?.content ?? null;
        entry.usage = parsed.usage ?? null;
        entry.timings = parsed.timings ?? null;
      } else if (request.url === '/apply-template') {
        entry.request = JSON.parse(body);
        entry.rendered_prompt_sha256 = digest(Buffer.from(JSON.parse(bytes).prompt));
      } else if (request.url === '/tokenize') {
        entry.rendered_prompt_sha256 = digest(Buffer.from(JSON.parse(body).content));
        entry.token_count = JSON.parse(bytes).tokens?.length ?? null;
      }
      report.requests.push(entry);
      response.writeHead(upstream.status, { 'content-type': upstream.headers.get('content-type') ?? 'application/json' });
      response.end(bytes);
    } catch (error) {
      report.requests.push({ ...entry, elapsed_ms: performance.now() - started, error: error.message });
      response.writeHead(502, { 'content-type': 'application/json' });
      response.end(JSON.stringify({ error: error.message }));
    }
  });
  await new Promise(resolve => proxy.listen(0, '127.0.0.1', resolve));
  const proxyUrl = `http://127.0.0.1:${proxy.address().port}/`;
  const serverArgs = ['--model', modelPath, '--alias', profile.model_alias,
    '--host', '127.0.0.1', '--port', String(runtimePort), '-c', '2048',
    '-ngl', '99', '--cache-ram', '0', '--parallel', '1', '--jinja'];
  report.server_arguments = serverArgs.map(value => value === modelPath ? '<verified-model>' : value);
  const serverEnv = { ...process.env,
    PATH: `${path.dirname(serverPath)};${path.join(root, '.cache/runtime/cudart')};${process.env.PATH}` };
  server = startProcess(serverPath, serverArgs, root, serverEnv,
    { maxCaptureCharacters: 4 * 1024 * 1024 });
  const sampleScript = `$ErrorActionPreference='Stop'; while ($true) { $p = Get-Process -Id ${server.child.pid} -ErrorAction SilentlyContinue; if (!$p) { break }; $g = & nvidia-smi --query-gpu=memory.used,utilization.gpu --format=csv,noheader,nounits; @{time=[DateTime]::UtcNow.ToString('o');working_set_bytes=$p.WorkingSet64;cpu_seconds=$p.CPU;gpu=$g} | ConvertTo-Json -Compress; Start-Sleep -Milliseconds 1000 }`;
  sampler = startProcess('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', sampleScript], root);
  await waitForHealthyServer(runtimeUrl, server, limits.readiness_ms);
  runStart = performance.now();
  deadlineTimer = setTimeout(() => { report.failures.push({ at: new Date().toISOString(),
    message: 'Declared model run wall budget elapsed' });
    activeCommand?.child.kill(); server?.child.kill(); }, limits.model_wall_ms);
  const originalInspection = await command(['inspect', sourcePath]);
  const translateStarted = performance.now();
  await command(['resume', statePath, runId, profilePath, proxyUrl, outputPath],
    limits.model_wall_ms);
  report.translation_elapsed_ms = Math.round(performance.now() - translateStarted);
  report.run_id = runId;
  report.run_status = JSON.parse(await command(['status', statePath, runId]));
  assert.equal(report.run_status.state, 'validated');
  const completed = readRunSnapshot(path.join(statePath, 'auralis-translate.sqlite'), runId);
  assertSavedPrefix(savedPrefix, completed);
  assert.equal(completed.checkpoints.length, 467);
  assert.equal(completed.results.length, 1);
  report.saved_prefix_preserved = true;
  const output = await fs.readFile(outputPath);
  report.output_sha256 = digest(output);
  const translatedInspection = await command(['inspect', outputPath]);
  verifyProtectedBytes(source, output, originalInspection, translatedInspection);
  const templatePath = path.join(workspace, 'template.json');
  await command(['template', outputPath, templatePath]);
  const accepted = JSON.parse(await fs.readFile(templatePath)).translations;
  assert.equal(accepted.length, 467);
  assert(accepted.every((row, index) => row.id === index + 1 && row.lines?.length === 1));
  report.accepted_lines = accepted.map(row => row.lines[0]);
  report.chat_requests = report.requests.filter(row => row.path === '/v1/chat/completions').length;
  assert(report.chat_requests <= limits.chat_requests);
  assert(report.requests.length <= limits.all_http_requests);
  assert.equal(digest(await fs.readFile(sourcePath)), sourceSha256);
  await stopProcess(server);
  const reexport = path.join(workspace, 'offline.ru.srt');
  await command(['resume', statePath, runId, profilePath, proxyUrl, reexport]);
  assert.equal(digest(await fs.readFile(reexport)), report.output_sha256);
  report.offline_reexport = 'byte_identical';
  report.status = 'passed_structural_probe';
  console.log(`Complete unreviewed natural source: 467/467, output SHA-256 ${report.output_sha256}`);
} catch (error) {
  report.status = 'failed';
  report.failures.push({ at: new Date().toISOString(), message: error.message });
  process.exitCode = 1;
  console.error(error);
} finally {
  clearTimeout(deadlineTimer);
  await stopProcess(server);
  await stopProcess(sampler);
  if (proxy) await new Promise(resolve => proxy.close(resolve));
  report.finished_at = new Date().toISOString();
  report.resource_samples = (sampler?.stdout ?? '').trim().split(/\r?\n/u).filter(Boolean)
    .map(line => { try { return JSON.parse(line); } catch { return { invalid_sample: line }; } });
  report.resource_sampling_error = sampler?.stderr || null;
  report.runtime_observations = (server?.stderr ?? '').split(/\r?\n/u)
    .filter(line => /offload|CUDA.*buffer size|KV.*buffer size|model params|model size|build:/iu.test(line));
  await fs.writeFile(path.join(workspace, 'report.json'), `${JSON.stringify(report, null, 2)}\n`);
  await fs.writeFile(path.join(workspace, 'server.log'), `${server?.stdout ?? ''}\n${server?.stderr ?? ''}`);
  await fs.writeFile(path.join(parent, 'latest.txt'), workspace);
  console.log(`Private full-source report retained: ${path.join(workspace, 'report.json')}`);
}
