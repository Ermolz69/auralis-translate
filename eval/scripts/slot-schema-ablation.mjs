import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { performance } from 'node:perf_hooks';
import { fileURLToPath } from 'node:url';
import { gunzipSync } from 'node:zlib';
import { digest } from './flores-file-fixture.mjs';
import { freeLoopbackPort, startProcess, stopProcess, waitForExit, waitForHealthyServer } from './local-process.mjs';
import { runtimeSampler } from './runtime-sampler.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const modelPath = process.env.AURALIS_TEST_GGUF;
const serverPath = process.env.AURALIS_TEST_LLAMA_SERVER;
assert(modelPath && serverPath && path.isAbsolute(modelPath) && path.isAbsolute(serverPath));
const executable = path.join(root, 'target/release/auralis-translation-cli.exe');
const profilePath = path.join(root, 'models/manifests/hy_mt2_1_8b_q4_k_m.context_v5_scene.experimental.json');
const profileBytes = await fs.readFile(profilePath);
const profile = JSON.parse(profileBytes);
assert.equal(digest(profileBytes), '432a1b064397a96334d777dfa01a2cef58d367b37023f1f9175501969698df4d');
const journalPath = path.join(root, 'eval/reports/2026-09-29-long-v5-scene-failure-journal.json.gz');
const journalBytes = await fs.readFile(journalPath);
assert.equal(digest(journalBytes), 'ea54a97843fb107e3181b66d60f80d1169fc85b40f5565dd05a49692dc7ebc58');
const journal = JSON.parse(gunzipSync(journalBytes));
const rejected = journal.requests.filter(row => row.outcome === 'invalid_candidate');
assert.equal(rejected.length, 1);
assert.equal(rejected[0].request_sha256, 'd2a7ffc787736347195f7436f1f8a1a0496a81f784b078d3f3b3a9be82b4f3eb');
const archived = JSON.parse(rejected[0].rendered_request);
const prompt = archived.messages?.[0]?.content;
assert.equal(typeof prompt, 'string');
const envelope = JSON.parse(prompt.split('Input JSON:\n')[1]);
assert.equal(envelope.target_slots.length, 1);
assert.equal(envelope.target_slots[0].segment_id, 72);
assert.equal(envelope.target_slots[0].line_index, 0);
assert.deepEqual(envelope.source_context.map(cue => cue.segment_id), [71, 73]);
assert.equal(envelope.target_slots[0].source_original, '工程 AUR-0072：这不是最后一班车。');
assert.equal(profile.model_file_sha256, 'dc5f44fcf1fa496ee7ad725982c0c8c553a4de00259b53af84c4b89fb0c06699');

