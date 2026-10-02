import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { createReadStream } from 'node:fs';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { performance } from 'node:perf_hooks';
import { fileURLToPath } from 'node:url';
import { freeLoopbackPort, startProcess, stopProcess, waitForHealthyServer } from './local-process.mjs';
import { runtimeSampler } from './runtime-sampler.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const preflight = process.argv.length === 3 && process.argv[2] === '--preflight';
assert(process.argv.length === 2 || preflight, 'Only --preflight is supported');
assert.equal(process.platform, 'win32');
const modelPath = process.env.AURALIS_TEST_GGUF;
const runtimePath = process.env.AURALIS_TEST_LLAMA_SERVER;
assert(modelPath && runtimePath && path.isAbsolute(modelPath) && path.isAbsolute(runtimePath));
const priorDir = path.join(root, '.cache/eval/reg-052-v8-controls-v1/attempt-uQZQXg');
const manifestPath = path.join(root, 'models/manifests/hy_mt2_7b_q4_k_m.context_v6_slot.experimental.json');
const packPath = path.join(root, 'eval/regressions/v8-name-question-controls-v1.json');
const expected = {
  prior: '96ac8d1b1b6c126b3e66052702560ff9b1aca30d0809ac1b59ce0f5a2b161ebf',
  pack: '23ecdaeb253d281e7651d5b76acdf10fd672793b428fd13262d38672a2ac82ed',
  manifest: 'e7e2d7745cb283a88984da202eb511f0144b2bc51bc6eb01727515a51e7aa06f',
  model: '9f96256500f3fc1ab4d64336b58f52a949a95ad7516b0c229476eef782f9f77b',
  runtime: '6f15be27bd80b6b4d52afefa49094e18fcfab55d5da354d717971f2d2537b2f4',
};
const limits = { chats: 12, preflights: 24, per_chat_ms: 120000,
  per_preflight_ms: 15000, readiness_ms: 120000, wall_ms: 600000,
  context_tokens: 2048, response_tokens: 256, safety_tokens: 64, retries: 0 };
const digest = bytes => createHash('sha256').update(bytes).digest('hex');
const hashFile = async file => {
  const hash = createHash('sha256');
  for await (const chunk of createReadStream(file)) hash.update(chunk);
  return hash.digest('hex');
};
assert.equal(await hashFile(path.join(priorDir, 'report.json')), expected.prior);
assert.equal(await hashFile(packPath), expected.pack);
assert.equal(await hashFile(manifestPath), expected.manifest);
assert.equal(await hashFile(modelPath), expected.model);
assert.equal(await hashFile(runtimePath), expected.runtime);
const prior = JSON.parse(await fs.readFile(path.join(priorDir, 'report.json')));
assert.equal(prior.status, 'complete_outer_json_unreviewed');
const priorEntries = (await fs.readFile(path.join(priorDir, 'requests.jsonl'), 'utf8'))
  .trim().split('\n').map(line => JSON.parse(line));
assert.equal(priorEntries.length, 24);
const pack = JSON.parse(await fs.readFile(packPath, 'utf8'));
const cases = [...pack.related_controls, ...pack.negative_controls];
const manifest = JSON.parse(await fs.readFile(manifestPath, 'utf8'));
assert.equal(manifest.model_file_sha256, expected.model);
assert.equal(manifest.model_alias, 'auralis-hy-mt2-7b-q4');
const planned = priorEntries.filter(entry => entry.context === 'on').map(entry => {
  assert.equal(entry.request.model, 'auralis-hy-mt2-1.8b-q4');
  assert.equal(digest(Buffer.from(JSON.stringify(entry.request))), entry.request_sha256);
  const sourceCase = cases.find(row => row.id === entry.case_id);
  assert(sourceCase);
  const request = structuredClone(entry.request);
  request.model = manifest.model_alias;
  assert.equal(request.max_tokens, limits.response_tokens);
  assert(!request.messages[0].content.includes(sourceCase.expected_meaning));
  assert.equal(JSON.parse(request.messages[0].content.split('Input JSON:\n')[1])
    .target_slots[0].source_original, sourceCase.source);
  return { case_id: entry.case_id, seed: entry.seed,
    prior_request_sha256: entry.request_sha256,
    prior_raw_response_sha256: entry.raw_response_sha256,
    prior_candidate: entry.parsed_candidate,
    request, request_sha256: digest(Buffer.from(JSON.stringify(request))),
    prompt_sha256: digest(Buffer.from(request.messages[0].content)) };
});
assert.equal(planned.length, limits.chats);
assert.deepEqual(planned.map(row => `${row.case_id}:${row.seed}`),
  cases.flatMap(row => [`${row.id}:101`, `${row.id}:202`]));
