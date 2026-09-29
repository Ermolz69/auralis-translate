import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import { performance } from 'node:perf_hooks';
import { fileURLToPath } from 'node:url';
import { digest, verifyProtectedBytes } from './flores-file-fixture.mjs';
import { freeLoopbackPort, startProcess, stopProcess, waitForExit, waitForHealthyServer } from './local-process.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const variant = process.env.AURALIS_NATURAL_MODEL_VARIANT;
assert(['1b', '7b'].includes(variant));
assert.equal(process.platform, 'win32');
const modelPath = process.env.AURALIS_TEST_GGUF;
const serverPath = process.env.AURALIS_TEST_LLAMA_SERVER;
assert(modelPath && path.isAbsolute(modelPath) && serverPath && path.isAbsolute(serverPath));
const profileStem = variant === '1b' ? 'hy_mt2_1_8b_q4_k_m' : 'hy_mt2_7b_q4_k_m';
const profilePath = path.join(root, `models/manifests/${profileStem}.context_v5_scene.experimental.json`);
const executable = path.join(root, 'target/release/auralis-translation-cli.exe');
const sourcePath = path.join(root, '.cache/eval/youtube-mingfay-derived/source.zh.srt');
const expectedSourceSha256 = '42109fc054cba93b0ef343853628b6a248b31664786d579bdefa415ccaacf9ee';
const source = await fs.readFile(sourcePath);
assert.equal(digest(source), expectedSourceSha256);
const profileBytes = await fs.readFile(profilePath);
const profile = JSON.parse(profileBytes);
assert.equal(profile.prompt_version, 5);
for (const file of [modelPath, serverPath, executable]) assert((await fs.stat(file)).isFile());
const blocks = source.toString('utf8').trimEnd().split(/\n\n+/);
assert.equal(blocks.length, 230);
const windows = [['start', 1, 4], ['middle', 114, 117],
  ['seam', 209, 212], ['end', 227, 230]];
const parent = path.join(root, `.cache/eval/mingfay-natural-${variant}-v1`);
await fs.mkdir(parent, { recursive: true });
const workspace = await fs.mkdtemp(path.join(parent, 'run-'));
const report = { schema_version: 1, experiment: `mingfay-natural-${variant}-v1`,
  model_variant: variant, status: 'running', started_at: new Date().toISOString(),
  source_sha256: expectedSourceSha256, profile_sha256: digest(profileBytes),
  cli_sha256: digest(await fs.readFile(executable)),
  runtime_sha256: digest(await fs.readFile(serverPath)),
  model_sha256_verified_by_doctor: profile.model_file_sha256,
  model_revision: profile.model_revision,
  hardware: { os: `${os.type()} ${os.release()} ${os.arch()}`,
    cpu: os.cpus()[0].model, total_ram_bytes: os.totalmem() },
  limits: { files: 4, source_cues: 16, chat_requests: 20,
    all_http_requests: 68, run_wall_ms: 600_000, repetitions: 1 },
  methodology: 'Four exact private natural-caption windows and source-only v5 context; unadmitted source; no Russian reference or human score.',
  cases: [], requests: [], commands: [], failures: [] };
