import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { createReadStream } from 'node:fs';
import fs from 'node:fs/promises';
import path from 'node:path';
import { performance } from 'node:perf_hooks';
import { fileURLToPath } from 'node:url';
import { digest } from './flores-file-fixture.mjs';
import { freeLoopbackPort, startProcess, stopProcess, waitForHealthyServer } from './local-process.mjs';
import { runtimeSampler } from './runtime-sampler.mjs';

assert.equal(process.platform, 'win32');
assert.deepEqual(process.argv.slice(2).filter(arg => arg !== '--preflight'), []);
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const runtimePath = process.env.AURALIS_TEST_LLAMA_SERVER;
const runtimeSha256 = '6f15be27bd80b6b4d52afefa49094e18fcfab55d5da354d717971f2d2537b2f4';
const sourceSha256 = '8c41e66f52000a5b67ab27bfc319accd11d89290b60e50fc5c60f4ee8230a000';
const controlPath = path.join(root, 'eval/corpora/vivo-fact-controls-v1.json');
const controlSha256 = '3119d4d1c0b6489618d214808662195f0c1d6d0d47946a4726fcd5d7409a67ef';
const promptTemplateSha256 = 'af6ebaa8af4ff777aeb313c0e4496998c898701df07809c7691d4fe2717b959c';
const firstDirectory = path.join(root, '.cache/eval/commons-vivo-full-7b-v1/run-zxrN7F');
const secondDirectory = path.join(root, '.cache/eval/commons-vivo-full-7b-resume-v1/run-ndCw9w');
const sourcePath = path.join(root, '.cache/eval/commons-vivo-979826861/source.zh.srt');
const naturalCases = [
  { id: 60, regression_id: 'REG-025', report: 'first', request_sha256: '3432a3119fe7424e906b699548d53e556077c4fb9b4fbdf4ba8e7fbddf5c8c63' },
  { id: 276, regression_id: 'REG-025', report: 'second', request_sha256: '24b553c5217f75f55232adeb2b646acb3c865cfb834f972731dfba3b3960081d' },
  { id: 280, regression_id: 'REG-026', report: 'second', request_sha256: 'd49c1497db10660c5aa9dd3fadfe066bfb4b9c110f657f9dfd6a989415e39814' },
  { id: 328, regression_id: 'REG-025', report: 'second', request_sha256: 'f66225dce8581aa2b692d5a2fc6c3cd8c5e5fed42aaeccca1d5a9ce3291b9455' },
  { id: 466, regression_id: 'REG-027', report: 'second', request_sha256: 'f7db980bb58a408f262b7b1812311aeba49cea3fec31eeb0dd4c8bdcd3aa464c' },
];
const models = [
  { key: '1b', stem: '1_8b', file: process.env.AURALIS_TEST_GGUF_1B,
    sha256: 'dc5f44fcf1fa496ee7ad725982c0c8c553a4de00259b53af84c4b89fb0c06699' },
  { key: '7b', stem: '7b', file: process.env.AURALIS_TEST_GGUF_7B,
    sha256: '9f96256500f3fc1ab4d64336b58f52a949a95ad7516b0c229476eef782f9f77b' },
];
const limits = { chat_requests: 56, server_starts: 2, natural_seeds: [101, 202],
  control_seeds: [101], per_request_ms: 120_000, readiness_ms: 180_000,
  total_wall_ms: 900_000, retries: 0 };
