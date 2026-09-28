import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import http from 'node:http';
import os from 'node:os';
import { performance } from 'node:perf_hooks';
import { fileURLToPath } from 'node:url';
import { digest, verifyProtectedBytes } from './flores-file-fixture.mjs';
import { freeLoopbackPort, startProcess, stopProcess, waitForExit, waitForHealthyServer } from './local-process.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const datasetFile = process.env.AURALIS_SCENE_DATASET ?? 'eval/corpora/context-contrasts-v1.json';
const corpusPath = path.join(root, datasetFile);
const baselinePath = path.join(root, 'models/manifests/hy_mt2_1_8b_q4_k_m.context_v5.experimental.json');
const sceneProfilePath = path.join(root, 'models/manifests/hy_mt2_1_8b_q4_k_m.context_v5_scene.experimental.json');
const serverPath = process.env.AURALIS_TEST_LLAMA_SERVER;
const modelPath = process.env.AURALIS_TEST_GGUF;
assert(serverPath && modelPath, 'Taskfile must provide checked local model and runtime paths');
const executable = path.join(root, 'target/release/auralis-translation-cli.exe');
const corpusBytes = await fs.readFile(corpusPath);
const corpus = JSON.parse(corpusBytes);
const ids = (process.env.AURALIS_SCENE_CASE_IDS ?? 'p01,s01').split(',');
assert(ids.length > 0 && ids.length <= 4 && ids.every(id => /^[a-z][0-9]{2}$/u.test(id)));
const cases = ids.map(id => {
  const row = corpus.cases.find(candidate => candidate.id === id);
  assert(row && row.relevant, `Missing frozen development case: ${id}`);
  return row;
});
const profiles = {
  baseline: { path: baselinePath, bytes: await fs.readFile(baselinePath) },
  scene: { path: sceneProfilePath, bytes: await fs.readFile(sceneProfilePath) },
};
for (const profile of Object.values(profiles)) profile.parsed = JSON.parse(profile.bytes);
assert.equal(profiles.baseline.parsed.model_file_sha256, profiles.scene.parsed.model_file_sha256);
assert.equal(profiles.baseline.parsed.prompt_template_sha256, profiles.scene.parsed.prompt_template_sha256);
const experiment = process.env.AURALIS_SCENE_EXPERIMENT ?? 'scene-context-smoke-v1';
assert(/^[a-z0-9-]+$/u.test(experiment));
const parent = path.join(root, '.cache/eval', experiment);
await fs.mkdir(parent, { recursive: true });
const workspace = await fs.mkdtemp(path.join(parent, 'run-'));
const runtimePort = await freeLoopbackPort();
const runtimeUrl = `http://127.0.0.1:${runtimePort}/`;
const report = {
  schema_version: 1,
  experiment,
  status: 'running',
  started_at: new Date().toISOString(),
  corpus_sha256: digest(corpusBytes),
  profile_sha256: Object.fromEntries(Object.entries(profiles).map(([name, profile]) => [name, digest(profile.bytes)])),
  cli_sha256: digest(await fs.readFile(executable)),
  runtime_sha256: digest(await fs.readFile(serverPath)),
  model_sha256_verified_by_doctor: profiles.scene.parsed.model_file_sha256,
  model_revision: profiles.scene.parsed.model_revision,
  hardware: { os: `${os.type()} ${os.release()} ${os.arch()}`, cpu: os.cpus()[0].model, total_ram_bytes: os.totalmem() },
  limits: { files: cases.length * 2, chat_requests: 0, all_http_requests: 0, run_wall_ms: 600_000, repetitions: 1 },
  methodology: 'Paired complete authored SRT scenes; same source bytes per arm; references are retained only in this report; baseline has no context and scene arm has reviewed-by-no-human source boundaries. AI review is separate.',
  cases: [], requests: [], failures: [], commands: [],
};
const git = await waitForExit(startProcess('git', ['rev-parse', 'HEAD'], root), 10_000);
report.revision = git.stdout.trim();
const command = async args => {
  const start = performance.now();
  const child = startProcess(executable, args, root);
  try { await waitForExit(child, 180_000); }
  finally { report.commands.push({ args: args.map(value => value === modelPath ? '<model>' : value), stdout: child.stdout, stderr: child.stderr, elapsed_ms: performance.now() - start }); }
  assert(!child.stdoutTruncated && !child.stderrTruncated);
  return child.stdout;
};
const sources = new Map();
for (const row of cases) {
  const lines = [...row.relevant.before_zh, row.target_zh, ...row.relevant.after_zh];
  const source = Buffer.from(lines.map((line, index) => {
    const start = String(index + 1).padStart(2, '0');
    const end = String(index + 2).padStart(2, '0');
    return `${index + 1}\r\n00:00:${start},000 --> 00:00:${end},000\r\n${line}\r\n`;
  }).join('\r\n'));
  const caseDir = path.join(workspace, row.id);
  await fs.mkdir(caseDir);
  const sourcePath = path.join(caseDir, 'source.srt');
  await fs.writeFile(sourcePath, source, { flag: 'wx' });
  const map = {
    schema_version: 1,
    source_sha256: digest(source),
    evidence_id: `authored-context-contrasts-v1:${row.id}:relevant`,
    scene_end_ids: [lines.length],
  };
  const mapPath = path.join(caseDir, 'scene-map.json');
  const mapBytes = Buffer.from(JSON.stringify(map));
  await fs.writeFile(mapPath, mapBytes, { flag: 'wx' });
  sources.set(row.id, { source, sourcePath, mapPath, mapBytes, cueCount: lines.length, targetId: row.relevant.before_zh.length + 1 });
  report.cases.push({ id: row.id, category: row.category, source_sha256: digest(source), scene_map_sha256: digest(mapBytes), target_id: row.relevant.before_zh.length + 1, expected_facts: row.relevant.expected_facts, prohibited_facts: row.relevant.prohibited_facts, proposed_reference_ru: row.relevant.reference_ru, arms: [] });
}
const cueCount = [...sources.values()].reduce((sum, fixture) => sum + fixture.cueCount, 0);
report.limits.chat_requests = 2 * cueCount + 2;
report.limits.all_http_requests = 4 * cueCount + 6 * cases.length + 8;
let server, sampler, proxy;
let activeArm = null;
let runStart = performance.now();
try {
  const doctor = startProcess(executable, ['doctor', sceneProfilePath, modelPath], root);
  await waitForExit(doctor, 180_000);
  report.doctor = doctor.stdout.trim();
  proxy = http.createServer(async (request, response) => {
    const chunks = [];
    for await (const chunk of request) chunks.push(chunk);
    const body = Buffer.concat(chunks);
    const entry = { arm: activeArm, path: request.url, at: new Date().toISOString(), request_sha256: digest(body) };
    const started = performance.now();
    try {
      if (report.requests.length >= report.limits.all_http_requests || performance.now() - runStart > report.limits.run_wall_ms) throw new Error('Predeclared request or time budget exceeded');
      const upstream = await fetch(new URL(request.url, runtimeUrl), { method: request.method, headers: body.length ? { 'content-type': 'application/json', 'x-auralis-source-sha256': request.headers['x-auralis-source-sha256'] ?? '' } : undefined, body: body.length ? body : undefined, signal: AbortSignal.timeout(180_000) });
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
  const serverArgs = ['--model', modelPath, '--alias', profiles.scene.parsed.model_alias, '--host', '127.0.0.1', '--port', String(runtimePort), '-c', '2048', '-ngl', '99', '--cache-ram', '0', '--parallel', '1', '--jinja'];
  report.server_arguments = serverArgs.map(value => value === modelPath ? '<verified-model.gguf>' : value);
  const serverEnv = { ...process.env, PATH: `${path.dirname(serverPath)};${path.join(root, '.cache/runtime/cudart')};${process.env.PATH}` };
  server = startProcess(serverPath, serverArgs, root, serverEnv, { maxCaptureCharacters: 4 * 1024 * 1024 });
  const sampleScript = `$ErrorActionPreference='Stop'; while ($true) { $p = Get-Process -Id ${server.child.pid} -ErrorAction SilentlyContinue; if (!$p) { break }; $g = & nvidia-smi --query-gpu=memory.used,utilization.gpu --format=csv,noheader,nounits; @{time=[DateTime]::UtcNow.ToString('o');working_set_bytes=$p.WorkingSet64;cpu_seconds=$p.CPU;gpu=$g} | ConvertTo-Json -Compress; Start-Sleep -Milliseconds 1000 }`;
  sampler = startProcess('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', sampleScript], root);
  await waitForHealthyServer(runtimeUrl, server, 180_000);
  runStart = performance.now();
  for (const row of cases) {
    const fixture = sources.get(row.id);
    const caseReport = report.cases.find(candidate => candidate.id === row.id);
    const originalInspection = await command(['inspect', fixture.sourcePath]);
    for (const arm of ['baseline', 'scene']) {
      activeArm = `${row.id}:${arm}`;
      const armDir = path.join(workspace, row.id, arm);
      await fs.mkdir(armDir);
      const state = path.join(armDir, 'state');
      const output = path.join(armDir, 'candidate.ru.srt');
      const profile = profiles[arm];
      const args = arm === 'scene'
        ? ['translate-v5-scene', fixture.sourcePath, state, profile.path, fixture.mapPath, proxyUrl, output]
        : ['translate', fixture.sourcePath, state, profile.path, proxyUrl, output];
      const started = performance.now();
      const stdout = await command(args);
      const runId = stdout.match(/run_id=([0-9a-f-]{36})/u)?.[1];
      assert(runId, 'Missing durable run ID');
      const status = JSON.parse(await command(['status', state, runId]));
      assert.equal(status.state, 'validated');
      const translated = await fs.readFile(output);
      const translatedInspection = await command(['inspect', output]);
      verifyProtectedBytes(fixture.source, translated, originalInspection, translatedInspection);
      const template = path.join(armDir, 'template.json');
      await command(['template', output, template]);
      const accepted = JSON.parse(await fs.readFile(template)).translations;
      assert.equal(accepted.length, fixture.cueCount);
      const target = accepted.find(segment => segment.id === fixture.targetId)?.lines?.[0];
      assert(target, 'Missing accepted target text');
      assert.equal(digest(await fs.readFile(fixture.sourcePath)), digest(fixture.source));
      caseReport.arms.push({ arm, run_id: runId, state, output_sha256: digest(translated), elapsed_ms: performance.now() - started, accepted_target: target, status });
      console.log(`${activeArm}: ${target}`);
    }
  }
  assert(report.requests.filter(entry => entry.path === '/v1/chat/completions').length <= report.limits.chat_requests);
  await stopProcess(server);
  activeArm = null;
  for (const row of report.cases) for (const arm of row.arms) {
    const profile = profiles[arm.arm];
    const exported = path.join(workspace, row.id, arm.arm, 'offline.ru.srt');
    await command(['resume', arm.state, arm.run_id, profile.path, proxyUrl, exported]);
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
  await stopProcess(server);
  await stopProcess(sampler);
  if (proxy) await new Promise(resolve => proxy.close(resolve));
  report.finished_at = new Date().toISOString();
  report.resource_samples = (sampler?.stdout ?? '').trim().split(/\r?\n/u).filter(Boolean).map(line => { try { return JSON.parse(line); } catch { return { invalid_sample: line }; } });
  report.resource_sampling_error = sampler?.stderr || null;
  report.runtime_observations = (server?.stderr ?? '').split(/\r?\n/u).filter(line => /offload|CUDA.*buffer size|KV.*buffer size|model params|model size|build:/iu.test(line));
  await fs.writeFile(path.join(workspace, 'report.json'), JSON.stringify(report, null, 2));
  await fs.writeFile(path.join(workspace, 'server.log'), `${server?.stdout ?? ''}\n${server?.stderr ?? ''}`);
  await fs.writeFile(path.join(parent, 'latest.txt'), workspace);
  console.log(`Retained report: ${path.join(workspace, 'report.json')}`);
}
