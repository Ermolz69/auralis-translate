import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { createReadStream } from 'node:fs';
import fs from 'node:fs/promises';
import path from 'node:path';
import { performance } from 'node:perf_hooks';
import { fileURLToPath } from 'node:url';
import { freeLoopbackPort, startProcess, stopProcess, waitForHealthyServer } from './local-process.mjs';
import { runtimeSampler } from './runtime-sampler.mjs';

assert.equal(process.platform, 'win32');
const mode = (process.argv[2] ?? 'probe').replace(/^--/u, '');
assert(['freeze', 'preflight', 'probe'].includes(mode));
assert(process.argv.length <= 3);
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const assetRoot = process.env.AURALIS_EVAL_ASSET_ROOT ?? root;
const sourcePath = path.join(root,
  '.cache/eval/youtube-geekerwan-vivo-original-caption/attempt-LQWxgw/source.zh.srt');
const originalPath = path.join(root,
  '.cache/eval/v8-vivo-original-long-v1/attempt-MAaX5T/report.json');
const priorJournalPath = path.join(root,
  '.cache/eval/reg066-authored-v8-screen-v1/attempt-LDeHdv/requests.jsonl');
const packPath = path.join(root,
  'eval/regressions/reg-066-vivo-v8-cross-model-facts-v1.json');
const runtimePath = path.join(assetRoot, '.cache/runtime/llama/llama-server.exe');
const freezePath = path.join(root,
  'eval/experiments/2026-10-09-reg066-natural-seams-freeze.json');
const digest = bytes => createHash('sha256').update(bytes).digest('hex');
const hashFile = async file => {
  const hash = createHash('sha256');
  for await (const chunk of createReadStream(file)) hash.update(chunk);
  return hash.digest('hex');
};
const pinned = {
  source: 'b100803367b95fa55fc638b1ff39a0abfa0d5b8183ebe58d58b1a87242d9d8c4',
  original: '84a737e1cc8c7b468ea66718f2507882929344f259d7824d9071953d24c1a5b5',
  prior_journal: '7ba723de6d16b771e7e3046e96df209025eace21c8a2c4d6a8316bf395d889ba',
  pack: '33b74c9a337acd931b87a4f101e54070c95a5ed69a40f04ab342768da24b061e',
  runtime: '6f15be27bd80b6b4d52afefa49094e18fcfab55d5da354d717971f2d2537b2f4',
  prompt_prefix: '1b4a2ae96e2526a2d096d41cd94215428d87e30db7ab614a222e65b6baac8ebb',
};
const models = [
  { id: '1_8b', file: 'Hy-MT2-1.8B-Q4_K_M.gguf',
    sha256: 'dc5f44fcf1fa496ee7ad725982c0c8c553a4de00259b53af84c4b89fb0c06699',
    manifest: 'hy_mt2_1_8b_q4_k_m.context_v8_target_first_batch4.experimental.json',
    manifest_sha256: '1803aeb68428e1b138a17ed72b01abe1cc5fbc5845b5bca66a402b8936b1081f' },
  { id: '7b', file: 'Hy-MT2-7B-Q4_K_M.gguf',
    sha256: '9f96256500f3fc1ab4d64336b58f52a949a95ad7516b0c229476eef782f9f77b',
    manifest: 'hy_mt2_7b_q4_k_m.context_v8_target_first_batch4.experimental.json',
    manifest_sha256: 'c287c53efbb4ce78471b64648ea3dd2f521363df0e168b7a61df1fdd6ae0479a' },
];
const limits = { natural_focus_cues: [60, 276, 280, 328, 466],
  natural_arms: ['original', 'shifted'], negative_controls: 5,
  chats: 30, preflights: 60, server_starts: 2, seed: 101, retries: 0,
  max_total_tokens: 100000, context_tokens: 2048,
  response_tokens: 1024, safety_tokens: 64,
  per_request_ms: 120000, per_preflight_ms: 30000,
  readiness_ms: 180000, max_wall_ms: 720000 };
assert.equal(await hashFile(sourcePath), pinned.source);
assert.equal(await hashFile(originalPath), pinned.original);
assert.equal(await hashFile(priorJournalPath), pinned.prior_journal);
assert.equal(await hashFile(packPath), pinned.pack);
assert.equal(await hashFile(runtimePath), pinned.runtime);
const pack = JSON.parse(await fs.readFile(packPath, 'utf8'));
assert.deepEqual(pack.model_response_reproducers.map(row => row.focus_cue),
  limits.natural_focus_cues);