const hashFile = async file => {
  const hash = createHash('sha256');
  for await (const chunk of createReadStream(file)) hash.update(chunk);
  return hash.digest('hex');
};
assert(runtimePath && path.isAbsolute(runtimePath));
assert.equal(await hashFile(runtimePath), runtimeSha256);
for (const model of models) {
  assert(model.file && path.isAbsolute(model.file));
  const bytes = await fs.readFile(path.join(root,
    `models/manifests/hy_mt2_${model.stem}_q4_k_m.context_v5_scene.experimental.json`));
  model.profile_sha256 = digest(bytes);
  model.profile = JSON.parse(bytes);
  assert.equal(model.profile.prompt_version, 5);
  assert.equal(model.profile.prompt_template_sha256, promptTemplateSha256);
  assert.equal(model.profile.model_file_sha256, model.sha256);
  assert.equal(await hashFile(model.file), model.sha256);
}
for (const key of ['target_segments_per_block', 'context_before_segments',
  'context_after_segments', 'temperature', 'top_p', 'top_k', 'repeat_penalty',
  'max_tokens_per_line', 'token_safety_margin_tokens'])
  assert.equal(models[0].profile[key], models[1].profile[key], key);
const sourceBytes = await fs.readFile(sourcePath);
assert.equal(digest(sourceBytes), sourceSha256);
const sourceBlocks = sourceBytes.toString('utf8').trimEnd().split(/\r?\n\r?\n/u);
assert.equal(sourceBlocks.length, 467);
const controlBytes = await fs.readFile(controlPath);
assert.equal(digest(controlBytes), controlSha256);
const controls = JSON.parse(controlBytes);
assert.equal(controls.cases.length, 18);
assert.equal(new Set(controls.cases.map(row => row.id)).size, 18);
for (const regressionId of ['REG-025', 'REG-026', 'REG-027']) {
  const packName = { 'REG-025': 'numeric-time', 'REG-026': 'workforce',
    'REG-027': 'future-products' }[regressionId];
  const pack = JSON.parse(await fs.readFile(path.join(root,
    `eval/regressions/natural-vivo-${packName}-v1.json`)));
  for (const kind of ['related', 'negative']) {
    const fromPack = pack[`${kind}_controls`].map(row => row.id).sort();
    const fromCorpus = controls.cases.filter(row => row.regression_id === regressionId
      && row.kind === kind).map(row => row.id).sort();
    assert.deepEqual(fromCorpus, fromPack);
  }
}
const first = JSON.parse(await fs.readFile(path.join(firstDirectory, 'report.json')));
const second = JSON.parse(await fs.readFile(path.join(secondDirectory, 'report.json')));
assert.equal(first.status, 'failed');
assert.equal(second.status, 'passed_structural_probe');
const firstChats = first.requests.filter(row => row.path === '/v1/chat/completions');
const secondChats = second.requests.filter(row => row.path === '/v1/chat/completions');
assert.equal(firstChats.length, 276);
assert.equal(secondChats.length, 192);
const marker = 'Input JSON:\n';
const realCases = naturalCases.map(row => {
  const archived = row.report === 'first' ? firstChats[row.id - 1]
    : secondChats[row.id - 276];
  assert.equal(archived.request_sha256, row.request_sha256);
  const request = structuredClone(archived.request);
  assert.equal(request.model, models[1].profile.model_alias);
  const prompt = request.messages?.[0]?.content;
  assert.equal(typeof prompt, 'string');
  assert.equal(prompt.split(marker).length, 2);
  assert.doesNotMatch(prompt, /\p{Script=Cyrillic}/u);
  const envelope = JSON.parse(prompt.split(marker)[1]);
  assert.equal(envelope.target_slots.length, 1);
  assert.equal(envelope.target_slots[0].segment_id, row.id);
  assert.equal(envelope.target_slots[0].line_index, 0);
  assert.equal(envelope.target_slots[0].source_original,
    sourceBlocks[row.id - 1].split(/\r?\n/u).slice(2).join('\n'));
  return { key: `vivo-${row.id}`, kind: 'natural', regression_id: row.regression_id,
    source_zh: envelope.target_slots[0].source_original, prompt, baseRequest: request,
    original_request_sha256: row.request_sha256 };
});
const prefix = realCases[0].prompt.split(marker)[0];
assert(realCases.every(row => row.prompt.split(marker)[0] === prefix));
const authoredCases = controls.cases.map((row, index) => {
  const id = 1001 + index;
  const envelope = { schema_version: 5, target_slots: [{ segment_id: id,
    line_index: 0, start_ms: index * 2000, end_ms: index * 2000 + 1500,
    source_original: row.source_zh, source_for_translation: row.source_zh }],
  source_context: row.context_before_zh.map((source, position) => ({
    segment_id: id - row.context_before_zh.length + position,
    start_ms: index * 2000 - 1500, end_ms: index * 2000 - 100,
    lines: [source], relative_position: 'before' })),
  approved_terms: [], protected_facts: [] };
  const prompt = `${prefix}${marker}${JSON.stringify(envelope)}`;
  assert.doesNotMatch(prompt, /\p{Script=Cyrillic}/u);
  assert(!prompt.includes(row.expected_meaning_en));
  const request = structuredClone(realCases[0].baseRequest);
  request.messages[0].content = prompt;
  return { key: row.id, kind: row.kind, regression_id: row.regression_id,
    source_zh: row.source_zh, prompt, baseRequest: request };
});
const cases = [...realCases, ...authoredCases];
assert.equal(cases.length, 23);
const planned = models.flatMap(model => cases.flatMap(row => {
  const seeds = row.kind === 'natural' ? limits.natural_seeds : limits.control_seeds;
  return seeds.map(seed => {
    const request = structuredClone(row.baseRequest);
    request.model = model.profile.model_alias;
    request.seed = seed;
    const body = Buffer.from(JSON.stringify(request));
    return { model: model.key, case_id: row.key, kind: row.kind,
      regression_id: row.regression_id, seed, source_zh: row.source_zh,
      original_request_sha256: row.original_request_sha256 ?? null,
      prompt_sha256: digest(Buffer.from(row.prompt)), request_sha256: digest(body),
      request, body };
  });
}));
assert.equal(planned.length, limits.chat_requests);
for (const item of planned.filter(row => row.model === '1b')) {
  const paired = planned.find(row => row.model === '7b'
    && row.case_id === item.case_id && row.seed === item.seed);
  assert(paired);
  const normalized = structuredClone(paired.request);
  normalized.model = item.request.model;
  assert.deepEqual(normalized, item.request, 'Paired requests differ beyond model alias');
  assert.equal(paired.prompt_sha256, item.prompt_sha256);
}
if (process.argv.includes('--preflight')) {
  console.log(`Vivo fact screen preflight: ${cases.length} same-source/authored cases, ${planned.length} paired requests; no inference.`);
  process.exit(0);
}

