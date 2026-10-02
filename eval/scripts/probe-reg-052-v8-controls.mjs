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
const files = {
  prior: '.cache/eval/v8-authored-batch-v1/attempt-GdrV2t/report.json',
  pack: 'eval/regressions/v8-name-question-controls-v1.json',
  manifest: 'models/manifests/hy_mt2_1_8b_q4_k_m.context_v8_target_first_batch4.experimental.json',
};
const expected = {
  prior: 'ecdf4d7e02190a5b81e8fd06c0477c7bb5219076ad2138a91dbd9d15f912ee52',
  prior_request: '3ab71e9b2f09786dfcb7d7c38470b4aa1a81ce964ba56334a8f5b1ff8e4fed91',
  pack: '23ecdaeb253d281e7651d5b76acdf10fd672793b428fd13262d38672a2ac82ed',
  manifest: '1803aeb68428e1b138a17ed72b01abe1cc5fbc5845b5bca66a402b8936b1081f',
  model: 'dc5f44fcf1fa496ee7ad725982c0c8c553a4de00259b53af84c4b89fb0c06699',
  runtime: '6f15be27bd80b6b4d52afefa49094e18fcfab55d5da354d717971f2d2537b2f4',
};
const limits = { chats: 24, preflights: 48, per_chat_ms: 90000,
  per_preflight_ms: 15000, readiness_ms: 120000, wall_ms: 600000,
  context_tokens: 2048, response_tokens: 256, safety_tokens: 64, retries: 0 };
const digest = bytes => createHash('sha256').update(bytes).digest('hex');
const hashFile = async file => {
  const hash = createHash('sha256');
  for await (const chunk of createReadStream(file)) hash.update(chunk);
  return hash.digest('hex');
};
for (const [key, relative] of Object.entries(files))
  assert.equal(await hashFile(path.join(root, relative)), expected[key], key);
assert.equal(await hashFile(modelPath), expected.model);
assert.equal(await hashFile(runtimePath), expected.runtime);
const pack = JSON.parse(await fs.readFile(path.join(root, files.pack), 'utf8'));
assert.equal(pack.id, 'REG-052');
const cases = [...pack.related_controls, ...pack.negative_controls];
assert.equal(cases.length, 6);
assert(cases.every(row => row.model_runs === 0));
const manifest = JSON.parse(await fs.readFile(path.join(root, files.manifest), 'utf8'));
assert.equal(manifest.prompt_version, 8);
assert.equal(manifest.model_file_sha256, expected.model);
const prior = JSON.parse(await fs.readFile(path.join(root, files.prior), 'utf8'));
const priorRow = prior.arms.find(arm => arm.size === 1).requests
  .filter(row => row.request_kind === 'chat_completion')[2];
assert.equal(priorRow.request_sha256, expected.prior_request);
assert.equal(digest(Buffer.from(priorRow.rendered_request)), expected.prior_request);
const original = JSON.parse(priorRow.rendered_request);
assert.equal(original.model, manifest.model_alias);
assert.equal(original.max_tokens, limits.response_tokens);
const marker = 'Input JSON:\n';
const [instruction, input] = original.messages[0].content.split(marker);
assert(instruction && input);
const envelope = JSON.parse(input);
assert.deepEqual(Object.keys(envelope), ['schema_version', 'target_slots', 'source_context']);
assert.equal(envelope.target_slots.length, 1);
assert.equal(envelope.target_slots[0].source_original, pack.minimal_reproducer.source);
assert.equal(envelope.source_context.length, 2);
const seeds = [101, 202];
const planned = cases.flatMap(row => seeds.flatMap(seed =>
  (seed === 101 ? ['on', 'off'] : ['off', 'on']).map(context => {
    const changed = structuredClone(envelope);
    changed.target_slots[0].source_original = row.source;
    changed.target_slots[0].source_for_translation = row.source;
    if (context === 'off') changed.source_context = [];
    const request = structuredClone(original);
    request.messages[0].content = `${instruction}${marker}${JSON.stringify(changed)}`;
    request.seed = seed;
    assert(!request.messages[0].content.includes(row.expected_meaning));
    assert.deepEqual(Object.keys(changed), ['schema_version', 'target_slots', 'source_context']);
    return { case_id: row.id, seed, context, request,
      request_sha256: digest(Buffer.from(JSON.stringify(request))),
      prompt_sha256: digest(Buffer.from(request.messages[0].content)) };
  })));
assert.equal(planned.length, limits.chats);
for (const row of cases) for (const seed of seeds) {
  const pair = planned.filter(item => item.case_id === row.id && item.seed === seed);
  assert.equal(pair.length, 2);
  const inputs = pair.map(item => JSON.parse(item.request.messages[0].content.split(marker)[1]));
  assert.deepEqual(inputs[0].target_slots, inputs[1].target_slots);
  assert.deepEqual({ ...pair[0].request, messages: [] }, { ...pair[1].request, messages: [] });
  assert.deepEqual(pair.find(item => item.context === 'on').request.messages[0].content,
    `${instruction}${marker}${JSON.stringify({ ...envelope,
      target_slots: inputs[0].target_slots })}`);
}
if (preflight) {
  console.log(JSON.stringify({ status: 'verified', expected, limits,
    planned: planned.map(({ case_id, seed, context, request_sha256, prompt_sha256 }) =>
      ({ case_id, seed, context, request_sha256, prompt_sha256 })) }));
  process.exit(0);
}

const parent = path.join(root, '.cache/eval/reg-052-v8-controls-v1');
await fs.mkdir(parent, { recursive: true });
const workspace = await fs.mkdtemp(path.join(parent, 'attempt-'));
const started = performance.now();
const report = { schema_version: 1, experiment: 'reg-052-v8-controls-v1',
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
    const entry = { case_id: item.case_id, seed: item.seed, context: item.context,
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
      report.requests.push({ case_id: item.case_id, seed: item.seed, context: item.context,
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
      console.log(`${item.case_id} seed=${item.seed} context=${item.context}: ${entry.structural_outcome}`);
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
  console.log(`REG-052 v8 controls ${report.status}: ${workspace}`);
}
