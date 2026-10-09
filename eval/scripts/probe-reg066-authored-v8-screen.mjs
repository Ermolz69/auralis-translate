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
const packPath = path.join(root, 'eval/regressions/reg-066-vivo-v8-cross-model-facts-v1.json');
const catalogPath = path.join(root, 'eval/regressions/catalog-v46.json');
const oldReportPath = path.join(root, '.cache/eval/v8-vivo-original-long-v1/attempt-MAaX5T/report.json');
const runtimePath = path.join(assetRoot, '.cache/runtime/llama/llama-server.exe');
const freezePath = path.join(root, 'eval/experiments/2026-10-09-reg066-authored-v8-screen-freeze.json');
const digest = bytes => createHash('sha256').update(bytes).digest('hex');
const hashFile = async file => {
  const hash = createHash('sha256');
  for await (const chunk of createReadStream(file)) hash.update(chunk);
  return hash.digest('hex');
};
const pinned = {
  pack: '33b74c9a337acd931b87a4f101e54070c95a5ed69a40f04ab342768da24b061e',
  catalog: '93933952cae2533230e67ee040caad98dd97e12d8ac13839ae5b9af3bcaa83cd',
  old_report: '84a737e1cc8c7b468ea66718f2507882929344f259d7824d9071953d24c1a5b5',
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
const limits = { cases: 10, chats: 20, preflights: 40, server_starts: 2,
  seed: 101, retries: 0, max_total_tokens: 100000,
  context_tokens: 2048, response_tokens: 1024, safety_tokens: 64,
  per_request_ms: 120000, per_preflight_ms: 30000,
  readiness_ms: 180000, max_wall_ms: 720000 };
assert.equal(await hashFile(packPath), pinned.pack);
assert.equal(await hashFile(catalogPath), pinned.catalog);
assert.equal(await hashFile(oldReportPath), pinned.old_report);
assert.equal(await hashFile(runtimePath), pinned.runtime);
const pack = JSON.parse(await fs.readFile(packPath, 'utf8'));
assert.equal(pack.id, 'REG-066');
const controls = [...pack.related_controls.map(row => ({ ...row, kind: 'related' })),
  ...pack.negative_controls.map(row => ({ ...row, kind: 'negative' }))];
assert.equal(controls.length, limits.cases);
assert.equal(new Set(controls.map(row => row.id)).size, limits.cases);
const old = JSON.parse(await fs.readFile(oldReportPath, 'utf8'));
const marker = 'Input JSON:\n';
const firstChats = old.arms.map(arm => arm.requests.find(row =>
  row.request_kind === 'chat_completion'));
const firstTemplates = old.arms.map(arm => arm.requests.find(row =>
  row.request_kind === 'apply_template'));
const prefix = JSON.parse(firstChats[0].rendered_request).messages[0].content.split(marker)[0];
assert.equal(digest(Buffer.from(prefix)), pinned.prompt_prefix);
assert(firstChats.every(row => JSON.parse(row.rendered_request).messages[0].content
  .split(marker)[0] === prefix));
assert(firstChats.every(row => JSON.parse(JSON.parse(row.rendered_request)
  .messages[0].content.split(marker)[1]).schema_version === 7));
const neutralZh = ['我们现在开始讨论。', '请继续说明。', '这个问题很重要。', '谢谢大家。'];
assert.equal(neutralZh.length, 4);
const cases = controls.map((control, index) => {
  const lines = [...neutralZh];
  const focus = control.source_lines ? [1, 2] : [index % 4];
  if (control.source_lines) {
    assert.equal(control.source_lines.length, 2);
    lines[1] = control.source_lines[0];
    lines[2] = control.source_lines[1];
  } else {
    assert.equal(typeof control.source, 'string');
    lines[focus[0]] = control.source;
  }
  const targetSlots = lines.map((source, position) => {
    const start = index * 10000 + position * 2000;
    return { approved_terms: [], end_ms: start + 1500,
      line_index: 0, protected_facts: [], segment_id: 1001 + index * 4 + position,
      source_for_translation: source, source_original: source, start_ms: start };
  });
  return { id: control.id, kind: control.kind, source_lines: lines,
    focus_segment_ids: focus.map(position => targetSlots[position].segment_id),
    envelope: { schema_version: 7, target_slots: targetSlots, source_context: [] } };
});
const planned = models.flatMap((model, modelIndex) => cases.map((control, index) => {
  const original = JSON.parse(firstChats[modelIndex].rendered_request);
  const template = JSON.parse(firstTemplates[modelIndex].rendered_request);
  const prompt = `${prefix}${marker}${JSON.stringify(control.envelope)}`;
  assert(!/\p{Script=Cyrillic}/u.test(prompt.split(marker)[1]));
  assert(!prompt.includes(controls[index].expected));
  original.messages[0].content = prompt;
  original.seed = limits.seed;
  template.messages[0].content = prompt;
  const body = Buffer.from(JSON.stringify(original));
  return { model: model.id, case_id: control.id, kind: control.kind,
    focus_segment_ids: control.focus_segment_ids,
    prompt_sha256: digest(Buffer.from(prompt)),
    request_sha256: digest(body), request: original, template,
    body, source_lines: control.source_lines };
}));
assert.equal(planned.length, limits.chats);
for (const left of planned.filter(row => row.model === '1_8b')) {
  const right = planned.find(row => row.model === '7b' && row.case_id === left.case_id);
  assert(right);
  const normalized = structuredClone(right.request);
  normalized.model = left.request.model;
  assert.deepEqual(normalized, left.request,
    'Paired v8 requests differ beyond the model alias');
  assert.equal(right.prompt_sha256, left.prompt_sha256);
}
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
const freeze = { schema_version: 1,
  experiment: 'REG-066-authored-v8-two-model-2026-10-09-v1',
  split: 'known_authored_development_not_holdout', pinned, limits,
  models: models.map(({ id, sha256, manifest_sha256, alias }) =>
    ({ id, sha256, manifest_sha256, alias })),
  requests: planned.map(({ model, case_id, kind, focus_segment_ids,
    prompt_sha256, request_sha256 }) => ({ model, case_id, kind,
    focus_segment_ids, prompt_sha256, request_sha256 })) };
const freezeBytes = `${JSON.stringify(freeze, null, 2)}\n`;
if (mode === 'freeze') {
  await fs.writeFile(freezePath, freezeBytes, { flag: 'wx' });
  console.log(`REG-066 freeze written: 20 paired request identities; ${digest(Buffer.from(freezeBytes))}`);
  process.exit(0);
}
assert.equal(await fs.readFile(freezePath, 'utf8'), freezeBytes);
if (mode === 'preflight') {
  console.log(`REG-066 preflight verified: 10 authored controls, 20 chats, 40 preflights; ${digest(Buffer.from(freezeBytes))}`);
  process.exit(0);
}

const parent = path.join(root, '.cache/eval/reg066-authored-v8-screen-v1');
await fs.mkdir(parent, { recursive: true });
const workspace = await fs.mkdtemp(path.join(parent, 'attempt-'));
const reportPath = path.join(workspace, 'report.json');
const journal = await fs.open(path.join(workspace, 'requests.jsonl'), 'wx');
const started = performance.now();
const report = { schema_version: 1, experiment: freeze.experiment,
  status: 'running', started_at: new Date().toISOString(),
  git_head: execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root,
    encoding: 'utf8' }).trim(),
  git_status: execFileSync('git', ['status', '--short'], { cwd: root,
    encoding: 'utf8' }).trim(),
  harness_sha256: await hashFile(fileURLToPath(import.meta.url)),
  freeze_sha256: digest(Buffer.from(freezeBytes)), pinned, limits,
  planned_requests: freeze.requests, requests: [],
  resources: {}, failures: [], total_tokens: 0 };
