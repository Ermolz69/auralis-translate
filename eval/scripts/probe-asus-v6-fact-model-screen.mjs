import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { createReadStream } from 'node:fs';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { performance } from 'node:perf_hooks';
import { fileURLToPath } from 'node:url';
import { freeLoopbackPort, startProcess, stopProcess, waitForHealthyServer } from './local-process.mjs';
import { runtimeSampler } from './runtime-sampler.mjs';

const preflight = process.argv.length === 3 && process.argv[2] === '--preflight';
const startupCheck = process.argv.length === 3
  && process.argv[2] === '--simulate-startup-failure';
assert(process.argv.length === 2 || preflight || startupCheck,
  'Only --preflight or --simulate-startup-failure is supported');
assert.equal(process.platform, 'win32');
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const archivedPath = path.join(root,
  '.cache/eval/commons-asus-full-v6-slot-v1/run-7XjHrR/report.json');
const packetPath = path.join(root,
  '.cache/eval/commons-asus-full-v6-slot-v1/run-7XjHrR/review-packet.json');
const sourcePath = path.join(root, '.cache/eval/commons-asus-rog-ally-892592485/source.zh.srt');
const runtimePath = process.env.AURALIS_TEST_LLAMA_SERVER;
const identities = {
  archive: '1d8addf0860cb88f0161ac6eeed3fc45351ab9912aaf0eff2b39a76772a26413',
  packet: 'da15e4cf479513ba1a41fc5e86f7802e6531e7c51c5a855e30f675d533485a6a',
  source: '923aed3991c2308d92b89c45181cea8ec7ece74e9b4d3a3ce0234d95e329913b',
  runtime: '6f15be27bd80b6b4d52afefa49094e18fcfab55d5da354d717971f2d2537b2f4',
  prompt_template: '137efcbd09400d7ad2ab6c257077f96e09d7ff0c2eac2a35c067cdcbd7ef6a18',
};
const models = [
  { key: '1b', file: process.env.AURALIS_TEST_GGUF_1B,
    sha256: 'dc5f44fcf1fa496ee7ad725982c0c8c553a4de00259b53af84c4b89fb0c06699',
    profile: 'models/manifests/hy_mt2_1_8b_q4_k_m.context_v6_slot.experimental.json' },
  { key: '7b', file: process.env.AURALIS_TEST_GGUF_7B,
    sha256: '9f96256500f3fc1ab4d64336b58f52a949a95ad7516b0c229476eef782f9f77b',
    profile: 'models/manifests/hy_mt2_7b_q4_k_m.context_v6_slot.experimental.json' },
];
const limits = { chats: 64, servers: 2, seed: 101, retries: 0,
  per_chat_ms: 120_000, readiness_ms: 180_000, wall_ms: 900_000 };
const focusIds = [2, 3, 12, 20, 91, 133, 142, 226, 227, 242, 267];
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
assert.equal(await hashFile(runtimePath), identities.runtime);
assert.equal(await hashFile(sourcePath), identities.source);
for (const model of models) {
  assert(model.file && path.isAbsolute(model.file));
  assert.equal(await hashFile(model.file), model.sha256);
  const profileBytes = await fs.readFile(path.join(root, model.profile));
  model.profile_sha256 = digest(profileBytes);
  model.settings = JSON.parse(profileBytes);
  assert.equal(model.settings.model_file_sha256, model.sha256);
  assert.equal(model.settings.prompt_version, 6);
  assert.equal(model.settings.prompt_template_sha256, identities.prompt_template);
}
for (const key of ['target_segments_per_block', 'context_before_segments',
  'context_after_segments', 'temperature', 'top_p', 'top_k', 'repeat_penalty',
  'max_tokens_per_line', 'token_safety_margin_tokens'])
  assert.equal(models[0].settings[key], models[1].settings[key], key);
