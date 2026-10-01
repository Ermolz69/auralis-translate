import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { createReadStream } from 'node:fs';
import fs from 'node:fs/promises';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import { performance } from 'node:perf_hooks';
import { digest, verifyProtectedBytes } from './flores-file-fixture.mjs';
import { extractCliRunId } from './cli-run-id.mjs';
import { freeLoopbackPort, startProcess, stopProcess, waitForExit, waitForHealthyServer } from './local-process.mjs';

const preflight = process.argv[2] === '--preflight';
assert(process.argv.length === (preflight ? 3 : 2), 'Use --preflight or no argument');
assert.equal(process.platform, 'win32');
const root = path.resolve('.');
const experiment = 'commons-sethlui-json-tail-retry-7b-v1';
const sourcePath = path.join(root, '.cache/eval/commons-sethlui-derived-v1/source.zh.srt');
const sourceSha256 = '4777e11caa115e893f2328c2a33c25a76c7391ace8ecf0ac4b9436635fc27964';
const parentPath = path.join(root, '.cache/eval/commons-sethlui-caption/caption-Cgsmq4/source.zh.srt');
const parentSha256 = '077aef6a49aa7128f5ddd349f38ffc84dd669f5e4bbfae6d692efa2d78304967';
const mappingPath = path.join(root, '.cache/eval/commons-sethlui-media/derived-1e655c9c-f93e-4b03-938c-f2510640fa2b/derivation.json');
const mappingSha256 = 'da63dec61c03ccbfcc307aa028e9499b8ba9a65de41c1df6b0daab5a629a9a4f';
const modelPath = process.env.AURALIS_TEST_GGUF_7B;
const profilePath = path.join(root,
  'models/manifests/hy_mt2_7b_q4_k_m.context_v6_slot_retry_tail.experimental.json');
const baselineProfilePath = path.join(root,
  'models/manifests/hy_mt2_7b_q4_k_m.context_v6_slot.experimental.json');
const serverPath = process.env.AURALIS_TEST_LLAMA_SERVER;
const cliPath = path.join(root, 'target/release/auralis-translation-cli.exe');
const receiptRoot = path.join(root, '.cache/eval/release-cli-build-receipts');
const receiptName = (await fs.readFile(path.join(receiptRoot, 'latest.txt'), 'utf8')).trim();
assert(/^receipt-[0-9a-f-]+\.json$/u.test(receiptName));
const receiptBytes = await fs.readFile(path.join(receiptRoot, receiptName));
const receipt = JSON.parse(receiptBytes);
const expectedHashes = {
  model: '9f96256500f3fc1ab4d64336b58f52a949a95ad7516b0c229476eef782f9f77b',
  runtime: '6f15be27bd80b6b4d52afefa49094e18fcfab55d5da354d717971f2d2537b2f4',
  cli: receipt.binary_sha256,
  profile: 'af9296ac5bbd089d82a44eaeb4afa2e144f013ce727bd4bf1c2de76ca615cbae',
};
const hashFile = async file => {
  const hasher = createHash('sha256');
  for await (const chunk of createReadStream(file)) hasher.update(chunk);
  return hasher.digest('hex');
};
const limits = { chat_requests: 526, all_http_requests: 1600,
  model_wall_ms: 1_200_000, readiness_ms: 180_000, doctor_ms: 600_000,
  upstream_ms: 130_000, repetitions: 1 };
assert(modelPath && path.isAbsolute(modelPath) && serverPath && path.isAbsolute(serverPath));
const source = await fs.readFile(sourcePath);
assert.equal(digest(source), sourceSha256);
assert.equal(source.toString('utf8').trimEnd().split(/\n\n+/u).length, 263);
assert.equal(await hashFile(parentPath), parentSha256);
assert.equal(await hashFile(mappingPath), mappingSha256);
const profileBytes = await fs.readFile(profilePath);
const profile = JSON.parse(profileBytes);
assert.equal(profile.prompt_version, 6);
for (const file of [modelPath, serverPath, cliPath]) assert((await fs.stat(file)).isFile());
assert.equal(digest(profileBytes), expectedHashes.profile);
assert.equal(await hashFile(modelPath), expectedHashes.model);
assert.equal(await hashFile(serverPath), expectedHashes.runtime);
assert.equal(await hashFile(cliPath), expectedHashes.cli);
assert.equal(profile.model_file_sha256, expectedHashes.model);
const baselineProfile = JSON.parse(await fs.readFile(baselineProfilePath));
const { retry_json_tail_once, max_block_attempts, ...unchangedProfile } = profile;
assert.equal(retry_json_tail_once, true);
assert.equal(max_block_attempts, 2);
assert.deepEqual(unchangedProfile, baselineProfile,
  'Only the retry policy may differ from the archived v6 profile');
