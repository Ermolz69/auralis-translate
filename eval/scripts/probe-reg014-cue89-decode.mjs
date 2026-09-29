import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { createReadStream } from 'node:fs';
import fs from 'node:fs/promises';
import path from 'node:path';
import { performance } from 'node:perf_hooks';
import { fileURLToPath } from 'node:url';
import { gunzipSync } from 'node:zlib';
import { digest } from './flores-file-fixture.mjs';
import { freeLoopbackPort, startProcess, stopProcess, waitForHealthyServer } from './local-process.mjs';
import { runtimeSampler } from './runtime-sampler.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const runtimePath = process.env.AURALIS_TEST_LLAMA_SERVER;
const modelPath = process.env.AURALIS_TEST_GGUF_1B;
const runtimeSha = '6f15be27bd80b6b4d52afefa49094e18fcfab55d5da354d717971f2d2537b2f4';
const modelSha = 'dc5f44fcf1fa496ee7ad725982c0c8c553a4de00259b53af84c4b89fb0c06699';
const profileSha = 'e80c80b0cf1db26d62ce5f644091f30e42fea752d27a0ce201fcab33f29ecb69';
const archiveSha = '752173e81de4084d7a548734622fa4477b3909dc882cb918f4b1082b132761bd';
const originalRequestSha = '530ad579a144c55908b02af8a994daa6169dc170a03ba9551c23df8fb15c7231';
const sourceSha = 'e9b760bdcce97de9f29f5fe671dbb927088f5a15119ebe3200e73e0408391bb3';
const seeds = [101, 202, 303];
const budgetMs = 10 * 60_000;
const perRequestMs = 120_000;
const asciiCode = /(?<![\p{L}\p{N}_])[A-Z]{2,}-[0-9]{2,8}(?![\p{L}\p{N}_])/gu;
const shaFile = async file => {
  const hash = createHash('sha256');
  for await (const chunk of createReadStream(file)) hash.update(chunk);
  return hash.digest('hex');
};

assert(runtimePath && path.isAbsolute(runtimePath));
assert(modelPath && path.isAbsolute(modelPath));
assert.equal(await shaFile(runtimePath), runtimeSha);
assert.equal(await shaFile(modelPath), modelSha);
const profileBytes = await fs.readFile(path.join(root,
  'models/manifests/hy_mt2_1_8b_q4_k_m.context_v6_prefix_repair.experimental.json'));
assert.equal(digest(profileBytes), profileSha);
const profile = JSON.parse(profileBytes);
assert.equal(profile.model_file_sha256, modelSha);
assert.equal(profile.prompt_version, 6);
const summary = JSON.parse(await fs.readFile(path.join(root,
  'eval/reports/2026-09-29-reg009-long-cli-prefix-repair-summary.json')));
assert.equal(summary.source_sha256, sourceSha);
assert.equal(summary.archive_sha256, archiveSha);
const archiveBytes = await fs.readFile(path.join(root,
  'eval/reports/2026-09-29-reg009-long-cli-prefix-repair-archive.json.gz'));
assert.equal(digest(archiveBytes), archiveSha);
const archive = JSON.parse(gunzipSync(archiveBytes));
const original = archive.requests.find(row => row.segment_id === 89 &&
  row.line_index === 0 && row.request_kind === 'chat_completion');
assert(original && original.outcome === 'invalid_candidate');
assert.equal(original.request_sha256, originalRequestSha);
assert.equal(original.restored_candidate, 'АРУ-0089: Поезд отправится в 08:10.');
const requestBytes = Buffer.from(original.rendered_request_base64, 'base64');
assert.equal(digest(requestBytes), originalRequestSha);
const request = JSON.parse(requestBytes);
assert.equal(request.model, profile.model_alias);
assert.equal(request.temperature, 0.7);
assert.equal(request.messages.length, 1);
assert.equal(request.messages[0].role, 'user');
assert.doesNotMatch(request.messages[0].content, /\p{Script=Cyrillic}/u);
const prompt = request.messages[0].content;
const marker = 'Input JSON:\n';
assert.equal(prompt.split(marker).length, 2);
const input = JSON.parse(prompt.split(marker)[1]);
assert.deepEqual(input.approved_terms, []);
assert.deepEqual(input.source_context.map(row => row.segment_id), [88, 90]);
assert.equal(input.target_slots.length, 1);
assert.equal(input.target_slots[0].segment_id, 89);
assert.equal(input.target_slots[0].line_index, 0);
assert.equal(input.target_slots[0].source_original,
  '工程 AUR-0089：列车将在 08:10 出发。');
