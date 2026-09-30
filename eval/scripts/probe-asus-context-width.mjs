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

const preflightOnly = process.argv.length === 3 && process.argv[2] === '--preflight';
assert(process.argv.length === 2 || preflightOnly, 'Only --preflight is supported');
assert.equal(process.platform, 'win32');
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const archivePath = path.join(root, '.cache/eval/commons-asus-full-v6-slot-v1/run-7XjHrR/report.json');
const packetPath = path.join(root, '.cache/eval/commons-asus-full-v6-slot-v1/run-7XjHrR/review-packet.json');
const sourcePath = path.join(root, '.cache/eval/commons-asus-rog-ally-892592485/source.zh.srt');
const runtimePath = process.env.AURALIS_TEST_LLAMA_SERVER;
const hashes = {
  archive: '1d8addf0860cb88f0161ac6eeed3fc45351ab9912aaf0eff2b39a76772a26413',
  packet: 'da15e4cf479513ba1a41fc5e86f7802e6531e7c51c5a855e30f675d533485a6a',
  source: '923aed3991c2308d92b89c45181cea8ec7ece74e9b4d3a3ce0234d95e329913b',
  runtime: '6f15be27bd80b6b4d52afefa49094e18fcfab55d5da354d717971f2d2537b2f4',
  prompt_template: '137efcbd09400d7ad2ab6c257077f96e09d7ff0c2eac2a35c067cdcbd7ef6a18',
};
const models = [
  { key: '1b', file: process.env.AURALIS_TEST_GGUF_1B,
    sha256: 'dc5f44fcf1fa496ee7ad725982c0c8c553a4de00259b53af84c4b89fb0c06699',
    expected_profile_sha256: 'b30546f228ba230364ba79edae55456d62e7d7c5010e56fef38464c3531089c5',
    profile: 'models/manifests/hy_mt2_1_8b_q4_k_m.context_v6_slot.experimental.json' },
  { key: '7b', file: process.env.AURALIS_TEST_GGUF_7B,
    sha256: '9f96256500f3fc1ab4d64336b58f52a949a95ad7516b0c229476eef782f9f77b',
    expected_profile_sha256: 'e7e2d7745cb283a88984da202eb511f0144b2bc51bc6eb01727515a51e7aa06f',
    profile: 'models/manifests/hy_mt2_7b_q4_k_m.context_v6_slot.experimental.json' },
];
const focusIds = [2, 3, 12, 20, 91, 133, 142, 226, 227, 242, 267];
const seeds = [101, 202];
const widths = [1, 3];
const limits = { chats: 88, preflights: 176, total_http: 264, servers: 2,
  per_chat_ms: 120_000, per_preflight_ms: 15_000, readiness_ms: 180_000,
  wall_ms: 900_000, context_tokens: 2048, response_tokens: 256,
  safety_tokens: 64, retries: 0 };
const digest = bytes => createHash('sha256').update(bytes).digest('hex');
const hashFile = async file => {
  const hash = createHash('sha256');
  for await (const chunk of createReadStream(file)) hash.update(chunk);
  return hash.digest('hex');
};
const readPinned = async (file, expected) => {
  const bytes = await fs.readFile(file);
  assert.equal(digest(bytes), expected, file);
  return bytes;
};
assert(runtimePath && path.isAbsolute(runtimePath));
assert.equal(await hashFile(runtimePath), hashes.runtime);
assert.equal(await hashFile(sourcePath), hashes.source);
for (const model of models) {
  assert(model.file && path.isAbsolute(model.file));
  assert.equal(await hashFile(model.file), model.sha256);
  const bytes = await fs.readFile(path.join(root, model.profile));
  model.profile_sha256 = digest(bytes);
  assert.equal(model.profile_sha256, model.expected_profile_sha256);
  model.settings = JSON.parse(bytes);
  assert.equal(model.settings.model_file_sha256, model.sha256);
  assert.equal(model.settings.prompt_version, 6);
  assert.equal(model.settings.prompt_template_sha256, hashes.prompt_template);
  assert.equal(model.settings.target_segments_per_block, 1);
  assert.equal(model.settings.context_before_segments, 1);
  assert.equal(model.settings.context_after_segments, 1);
  assert.equal(model.settings.max_tokens_per_line, limits.response_tokens);
  assert.equal(model.settings.token_safety_margin_tokens, limits.safety_tokens);
}
for (const key of ['temperature', 'top_p', 'top_k', 'repeat_penalty',
  'max_tokens_per_line', 'token_safety_margin_tokens'])
  assert.equal(models[0].settings[key], models[1].settings[key], key);
