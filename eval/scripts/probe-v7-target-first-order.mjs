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
  baseline: '.cache/eval/v7-authored-batch-v1/attempt-WUmq4Q/report.json',
  fixture: 'eval/corpora/v7-target-first-controls-v1.json',
  manifest: 'models/manifests/hy_mt2_1_8b_q4_k_m.context_v7_batch4.experimental.json',
};
const expected = {
  baseline: 'ad6b8505f89b6386a0fca47adcd4570988cb66536aac1f5cefb5853e0f91cebb',
  baseline_request: '457fa9c51d43fd1c848c9b2e2c135e65890d8ab245499bde79497ee193307e33',
  fixture: '9fbd7075ea490c13e674677d483a7ad68bd0d9abb90d9adccc936f621ae9e7a9',
  manifest: '84695e78c6f41abbc0a337e4fa3c0a2df3d7a045d38505fdee8abcf1f6641620',
  model: 'dc5f44fcf1fa496ee7ad725982c0c8c553a4de00259b53af84c4b89fb0c06699',
  runtime: '6f15be27bd80b6b4d52afefa49094e18fcfab55d5da354d717971f2d2537b2f4',
};
const limits = { chats: 12, preflights: 24, per_chat_ms: 90000,
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
const fixture = JSON.parse(await fs.readFile(path.join(root, files.fixture), 'utf8'));
assert.equal(fixture.schema_version, 1);
assert.equal(fixture.split, 'authored_development_not_holdout');
assert.deepEqual(fixture.cases.map(row => row.id),
  ['known_money_leak', 'unseen_nonmoney_neighbor', 'return_vs_borrow_scene']);
const manifest = JSON.parse(await fs.readFile(path.join(root, files.manifest), 'utf8'));
assert.equal(manifest.prompt_version, 7);
assert.equal(manifest.model_file_sha256, expected.model);
const baseline = JSON.parse(await fs.readFile(path.join(root, files.baseline), 'utf8'));
const originalRow = baseline.arms[0].requests.find(row => row.request_kind === 'chat_completion');
assert.equal(originalRow.request_sha256, expected.baseline_request);
assert.equal(digest(Buffer.from(originalRow.rendered_request)), expected.baseline_request);
const original = JSON.parse(originalRow.rendered_request);
assert.equal(original.model, manifest.model_alias);
assert.equal(original.max_tokens, limits.response_tokens);
const marker = 'Input JSON:\n';
assert.equal(original.messages.length, 1);
assert.equal(original.messages[0].content.split(marker).length, 2);
const [prefix, inputJson] = original.messages[0].content.split(marker);
const baselineEnvelope = JSON.parse(inputJson);
assert.deepEqual(Object.keys(baselineEnvelope),
  ['schema_version', 'source_context', 'target_slots']);
assert.equal(baselineEnvelope.source_context.length, 1);
assert.equal(baselineEnvelope.target_slots.length, 1);
assert.equal(baselineEnvelope.target_slots[0].source_original,
  fixture.cases[0].target_source);
assert.equal(baselineEnvelope.source_context[0].source_original,
  fixture.cases[0].context_source);
assert(!/\p{Script=Cyrillic}/u.test(original.messages[0].content));
const orders = ['baseline', 'target_first'];
const seeds = [101, 202];
const planned = fixture.cases.flatMap(testCase => seeds.flatMap(seed =>
  (seed === 101 ? orders : [...orders].reverse()).map(order => {
    const envelope = structuredClone(baselineEnvelope);
    envelope.target_slots[0].source_original = testCase.target_source;
    envelope.target_slots[0].source_for_translation = testCase.target_source;
    envelope.source_context[0].source_original = testCase.context_source;
    const ordered = order === 'target_first' ? {
      schema_version: envelope.schema_version,
      target_slots: envelope.target_slots,
      source_context: envelope.source_context,
    } : envelope;
    assert.deepEqual(Object.keys(ordered), order === 'target_first'
      ? ['schema_version', 'target_slots', 'source_context']
      : ['schema_version', 'source_context', 'target_slots']);
    const request = structuredClone(original);
    request.messages[0].content = `${prefix}${marker}${JSON.stringify(ordered)}`;
    if (testCase.id === 'known_money_leak' && order === 'baseline')
      assert.equal(request.messages[0].content, original.messages[0].content);
    assert(!/\p{Script=Cyrillic}/u.test(request.messages[0].content));
    request.seed = seed;
    return { case_id: testCase.id, seed, order, request,
      request_sha256: digest(Buffer.from(JSON.stringify(request))),
      prompt_sha256: digest(Buffer.from(request.messages[0].content)) };
  })));
assert.equal(planned.length, limits.chats);
for (const testCase of fixture.cases) for (const seed of seeds) {
  const pair = planned.filter(row => row.case_id === testCase.id && row.seed === seed);
  assert.equal(pair.length, 2);
  const [left, right] = pair.map(row => structuredClone(row.request));
  const leftEnvelope = JSON.parse(left.messages[0].content.split(marker)[1]);
  const rightEnvelope = JSON.parse(right.messages[0].content.split(marker)[1]);
  assert.deepEqual(leftEnvelope, rightEnvelope);
  assert.deepEqual({ ...left, messages: [] }, { ...right, messages: [] });
  assert.equal(left.messages[0].content.split(marker)[0],
    right.messages[0].content.split(marker)[0]);
}
if (preflight) {
  console.log(JSON.stringify({ status: 'verified', expected, limits,
    planned: planned.map(({ case_id, seed, order, request_sha256, prompt_sha256 }) =>
      ({ case_id, seed, order, request_sha256, prompt_sha256 })) }));
  process.exit(0);
}

const parent = path.join(root, '.cache/eval/v7-target-first-order-v1');
await fs.mkdir(parent, { recursive: true });
const workspace = await fs.mkdtemp(path.join(parent, 'attempt-'));
const started = performance.now();
const report = { schema_version: 1, experiment: 'v7-target-first-order-v1',
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
    const entry = { case_id: item.case_id, seed: item.seed, order: item.order,
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
      if (chat.http_status !== 200) throw new Error(`Chat HTTP ${chat.http_status}`);
    } catch (error) {
      entry.error = String(error);
      entry.structural_outcome = 'request_or_preflight_failure';
      throw error;
    } finally {
      report.requests.push({ case_id: item.case_id, seed: item.seed, order: item.order,
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
      console.log(`${item.case_id} seed=${item.seed} order=${item.order}: ${entry.structural_outcome}`);
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
  console.log(`v7 target-first order ${report.status}: ${workspace}`);
}
