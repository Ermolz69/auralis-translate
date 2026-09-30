import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { performance } from 'node:perf_hooks';
import { digest } from './flores-file-fixture.mjs';
import { freeLoopbackPort, startProcess, stopProcess, waitForExit, waitForHealthyServer } from './local-process.mjs';
import { runtimeSampler } from './runtime-sampler.mjs';

const preflight = process.argv.length === 3 && process.argv[2] === '--preflight';
assert(process.argv.length === 2 || preflight, 'Only --preflight is supported');
assert.equal(process.platform, 'win32');
const root = path.resolve('.');
const privateReportPath = path.join(root, '.cache/eval/commons-asus-full-1_8b-v1/run-M5lG2W/report.json');
const sourcePath = path.join(root, '.cache/eval/commons-asus-rog-ally-892592485/source.zh.srt');
const modelPath = process.env.AURALIS_TEST_GGUF;
const serverPath = process.env.AURALIS_TEST_LLAMA_SERVER;
const cliPath = path.join(root, 'target/release/auralis-translation-cli.exe');
const profilePath = path.join(root, 'models/manifests/hy_mt2_1_8b_q4_k_m.context_v5_scene.experimental.json');
assert(modelPath && serverPath && path.isAbsolute(modelPath) && path.isAbsolute(serverPath));
const expected = {
  report: '5f606c5f3e66acf4c20a162101cede8f95381145fc6c55a5da98dd5c912a066e',
  request: 'c4fb7132f0ab385aad7d3cef404a9f9fc772169a221d5d492873fffc9378b1c3',
  source: '923aed3991c2308d92b89c45181cea8ec7ece74e9b4d3a3ce0234d95e329913b',
  model: 'dc5f44fcf1fa496ee7ad725982c0c8c553a4de00259b53af84c4b89fb0c06699',
  runtime: '6f15be27bd80b6b4d52afefa49094e18fcfab55d5da354d717971f2d2537b2f4',
  cli: '82df0fbd0167b9163f945c58d8387a1edf2c6eedfed9f38086f617f74914df1d',
  profile: '432a1b064397a96334d777dfa01a2cef58d367b37023f1f9175501969698df4d',
};
const reportBytes = await fs.readFile(privateReportPath);
assert.equal(digest(reportBytes), expected.report);
const archivedReport = JSON.parse(reportBytes);
const failure = archivedReport.requests.filter(row => row.path === '/v1/chat/completions').at(-1);
assert.equal(failure.request_sha256, expected.request);
assert.equal(digest(Buffer.from(JSON.stringify(failure.request))), expected.request);
const archived = failure.request;
const envelope = JSON.parse(archived.messages[0].content.split('Input JSON:\n')[1]);
assert.equal(envelope.target_slots[0].segment_id, 20);
assert.equal(envelope.target_slots[0].line_index, 0);
assert.deepEqual(envelope.source_context.map(row => row.segment_id), [19, 21]);
for (const [file, hash] of [[sourcePath, expected.source], [modelPath, expected.model],
  [serverPath, expected.runtime], [cliPath, expected.cli], [profilePath, expected.profile]])
  assert.equal(digest(await fs.readFile(file)), hash, `${file} identity changed`);
if (preflight) {
  console.log('Natural ASUS slot-schema preflight: exact failed request, source, model, runtime, CLI and profile verified; budget six chats.');
  process.exit(0);
}

