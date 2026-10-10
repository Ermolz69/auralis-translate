import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { createReadStream } from 'node:fs';
import fs from 'node:fs/promises';
import path from 'node:path';
import { performance } from 'node:perf_hooks';
import { fileURLToPath } from 'node:url';
import { freeLoopbackPort, startProcess, stopProcess,
  waitForHealthyServer } from './local-process.mjs';
import { runtimeSampler } from './runtime-sampler.mjs';
import { decodeTechnicalSenseReply } from './vivo-technical-senses-v2.mjs';

const mode = process.argv[2];
assert(['--freeze', '--preflight', '--probe'].includes(mode) &&
  process.argv.length === 3);
assert.equal(process.platform, 'win32');
const version = process.env.AURALIS_OFFICIAL_REFERENCE_VERSION ?? 'v1';
assert(['v1', 'v2'].includes(version));
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const modelRoot = process.env.AURALIS_MODEL_ASSET_ROOT;
assert(modelRoot && path.isAbsolute(modelRoot));
const privateRoot = path.join(root, '.cache/eval/official-zh-ru-reference-2026');
const sourcePath = path.join(privateRoot,
  version === 'v2' ? 'source-cases-v2.json' : 'source-cases.json');
const pdfPath = path.join(privateRoot, 'source-reference.pdf');
const baselinePath = path.join(root,
  '.cache/eval/vivo-technical-senses-v2/attempt-WN2KN8/requests.jsonl');
const modelPath = path.join(modelRoot, '.cache/models/Hy-MT2-7B-Q4_K_M.gguf');
const runtimePath = path.join(modelRoot, '.cache/runtime/llama/llama-server.exe');
const manifestPath = path.join(root,
  'models/manifests/hy_mt2_7b_q4_k_m.context_v8_target_first_batch4.experimental.json');
const freezePath = path.join(root,
  `eval/experiments/2026-10-10-official-zh-ru-reference-${version}-freeze.json`);
const expected = {
  pdf: 'dc029d7ebc4b43d599348943dca8229108df81d3c932df2ccbb72df43da82ea8',
  source: version === 'v2' ?
    '026b7189bea819b0b4ccdcde8480cb1da4483305207ac5c5f6e4554ead2e00fa' :
    '99db71f3c76546e9e8e7aeb8dc6a049adb49a9698dc71fb366786695ce843d52',
  baseline: 'b9c0951807157c832c42ec1d8d5ab3ec0ebd8498fa2cb01ccf3ce1f2b65e8210',
  model: '9f96256500f3fc1ab4d64336b58f52a949a95ad7516b0c229476eef782f9f77b',
  runtime: '6f15be27bd80b6b4d52afefa49094e18fcfab55d5da354d717971f2d2537b2f4',
  manifest: 'c287c53efbb4ce78471b64648ea3dd2f521363df0e168b7a61df1fdd6ae0479a',
};
const limits = { cases: 10, chats: 10, preflights: 20,
  max_total_tokens: 24000, max_wall_ms: 600000, readiness_ms: 180000,
  per_request_ms: 120000, per_preflight_ms: 30000,
  context_tokens: 2048, response_tokens: 1024, safety_tokens: 64,
  server_starts: 1, retries: 0 };
if (version === 'v2') Object.assign(limits, { cases: 6, chats: 6,
  preflights: 12, max_total_tokens: 16000 });
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
async function hashFile(file) {
  const hash = createHash('sha256');
  for await (const chunk of createReadStream(file,
    { highWaterMark: 8 * 1024 * 1024 })) hash.update(chunk);
  return hash.digest('hex');
}
for (const [key, file] of Object.entries({ pdf: pdfPath, source: sourcePath,
  baseline: baselinePath, model: modelPath, runtime: runtimePath,
  manifest: manifestPath })) {
  console.log(`Hashing pinned ${key}`);
  assert.equal(await hashFile(file), expected[key], `Pinned ${key} changed`);
}
const source = JSON.parse(await fs.readFile(sourcePath, 'utf8'));
assert.equal(source.schema_version, version === 'v2' ? 2 : 1);
assert.equal(source.source_pdf_sha256, expected.pdf);
assert.equal(source.cases.length, limits.cases);
assert(!/[А-Яа-яЁё]/u.test(JSON.stringify(source)),
  'Chinese-only selection contains Cyrillic reference text');
assert.equal(new Set(source.cases.map(row => row.id)).size, limits.cases);
if (version === 'v2') {
  const byId = Object.fromEntries(source.cases.map(row => [row.id, row]));
  assert(byId.policy_stability.context.includes('2025年工作回顾'));
  assert(byId.research_growth.source.includes('提出'));
  assert(byId.carbon_target.source.includes('提出'));
  for (const id of ['completed_economy', 'completed_innovation']) {
    assert(byId[id].context.includes('2025年工作回顾'));
    assert(/实现|取得/u.test(byId[id].source));
  }
}
const manifest = JSON.parse(await fs.readFile(manifestPath, 'utf8'));
assert.equal(manifest.prompt_version, 8);
assert.equal(manifest.model_file_sha256, expected.model);
const priorRows = (await fs.readFile(baselinePath, 'utf8')).trimEnd()
  .split(/\r?\n/u).map(JSON.parse);