const archive = JSON.parse(await readPinned(archivePath, hashes.archive));
const packet = JSON.parse(await readPinned(packetPath, hashes.packet));
assert.equal(archive.source_sha256, hashes.source);
assert.equal(packet.sample_count, 44);
const chats = archive.requests.filter(row => row.path === '/v1/chat/completions');
assert.equal(chats.length, 268);
const marker = 'Input JSON:\n';
const envelopes = chats.map((row, index) => {
  assert.equal(row.request_sha256, digest(Buffer.from(JSON.stringify(row.request))));
  const content = row.request.messages?.[0]?.content;
  assert.equal(typeof content, 'string');
  assert.equal(content.split(marker).length, 2);
  const envelope = JSON.parse(content.split(marker)[1]);
  assert.equal(envelope.target_slots.length, 1);
  assert.equal(envelope.target_slots[0].segment_id, index + 1);
  assert.equal(envelope.target_slots[0].line_index, 0);
  assert.equal(envelope.approved_terms.length, 0);
  return envelope;
});
const sourceBlocks = (await fs.readFile(sourcePath, 'utf8')).trimEnd().split(/\r?\n\r?\n/u);
assert.equal(sourceBlocks.length, envelopes.length);
for (const [index, block] of sourceBlocks.entries()) {
  const lines = block.split(/\r?\n/u);
  assert.equal(lines.length, 3);
  assert.equal(Number(lines[0]), index + 1);
  assert.equal(lines[2], envelopes[index].target_slots[0].source_original);
}
const sourceContext = (id, width) => {
  const ids = [];
  for (let neighbor = Math.max(1, id - width); neighbor <= Math.min(268, id + width); neighbor++)
    if (neighbor !== id) ids.push(neighbor);
  return ids.map(neighbor => {
    const slot = envelopes[neighbor - 1].target_slots[0];
    return { segment_id: neighbor, start_ms: slot.start_ms, end_ms: slot.end_ms,
      lines: [slot.source_original], relative_position: neighbor < id ? 'before' : 'after' };
  });
};
const cases = focusIds.flatMap(id => {
  const original = chats[id - 1].request;
  const packetRow = packet.rows.find(row => row.id === id);
  assert(packetRow);
  assert.equal(packetRow.request_sha256, chats[id - 1].request_sha256);
  assert.equal(packetRow.source_text, envelopes[id - 1].target_slots[0].source_original);
  assert.deepEqual(envelopes[id - 1].source_context, sourceContext(id, 1));
  assert.equal(original.response_format.schema.properties.translations.items.properties.segment_id.const, id);
  return widths.map(width => {
    const request = structuredClone(original);
    const envelope = structuredClone(envelopes[id - 1]);
    envelope.source_context = sourceContext(id, width);
    const [prefix] = original.messages[0].content.split(marker);
    request.messages[0].content = `${prefix}${marker}${JSON.stringify(envelope)}`;
    if (width === 1) assert.equal(request.messages[0].content, original.messages[0].content);
    assert.doesNotMatch(request.messages[0].content, /\p{Script=Cyrillic}/u);
    return { id, width, request, source_zh: packetRow.source_text,
      original_request_sha256: chats[id - 1].request_sha256 };
  });
});
assert.equal(cases.length, 22);
const planned = models.flatMap(model => seeds.flatMap(seed => cases.map(item => {
  const request = structuredClone(item.request);
  request.model = model.settings.model_alias;
  request.seed = seed;
  const body = Buffer.from(JSON.stringify(request));
  return { model: model.key, seed, cue_id: item.id, width: item.width,
    source_zh: item.source_zh, original_request_sha256: item.original_request_sha256,
    prompt_sha256: digest(Buffer.from(request.messages[0].content)),
    request_sha256: digest(body), request, body };
})));
assert.equal(planned.length, limits.chats);
for (const model of models) for (const seed of seeds) for (const id of focusIds) {
  const pair = planned.filter(row => row.model === model.key && row.seed === seed && row.cue_id === id);
  assert.equal(pair.length, 2);
  const [narrow, wide] = pair.map(row => structuredClone(row.request));
  const narrowEnvelope = JSON.parse(narrow.messages[0].content.split(marker)[1]);
  const wideEnvelope = JSON.parse(wide.messages[0].content.split(marker)[1]);
  assert.deepEqual({ ...narrowEnvelope, source_context: [] },
    { ...wideEnvelope, source_context: [] }, 'Width pair differs beyond source context');
  assert.deepEqual({ ...narrow, messages: [] }, { ...wide, messages: [] });
}
for (const seed of seeds) for (const id of focusIds) for (const width of widths) {
  const pair = planned.filter(row => row.seed === seed && row.cue_id === id && row.width === width);
  assert.equal(pair.length, 2);
  const [first, second] = pair.map(row => structuredClone(row.request));
  second.model = first.model;
  assert.deepEqual(second, first, 'Model pair differs beyond alias');
}
for (const model of models) for (const id of focusIds) for (const width of widths) {
  const pair = planned.filter(row => row.model === model.key && row.cue_id === id && row.width === width);
  assert.equal(pair.length, 2);
  const [first, second] = pair.map(row => structuredClone(row.request));
  second.seed = first.seed;
  assert.deepEqual(second, first, 'Seed pair differs beyond seed');
}
if (preflightOnly) {
  console.log(`ASUS context-width preflight: ${focusIds.length} source cues, ${planned.length} pinned requests, one source-context factor; zero inference.`);
  process.exit(0);
}