const parent = path.join(root, '.cache/eval/slot-schema-ablation');
await fs.mkdir(parent, { recursive: true });
const workspace = await fs.mkdtemp(path.join(parent, 'run-'));
console.log(`Slot-schema ablation workspace: ${workspace}`);
const started = performance.now();
const budgetMs = 600_000;
const runtimeSha256 = digest(await fs.readFile(serverPath));
assert.equal(runtimeSha256, '6f15be27bd80b6b4d52afefa49094e18fcfab55d5da354d717971f2d2537b2f4');
const report = {
  schema_version: 1,
  experiment: 'slot-schema-ablation-2026-09-29-v1',
  started_at: new Date().toISOString(),
  status: 'running',
  case: { source_sha256: digest(Buffer.from(prompt)), target_segment_id: 72, target_line_index: 0, context_segment_ids: [71, 73], expected_meaning_outside_requests: 'The addressed train is not the last one.', quality_verdict: 'unreviewed' },
  identity: {
    archived_request_sha256: rejected[0].request_sha256,
    journal_gzip_sha256: digest(journalBytes),
    profile_sha256: digest(profileBytes),
    model_revision: profile.model_revision,
    model_sha256_verified_by_doctor: profile.model_file_sha256,
    runtime_sha256: runtimeSha256,
    cli_sha256: digest(await fs.readFile(executable)),
    os: `${os.type()} ${os.release()} ${os.arch()}`,
    cpu: os.cpus()[0].model,
    total_ram_bytes: os.totalmem(),
  },
  budget: { chat_requests: 4, per_request_timeout_ms: 120_000, total_wall_ms: budgetMs, seeds: [101, 202] },
  requests: [],
  failures: [],
};
let server;
let sampler;
try {
  const revision = startProcess('git', ['rev-parse', 'HEAD'], root);
  await waitForExit(revision, 10_000);
  report.identity.code_commit = revision.stdout.trim();
  const doctor = startProcess(executable, ['doctor', profilePath, modelPath], root);
  await waitForExit(doctor, 180_000);
  report.doctor = doctor.stdout.trim();
  const port = await freeLoopbackPort();
  const url = `http://127.0.0.1:${port}/`;
  const serverArgs = ['--model', modelPath, '--alias', profile.model_alias, '--host', '127.0.0.1', '--port', String(port), '-c', '2048', '-ngl', '99', '--cache-ram', '0', '--parallel', '1', '--jinja'];
  report.server_arguments = serverArgs.map(value => value === modelPath ? '<verified-model.gguf>' : value);
  const env = { ...process.env, PATH: `${path.dirname(serverPath)};${path.join(root, '.cache/runtime/cudart')};${process.env.PATH}` };
  server = startProcess(serverPath, serverArgs, root, env, { maxCaptureCharacters: 4 * 1024 * 1024 });
  await waitForHealthyServer(url, server, Math.min(180_000, budgetMs - (performance.now() - started)));
  sampler = runtimeSampler(path.join(workspace, 'resources.jsonl'), root, () => [server.child.pid]);
  for (const seed of report.budget.seeds) {
    for (const arm of ['baseline', 'const_schema']) {
      assert(report.requests.length < report.budget.chat_requests);
      const remaining = budgetMs - (performance.now() - started);
      assert(remaining > 0, 'Ablation wall budget exhausted');
      const request = structuredClone(archived);
      request.seed = seed;
      if (arm === 'const_schema') {
        const properties = request.response_format.schema.properties.translations.items.properties;
        properties.segment_id = { const: 72 };
        properties.line_index = { const: 0 };
      }
      const body = Buffer.from(JSON.stringify(request));
      const entry = { seed, arm, started_at: new Date().toISOString(), request_sha256: digest(body), request };
      const requestStarted = performance.now();
      try {
        const response = await fetch(`${url}v1/chat/completions`, { method: 'POST', headers: { 'content-type': 'application/json' }, body, signal: AbortSignal.timeout(Math.min(report.budget.per_request_timeout_ms, remaining)) });
        const bytes = Buffer.from(await response.arrayBuffer());
        entry.http_status = response.status;
        entry.raw_response = bytes.toString('utf8');
        const parsed = JSON.parse(entry.raw_response);
        entry.usage = parsed.usage ?? null;
        entry.timings = parsed.timings ?? null;
        entry.raw_candidate = parsed.choices?.[0]?.message?.content ?? null;
        if (response.ok && typeof entry.raw_candidate === 'string') {
          const candidate = JSON.parse(entry.raw_candidate);
          entry.candidate = candidate;
          const translations = candidate.translations;
          entry.structurally_accepted = Array.isArray(translations) && translations.length === 1
            && translations[0].segment_id === 72 && translations[0].line_index === 0
            && typeof translations[0].text === 'string' && translations[0].text.trim().length > 0;
        } else {
          entry.structurally_accepted = false;
        }
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
  report.status = report.requests.every(row => row.http_status === 200 && !row.error) ? 'completed' : 'completed_with_request_failures';
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
  console.log(`Slot-schema ablation ${report.status}; report: ${path.join(workspace, 'report.json')}`);
}