const save = () => fs.writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`);
const remaining = () => {
  const ms = limits.max_wall_ms - (performance.now() - started);
  assert(ms > 0, 'Declared wall budget exhausted');
  return ms;
};
const post = async (url, endpoint, body, timeoutMs) => {
  const bytes = Buffer.from(JSON.stringify(body));
  const began = performance.now();
  const response = await fetch(`${url}${endpoint}`, { method: 'POST',
    headers: { 'content-type': 'application/json' }, body: bytes,
    signal: AbortSignal.timeout(Math.min(timeoutMs, remaining())) });
  return { endpoint, request_sha256: digest(bytes),
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
          kind: item.kind, focus_segment_ids: item.focus_segment_ids,
          source_lines: item.source_lines,
          request_sha256: item.request_sha256,
          prompt_sha256: item.prompt_sha256,
          request: item.request, started_at: new Date().toISOString(),
          preflight: [], status: 'running' };
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
            const ids = item.request.messages[0].content.split(marker)[1];
            const expectedIds = JSON.parse(ids).target_slots.map(slot => slot.segment_id);
            assert.deepEqual(translations.map(row => row.segment_id), expectedIds);
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
            message: String(error) });
        }
        entry.finished_at = new Date().toISOString();
        await journal.write(`${JSON.stringify(entry)}\n`);
        await journal.sync();
        report.requests.push({ model: model.id, case_id: item.case_id,
          kind: item.kind, focus_segment_ids: item.focus_segment_ids,
          request_sha256: item.request_sha256,
          prompt_sha256: item.prompt_sha256, status: entry.status,
          prompt_tokens_preflight: entry.prompt_tokens_preflight ?? null,
          usage: entry.usage ?? null,
          translations: entry.translations ?? null,
          preflight_count: entry.preflight.length,
          chat_elapsed_ms: entry.chat?.elapsed_ms ?? null });
        await save();
        console.log(`${model.id} ${item.case_id}: ${entry.status}`);
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
  console.log(`REG-066 authored screen ${report.status}: ${reportPath}`);
}