const parent = path.join(root, '.cache/eval/asus-context-width-paired-v1');
await fs.mkdir(parent, { recursive: true });
const workspace = await fs.mkdtemp(path.join(parent, 'run-'));
console.log(`Private context-width screen: ${workspace}`);
const started = performance.now();
const report = { schema_version: 1, id: 'asus-context-width-paired-v1',
  status: 'running', started_at: new Date().toISOString(),
  git_head: null, git_status: null,
  harness_sha256: await hashFile(fileURLToPath(import.meta.url)),
  identity: { ...hashes, os: `${os.type()} ${os.release()} ${os.arch()}`,
    cpu: os.cpus()[0].model, total_ram_bytes: os.totalmem(),
    models: models.map(model => ({ key: model.key, revision: model.settings.model_revision,
      model_sha256: model.sha256, profile_sha256: model.profile_sha256 })) },
  limits, focus_ids: focusIds, seeds, widths, human_review_count: 0,
  planned_requests: planned.map(({ model, seed, cue_id, width, original_request_sha256,
    prompt_sha256, request_sha256 }) => ({ model, seed, cue_id, width,
    original_request_sha256, prompt_sha256, request_sha256 })),
  requests: [], failures: [], resources: {} };
const save = async () => fs.writeFile(path.join(workspace, 'report.json'),
  `${JSON.stringify(report, null, 2)}\n`);