const prior = priorRows.find(row => row.case_id === 'natural_multicore' &&
  row.arm === 'baseline' && row.status === 'valid_unreviewed');
assert(prior);
const template = prior.request;
assert.equal(sha(Buffer.from(JSON.stringify(template))), prior.request_sha256);
assert.equal(template.model, manifest.model_alias);
const marker = 'Input JSON:\n';
const promptParts = template.messages[0].content.split(marker);
assert.equal(promptParts.length, 2);
const prefix = promptParts[0];
assert(prefix.includes('Translate every target_slots entry into Russian'));
const planned = source.cases.map((row, index) => {
  assert.equal(typeof row.source, 'string');
  assert(/[\u4e00-\u9fff]/u.test(row.source));
  assert(!/[А-Яа-яЁё]/u.test(row.source));
  const id = (version === 'v2' ? 6001 : 5001) + index;
  const sourceContext = row.context ? [{
    end_ms: index * 10000 + 2000, line_index: 0,
    segment_id: id - 1, source_original: row.context,
    start_ms: index * 10000 }] : [];
  const targetStart = index * 10000 + (version === 'v2' ? 3000 : 0);
  const envelope = { schema_version: 7, target_slots: [{
    approved_terms: [], end_ms: index * 10000 + 8000,
    line_index: 0, protected_facts: [], segment_id: id,
    source_for_translation: row.source, source_original: row.source,
    start_ms: targetStart }], source_context: sourceContext };
  const request = structuredClone(template);
  request.messages[0].content = `${prefix}${marker}${JSON.stringify(envelope)}`;
  request.response_format.schema.properties.translations.minItems = 1;
  request.response_format.schema.properties.translations.maxItems = 1;
  assert(!/[А-Яа-яЁё]/u.test(JSON.stringify(request)),
    'Model request contains Cyrillic reference text');
  return { id: row.id, page: row.page, target_id: id,
    source_sha256: sha(Buffer.from(row.source)),
    request_sha256: sha(Buffer.from(JSON.stringify(request))), request };
});
const freeze = { schema_version: 1,
  experiment: `OFFICIAL-ZH-RU-REFERENCE-2026-${version}`,
  split: 'published_parallel_exposed_development_not_holdout',
  expected, limits, model_alias: manifest.model_alias,
  prompt_prefix_sha256: sha(Buffer.from(prefix)),
  planned: planned.map(({ id, page, target_id, source_sha256,
    request_sha256 }) => ({ id, page, target_id, source_sha256,
    request_sha256 })) };
const freezeBytes = `${JSON.stringify(freeze, null, 2)}\n`;
if (mode === '--freeze') {
  await fs.writeFile(freezePath, freezeBytes, { flag: 'wx' });
  console.log(`Frozen ${planned.length} source-only requests: ${sha(Buffer.from(freezeBytes))}`);
  process.exit(0);
}
assert.equal(await fs.readFile(freezePath, 'utf8'), freezeBytes,
  'Frozen request identities changed');
if (mode === '--preflight') {
  console.log(`Official reference preflight: ${planned.length} requests; no reference in prompts`);
  process.exit(0);
}

const workspace = await fs.mkdtemp(path.join(privateRoot,
  version === 'v2' ? 'attempt-v2-' : 'attempt-'));
const journal = await fs.open(path.join(workspace, 'requests.jsonl'), 'wx');
const reportPath = path.join(workspace, 'report.json');
const began = performance.now();
const report = { schema_version: 1, experiment: freeze.experiment,
  status: 'running', started_at: new Date().toISOString(),
  git_head: execFileSync('git', ['rev-parse', 'HEAD'],
    { cwd: root, encoding: 'utf8' }).trim(),
  git_status: execFileSync('git', ['status', '--short'],
    { cwd: root, encoding: 'utf8' }).trim(),
  freeze_sha256: sha(Buffer.from(freezeBytes)), expected, limits,
  requests: [], failures: [], total_tokens: 0, resources: {} };
const save = () => fs.writeFile(reportPath,
  `${JSON.stringify(report, null, 2)}\n`);