const archive = JSON.parse(await readPinned(archivedPath, identities.archive));
const packet = JSON.parse(await readPinned(packetPath, identities.packet));
assert.equal(archive.source_sha256, identities.source);
assert.equal(packet.sample_count, 44);
const chats = archive.requests.filter(row => row.path === '/v1/chat/completions');
assert.equal(chats.length, 268);
const marker = 'Input JSON:\n';
const natural = focusIds.map(id => {
  const row = chats[id - 1];
  assert.equal(row.request_sha256, digest(Buffer.from(JSON.stringify(row.request))));
  const prompt = row.request.messages?.[0]?.content;
  assert.equal(typeof prompt, 'string');
  assert.equal(prompt.split(marker).length, 2);
  const envelope = JSON.parse(prompt.split(marker)[1]);
  assert.equal(envelope.target_slots.length, 1);
  assert.equal(envelope.target_slots[0].segment_id, id);
  assert.equal(envelope.target_slots[0].line_index, 0);
  const packetRow = packet.rows.find(item => item.id === id);
  assert(packetRow);
  assert.equal(packetRow.request_sha256, row.request_sha256);
  assert.equal(packetRow.source_text, envelope.target_slots[0].source_original);
  assert.equal(row.request.response_format.schema.properties.translations.items
    .properties.segment_id.const, id);
  return { id: `asus-${id}`, cue_id: id, kind: 'natural',
    regression_id: id === 12 || id === 227 ? 'REG-031'
      : [2, 3, 91, 267].includes(id) ? 'REG-032' : 'REG-033',
    source_zh: packetRow.source_text, original_request_sha256: row.request_sha256,
    baseRequest: row.request };
});
const catalog = JSON.parse(await fs.readFile(path.join(root,
  'eval/regressions/catalog-v18.json')));
const packs = catalog.entries.map(entry => ({ entry,
  file: path.join(root, 'eval/regressions', entry.pack_file) }));
const authored = [];
for (const { entry, file } of packs) {
  const bytes = await fs.readFile(file);
  assert.equal(digest(bytes), entry.pack_sha256);
  const pack = JSON.parse(bytes);
  assert(['REG-031', 'REG-032', 'REG-033'].includes(pack.id));
  for (const kind of ['related', 'negative']) {
    for (const control of pack[`${kind}_controls`]) {
      const source = control.source;
      assert.equal(typeof source, 'string');
      assert(source.length > 0);
      authored.push({ id: `${pack.id}-${kind}-${control.id}`, kind,
        regression_id: pack.id, source_zh: source });
    }
  }
}
assert.equal(authored.length, 21);
const base = natural[0].baseRequest;
const prefix = base.messages[0].content.split(marker)[0];
assert(natural.every(item => item.baseRequest.messages[0].content.split(marker)[0] === prefix));
for (const [index, item] of authored.entries()) {
  item.cue_id = 1001 + index;
  const source = item.source_zh;
  const envelope = { approved_terms: [], protected_facts: [], schema_version: 5,
    source_context: [], target_slots: [{ end_ms: index * 2000 + 1500,
      line_index: 0, segment_id: item.cue_id, source_for_translation: source,
      source_original: source, start_ms: index * 2000 }] };
  const request = structuredClone(base);
  request.messages[0].content = `${prefix}${marker}${JSON.stringify(envelope)}`;
  request.response_format.schema.properties.translations.items.properties.segment_id
    = { const: item.cue_id };
  item.baseRequest = request;
}
const cases = [...natural, ...authored];
assert.equal(cases.length, 32);
const planned = models.flatMap(model => cases.map(item => {
  const request = structuredClone(item.baseRequest);
  request.model = model.settings.model_alias;
  request.seed = limits.seed;
  assert.doesNotMatch(request.messages[0].content, /\p{Script=Cyrillic}/u);
  const body = Buffer.from(JSON.stringify(request));
  return { model: model.key, case_id: item.id, kind: item.kind,
    regression_id: item.regression_id, cue_id: item.cue_id, source_zh: item.source_zh,
    original_request_sha256: item.original_request_sha256 ?? null,
    prompt_sha256: digest(Buffer.from(request.messages[0].content)),
    request_sha256: digest(body), request, body };
}));
assert.equal(planned.length, limits.chats);
for (let index = 0; index < cases.length; index++) {
  const first = planned[index].request;
  const second = structuredClone(planned[cases.length + index].request);
  second.model = first.model;
  assert.deepEqual(second, first, 'Paired requests differ beyond model alias');
}
if (preflight) {
  console.log(`ASUS fact screen preflight: ${natural.length} pinned natural and ${authored.length} authored cases, ${planned.length} exact paired requests; no inference.`);
  process.exit(0);
}

const parent = path.join(root, startupCheck
  ? '.cache/eval/commons-asus-v6-fact-model-screen-startup-check-v1'
  : '.cache/eval/commons-asus-v6-fact-model-screen-v1');
await fs.mkdir(parent, { recursive: true });
const workspace = await fs.mkdtemp(path.join(parent, 'run-'));
console.log(`Private ASUS fact screen: ${workspace}`);
const started = performance.now();
const report = { schema_version: 1, id: 'commons-asus-v6-fact-model-screen-v1',
  status: 'running', started_at: new Date().toISOString(),
  git_head: null, git_status: null, startup_check: startupCheck,
  harness_sha256: await hashFile(fileURLToPath(import.meta.url)),
  identity: { ...identities, os: `${os.type()} ${os.release()} ${os.arch()}`,
    cpu: os.cpus()[0].model, total_ram_bytes: os.totalmem(),
    models: models.map(model => ({ key: model.key, revision: model.settings.model_revision,
      model_sha256: model.sha256, profile_sha256: model.profile_sha256 })) },
  limits, human_review_count: 0, ai_review: 'pending',
  planned_requests: planned.map(({ model, case_id, kind, regression_id, cue_id,
    original_request_sha256, prompt_sha256, request_sha256 }) => ({ model,
    case_id, kind, regression_id, cue_id, original_request_sha256,
    prompt_sha256, request_sha256 })),
  requests: [], failures: [], resources: {} };