const prior = JSON.parse(await fs.readFile(originalPath, 'utf8'));
const priorRows = prior.arms[1].requests;
const chatRows = priorRows.filter(row => row.request_kind === 'chat_completion');
const templateRows = priorRows.filter(row => row.request_kind === 'apply_template');
assert.equal(chatRows.length, 117);
assert.equal(templateRows.length, 117);
const marker = 'Input JSON:\n';
const firstPrompt = JSON.parse(chatRows[0].rendered_request).messages[0].content;
const prefix = firstPrompt.split(marker)[0];
assert.equal(digest(Buffer.from(prefix)), pinned.prompt_prefix);
const sourceSlots = new Map();
for (const row of chatRows) {
  const content = JSON.parse(row.rendered_request).messages[0].content;
  assert.equal(content.split(marker)[0], prefix);
  for (const slot of JSON.parse(content.split(marker)[1]).target_slots) {
    assert(!sourceSlots.has(slot.segment_id));
    sourceSlots.set(slot.segment_id, slot);
  }
}
assert.equal(sourceSlots.size, 467);
assert.deepEqual([...sourceSlots.keys()], Array.from({ length: 467 }, (_, i) => i + 1));
const sourceBlocks = (await fs.readFile(sourcePath, 'utf8')).trimEnd().split(/\r?\n\r?\n/u);
assert.equal(sourceBlocks.length, 467);
for (const slot of sourceSlots.values())
  assert(sourceBlocks[slot.segment_id - 1].includes(slot.source_original));
const negativeRows = (await fs.readFile(priorJournalPath, 'utf8')).trimEnd()
  .split('\n').map(JSON.parse).filter(row => row.model === '7b' && row.kind === 'negative');
assert.equal(negativeRows.length, limits.negative_controls);
assert.deepEqual(negativeRows.map(row => row.case_id),
  pack.negative_controls.map(row => row.id));
for (const model of models) {
  model.path = path.join(assetRoot, '.cache/models', model.file);
  model.manifest_path = path.join(root, 'models/manifests', model.manifest);
  assert.equal(await hashFile(model.path), model.sha256);
  assert.equal(await hashFile(model.manifest_path), model.manifest_sha256);
  const manifest = JSON.parse(await fs.readFile(model.manifest_path, 'utf8'));
  assert.equal(manifest.prompt_version, 8);
  assert.equal(manifest.target_segments_per_block, 4);
  assert.equal(manifest.model_file_sha256, model.sha256);
  model.alias = manifest.model_alias;
}
const contextSlot = id => {
  const { approved_terms, protected_facts, source_for_translation, ...source } =
    sourceSlots.get(id);
  assert.deepEqual(approved_terms, []);
  assert.deepEqual(protected_facts, []);
  assert.equal(source_for_translation, source.source_original);
  return source;
};
const makeNatural = (focus, variant) => {
  const original = chatRows.find(row => row.segment_id <= focus &&
    focus < row.segment_id + 4);
  assert(original);
  const first = variant === 'original' ? original.segment_id :
    original.segment_id + (focus === 466 ? -1 : 1);
  const count = Math.min(4, 468 - first);
  const ids = Array.from({ length: count }, (_, index) => first + index);
  assert(ids.includes(focus));
  const envelope = { schema_version: 7,
    target_slots: ids.map(id => sourceSlots.get(id)),
    source_context: [first - 1, first + count].filter(id => sourceSlots.has(id))
      .map(contextSlot) };
  if (variant === 'original') {
    const archived = JSON.parse(JSON.parse(original.rendered_request)
      .messages[0].content.split(marker)[1]);
    assert.deepEqual(envelope, archived);
  }
  return { case_id: `natural_${focus}`, kind: 'natural', variant, focus,
    source_ids: ids, prompt: `${prefix}${marker}${JSON.stringify(envelope)}`,
    original_request: JSON.parse(original.rendered_request),
    original_template: JSON.parse(templateRows.find(row =>
      row.segment_id === original.segment_id).rendered_request) };
};
const cases = limits.natural_focus_cues.flatMap(focus =>
  limits.natural_arms.map(variant => makeNatural(focus, variant)));