const remaining = () => {
  const ms = limits.max_wall_ms - (performance.now() - began);
  assert(ms > 0, 'Frozen wall budget exhausted');
  return ms;
};
const post = async (url, endpoint, body, timeoutMs) => {
  const bytes = Buffer.from(JSON.stringify(body));
  const start = performance.now();
  const response = await fetch(`${url}${endpoint}`, { method: 'POST',
    headers: { 'content-type': 'application/json' }, body: bytes,
    signal: AbortSignal.timeout(Math.min(timeoutMs, remaining())) });
  return { request_sha256: sha(bytes), http_status: response.status,
    raw_response: await response.text(),
    elapsed_ms: Math.round(performance.now() - start) };
};
let server;
try {
  await save();
  const port = await freeLoopbackPort();
  const url = `http://127.0.0.1:${port}/`;
  const args = ['--model', modelPath, '--alias', manifest.model_alias,
    '--host', '127.0.0.1', '--port', String(port), '-c', '2048', '-ngl', '99',
    '--parallel', '1', '--jinja', '--cache-ram', '0'];
  const runtimeEnv = { ...process.env,
    PATH: `${path.dirname(runtimePath)};${path.join(modelRoot,
      '.cache/runtime/cudart')};${process.env.PATH}` };
  server = startProcess(runtimePath, args, root, runtimeEnv,
    { maxCaptureCharacters: 4 * 1024 * 1024 });
  await waitForHealthyServer(url, server,
    Math.min(limits.readiness_ms, remaining()));
  const sampler = runtimeSampler(path.join(workspace, 'resources.jsonl'),
    root, () => [server.child.pid]);
  try {
    for (const item of planned) {
      const entry = { id: item.id, page: item.page,
        target_id: item.target_id, source_sha256: item.source_sha256,
        request_sha256: item.request_sha256, request: item.request,
        started_at: new Date().toISOString(), status: 'running',
        preflight: [] };
      try {
        const rendered = await post(url, 'apply-template',
          { messages: item.request.messages, model: item.request.model,
            response_format: item.request.response_format },
          limits.per_preflight_ms);
        entry.preflight.push(rendered);
        assert.equal(rendered.http_status, 200);
        const prompt = JSON.parse(rendered.raw_response).prompt;
        const tokenized = await post(url, 'tokenize',
          { content: prompt, add_special: false, parse_special: true },
          limits.per_preflight_ms);
        entry.preflight.push(tokenized);
        assert.equal(tokenized.http_status, 200);
        entry.prompt_tokens_preflight = JSON.parse(tokenized.raw_response)
          .tokens.length;
        assert(entry.prompt_tokens_preflight + limits.response_tokens +
          limits.safety_tokens <= limits.context_tokens);
        const chat = await post(url, 'v1/chat/completions', item.request,
          limits.per_request_ms);
        entry.chat = chat;
        assert.equal(chat.request_sha256, item.request_sha256);
        assert.equal(chat.http_status, 200);
        const parsed = JSON.parse(chat.raw_response);
        entry.usage = parsed.usage ?? null;
        report.total_tokens += (entry.usage?.prompt_tokens ?? 0) +
          (entry.usage?.completion_tokens ?? 0);
        assert(report.total_tokens <= limits.max_total_tokens);
        entry.raw_candidate = parsed.choices?.[0]?.message?.content ?? null;
        entry.accepted_text = decodeTechnicalSenseReply(chat.raw_response,
          item.target_id);
        entry.accepted_text_sha256 = sha(Buffer.from(entry.accepted_text));
        entry.status = 'valid_unreviewed';
      } catch (error) {
        entry.status = 'request_or_validation_failed';
        entry.error = String(error);
        report.failures.push({ id: item.id, error: entry.error });
      }
      entry.finished_at = new Date().toISOString();
      await journal.write(`${JSON.stringify(entry)}\n`);
      await journal.sync();
      report.requests.push({ id: item.id, page: item.page,
        source_sha256: item.source_sha256,
        request_sha256: item.request_sha256, status: entry.status,
        accepted_text_sha256: entry.accepted_text_sha256 ?? null,
        usage: entry.usage ?? null,
        prompt_tokens_preflight: entry.prompt_tokens_preflight ?? null,
        chat_elapsed_ms: entry.chat?.elapsed_ms ?? null,
        preflight_count: entry.preflight.length });
      await save();
      console.log(`${item.id}: ${entry.status}`);
      if (entry.status !== 'valid_unreviewed') throw new Error(entry.error);
    }
  } finally {
    report.resources.server = await sampler.stop();
    await stopProcess(server);
    await fs.writeFile(path.join(workspace, 'server.log'),
      `${server.stdout}\n${server.stderr}\n`);
    server = null;
  }
  report.status = 'complete_unreviewed';
} catch (error) {
  report.status = 'failed_retained';
  report.failures.push({ stage: 'run', error: String(error) });
  if (server) await stopProcess(server);
  throw error;
} finally {
  report.finished_at = new Date().toISOString();
  report.elapsed_ms = Math.round(performance.now() - began);
  await save();
  await journal.close();
  console.log(`Private attempt: ${workspace}`);
}
