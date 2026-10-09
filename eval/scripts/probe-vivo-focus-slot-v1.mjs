import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { createReadStream } from 'node:fs';
import fs from 'node:fs/promises';
import path from 'node:path';
import { performance } from 'node:perf_hooks';
import { fileURLToPath } from 'node:url';
import { isolateFocusSlot } from './focus-slot-v1.mjs';
import { freeLoopbackPort, startProcess, stopProcess,
  waitForHealthyServer } from './local-process.mjs';
import { runtimeSampler } from './runtime-sampler.mjs';

assert.equal(process.platform, 'win32');
const mode = (process.argv[2] ?? 'probe').replace(/^--/u, '');
assert(['freeze', 'preflight', 'probe'].includes(mode));
assert(process.argv.length <= 3);
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const sourceRoot = process.env.AURALIS_EVAL_ASSET_ROOT ?? root;
const modelRoot = process.env.AURALIS_MODEL_ASSET_ROOT ?? root;
const freezePath = path.join(root,
  'eval/experiments/2026-10-10-vivo-focus-slot-v1-freeze.json');
const sourcePath = path.join(sourceRoot,
  '.cache/eval/v8-vivo-original-long-v1/attempt-MAaX5T/7b/source.zh.srt');
const priorPath = path.join(sourceRoot,
  '.cache/eval/source-fact-hints-v1/attempt-HtkAPR/requests.jsonl');
const runtimePath = path.join(modelRoot,
  '.cache/runtime/llama/llama-server.exe');
const modelPath = path.join(modelRoot,
  '.cache/models/Hy-MT2-7B-Q4_K_M.gguf');
const manifestPath = path.join(root,
  'models/manifests/hy_mt2_7b_q4_k_m.context_v8_target_first_batch4.experimental.json');
const helperPath = path.join(root, 'eval/scripts/focus-slot-v1.mjs');
const pinned = {
  source: 'b100803367b95fa55fc638b1ff39a0abfa0d5b8183ebe58d58b1a87242d9d8c4',
  prior_journal: '72e52f740ffa1b4dce7e88168a6872eb2687ab44e1f39fd19e0316a10b8f767f',
  model: '9f96256500f3fc1ab4d64336b58f52a949a95ad7516b0c229476eef782f9f77b',
  manifest: 'c287c53efbb4ce78471b64648ea3dd2f521363df0e168b7a61df1fdd6ae0479a',
  runtime: '6f15be27bd80b6b4d52afefa49094e18fcfab55d5da354d717971f2d2537b2f4',
};
const limits = { cases: 10, arms: ['batch', 'focus'], chats: 20,
  preflights: 40, server_starts: 1, seed: 101, retries: 0,
  max_total_tokens: 60000, context_tokens: 2048,
  response_tokens: 1024, safety_tokens: 64,
  per_request_ms: 120000, per_preflight_ms: 30000,
  readiness_ms: 180000, max_wall_ms: 600000 };
const caseFocus = [
  ['natural_60', 60], ['natural_276', 276],
  ['natural_280', 280], ['natural_328', 328],
  ['natural_466', 466], ['explicit_first_generation', 1022],
  ['thirty_six_months_after_start', 1027],
  ['money_and_team_both_explicit', 1032],
  ['eleven_twelve_at_night', 1033],
  ['products_already_available', 1038],
];
const digest = bytes => createHash('sha256').update(bytes).digest('hex');
const hashFile = async file => {
  const hash = createHash('sha256');
  for await (const chunk of createReadStream(file)) hash.update(chunk);
  return hash.digest('hex');
};

const [sourceBytes, priorBytes, modelSha, runtimeSha, manifestSha,
  helperSha, harnessSha] = await Promise.all([
  fs.readFile(sourcePath), fs.readFile(priorPath), hashFile(modelPath),
  hashFile(runtimePath), hashFile(manifestPath), hashFile(helperPath),
  hashFile(fileURLToPath(import.meta.url)),
]);
assert.equal(digest(sourceBytes), pinned.source);
assert.equal(digest(priorBytes), pinned.prior_journal);
assert.equal(modelSha, pinned.model);
assert.equal(runtimeSha, pinned.runtime);
assert.equal(manifestSha, pinned.manifest);
const manifest = JSON.parse(await fs.readFile(manifestPath, 'utf8'));
assert.equal(manifest.prompt_version, 8);
assert.equal(manifest.target_segments_per_block, 4);
assert.equal(manifest.model_file_sha256, pinned.model);
const sourceBlocks = sourceBytes.toString('utf8').replace(/^\uFEFF/u, '')
  .trimEnd().split(/\r?\n\r?\n/u);