let server;
let sampler;
let proxy;
let activeArm = null;
let activeCommand = null;
let deadlineTimer;
let runStart = null;
try {
  const git = await waitForExit(startProcess('git', ['rev-parse', 'HEAD'], root), 10_000);
  report.revision = git.stdout.trim();
  const gitStatus = await waitForExit(startProcess('git', ['status', '--porcelain'], root), 10_000);
  report.git_status_porcelain = gitStatus.stdout.trim();
  for (const [id, first, last] of windows) {
    const caseDir = path.join(workspace, id);
    await fs.mkdir(caseDir);
    const subset = Buffer.from(`${blocks.slice(first - 1, last).join('\n\n')}\n`);
    const subsetPath = path.join(caseDir, 'source.srt');
    await fs.writeFile(subsetPath, subset, { flag: 'wx' });
    const map = { schema_version: 1, source_sha256: digest(subset),
      evidence_id: `mingfay-private-caption-unreviewed:${id}`, scene_end_ids: [4] };
    const mapPath = path.join(caseDir, 'scene-map.json');
    await fs.writeFile(mapPath, `${JSON.stringify(map)}\n`, { flag: 'wx' });
    report.cases.push({ id, original_cue_ids: [first, first + 1, first + 2, last],
      source_sha256: digest(subset), scene_map_sha256: digest(await fs.readFile(mapPath)),
      target_id: 2, source_path: subsetPath, map_path: mapPath, arms: [] });
  }
  const runtimePort = await freeLoopbackPort();
  const runtimeUrl = `http://127.0.0.1:${runtimePort}/`;
  const command = async (args, timeoutMs = 180_000) => {
    if (runStart !== null && performance.now() - runStart > report.limits.run_wall_ms) {
      throw new Error('Declared model run wall budget exhausted');
    }
    const started = performance.now();
    const child = startProcess(executable, args, root);
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
  report.doctor = await command(['doctor', profilePath, modelPath]);
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
    const entry = { arm: activeArm, path: request.url, at: new Date().toISOString(),
      request_sha256: digest(body) };
    try {
      if (report.requests.length >= report.limits.all_http_requests
          || (runStart !== null && performance.now() - runStart > report.limits.run_wall_ms)) {
        throw new Error('Predeclared HTTP or wall budget exceeded');
      }
      const upstream = await fetch(new URL(request.url, runtimeUrl), {
        method: request.method,
        headers: body.length ? { 'content-type': 'application/json',
          'x-auralis-source-sha256': request.headers['x-auralis-source-sha256'] ?? '' } : undefined,
        body: body.length ? body : undefined, signal: AbortSignal.timeout(130_000),
      });
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
  server = startProcess(serverPath, serverArgs, root, serverEnv, { maxCaptureCharacters: 4 * 1024 * 1024 });
  const sampleScript = `$ErrorActionPreference='Stop'; while ($true) { $p = Get-Process -Id ${server.child.pid} -ErrorAction SilentlyContinue; if (!$p) { break }; $g = & nvidia-smi --query-gpu=memory.used,utilization.gpu --format=csv,noheader,nounits; @{time=[DateTime]::UtcNow.ToString('o');working_set_bytes=$p.WorkingSet64;cpu_seconds=$p.CPU;gpu=$g} | ConvertTo-Json -Compress; Start-Sleep -Milliseconds 1000 }`;
  sampler = startProcess('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', sampleScript], root);
  await waitForHealthyServer(runtimeUrl, server, 180_000);
  runStart = performance.now();
  deadlineTimer = setTimeout(() => {
    report.failures.push({ at: new Date().toISOString(), message: 'Declared model run wall budget elapsed' });
    activeCommand?.child.kill();
    server?.child.kill();
  }, report.limits.run_wall_ms);
  for (const row of report.cases) {
    activeArm = `${row.id}:scene`;
    const sourceBytes = await fs.readFile(row.source_path);
    const originalInspection = await command(['inspect', row.source_path]);
    const armDir = path.join(workspace, row.id, 'scene');
    await fs.mkdir(armDir);
    const state = path.join(armDir, 'state');
    const output = path.join(armDir, 'candidate.ru.srt');
    const started = performance.now();
    const stdout = await command(['translate-v5-scene', row.source_path, state,
      profilePath, row.map_path, proxyUrl, output]);
    const runId = stdout.match(/run_id=([0-9a-f-]{36})/u)?.[1];
    assert(runId, `Missing durable run ID for ${row.id}`);
    const status = JSON.parse(await command(['status', state, runId]));
    assert.equal(status.state, 'validated');
    const translated = await fs.readFile(output);
    const translatedInspection = await command(['inspect', output]);
    verifyProtectedBytes(sourceBytes, translated, originalInspection, translatedInspection);
    const template = path.join(armDir, 'template.json');
    await command(['template', output, template]);
    const accepted = JSON.parse(await fs.readFile(template)).translations;
    assert.equal(accepted.length, 4);
    assert(accepted.every((segment, index) => segment.id === index + 1 && segment.lines?.length === 1));
    assert.equal(digest(await fs.readFile(row.source_path)), row.source_sha256);
    const acceptedLines = accepted.map(segment => segment.lines[0]);
    row.arms.push({ arm: 'scene', run_id: runId, state, output_sha256: digest(translated),
      elapsed_ms: performance.now() - started, accepted_target: acceptedLines[1],
      accepted_lines: acceptedLines, status });
    console.log(`${variant} ${row.id}: 4/4 translated cues, sha256=${digest(translated)}`);
  }
  assert(report.requests.filter(entry => entry.path === '/v1/chat/completions').length <= report.limits.chat_requests);
  await stopProcess(server);
  activeArm = null;
  for (const row of report.cases) {
    const arm = row.arms[0];
    const exported = path.join(workspace, row.id, 'scene', 'offline.ru.srt');
    await command(['resume', arm.state, arm.run_id, profilePath, proxyUrl, exported]);
    assert.equal(digest(await fs.readFile(exported)), arm.output_sha256);
    arm.offline_reexport = 'byte_identical';
  }
  report.status = 'passed_structural_probe';
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
  console.log(`Private natural-source report retained: ${path.join(workspace, 'report.json')}`);
}