const parent = path.join(root, '.cache/eval/commons-vivo-fact-model-screen-v1');
await fs.mkdir(parent, { recursive: true });
const workspace = await fs.mkdtemp(path.join(parent, 'run-'));
console.log(`Private Vivo fact screen: ${workspace}`);
const started = performance.now();
const report = { schema_version: 1, id: 'commons-vivo-fact-model-screen-v1',
  status: 'running', started_at: new Date().toISOString(),
  git_head: execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim(),
  git_status: execFileSync('git', ['status', '--short'], { cwd: root, encoding: 'utf8' }).trim(),
  harness_sha256: await hashFile(fileURLToPath(import.meta.url)),
  source_sha256: sourceSha256, control_sha256: controlSha256,
  runtime_sha256: runtimeSha256, prompt_template_sha256: promptTemplateSha256,
  models: models.map(model => ({ key: model.key, revision: model.profile.model_revision,
    model_sha256: model.sha256, profile_sha256: model.profile_sha256 })),
  limits, quality_review: 'ai_triage_pending_human_missing',
  planned_requests: planned.map(({ model, case_id, kind, regression_id, seed,
    original_request_sha256, prompt_sha256, request_sha256 }) => ({ model, case_id,
    kind, regression_id, seed, original_request_sha256, prompt_sha256, request_sha256 })),
  requests: [], failures: [], resources: {} };
const save = async () => fs.writeFile(path.join(workspace, 'report.json'),
  `${JSON.stringify(report, null, 2)}\n`);