assert.equal(sourceBlocks.length, 467);
const sourceTexts = sourceBlocks.map((block, index) => {
  const lines = block.split(/\r?\n/u);
  assert.equal(Number(lines[0]), index + 1);
  return lines.slice(2).join('\n');
});
const previous = priorBytes.toString('utf8').trimEnd()
  .split('\n').map(JSON.parse);
assert.equal(previous.length, 36);
const planned = caseFocus.flatMap(([caseId, focusId], index) => {
  const saved = previous.filter(row => row.case_id === caseId &&
    row.arm === 'baseline');
  assert.equal(saved.length, 1);
  assert.equal(saved[0].status, 'valid_unreviewed');
  const batch = structuredClone(saved[0].request);
  assert.equal(batch.seed, limits.seed);
  assert.equal(batch.model, manifest.model_alias);
  assert.equal(digest(Buffer.from(JSON.stringify(batch))),
    saved[0].request_sha256);
  const focused = isolateFocusSlot(batch, focusId);
  for (const cue of focused.sourceInventory) {
    if (cue.segment_id <= sourceTexts.length)
      assert.equal(cue.source_original, sourceTexts[cue.segment_id - 1]);
  }
  assert(focused.baselineTargetIds.length > 1);
  const requests = { batch, focus: focused.request };
  const order = index % 2 === 0 ? ['batch', 'focus']
    : ['focus', 'batch'];
  return order.map(arm => {
    const request = requests[arm];
    const targetIds = arm === 'batch'
      ? focused.baselineTargetIds : [focusId];
    return { case_id: caseId, family: saved[0].family, focus_id: focusId,
      arm, target_ids: targetIds, request,
      request_sha256: digest(Buffer.from(JSON.stringify(request))),
      prompt_sha256: digest(Buffer.from(request.messages[0].content)),
      source_inventory_sha256: digest(Buffer.from(
        JSON.stringify(focused.sourceInventory))),
      template: { messages: request.messages, model: request.model,
        response_format: request.response_format } };
  });
});
assert.equal(planned.length, limits.chats);
const freeze = { schema_version: 1,
  experiment: 'vivo-focus-slot-v1-7b-paired-2026-10-10',
  split: 'known_natural_and_authored_development_not_holdout',
  pinned: { ...pinned, helper: helperSha, harness: harnessSha },
  limits, model_alias: manifest.model_alias,
  requests: planned.map(({ case_id, family, focus_id, arm, target_ids,
    request_sha256, prompt_sha256, source_inventory_sha256 }) =>
    ({ case_id, family, focus_id, arm, target_ids,
      request_sha256, prompt_sha256, source_inventory_sha256 })) };
const freezeBytes = `${JSON.stringify(freeze, null, 2)}\n`;
if (mode === 'freeze') {
  await fs.writeFile(freezePath, freezeBytes, { flag: 'wx' });
  console.log(`Focus-slot screen frozen: ${planned.length} requests, ${digest(Buffer.from(freezeBytes))}`);
  process.exit(0);
}
assert.equal(await fs.readFile(freezePath, 'utf8'), freezeBytes);
if (mode === 'preflight') {
  console.log(`Focus-slot screen preflight: ${planned.length} paired requests, no model calls`);
  process.exit(0);
}

const parent = path.join(root, '.cache/eval/vivo-focus-slot-v1');
await fs.mkdir(parent, { recursive: true });
const workspace = await fs.mkdtemp(path.join(parent, 'attempt-'));
const journal = await fs.open(path.join(workspace, 'requests.jsonl'), 'wx');
const reportPath = path.join(workspace, 'report.json');
const started = performance.now();
const report = { schema_version: 1, experiment: freeze.experiment,
  status: 'running', started_at: new Date().toISOString(),
  git_head: execFileSync('git', ['rev-parse', 'HEAD'],
    { cwd: root, encoding: 'utf8' }).trim(),
  git_status: execFileSync('git', ['status', '--short'],
    { cwd: root, encoding: 'utf8' }).trim(),
  freeze_sha256: digest(Buffer.from(freezeBytes)),
  harness_sha256: harnessSha, helper_sha256: helperSha,
  pinned, limits, planned_requests: freeze.requests,
  requests: [], resources: {}, failures: [], total_tokens: 0 };