assert.equal(profile.target_segments_per_block, 1);
assert.equal(profile.context_before_segments, 1);
assert.equal(profile.context_after_segments, 1);
const mediaPath = path.join(root, '.cache/eval/commons-sethlui-media/media-86cd634d-fa4e-43eb-ba4b-472b4bf5c9e1/source.240p.webm');
assert.equal(digest(await fs.readFile(mediaPath)), '6e29f1512a76f553bdfc1678f458a69cf010e4653ac3f1cdfc4c45742bfb39d6');
if (preflight) {
  console.log(`Restaurant 7B JSON-tail retry preflight: 263 candidate cues, unchanged prompt and source, receipt ${digest(receiptBytes)}, 526 chats / 1600 HTTP / 1,200,000 ms.`);
  process.exit(0);
}
const parent = path.join(root, `.cache/eval/${experiment}`);
await fs.mkdir(parent, { recursive: true });
const workspace = await fs.mkdtemp(path.join(parent, 'run-'));
const mapPath = path.join(workspace, 'scene-map.json');
const sceneMap = { schema_version: 1, source_sha256: sourceSha256,
  evidence_id: 'commons-sethlui-provisional-one-video-scene-v1', scene_end_ids: [263] };
await fs.writeFile(mapPath, `${JSON.stringify(sceneMap)}\n`, { flag: 'wx' });
const outputPath = path.join(workspace, 'candidate.ru.srt');
const statePath = path.join(workspace, 'state');
const report = { schema_version: 1, experiment, status: 'running',
  started_at: new Date().toISOString(), model_key: '7b',
  source_commit: receipt.source_commit, build_receipt_sha256: digest(receiptBytes),
  source_sha256: sourceSha256, parent_sha256: parentSha256, mapping_sha256: mappingSha256,
  source_cues: 263,
  media_sha256: '6e29f1512a76f553bdfc1678f458a69cf010e4653ac3f1cdfc4c45742bfb39d6',
  scene_map_sha256: digest(await fs.readFile(mapPath)),
  profile_sha256: digest(profileBytes), cli_sha256: digest(await fs.readFile(cliPath)),
  runtime_sha256: digest(await fs.readFile(serverPath)),
  model_sha256_verified_by_doctor: profile.model_file_sha256,
  model_revision: profile.model_revision,
  sampling_seed: null,
  sampling_seed_reason: 'CLI v6 request does not specify a seed; runtime default is unknown',
  hardware: { os: `${os.type()} ${os.release()} ${os.arch()}`,
    cpu: os.cpus()[0].model, total_ram_bytes: os.totalmem() },
  limits, requests: [], commands: [], failures: [] };
let server;
let sampler;
let proxy;
let runStart;
let activeCommand;
let deadlineTimer;
try {
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
      if (args[0] === 'translate-v5-scene') {
        report.translation_elapsed_ms = Math.round(performance.now() - started);
        report.run_id = extractCliRunId(child.stdout, child.stderr);
      }
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
          || (request.url === '/v1/chat/completions'
            && report.requests.filter(row => row.path === request.url).length >= limits.chat_requests)
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
  const stdout = await command(['translate-v5-scene', sourcePath, statePath,
    profilePath, mapPath, proxyUrl, outputPath], limits.model_wall_ms);
  const runId = extractCliRunId(stdout, '');
  assert(runId, 'Missing durable run ID');
  report.run_id = runId;
  report.run_status = JSON.parse(await command(['status', statePath, runId]));
  assert.equal(report.run_status.state, 'validated');
  const output = await fs.readFile(outputPath);
  report.output_sha256 = digest(output);
  const translatedInspection = await command(['inspect', outputPath]);
  verifyProtectedBytes(source, output, originalInspection, translatedInspection);
  const templatePath = path.join(workspace, 'template.json');
  await command(['template', outputPath, templatePath]);
  const accepted = JSON.parse(await fs.readFile(templatePath)).translations;
  assert.equal(accepted.length, 263);
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
  console.log(`Complete unreviewed restaurant 7B JSON-tail retry: 263/263, output SHA-256 ${report.output_sha256}`);
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
  report.chat_requests = report.requests.filter(row => row.path === '/v1/chat/completions').length;
  report.template_preflight_requests = report.requests.filter(row => row.path === '/apply-template').length;
  report.tokenize_preflight_requests = report.requests.filter(row => row.path === '/tokenize').length;
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