for (const row of negativeRows) {
  const control = pack.negative_controls.find(item => item.id === row.case_id);
  assert(control);
  assert.equal(row.source_lines.length, 4);
  assert.equal(row.source_lines.filter(line => line === control.source).length, 1);
  assert(row.source_lines.every(line => [control.source,
    '我们现在开始讨论。', '请继续说明。', '这个问题很重要。',
    '谢谢大家。'].includes(line)));
  cases.push({ case_id: row.case_id, kind: 'negative', variant: 'unchanged',
    focus_segment_ids: row.focus_segment_ids,
    prompt: row.request.messages[0].content,
    original_request: row.request,
    original_template: { messages: row.request.messages,
      model: row.request.model, response_format: row.request.response_format } });
}
assert.equal(cases.length, 15);
const planned = models.flatMap(model => cases.map(item => {
  const request = structuredClone(item.original_request);
  request.messages[0].content = item.prompt;
  request.model = model.alias;
  request.seed = limits.seed;
  const template = structuredClone(item.original_template);
  template.messages[0].content = item.prompt;
  template.model = model.alias;
  const requestSha = digest(Buffer.from(JSON.stringify(request)));
  const promptSha = digest(Buffer.from(item.prompt));
  const envelope = JSON.parse(item.prompt.split(marker)[1]);
  assert(!/\p{Script=Cyrillic}/u.test(item.prompt.split(marker)[1]));
  assert(envelope.target_slots.every(slot => slot.approved_terms.length === 0 &&
    slot.protected_facts.length === 0));
  return { model: model.id, case_id: item.case_id, kind: item.kind,
    variant: item.variant, focus: item.focus ?? null,
    focus_segment_ids: item.focus_segment_ids ?? [item.focus],
    source_ids: envelope.target_slots.map(slot => slot.segment_id),
    request_sha256: requestSha, prompt_sha256: promptSha, request, template };
}));
assert.equal(planned.length, limits.chats);
for (const left of planned.filter(row => row.model === '1_8b')) {
  const right = planned.find(row => row.model === '7b' &&
    row.case_id === left.case_id && row.variant === left.variant);
  assert(right);
  const paired = structuredClone(right.request);
  paired.model = left.request.model;
  assert.deepEqual(paired, left.request);
  assert.equal(right.prompt_sha256, left.prompt_sha256);
}
const freeze = { schema_version: 1,
  experiment: 'REG-066-natural-seams-two-model-2026-10-09-v1',
  split: 'known_natural_development_not_holdout', pinned, limits,
  models: models.map(({ id, sha256, manifest_sha256, alias }) =>
    ({ id, sha256, manifest_sha256, alias })),
  requests: planned.map(({ model, case_id, kind, variant, focus,
    focus_segment_ids, source_ids, prompt_sha256, request_sha256 }) =>
    ({ model, case_id, kind, variant, focus, focus_segment_ids,
      source_ids, prompt_sha256, request_sha256 })) };
const freezeBytes = `${JSON.stringify(freeze, null, 2)}\n`;
if (mode === 'freeze') {
  await fs.writeFile(freezePath, freezeBytes, { flag: 'wx' });
  console.log(`REG-066 natural seams frozen: ${planned.length} requests; ${digest(Buffer.from(freezeBytes))}`);
  process.exit(0);
}
assert.equal(await fs.readFile(freezePath, 'utf8'), freezeBytes);
if (mode === 'preflight') {
  console.log(`REG-066 natural seams preflight: ${planned.length} requests, no model calls`);
  process.exit(0);
}

const parent = path.join(root, '.cache/eval/reg066-natural-seams-v1');
await fs.mkdir(parent, { recursive: true });
const workspace = await fs.mkdtemp(path.join(parent, 'attempt-'));
const journal = await fs.open(path.join(workspace, 'requests.jsonl'), 'wx');
const reportPath = path.join(workspace, 'report.json');
const started = performance.now();
const report = { schema_version: 1, experiment: freeze.experiment,
  status: 'running', started_at: new Date().toISOString(),
  git_head: execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root,
    encoding: 'utf8' }).trim(),
  git_status: execFileSync('git', ['status', '--short'], { cwd: root,
    encoding: 'utf8' }).trim(),
  harness_sha256: await hashFile(fileURLToPath(import.meta.url)),
  freeze_sha256: digest(Buffer.from(freezeBytes)), pinned, limits,
  planned_requests: freeze.requests, requests: [], resources: {},
  failures: [], total_tokens: 0 };