const save = () => fs.writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`);
const remaining = () => {
  const ms = limits.max_wall_ms - (performance.now() - started);
  assert(ms > 0, 'declared wall budget exhausted');
  return ms;
};
const post = async (url, endpoint, body, timeoutMs) => {
  const request = Buffer.from(JSON.stringify(body));
  const began = performance.now();
  const response = await fetch(`${url}${endpoint}`, { method: 'POST',
    headers: { 'content-type': 'application/json' }, body: request,
    signal: AbortSignal.timeout(Math.min(timeoutMs, remaining())) });
  return { endpoint, request_sha256: digest(request), request: body,
    http_status: response.status, raw_response: await response.text(),
    elapsed_ms: Math.round(performance.now() - began) };
};
let server;
try {
  await save();
  const port = await freeLoopbackPort();
  const url = `http://127.0.0.1:${port}/`;
  const args = ['--model', modelPath, '--alias', manifest.model_alias,
    '--host', '127.0.0.1', '--port', String(port), '-c', '2048', '-ngl', '99',
    '--parallel', '1', '--jinja', '--cache-ram', '0'];
  const runtimeEnv = { ...process.env, PATH: `${path.dirname(runtimePath)};${path.join(modelRoot,
    '.cache/runtime/cudart')};${process.env.PATH}` };
  server = startProcess(runtimePath, args, root, runtimeEnv,
    { maxCaptureCharacters: 4 * 1024 * 1024 });
  await waitForHealthyServer(url, server,
    Math.min(limits.readiness_ms, remaining()));
  const sampler = runtimeSampler(path.join(workspace,
    '7b-resources.jsonl'), root, () => [server.child.pid]);
  try {
    for (const item of planned) {
      assert(report.requests.length < limits.chats);
      const entry = { case_id: item.case_id, family: item.family,
        focus_id: item.focus_id, arm: item.arm,
        target_ids: item.target_ids, request_sha256: item.request_sha256,
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
          limits.safety_tokens, 'rendered prompt exceeds declared budget');
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
          'declared token budget exhausted');
        assert.equal(chat.http_status, 200);
        assert.equal(entry.finish_reason, 'stop');
        const translations = JSON.parse(entry.raw_candidate).translations;
        assert.deepEqual(translations.map(row => row.segment_id), item.target_ids);
        assert(translations.every(row => row.line_index === 0 &&
          typeof row.text === 'string' && row.text.trim() &&
          !/[\p{Cc}\p{Cf}{}\[\]]/u.test(row.text)));
        entry.translations = translations;
        entry.status = 'valid_unreviewed';
      } catch (error) {
        entry.status = 'invalid_or_request_failed';
        entry.error = String(error);
        report.failures.push({ case_id: item.case_id, arm: item.arm,
          message: String(error) });
      }
      entry.finished_at = new Date().toISOString();
      await journal.write(`${JSON.stringify(entry)}\n`);
      await journal.sync();
      report.requests.push({ case_id: item.case_id, family: item.family,
        focus_id: item.focus_id, arm: item.arm,
        target_ids: item.target_ids, request_sha256: item.request_sha256,
        prompt_sha256: item.prompt_sha256, status: entry.status,
        prompt_tokens_preflight: entry.prompt_tokens_preflight ?? null,
        usage: entry.usage ?? null, translations: entry.translations ?? null,
        preflight_count: entry.preflight.length,
        chat_elapsed_ms: entry.chat?.elapsed_ms ?? null });
      await save();
      console.log(`${item.case_id} ${item.arm}: ${entry.status}`);
      if (entry.status !== 'valid_unreviewed') throw new Error(entry.error);
    }
  } finally {
    report.resources.model_7b = await sampler.stop();
    await stopProcess(server);
    await fs.writeFile(path.join(workspace, '7b-server.log'),
      `${server.stdout}\n${server.stderr}\n`);
    server = null;
    await save();
  }
  assert.equal(report.requests.length, limits.chats);
  assert.equal(report.requests.reduce((sum, row) =>
    sum + row.preflight_count, 0), limits.preflights);
  report.status = 'complete_structural_observations_unreviewed';
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
  console.log(`Focus-slot screen ${report.status}: ${reportPath}`);
}