const journal = await fs.open(path.join(workspace, 'requests.jsonl'), 'wx');
const remaining = () => {
  const ms = limits.wall_ms - (performance.now() - started);
  assert(ms > 0, 'Declared context-width wall budget exhausted');
  return ms;
};
const post = async (url, endpoint, body, timeoutMs) => {
  const began = performance.now();
  const response = await fetch(`${url}${endpoint}`, { method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body), signal: AbortSignal.timeout(Math.min(timeoutMs, remaining())) });
  const raw = Buffer.from(await response.arrayBuffer());
  return { path: `/${endpoint}`, request: body, request_sha256: digest(Buffer.from(JSON.stringify(body))),
    raw_response: raw.toString('utf8'), raw_response_sha256: digest(raw),
    http_status: response.status, elapsed_ms: Math.round(performance.now() - began) };
};
let server;
try {
  await save();
  report.git_head = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root,
    encoding: 'utf8' }).trim();
  report.git_status = execFileSync('git', ['status', '--short'], { cwd: root,
    encoding: 'utf8' }).trim();
  await save();
  for (const model of models) {
    const port = await freeLoopbackPort();
    const url = `http://127.0.0.1:${port}/`;
    const args = ['--model', model.file, '--alias', model.settings.model_alias,
      '--host', '127.0.0.1', '--port', String(port), '-c', '2048', '-ngl', '99',
      '--parallel', '1', '--jinja', '--cache-ram', '0'];
    const runtimeEnv = { ...process.env, PATH: `${path.dirname(runtimePath)};${path.join(root,
      '.cache/runtime/cudart')};${process.env.PATH}` };
    server = startProcess(runtimePath, args, root, runtimeEnv,
      { maxCaptureCharacters: 4 * 1024 * 1024 });
    await waitForHealthyServer(url, server, Math.min(limits.readiness_ms, remaining()));
    const sampler = runtimeSampler(path.join(workspace, `${model.key}-resources.jsonl`),
      root, () => [server.child.pid]);
    try {
      for (const item of planned.filter(row => row.model === model.key)) {
        assert(report.requests.length < limits.chats);
        const entry = { model: item.model, seed: item.seed, cue_id: item.cue_id,
          width: item.width, source_zh: item.source_zh,
          original_request_sha256: item.original_request_sha256,
          prompt_sha256: item.prompt_sha256, request_sha256: item.request_sha256,
          request: item.request, started_at: new Date().toISOString(),
          preflight: [] };
        try {
          const template = await post(url, 'apply-template', {
            model: item.request.model, messages: item.request.messages,
            response_format: item.request.response_format }, limits.per_preflight_ms);
          entry.preflight.push(template);
          assert.equal(template.http_status, 200);
          const rendered = JSON.parse(template.raw_response).prompt;
          assert.equal(typeof rendered, 'string');
          assert(rendered.length > 0);
          const tokenized = await post(url, 'tokenize',
            { content: rendered, add_special: false, parse_special: true },
            limits.per_preflight_ms);
          entry.preflight.push(tokenized);
          assert.equal(tokenized.http_status, 200);
          const tokens = JSON.parse(tokenized.raw_response).tokens;
          assert(Array.isArray(tokens) && tokens.length > 0);
          assert(tokens.every(token => Number.isInteger(token) && token >= 0));
          entry.prompt_tokens_preflight = tokens.length;
          assert(tokens.length <= limits.context_tokens - limits.response_tokens - limits.safety_tokens,
            'Rendered prompt exceeds declared model budget');
          const began = performance.now();
          const response = await fetch(`${url}v1/chat/completions`, { method: 'POST',
            headers: { 'content-type': 'application/json' }, body: item.body,
            signal: AbortSignal.timeout(Math.min(limits.per_chat_ms, remaining())) });
          const raw = Buffer.from(await response.arrayBuffer());
          entry.chat_elapsed_ms = Math.round(performance.now() - began);
          entry.http_status = response.status;
          entry.raw_response = raw.toString('utf8');
          entry.raw_response_sha256 = digest(raw);
          const parsed = JSON.parse(entry.raw_response);
          entry.finish_reason = parsed.choices?.[0]?.finish_reason ?? null;
          entry.raw_candidate = parsed.choices?.[0]?.message?.content ?? null;
          entry.usage = parsed.usage ?? null;
          entry.timings = parsed.timings ?? null;
          assert.equal(entry.usage?.prompt_tokens, tokens.length,
            'Server prompt usage differs from tokenizer preflight');
          if (response.ok && entry.finish_reason === 'stop'
              && typeof entry.raw_candidate === 'string') {
            try {
              const rows = JSON.parse(entry.raw_candidate).translations;
              assert.equal(rows?.length, 1);
              assert.equal(rows[0].segment_id, item.cue_id);
              assert.equal(rows[0].line_index, 0);
              assert(typeof rows[0].text === 'string' && rows[0].text.trim());
              assert(!/[\p{Cc}\p{Cf}]/u.test(rows[0].text));
              entry.parsed_candidate = rows[0].text;
              entry.structural_outcome = 'outer_json_valid_unreviewed';
            } catch (error) { entry.structural_outcome = `invalid: ${error.message}`; }
          } else entry.structural_outcome = 'incomplete_or_http_failure';
        } catch (error) {
          entry.error = String(error);
          entry.structural_outcome = 'request_or_preflight_failure';
          throw error;
        } finally {
          report.requests.push({ model: item.model, seed: item.seed,
            cue_id: item.cue_id, width: item.width, request_sha256: item.request_sha256,
            prompt_sha256: item.prompt_sha256,
            prompt_tokens_preflight: entry.prompt_tokens_preflight ?? null,
            raw_response_sha256: entry.raw_response_sha256 ?? null,
            http_status: entry.http_status ?? null,
            finish_reason: entry.finish_reason ?? null,
            structural_outcome: entry.structural_outcome ?? 'aborted',
            parsed_candidate: entry.parsed_candidate ?? null,
            usage: entry.usage ?? null, chat_elapsed_ms: entry.chat_elapsed_ms ?? null });
          await journal.write(`${JSON.stringify(entry)}\n`);
          await journal.sync();
          await save();
          console.log(`${model.key} seed=${item.seed} cue=${item.cue_id} width=${item.width}: ${entry.structural_outcome}`);
        }
      }
    } finally {
      report.resources[model.key] = await sampler.stop();
      await stopProcess(server);
      await fs.writeFile(path.join(workspace, `${model.key}-server.log`),
        `${server.stdout}\n${server.stderr}\n`);
      server = null;
      await save();
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
  if (server) await stopProcess(server);
  report.finished_at = new Date().toISOString();
  report.wall_elapsed_ms = Math.round(performance.now() - started);
  await save();
  await journal.close();
  await fs.writeFile(path.join(parent, 'latest.txt'), workspace);
}