assert.equal(input.target_slots[0].source_for_translation,
  input.target_slots[0].source_original);
const armOrders = [[0.7, 0], [0, 0.7], [0.7, 0]];
const planned = seeds.flatMap((seed, index) => armOrders[index].map(temperature => {
  const candidate = { ...request, seed, temperature };
  const body = Buffer.from(JSON.stringify(candidate));
  return { seed, temperature, body, request_sha256: digest(body),
    prompt_sha256: digest(Buffer.from(candidate.messages[0].content)) };
}));
assert.equal(planned.length, 6);
assert.equal(new Set(planned.map(row => row.prompt_sha256)).size, 1);

if (process.argv.includes('--preflight')) {
  console.log(JSON.stringify({ experiment: 'reg014-cue89-decode-v1',
    original_request_sha256: originalRequestSha, source_sha256: sourceSha,
    prompt_sha256: planned[0].prompt_sha256, planned_requests: planned.map(row => ({
      seed: row.seed, temperature: row.temperature, request_sha256: row.request_sha256,
    })) }, null, 2));
  process.exit(0);
}

const parent = path.join(root, '.cache/eval/reg014-cue89-decode');
await fs.mkdir(parent, { recursive: true });
const workspace = await fs.mkdtemp(path.join(parent, 'run-'));
console.log(`REG-014 cue-89 workspace: ${workspace}`);
const started = performance.now();
const report = {
  schema_version: 1, experiment: 'reg014-cue89-decode-v1', status: 'running',
  started_at: new Date().toISOString(), source_family: 'project_authored_synthetic_development',
  human_review: 'missing', sealed_holdout: false,
  identity: { git_head: execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim(),
    git_status: execFileSync('git', ['status', '--short'], { cwd: root, encoding: 'utf8' }).trim(),
    runner_sha256: await shaFile(fileURLToPath(import.meta.url)), model_sha256: modelSha,
    runtime_sha256: runtimeSha, profile_sha256: profileSha, archive_sha256: archiveSha,
    source_sha256: sourceSha, original_request_sha256: originalRequestSha,
    prompt_sha256: planned[0].prompt_sha256 },
  budget: { seeds, arm_orders: armOrders, request_count: 6, retries: 0,
    server_starts: 1, per_request_ms: perRequestMs, wall_ms: budgetMs },
  planned_requests: planned.map(({ seed, temperature, request_sha256, prompt_sha256 }) =>
    ({ seed, temperature, request_sha256, prompt_sha256 })),
  requests: [], errors: [], resources: null,
};
const save = () => fs.writeFile(path.join(workspace, 'report.json'),
  `${JSON.stringify(report, null, 2)}\n`);