const journal = await fs.open(path.join(workspace, 'requests.jsonl'), 'wx');
const remaining = () => {
  const ms = limits.total_wall_ms - (performance.now() - started);
  assert(ms > 0, 'Declared Vivo fact screen wall budget exhausted');
  return ms;
};
let currentServer;
try {
  await save();
  for (const model of models) {
    const port = await freeLoopbackPort();
    const url = `http://127.0.0.1:${port}/`;
    const args = ['--model', model.file, '--alias', model.profile.model_alias,
      '--host', '127.0.0.1', '--port', String(port), '-c', '2048', '-ngl', '99',
      '--parallel', '1', '--jinja', '--cache-ram', '0'];
    const runtimeEnv = { ...process.env, PATH: `${path.dirname(runtimePath)};${path.join(root,
      '.cache/runtime/cudart')};${process.env.PATH}` };
    currentServer = startProcess(runtimePath, args, root, runtimeEnv,
      { maxCaptureCharacters: 4 * 1024 * 1024 });
    await waitForHealthyServer(url, currentServer, Math.min(limits.readiness_ms, remaining()));
    const sampler = runtimeSampler(path.join(workspace, `${model.key}-resources.jsonl`),
      root, () => [currentServer.child.pid]);
    try {
      for (const item of planned.filter(row => row.model === model.key)) {
        assert(report.requests.length < limits.chat_requests);
        const entry = { model: item.model, case_id: item.case_id,
          kind: item.kind, regression_id: item.regression_id, seed: item.seed,
          source_zh: item.source_zh, prompt_sha256: item.prompt_sha256,
          request_sha256: item.request_sha256, request: item.request,
          started_at: new Date().toISOString() };
        const requestStarted = performance.now();
        try {
          const response = await fetch(`${url}v1/chat/completions`, { method: 'POST',
            headers: { 'content-type': 'application/json' }, body: item.body,
            signal: AbortSignal.timeout(Math.min(limits.per_request_ms, remaining())) });
          entry.http_status = response.status;
          entry.raw_response = await response.text();
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
              assert.equal(output[0].segment_id, item.kind === 'natural'
                ? Number(item.case_id.slice(5)) : 1001 + controls.cases.findIndex(row => row.id === item.case_id));
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
        entry.elapsed_ms = Math.round(performance.now() - requestStarted);
        report.requests.push({ model: item.model, case_id: item.case_id,
          kind: item.kind, regression_id: item.regression_id, seed: item.seed,
          request_sha256: item.request_sha256, prompt_sha256: item.prompt_sha256,
          http_status: entry.http_status ?? null, finish_reason: entry.finish_reason ?? null,
          structural_outcome: entry.structural_outcome,
          accepted_candidate: entry.accepted_candidate ?? null,
          usage: entry.usage ?? null, elapsed_ms: entry.elapsed_ms });
        await journal.write(`${JSON.stringify(entry)}\n`);
        await journal.sync();
        await save();
        console.log(`${model.key} ${item.case_id} seed=${item.seed}: ${entry.structural_outcome}, ${entry.elapsed_ms} ms`);
      }
    } finally {
      report.resources[model.key] = await sampler.stop();
      await stopProcess(currentServer);
      await fs.writeFile(path.join(workspace, `${model.key}-server.log`),
        `${currentServer.stdout}\n${currentServer.stderr}\n`);
      currentServer = null;
      await save();
    }
  }
  assert.equal(report.requests.length, limits.chat_requests);
  report.status = report.requests.every(row => row.structural_outcome === 'valid_unreviewed')
    ? 'complete_structural_observations_unreviewed' : 'complete_with_failures_unreviewed';
} catch (error) {
  report.status = 'failed';
  report.failures.push({ at: new Date().toISOString(), message: String(error) });
  throw error;
} finally {
  if (currentServer) await stopProcess(currentServer);
  report.finished_at = new Date().toISOString();
  report.wall_elapsed_ms = Math.round(performance.now() - started);
  await save();
  await journal.close();
  await fs.writeFile(path.join(parent, 'latest.txt'), workspace);
}