if (preflight) {
  console.log(JSON.stringify({ status: 'verified', expected, limits,
    planned: planned.map(({ case_id, seed, request_sha256, prompt_sha256 }) =>
      ({ case_id, seed, request_sha256, prompt_sha256 })) }));
  process.exit(0);
}

const parent = path.join(root, '.cache/eval/reg-052-cross-model-v1');
await fs.mkdir(parent, { recursive: true });
const workspace = await fs.mkdtemp(path.join(parent, 'attempt-'));
const started = performance.now();
const report = { schema_version: 1, experiment: 'reg-052-cross-model-v1',
  started_at: new Date().toISOString(), status: 'running', expected, limits,
  harness_sha256: await hashFile(fileURLToPath(import.meta.url)),
  platform: { os: `${os.type()} ${os.release()} ${os.arch()}`,
    cpu: os.cpus()[0].model, ram_bytes: os.totalmem() },
  code_commit: null, git_status: null, requests: [], failures: [], resources: null };
const journal = await fs.open(path.join(workspace, 'requests.jsonl'), 'wx');
const save = () => fs.writeFile(path.join(workspace, 'report.json'),
  `${JSON.stringify(report, null, 2)}\n`);
const remaining = () => {
  const ms = limits.wall_ms - (performance.now() - started);
  assert(ms > 0, 'Declared wall budget exhausted');
  return ms;
};
const post = async (url, endpoint, body, timeoutMs) => {
  const began = performance.now();
  const response = await fetch(`${url}${endpoint}`, { method: 'POST',
    headers: { 'content-type': 'application/json' }, body: JSON.stringify(body),
    signal: AbortSignal.timeout(Math.min(timeoutMs, remaining())) });
  const bytes = Buffer.from(await response.arrayBuffer());
  return { path: `/${endpoint}`, request: body,
    request_sha256: digest(Buffer.from(JSON.stringify(body))),
    raw_response: bytes.toString('utf8'), raw_response_sha256: digest(bytes),
    http_status: response.status, elapsed_ms: Math.round(performance.now() - began) };
};
let server, sampler;
try {
  await save();
  report.code_commit = execFileSync('git', ['rev-parse', 'HEAD'],
    { cwd: root, encoding: 'utf8' }).trim();
  report.git_status = execFileSync('git', ['status', '--short'],
    { cwd: root, encoding: 'utf8' }).trim();
  const port = await freeLoopbackPort();
  const url = `http://127.0.0.1:${port}/`;
  const args = ['--model', modelPath, '--alias', manifest.model_alias,
    '--host', '127.0.0.1', '--port', String(port), '-c', '2048', '-ngl', '99',
    '--parallel', '1', '--jinja', '--cache-ram', '0'];
  const env = { ...process.env, PATH: `${path.dirname(runtimePath)};${path.join(root,
    '.cache/runtime/cudart')};${process.env.PATH}` };
  server = startProcess(runtimePath, args, root, env,
    { maxCaptureCharacters: 4 * 1024 * 1024 });
  await waitForHealthyServer(url, server, Math.min(limits.readiness_ms, remaining()));
  sampler = runtimeSampler(path.join(workspace, 'resources.jsonl'), root,
    () => [server.child.pid]);
  for (const item of planned) {
    assert(report.requests.length < limits.chats);
    const entry = { case_id: item.case_id, seed: item.seed,
      prior_request_sha256: item.prior_request_sha256,
      prior_raw_response_sha256: item.prior_raw_response_sha256,
      prior_candidate: item.prior_candidate,
      request_sha256: item.request_sha256, prompt_sha256: item.prompt_sha256,
      request: item.request, started_at: new Date().toISOString(), preflight: [] };
    try {
      const template = await post(url, 'apply-template', {
        model: item.request.model, messages: item.request.messages,
        response_format: item.request.response_format }, limits.per_preflight_ms);
      entry.preflight.push(template);
      assert.equal(template.http_status, 200);
      const rendered = JSON.parse(template.raw_response).prompt;
      assert.equal(typeof rendered, 'string');
      const tokenized = await post(url, 'tokenize',
        { content: rendered, add_special: false, parse_special: true },
        limits.per_preflight_ms);
      entry.preflight.push(tokenized);
      assert.equal(tokenized.http_status, 200);
      const tokens = JSON.parse(tokenized.raw_response).tokens;
      assert(Array.isArray(tokens) && tokens.every(Number.isInteger));
      entry.prompt_tokens_preflight = tokens.length;
      assert(tokens.length <= limits.context_tokens - limits.response_tokens - limits.safety_tokens,
        'Rendered prompt exceeds declared budget');
      const chat = await post(url, 'v1/chat/completions', item.request, limits.per_chat_ms);
      Object.assign(entry, { http_status: chat.http_status,
        chat_elapsed_ms: chat.elapsed_ms, raw_response: chat.raw_response,
        raw_response_sha256: chat.raw_response_sha256 });
      const parsed = JSON.parse(chat.raw_response);
      entry.finish_reason = parsed.choices?.[0]?.finish_reason ?? null;
      entry.raw_candidate = parsed.choices?.[0]?.message?.content ?? null;
      entry.usage = parsed.usage ?? null;
      entry.timings = parsed.timings ?? null;
      assert.equal(entry.usage?.prompt_tokens, tokens.length,
        'Server prompt usage differs from tokenizer preflight');
      if (chat.http_status === 200 && entry.finish_reason === 'stop'
          && typeof entry.raw_candidate === 'string') {
        try {
          const rows = JSON.parse(entry.raw_candidate).translations;
          assert.equal(rows?.length, 1);
          assert.equal(rows[0].segment_id, 3);
          assert.equal(rows[0].line_index, 0);
          assert(typeof rows[0].text === 'string' && rows[0].text.trim());
          entry.parsed_candidate = rows[0].text;
          entry.structural_outcome = 'outer_json_valid_unreviewed';
        } catch (error) { entry.structural_outcome = `invalid: ${error.message}`; }
      } else entry.structural_outcome = 'incomplete_or_http_failure';
      if (chat.http_status !== 200) throw new Error(`Chat HTTP ${chat.http_status}`);
    } catch (error) {
      entry.error = String(error);
      entry.structural_outcome = 'request_or_preflight_failure';
      throw error;
    } finally {
      report.requests.push({ case_id: item.case_id, seed: item.seed,
        prior_request_sha256: item.prior_request_sha256,
        prior_raw_response_sha256: item.prior_raw_response_sha256,
        prior_candidate: item.prior_candidate,
        request_sha256: item.request_sha256, prompt_sha256: item.prompt_sha256,
        prompt_tokens_preflight: entry.prompt_tokens_preflight ?? null,
        raw_response_sha256: entry.raw_response_sha256 ?? null,
        http_status: entry.http_status ?? null, finish_reason: entry.finish_reason ?? null,
        structural_outcome: entry.structural_outcome ?? 'aborted',
        parsed_candidate: entry.parsed_candidate ?? null,
        usage: entry.usage ?? null, chat_elapsed_ms: entry.chat_elapsed_ms ?? null });
      await journal.write(`${JSON.stringify(entry)}\n`);
      await journal.sync();
      await save();
      console.log(`${item.case_id} seed=${item.seed}: ${entry.structural_outcome}`);
    }
  }
  assert.equal(report.requests.length, limits.chats);
  report.status = report.requests.every(row => row.structural_outcome === 'outer_json_valid_unreviewed')
    ? 'complete_outer_json_unreviewed' : 'complete_with_structural_failures_unreviewed';
} catch (error) {
  report.status = 'failed';
  report.failures.push({ at: new Date().toISOString(), message: String(error) });
  process.exitCode = 1;
} finally {
  report.resources = sampler ? await sampler.stop() : null;
  await stopProcess(server);
  if (server) {
    await fs.writeFile(path.join(workspace, 'server.stdout.log'), server.stdout);
    await fs.writeFile(path.join(workspace, 'server.stderr.log'), server.stderr);
  }
  report.finished_at = new Date().toISOString();
  report.wall_elapsed_ms = Math.round(performance.now() - started);
  await save();
  await journal.close();
  console.log(`REG-052 cross-model ${report.status}: ${workspace}`);
}