const parent = path.join(root, '.cache/eval/natural-asus-slot-schema-screen-v1');
await fs.mkdir(parent, { recursive: true });
const workspace = await fs.mkdtemp(path.join(parent, 'run-'));
console.log(`Natural ASUS slot-schema workspace: ${workspace}`);
const started = performance.now();
const budgetMs = 600_000;
const report = {
  schema_version: 1,
  experiment: 'natural-asus-slot-schema-screen-v1',
  started_at: new Date().toISOString(),
  status: 'running',
  identity: { archived_report_sha256: expected.report, archived_request_sha256: expected.request,
    source_sha256: expected.source, model_sha256: expected.model, runtime_sha256: expected.runtime,
    cli_sha256: expected.cli, profile_sha256: expected.profile,
    os: `${os.type()} ${os.release()} ${os.arch()}`,
    cpu: os.cpus()[0].model, total_ram_bytes: os.totalmem() },
  case: { target_segment_id: 20, line_index: 0, context_segment_ids: [19, 21],
    quality_verdict: 'unreviewed' },
  budget: { chat_requests: 6, per_request_timeout_ms: 120_000, total_wall_ms: budgetMs,
    seeds: [101, 202, 303] },
  requests: [], failures: [],
};
let server;
let sampler;
try {
  const git = startProcess('git', ['rev-parse', 'HEAD'], root);
  await waitForExit(git, 10_000);
  report.identity.code_commit = git.stdout.trim();
  const doctor = startProcess(cliPath, ['doctor', profilePath, modelPath], root);
  await waitForExit(doctor, 180_000);
  report.doctor = doctor.stdout.trim();
  assert.equal(JSON.parse(report.doctor).model_sha256, expected.model);
  const port = await freeLoopbackPort();
  const url = `http://127.0.0.1:${port}/`;
  const args = ['--model', modelPath, '--alias', archived.model, '--host', '127.0.0.1',
    '--port', String(port), '-c', '2048', '-ngl', '99', '--cache-ram', '0', '--parallel', '1', '--jinja'];
  report.server_arguments = args.map(value => value === modelPath ? '<verified-model.gguf>' : value);
  const env = { ...process.env,
    PATH: `${path.dirname(serverPath)};${path.join(root, '.cache/runtime/cudart')};${process.env.PATH}` };
  server = startProcess(serverPath, args, root, env, { maxCaptureCharacters: 4 * 1024 * 1024 });
  await waitForHealthyServer(url, server, Math.min(180_000, budgetMs - (performance.now() - started)));
  sampler = runtimeSampler(path.join(workspace, 'resources.jsonl'), root, () => [server.child.pid]);
  for (const seed of report.budget.seeds) {
    for (const arm of ['baseline', 'const_schema']) {
      assert(report.requests.length < report.budget.chat_requests);
      const remaining = budgetMs - (performance.now() - started);
      assert(remaining > 0, 'Screen wall budget exhausted');
      const request = structuredClone(archived);
      request.seed = seed;
      if (arm === 'const_schema') {
        const properties = request.response_format.schema.properties.translations.items.properties;
        properties.segment_id = { const: 20 };
        properties.line_index = { const: 0 };
      }
      const body = Buffer.from(JSON.stringify(request));
      const entry = { seed, arm, started_at: new Date().toISOString(),
        request_sha256: digest(body), request };
      const requestStarted = performance.now();
      try {
        const response = await fetch(`${url}v1/chat/completions`, { method: 'POST',
          headers: { 'content-type': 'application/json' }, body,
          signal: AbortSignal.timeout(Math.min(report.budget.per_request_timeout_ms, remaining)) });
        const bytes = Buffer.from(await response.arrayBuffer());
        entry.http_status = response.status;
        entry.raw_response = bytes.toString('utf8');
        entry.raw_response_sha256 = digest(bytes);
        const parsed = JSON.parse(entry.raw_response);
        entry.usage = parsed.usage ?? null;
        entry.timings = parsed.timings ?? null;
        entry.raw_candidate = parsed.choices?.[0]?.message?.content ?? null;
        if (response.ok && typeof entry.raw_candidate === 'string') {
          entry.raw_candidate_sha256 = digest(Buffer.from(entry.raw_candidate));
          entry.candidate = JSON.parse(entry.raw_candidate);
          const rows = entry.candidate.translations;
          entry.structurally_accepted = Array.isArray(rows) && rows.length === 1
            && rows[0].segment_id === 20 && rows[0].line_index === 0
            && typeof rows[0].text === 'string' && rows[0].text.trim().length > 0;
        } else entry.structurally_accepted = false;
      } catch (error) {
        entry.error = error.message;
        entry.structurally_accepted = false;
      } finally {
        entry.elapsed_ms = performance.now() - requestStarted;
        report.requests.push(entry);
        console.log(`${arm} seed=${seed} HTTP ${entry.http_status ?? 'error'} accepted=${entry.structurally_accepted} elapsed_ms=${Math.round(entry.elapsed_ms)}`);
      }
    }
  }
  report.status = report.requests.every(row => row.http_status === 200 && !row.error)
    ? 'completed' : 'completed_with_request_failures';
  if (report.status !== 'completed') process.exitCode = 1;
} catch (error) {
  report.status = 'failed';
  report.failures.push(error.message);
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
  await fs.writeFile(path.join(workspace, 'report.json'), `${JSON.stringify(report, null, 2)}\n`, { flag: 'wx' });
  console.log(`Natural ASUS slot-schema screen ${report.status}; report: ${path.join(workspace, 'report.json')}`);
}
