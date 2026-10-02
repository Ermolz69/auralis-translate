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
const baselinePath = path.join(root, '.cache/eval/v7-authored-batch-v1/attempt-WUmq4Q/report.json');
const sourcePath = path.join(root, 'eval/corpora/v7-batch-development-v1.zh.srt');
const manifestPath = path.join(root, 'models/manifests/hy_mt2_1_8b_q4_k_m.context_v7_batch4.experimental.json');
const expected = {
  baseline: 'ad6b8505f89b6386a0fca47adcd4570988cb66536aac1f5cefb5853e0f91cebb',
  request: '457fa9c51d43fd1c848c9b2e2c135e65890d8ab245499bde79497ee193307e33',
  source: 'ad88b2d2f96b153d5d8880175b321167263d7abaae48ca693d89b925459bc8a7',
  manifest: '84695e78c6f41abbc0a337e4fa3c0a2df3d7a045d38505fdee8abcf1f6641620',
  model: 'dc5f44fcf1fa496ee7ad725982c0c8c553a4de00259b53af84c4b89fb0c06699',
  runtime: '6f15be27bd80b6b4d52afefa49094e18fcfab55d5da354d717971f2d2537b2f4',
};
const limits = { chats: 4, preflights: 8, per_chat_ms: 90000,
  per_preflight_ms: 15000, readiness_ms: 120000, wall_ms: 600000,
  context_tokens: 2048, response_tokens: 256, safety_tokens: 64, retries: 0 };
const digest = data => createHash('sha256').update(data).digest('hex');
const hashFile = async file => {
  const hash = createHash('sha256');
  for await (const chunk of createReadStream(file)) hash.update(chunk);
  return hash.digest('hex');
};
for (const [key, file] of Object.entries({ baseline: baselinePath, source: sourcePath,
  manifest: manifestPath, model: modelPath, runtime: runtimePath }))
  assert.equal(await hashFile(file), expected[key], key);
const manifest = JSON.parse(await fs.readFile(manifestPath, 'utf8'));
assert.equal(manifest.model_file_sha256, expected.model);
assert.equal(manifest.prompt_version, 7);
const baseline = JSON.parse(await fs.readFile(baselinePath, 'utf8'));
const old = baseline.arms[0].requests.find(row => row.request_kind === 'chat_completion');
assert.equal(old.request_sha256, expected.request);
assert.equal(old.outcome, 'invalid_candidate');
const original = JSON.parse(old.rendered_request);
assert.equal(digest(Buffer.from(old.rendered_request)), expected.request);
assert.equal(original.model, manifest.model_alias);
assert.equal(original.max_tokens, limits.response_tokens);
assert.equal(original.messages.length, 1);
const marker = 'Input JSON:\n';
assert.equal(original.messages[0].content.split(marker).length, 2);
const [prefix, envelopeText] = original.messages[0].content.split(marker);
const sourceEnvelope = JSON.parse(envelopeText);
assert.equal(sourceEnvelope.source_context.length, 1);
assert.equal(sourceEnvelope.source_context[0].segment_id, 2);
assert.equal(sourceEnvelope.target_slots.length, 1);
assert.equal(sourceEnvelope.target_slots[0].segment_id, 1);
assert.equal(sourceEnvelope.target_slots[0].source_original, '王经理说，明天不是星期五。');
assert(!/\p{Script=Cyrillic}/u.test(original.messages[0].content));
const planned = [
  { seed: 101, context: true }, { seed: 101, context: false },
  { seed: 202, context: false }, { seed: 202, context: true },
].map(({ seed, context }) => {
  const request = structuredClone(original);
  const envelope = structuredClone(sourceEnvelope);
  if (!context) envelope.source_context = [];
  request.messages[0].content = `${prefix}${marker}${JSON.stringify(envelope)}`;
  if (context) assert.equal(request.messages[0].content, original.messages[0].content);
  request.seed = seed;
  return { seed, context, request, request_sha256: digest(Buffer.from(JSON.stringify(request))),
    prompt_sha256: digest(Buffer.from(request.messages[0].content)) };
});
for (const seed of [101, 202]) {
  const pair = planned.filter(row => row.seed === seed);
  assert.equal(pair.length, 2);
  const [first, second] = pair.map(row => structuredClone(row.request));
  const firstEnvelope = JSON.parse(first.messages[0].content.split(marker)[1]);
  const secondEnvelope = JSON.parse(second.messages[0].content.split(marker)[1]);
  assert.deepEqual({ ...firstEnvelope, source_context: [] },
    { ...secondEnvelope, source_context: [] });
  assert.deepEqual({ ...first, messages: [] }, { ...second, messages: [] });
}
if (preflight) {
  console.log(JSON.stringify({ status: 'verified', expected, limits,
    planned: planned.map(({ seed, context, request_sha256, prompt_sha256 }) =>
      ({ seed, context, request_sha256, prompt_sha256 })) }));
  process.exit(0);
}

const parent = path.join(root, '.cache/eval/v7-context-salience-v1');
await fs.mkdir(parent, { recursive: true });
const workspace = await fs.mkdtemp(path.join(parent, 'attempt-'));
const started = performance.now();
const report = { schema_version: 1, experiment: 'v7-context-salience-v1',
  started_at: new Date().toISOString(), status: 'running', expected, limits,
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
    const entry = { seed: item.seed, context: item.context,
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
          assert.equal(rows[0].segment_id, 1);
          assert.equal(rows[0].line_index, 0);
          assert(typeof rows[0].text === 'string' && rows[0].text.trim());
          entry.parsed_candidate = rows[0].text;
          entry.structural_outcome = 'outer_json_valid_unreviewed';
        } catch (error) { entry.structural_outcome = `invalid: ${error.message}`; }
      } else entry.structural_outcome = 'incomplete_or_http_failure';
    } catch (error) {
      entry.error = String(error);
      entry.structural_outcome = 'request_or_preflight_failure';
      throw error;
    } finally {
      report.requests.push({ seed: item.seed, context: item.context,
        request_sha256: item.request_sha256, prompt_sha256: item.prompt_sha256,
        prompt_tokens_preflight: entry.prompt_tokens_preflight ?? null,
        raw_response_sha256: entry.raw_response_sha256 ?? null,
        http_status: entry.http_status ?? null, finish_reason: entry.finish_reason ?? null,
        structural_outcome: entry.structural_outcome ?? 'aborted',
        parsed_candidate: entry.parsed_candidate ?? null, usage: entry.usage ?? null,
        chat_elapsed_ms: entry.chat_elapsed_ms ?? null });
      await journal.write(`${JSON.stringify(entry)}\n`);
      await journal.sync();
      await save();
      console.log(`seed=${item.seed} context=${item.context}: ${entry.structural_outcome}`);
    }
  }
  assert.equal(report.requests.length, limits.chats);
  report.status = report.requests.every(row => row.structural_outcome === 'outer_json_valid_unreviewed')
    ? 'complete_outer_json_unreviewed' : 'complete_with_failures_unreviewed';
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
  console.log(`v7 context salience ${report.status}: ${workspace}`);
}