const journal = await fs.open(path.join(workspace, 'requests.jsonl'), 'a');
const remaining = () => {
  const ms = budgetMs - (performance.now() - started);
  assert(ms > 0, 'REG-014 wall budget exhausted');
  return ms;
};
let server;
let sampler;
try {
  await save();
  const port = await freeLoopbackPort();
  const url = `http://127.0.0.1:${port}/`;
  const args = ['--model', modelPath, '--alias', profile.model_alias,
    '--host', '127.0.0.1', '--port', String(port), '-c', '2048', '-ngl', '99',
    '--parallel', '1', '--jinja', '--cache-ram', '0'];
  server = startProcess(runtimePath, args, root, process.env,
    { maxCaptureCharacters: 4 * 1024 * 1024 });
  await waitForHealthyServer(url, server, Math.min(180_000, remaining()));
  sampler = runtimeSampler(path.join(workspace, 'resources.jsonl'), root,
    () => [server.child.pid]);
  for (const item of planned) {
    const entry = { seed: item.seed, temperature: item.temperature,
      request_sha256: item.request_sha256, prompt_sha256: item.prompt_sha256,
      rendered_request: item.body.toString('utf8'), started_at: new Date().toISOString() };
    const callStarted = performance.now();
    try {
      const response = await fetch(`${url}v1/chat/completions`, {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: item.body,
        signal: AbortSignal.timeout(Math.min(perRequestMs, remaining())),
      });
      entry.http_status = response.status;
      entry.raw_response = await response.text();
      assert(response.ok, `HTTP ${response.status}`);
      const envelope = JSON.parse(entry.raw_response);
      entry.finish_reason = envelope.choices?.[0]?.finish_reason ?? null;
      entry.raw_candidate = envelope.choices?.[0]?.message?.content ?? null;
      entry.usage = envelope.usage ?? null;
      entry.timings = envelope.timings ?? null;
      if (entry.finish_reason === 'stop' && typeof entry.raw_candidate === 'string') {
        try {
          const decoded = JSON.parse(entry.raw_candidate);
          assert.equal(decoded.translations?.length, 1);
          const slot = decoded.translations[0];
          assert.equal(slot.segment_id, 89);
          assert.equal(slot.line_index, 0);
          assert(typeof slot.text === 'string' && slot.text.trim());
          entry.restored_candidate = slot.text;
          entry.raw_ascii_identifiers = slot.text.match(asciiCode) ?? [];
          entry.raw_exact_identifier = JSON.stringify(entry.raw_ascii_identifiers) ===
            JSON.stringify(['AUR-0089']);
          entry.time_preserved = slot.text.includes('08:10');
          entry.mixed_script_code_like = /[A-ZА-ЯЁ]*[А-ЯЁ][A-ZА-ЯЁ]*-[0-9]{2,}/u.test(slot.text);
          entry.structural_outcome = 'parsed_target_slot';
        } catch (error) { entry.structural_outcome = `invalid_target_slot: ${error.message}`; }
      } else entry.structural_outcome = 'incomplete_candidate';
    } catch (error) {
      entry.error = String(error);
      entry.structural_outcome = 'http_or_envelope_failure';
    }
    entry.elapsed_ms = Math.round(performance.now() - callStarted);
    report.requests.push({ seed: entry.seed, temperature: entry.temperature,
      request_sha256: entry.request_sha256, http_status: entry.http_status ?? null,
      finish_reason: entry.finish_reason ?? null,
      structural_outcome: entry.structural_outcome,
      raw_exact_identifier: entry.raw_exact_identifier ?? null,
      time_preserved: entry.time_preserved ?? null,
      mixed_script_code_like: entry.mixed_script_code_like ?? null,
      usage: entry.usage ?? null, elapsed_ms: entry.elapsed_ms });
    await journal.write(`${JSON.stringify(entry)}\n`);
    await journal.sync();
    await save();
    console.log(`seed=${entry.seed} temperature=${entry.temperature}: ${entry.structural_outcome}, code=${entry.raw_exact_identifier ?? 'unknown'}, ${entry.elapsed_ms} ms`);
    if (entry.error) throw new Error(entry.error);
  }
  report.status = 'complete_observations_unreviewed';
} catch (error) {
  report.status = 'failed_retained';
  report.errors.push({ at: new Date().toISOString(), message: String(error),
    stack: error.stack ?? null });
  throw error;
} finally {
  if (sampler) report.resources = await sampler.stop();
  if (server) {
    await stopProcess(server);
    await fs.writeFile(path.join(workspace, 'server.log'),
      `${server.stdout}\n${server.stderr}\n`);
  }
  report.finished_at = new Date().toISOString();
  report.wall_elapsed_ms = Math.round(performance.now() - started);
  await save();
  await journal.close();
}