const save = () => fs.writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`);
const remaining = () => {
  const ms = limits.max_wall_ms - (performance.now() - started);
  assert(ms > 0, 'Declared wall budget exhausted');
  return ms;
};
const post = async (url, endpoint, body, timeoutMs) => {
  const request = Buffer.from(JSON.stringify(body));
  const began = performance.now();
  const response = await fetch(`${url}${endpoint}`, { method: 'POST',
    headers: { 'content-type': 'application/json' }, body: request,
    signal: AbortSignal.timeout(Math.min(timeoutMs, remaining())) });
  return { endpoint, request_sha256: digest(request),
    request: body, http_status: response.status,
    raw_response: await response.text(),
    elapsed_ms: Math.round(performance.now() - began) };
};
let server;
try {
  await save();
  for (const model of models) {
    const port = await freeLoopbackPort();
    const url = `http://127.0.0.1:${port}/`;
    const args = ['--model', model.path, '--alias', model.alias,
      '--host', '127.0.0.1', '--port', String(port), '-c', '2048', '-ngl', '99',
      '--parallel', '1', '--jinja', '--cache-ram', '0'];
    const runtimeEnv = { ...process.env, PATH: `${path.dirname(runtimePath)};${path.join(assetRoot,
      '.cache/runtime/cudart')};${process.env.PATH}` };
    server = startProcess(runtimePath, args, root, runtimeEnv,
      { maxCaptureCharacters: 4 * 1024 * 1024 });
    await waitForHealthyServer(url, server,
      Math.min(limits.readiness_ms, remaining()));
    const sampler = runtimeSampler(path.join(workspace,
      `${model.id}-resources.jsonl`), root, () => [server.child.pid]);
    try {
      for (const item of planned.filter(row => row.model === model.id)) {
        assert(report.requests.length < limits.chats);
        const entry = { model: model.id, case_id: item.case_id,
          kind: item.kind, variant: item.variant, focus: item.focus,
          focus_segment_ids: item.focus_segment_ids,
          source_ids: item.source_ids,
          request_sha256: item.request_sha256,
          prompt_sha256: item.prompt_sha256, request: item.request,
          started_at: new Date().toISOString(), preflight: [], status: 'running' };
        try {
          const template = await post(url, 'apply-template', item.template,
            limits.per_preflight_ms);
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
          assert(Array.isArray(tokens) && tokens.length > 0);
          assert(tokens.length <= limits.context_tokens - limits.response_tokens -
            limits.safety_tokens, 'Rendered prompt exceeds declared budget');
          entry.prompt_tokens_preflight = tokens.length;
          const chat = await post(url, 'v1/chat/completions', item.request,
            limits.per_request_ms);
          entry.chat = chat;
          assert.equal(chat.request_sha256, item.request_sha256);
          const parsed = JSON.parse(chat.raw_response);
          entry.usage = parsed.usage ?? null;
          entry.finish_reason = parsed.choices?.[0]?.finish_reason ?? null;
          entry.raw_candidate = parsed.choices?.[0]?.message?.content ?? null;
          report.total_tokens += (entry.usage?.prompt_tokens ?? 0) +
            (entry.usage?.completion_tokens ?? 0);
          assert(report.total_tokens <= limits.max_total_tokens,
            'Declared token budget exhausted');
          try {
            assert.equal(chat.http_status, 200);
            assert.equal(entry.finish_reason, 'stop');
            const translations = JSON.parse(entry.raw_candidate).translations;
            assert.deepEqual(translations.map(row => row.segment_id), item.source_ids);
            assert(translations.every(row => row.line_index === 0 &&
              typeof row.text === 'string' && row.text.trim() &&
              !/[\p{Cc}\p{Cf}]/u.test(row.text)));
            entry.translations = translations;
            entry.status = 'valid_unreviewed';
          } catch (error) {
            entry.status = 'invalid_unreviewed';
            entry.validation_error = String(error);
          }
        } catch (error) {
          entry.status = 'request_or_budget_failed';
          entry.error = String(error);
          report.failures.push({ model: model.id, case_id: item.case_id,
            variant: item.variant, message: String(error) });
        }
        entry.finished_at = new Date().toISOString();
        await journal.write(`${JSON.stringify(entry)}\n`);
        await journal.sync();
        report.requests.push({ model: model.id, case_id: item.case_id,
          kind: item.kind, variant: item.variant, focus: item.focus,
          focus_segment_ids: item.focus_segment_ids,
          source_ids: item.source_ids, request_sha256: item.request_sha256,
          prompt_sha256: item.prompt_sha256, status: entry.status,
          prompt_tokens_preflight: entry.prompt_tokens_preflight ?? null,
          usage: entry.usage ?? null, translations: entry.translations ?? null,
          preflight_count: entry.preflight.length,
          chat_elapsed_ms: entry.chat?.elapsed_ms ?? null });
        await save();
        console.log(`${model.id} ${item.case_id} ${item.variant}: ${entry.status}`);
        if (entry.status === 'request_or_budget_failed') throw new Error(entry.error);
      }
    } finally {
      report.resources[model.id] = await sampler.stop();
      await stopProcess(server);
      await fs.writeFile(path.join(workspace, `${model.id}-server.log`),
        `${server.stdout}\n${server.stderr}\n`);
      server = null;
      await save();
    }
  }
  assert.equal(report.requests.length, limits.chats);
  assert.equal(report.requests.reduce((sum, row) => sum + row.preflight_count, 0),
    limits.preflights);
  report.status = report.requests.every(row => row.status === 'valid_unreviewed')
    ? 'complete_structural_observations_unreviewed'
    : 'complete_with_invalid_responses_unreviewed';
} catch (error) {
  report.status = 'failed';
  report.failures.push({ message: String(error) });
  process.exitCode = 1;
} finally {
  if (server) await stopProcess(server);
  report.finished_at = new Date().toISOString();
  report.wall_elapsed_ms = Math.round(performance.now() - started);
  await save();
  await journal.close();
  console.log(`REG-066 natural seams ${report.status}: ${reportPath}`);
}
