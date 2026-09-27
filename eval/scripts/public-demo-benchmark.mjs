import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import http from 'node:http';
import os from 'node:os';
import { performance } from 'node:perf_hooks';
import { fileURLToPath } from 'node:url';
import { buildSrt, digest, verifyProtectedBytes } from './flores-file-fixture.mjs';
import { startProcess, stopProcess, waitForExit, waitForHealthyServer, freeLoopbackPort } from './local-process.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const datasetFile = process.env.AURALIS_DEMO_DATASET ?? 'eval/corpora/public-demo-v1.json';
const datasetBytes = await fs.readFile(path.resolve(root, datasetFile));
const dataset = JSON.parse(datasetBytes);
assert.equal(dataset.examples.length, 20);
assert.equal(new Set(dataset.examples.map(row => row.id)).size, 20);
const profileFile = process.env.AURALIS_DEMO_PROFILE ?? 'models/manifests/hy_mt2_1_8b_q4_k_m.checked.experimental.json';
const profileBytes = await fs.readFile(path.resolve(root, profileFile));
const profile = JSON.parse(profileBytes);
console.log(`Dataset: ${datasetFile}; profile: ${profileFile}; prompt v${profile.prompt_version}`);
if (profileFile.includes('.fidelity.')) assert.equal(profile.prompt_version, 4);
const serverPath = process.env.AURALIS_TEST_LLAMA_SERVER;
const modelPath = process.env.AURALIS_TEST_GGUF;
assert(serverPath && modelPath, 'Supply already installed runtime and model paths');
const executable = path.join(root, 'target/release/auralis-translation-cli.exe');
const parent = path.join(root, '.cache/eval/public-demo');
await fs.mkdir(parent, { recursive: true });
const workspace = await fs.mkdtemp(path.join(parent, 'run-'));
console.log(`Benchmark workspace: ${workspace}`);
const source = buildSrt(dataset.examples);
const sourcePath = path.join(workspace, 'source.srt');
const savedProfile = path.join(workspace, 'profile.json');
await fs.writeFile(sourcePath, source, { flag: 'wx' });
await fs.writeFile(savedProfile, profileBytes, { flag: 'wx' });
const commands = [];
const cli = async args => {
  const t = performance.now();
  const process = startProcess(executable, args, root);
  commands.push({ args, process });
  await waitForExit(process, 900_000);
  assert(!process.stdoutTruncated && !process.stderrTruncated);
  return { stdout: process.stdout, stderr: process.stderr, elapsed_ms: performance.now() - t };
};
const git = await waitForExit(startProcess('git', ['rev-parse', 'HEAD'], root), 10_000);
const gpu = await waitForExit(startProcess('nvidia-smi', ['--query-gpu=name,memory.total,driver_version', '--format=csv,noheader'], root), 10_000);
const report = {
  schema_version: 1, started_at: new Date().toISOString(), revision: git.stdout.trim(),
  dataset_sha256: digest(datasetBytes), source_sha256: digest(source), profile_sha256: digest(profileBytes),
  cli_sha256: digest(await fs.readFile(executable)), runtime_sha256: digest(await fs.readFile(serverPath)),
  profile, repetitions_planned: 3, runs: [], failures: [],
  hardware: { os: `${os.type()} ${os.release()} ${os.arch()}`, cpu: os.cpus()[0].model, logical_cpus: os.cpus().length, total_ram_bytes: os.totalmem(), gpu: gpu.stdout.trim() },
  methodology: { clock: 'Node performance.now(), monotonic milliseconds', server: 'One persistent server; first timed file follows readiness, other files reuse the loaded model. No claim of cold OS cache.', request: 'Loopback proxy times POST /v1/chat/completions through complete response body. Includes proxy/HTTP overhead; llama.cpp token timings are separate.', cache: 'llama.cpp --cache-ram 0; slot/prompt behavior otherwise defaults. Repeated identical prompts can reuse the runtime prompt cache.', resources: 'Sampled every 1 second. GPU usage includes other applications; process working set is not private allocation. Peaks are approximate.', dataset: dataset.provenance, scope: `Twenty standalone Chinese lines; prompt v${profile.prompt_version}, no context or glossary, synthetic CRLF SRT. Proposed references are not sent to the model. Not a subtitle holdout or language-release gate.` },
};
report.code_snapshot = {};
for (const file of ['crates/auralis-translation-llamacpp/src/provider.rs', 'crates/auralis-translation-llamacpp/src/chinese_fidelity_prompt.rs', 'crates/auralis-translation-llamacpp/src/chinese_money_terms.rs', 'crates/auralis-translation-llamacpp/src/chinese_number.rs', 'eval/scripts/public-demo-benchmark.mjs']) {
  report.code_snapshot[file] = digest(await fs.readFile(path.join(root, file)));
}
report.methodology.currency = profile.prompt_version === 4 ? 'Recognized source amounts are protected as ordered tokens in inference-only text, then restored by the adapter after token validation. Raw candidate and accepted_candidate differ intentionally. Unrecognized amounts remain model translated.' : 'No monetary protection.';
const inspection = await cli(['inspect', sourcePath]);
let server, sampler, proxy;
let activeRun;
const requests = [];
const runtimePort = await freeLoopbackPort();
const runtimeUrl = `http://127.0.0.1:${runtimePort}/`;
try {
  proxy = http.createServer(async (req, res) => {
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    const body = Buffer.concat(chunks);
    const timed = req.method === 'POST' && req.url.includes('chat/completions');
    const started = performance.now();
    const measurement = timed ? { run: activeRun, started_at: new Date().toISOString(), request_sha256: digest(body) } : undefined;
    try {
      const response = await fetch(new URL(req.url, runtimeUrl), { method: req.method, headers: body.length ? { 'content-type': 'application/json' } : undefined, body: body.length ? body : undefined, signal: AbortSignal.timeout(180_000) });
      const bytes = Buffer.from(await response.arrayBuffer());
      if (measurement) {
        const request = JSON.parse(body);
        const content = request.messages.at(-1).content;
        const example = dataset.examples.find(row => digest(Buffer.from(row.source)) === req.headers['x-auralis-source-sha256']);
        assert(example, 'Unmapped model request');
        const result = JSON.parse(bytes);
        Object.assign(measurement, { example_id: example.id, source_sha256: req.headers['x-auralis-source-sha256'], prompt: content, elapsed_ms: performance.now() - started, http_status: response.status, candidate: result.choices?.[0]?.message?.content ?? null, usage: result.usage ?? null, timings: result.timings ?? null });
        requests.push(measurement);
      }
      res.writeHead(response.status, { 'content-type': response.headers.get('content-type') ?? 'application/json' });
      res.end(bytes);
    } catch (error) {
      if (measurement) requests.push({ ...measurement, elapsed_ms: performance.now() - started, error: error.message });
      res.writeHead(502); res.end(JSON.stringify({ error: error.message }));
    }
  });
  await new Promise(resolve => proxy.listen(0, '127.0.0.1', resolve));
  const url = `http://127.0.0.1:${proxy.address().port}/`;
  const args = ['--model', modelPath, '--alias', profile.model_alias, '--host', '127.0.0.1', '--port', String(runtimePort), '-c', String(profile.min_context_tokens), '-ngl', '99', '--cache-ram', '0', '--parallel', '1', '--jinja'];
  report.server_arguments = args.map(value => value === modelPath ? '<supplied-model.gguf>' : value);
  const started = performance.now();
  server = startProcess(serverPath, args, root, process.env, { maxCaptureCharacters: 4 * 1024 * 1024 });
  await waitForHealthyServer(runtimeUrl, server, 180_000);
  report.server_startup_ms = performance.now() - started;
  console.log(`Server ready in ${report.server_startup_ms.toFixed(3)} ms`);
  const sampleScript = `$ErrorActionPreference='Stop'; while ($true) { $p = Get-Process -Id ${server.child.pid} -ErrorAction SilentlyContinue; if (!$p) { break }; $g = & nvidia-smi --query-gpu=memory.used,utilization.gpu --format=csv,noheader,nounits; @{time=[DateTime]::UtcNow.ToString('o');working_set_bytes=$p.WorkingSet64;cpu_seconds=$p.CPU;gpu=$g} | ConvertTo-Json -Compress; Start-Sleep -Milliseconds 1000 }`;
  sampler = startProcess('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', sampleScript], root);
  for (let repetition = 1; repetition <= 3; repetition++) {
    activeRun = repetition;
    const runRoot = path.join(workspace, `repeat-${repetition}`);
    await fs.mkdir(runRoot);
    const state = path.join(runRoot, 'state');
    const output = path.join(runRoot, 'candidate.ru.srt');
    const translated = await cli(['translate', sourcePath, state, savedProfile, url, output]);
    const runId = translated.stdout.match(/run_id=([0-9a-f-]{36})/u)?.[1];
    assert(runId);
    const status = JSON.parse((await cli(['status', state, runId])).stdout);
    assert.equal(status.state, 'validated');
    assert.equal(status.completed_blocks, status.total_blocks);
    const bytes = await fs.readFile(output);
    verifyProtectedBytes(source, bytes, inspection.stdout, (await cli(['inspect', output])).stdout);
    const templateFile = path.join(runRoot, 'template.json');
    await cli(['template', output, templateFile]);
    const translations = JSON.parse(await fs.readFile(templateFile, 'utf8')).translations;
    assert.equal(translations.length, 20);
    translations.forEach((row, index) => { assert.equal(row.id, index + 1); assert.equal(row.lines.length, 1); });
    const runRequests = requests.filter(row => row.run === repetition);
    assert(runRequests.length >= 20);
    for (const row of dataset.examples) assert(runRequests.some(request => request.example_id === row.id && request.http_status === 200));
    for (const request of runRequests) request.accepted_candidate = translations[dataset.examples.findIndex(row => row.id === request.example_id)].lines[0];
    report.runs.push({ repetition, run_id: runId, translation_elapsed_ms: translated.elapsed_ms, request_elapsed_sum_ms: runRequests.reduce((sum, row) => sum + row.elapsed_ms, 0), output_sha256: digest(bytes), status, structural_checks: 'passed', rows: translations.map((row, index) => ({ example_id: dataset.examples[index].id, candidate: row.lines[0] })) });
    assert.deepEqual(await fs.readFile(sourcePath), source);
    console.log(`Repeat ${repetition}: ${translated.elapsed_ms.toFixed(3)} ms; ${runRequests.length} real model requests; protected bytes verified`);
  }
  await stopProcess(server);
  activeRun = null;
  for (const run of report.runs) {
    const state = path.join(workspace, `repeat-${run.repetition}`, 'state');
    const output = path.join(workspace, `repeat-${run.repetition}`, 'offline.ru.srt');
    const result = await cli(['resume', state, run.run_id, savedProfile, url, output]);
    assert.equal(digest(await fs.readFile(output)), run.output_sha256);
    run.offline_reexport_ms = result.elapsed_ms;
    run.offline_reexport = 'byte_identical';
  }
  report.source_preservation = 'byte_identical';
  report.result = 'passed';
} catch (error) {
  report.failures.push({ at: new Date().toISOString(), message: error.message });
  report.result = 'failed';
  process.exitCode = 1;
  console.error(error);
} finally {
  await stopProcess(server);
  await stopProcess(sampler);
  if (proxy) await new Promise(resolve => proxy.close(resolve));
  report.requests = requests;
  report.resource_samples = (sampler?.stdout ?? '').trim().split(/\r?\n/).filter(Boolean).map(line => { try { return JSON.parse(line); } catch { return { invalid_sample: true }; } });
  report.resource_sampling_error = sampler?.stderr || null;
  report.finished_at = new Date().toISOString();
  await fs.writeFile(path.join(workspace, 'benchmark.json'), JSON.stringify(report, null, 2));
  await fs.writeFile(path.join(workspace, 'model-server.log'), `${server?.stdout ?? ''}\n${server?.stderr ?? ''}`);
  await fs.writeFile(path.join(workspace, 'cli.log'), commands.map(call => `${JSON.stringify(call.args)}\n${call.process.stdout}\n${call.process.stderr}`).join('\n'));
  await fs.writeFile(path.join(parent, 'latest.txt'), workspace);
  console.log(`Retained report: ${path.join(workspace, 'benchmark.json')}`);
}