const save = async () => fs.writeFile(path.join(workspace, 'report.json'),
  `${JSON.stringify(report, null, 2)}\n`);
const journal = await fs.open(path.join(workspace, 'requests.jsonl'), 'wx');
const remaining = () => {
  const ms = limits.wall_ms - (performance.now() - started);
  assert(ms > 0, 'Declared ASUS fact screen wall budget exhausted');
  return ms;
};
let server;
try {
  await save();
  if (startupCheck) throw new Error('simulated metadata failure before server start');
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
        const entry = { model: item.model, case_id: item.case_id, kind: item.kind,
          regression_id: item.regression_id, cue_id: item.cue_id,
          source_zh: item.source_zh, original_request_sha256: item.original_request_sha256,
          prompt_sha256: item.prompt_sha256, request_sha256: item.request_sha256,
          request: item.request, started_at: new Date().toISOString() };
        const began = performance.now();
        try {
          const response = await fetch(`${url}v1/chat/completions`, { method: 'POST',
            headers: { 'content-type': 'application/json' }, body: item.body,
            signal: AbortSignal.timeout(Math.min(limits.per_chat_ms, remaining())) });
          entry.http_status = response.status;
          const bytes = Buffer.from(await response.arrayBuffer());
          entry.raw_response = bytes.toString('utf8');
          entry.raw_response_sha256 = digest(bytes);
          const parsed = JSON.parse(entry.raw_response);
          entry.finish_reason = parsed.choices?.[0]?.finish_reason ?? null;
          entry.raw_candidate = parsed.choices?.[0]?.message?.content ?? null;
          entry.usage = parsed.usage ?? null;
          entry.timings = parsed.timings ?? null;
          if (response.ok && entry.finish_reason === 'stop'
              && typeof entry.raw_candidate === 'string') {
            try {
              const output = JSON.parse(entry.raw_candidate).translations;
              assert.equal(output?.length, 1);
              assert.equal(output[0].segment_id, item.cue_id);
              assert.equal(output[0].line_index, 0);
              assert(typeof output[0].text === 'string' && output[0].text.trim());
              assert(!/[\p{Cc}\p{Cf}]/u.test(output[0].text));
              entry.accepted_candidate = output[0].text;
              entry.structural_outcome = 'valid_unreviewed';
            } catch (error) { entry.structural_outcome = `invalid: ${error.message}`; }
          } else entry.structural_outcome = 'incomplete_or_http_failure';
        } catch (error) {
          entry.error = String(error);
          entry.structural_outcome = 'transport_failure';
        }
        entry.elapsed_ms = Math.round(performance.now() - began);
        report.requests.push({ model: item.model, case_id: item.case_id,
          kind: item.kind, regression_id: item.regression_id, cue_id: item.cue_id,
          request_sha256: item.request_sha256, prompt_sha256: item.prompt_sha256,
          raw_response_sha256: entry.raw_response_sha256 ?? null,
          http_status: entry.http_status ?? null, finish_reason: entry.finish_reason ?? null,
          structural_outcome: entry.structural_outcome,
          accepted_candidate: entry.accepted_candidate ?? null,
          usage: entry.usage ?? null, timings: entry.timings ?? null,
          elapsed_ms: entry.elapsed_ms });
        await journal.write(`${JSON.stringify(entry)}\n`);
        await journal.sync();
        await save();
        console.log(`${model.key} ${item.case_id}: ${entry.structural_outcome}, ${entry.elapsed_ms} ms`);
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
  report.status = report.requests.every(row => row.structural_outcome === 'valid_unreviewed')
    ? 'complete_structural_observations_unreviewed' : 'complete_with_failures_unreviewed';
} catch (error) {
  report.status = 'failed';
  report.failures.push({ at: new Date().toISOString(), message: String(error) });
  process.exitCode = startupCheck ? 0 : 1;
} finally {
  if (server) await stopProcess(server);
  report.finished_at = new Date().toISOString();
  report.wall_elapsed_ms = Math.round(performance.now() - started);
  await save();
  await journal.close();
  await fs.writeFile(path.join(parent, 'latest.txt'), workspace);
}
