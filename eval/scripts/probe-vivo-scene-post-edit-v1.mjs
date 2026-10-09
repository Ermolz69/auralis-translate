import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { createReadStream } from 'node:fs';
import fs from 'node:fs/promises';
import path from 'node:path';
import { performance } from 'node:perf_hooks';
import { fileURLToPath } from 'node:url';
import { parsePinnedSrt } from './cross-source-relation-screen.mjs';
import { buildScenePostEditRequest, validateScenePostEditReply } from
  './vivo-scene-post-edit-v1.mjs';
import { freeLoopbackPort, startProcess, stopProcess,
  waitForHealthyServer } from './local-process.mjs';
import { runtimeSampler } from './runtime-sampler.mjs';

assert.equal(process.platform, 'win32');
const mode = process.argv[2];
assert(['--freeze', '--preflight', '--probe'].includes(mode) &&
  process.argv.length === 3);
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const assetRoot = process.env.AURALIS_EVAL_ASSET_ROOT;
const modelRoot = process.env.AURALIS_MODEL_ASSET_ROOT;
assert(assetRoot && path.isAbsolute(assetRoot));
assert(modelRoot && path.isAbsolute(modelRoot));
const base = path.join(assetRoot,
  '.cache/eval/v8-vivo-original-long-v1/attempt-MAaX5T/7b');
const sourcePath = path.join(base, 'source.zh.srt');
const draftPath = path.join(base, 'candidate.ru.srt');
const journalPath = path.join(assetRoot,
  '.cache/eval/source-fact-hints-v1/attempt-HtkAPR/requests.jsonl');
const modelPath = path.join(modelRoot,
  '.cache/models/Hy-MT2-7B-Q4_K_M.gguf');
const runtimePath = path.join(modelRoot,
  '.cache/runtime/llama/llama-server.exe');
const manifestPath = path.join(root,
  'models/manifests/hy_mt2_7b_q4_k_m.context_v8_target_first_batch4.experimental.json');
const helperPath = path.join(root, 'eval/scripts/vivo-scene-post-edit-v1.mjs');
const freezePath = path.join(root,
  'eval/experiments/2026-10-10-vivo-scene-post-edit-v1-freeze.json');
const digest = bytes => createHash('sha256').update(bytes).digest('hex');
const hashFile = async file => {
  const hash = createHash('sha256');
  for await (const chunk of createReadStream(file)) hash.update(chunk);
  return hash.digest('hex');
};
const pinned = {
  source: 'b100803367b95fa55fc638b1ff39a0abfa0d5b8183ebe58d58b1a87242d9d8c4',
  draft: '4451868ea3e7cbb3ed81f3d24b5f85bc61a749168b213c54c88ae552208c4831',
  prior_journal: '72e52f740ffa1b4dce7e88168a6872eb2687ab44e1f39fd19e0316a10b8f767f',
  model: '9f96256500f3fc1ab4d64336b58f52a949a95ad7516b0c229476eef782f9f77b',
  runtime: '6f15be27bd80b6b4d52afefa49094e18fcfab55d5da354d717971f2d2537b2f4',
  manifest: 'c287c53efbb4ce78471b64648ea3dd2f521363df0e168b7a61df1fdd6ae0479a',
};
const limits = { cases: 10, chats: 10, preflights: 20,
  server_starts: 1, seed: 101, retries: 0,
  max_total_tokens: 40000, context_tokens: 2048,
  response_tokens: 1024, safety_tokens: 64,
  per_request_ms: 120000, per_preflight_ms: 30000,
  readiness_ms: 180000, max_wall_ms: 480000 };
const natural = [
  { id: 'natural_9400', start: 57, end: 60 },
  { id: 'natural_planning', start: 273, end: 277 },
  { id: 'natural_team', start: 278, end: 282 },
  { id: 'natural_midnight', start: 325, end: 329 },
  { id: 'natural_future', start: 464, end: 467 },
];
const negative = [
  'explicit_first_generation', 'thirty_six_months_after_start',
  'money_and_team_both_explicit', 'eleven_twelve_at_night',
  'products_already_available',
];
const [sourceBytes, draftBytes, journalBytes, modelSha, runtimeSha,
  manifestSha, helperSha, harnessSha] = await Promise.all([
  fs.readFile(sourcePath), fs.readFile(draftPath), fs.readFile(journalPath),
  hashFile(modelPath), hashFile(runtimePath), hashFile(manifestPath),
  hashFile(helperPath), hashFile(fileURLToPath(import.meta.url)),
]);
assert.equal(digest(sourceBytes), pinned.source);
assert.equal(digest(draftBytes), pinned.draft);
assert.equal(digest(journalBytes), pinned.prior_journal);
assert.equal(modelSha, pinned.model);
assert.equal(runtimeSha, pinned.runtime);
assert.equal(manifestSha, pinned.manifest);
const manifest = JSON.parse(await fs.readFile(manifestPath));
assert.equal(manifest.model_file_sha256, pinned.model);
assert.equal(manifest.prompt_version, 8);
const source = parsePinnedSrt(sourceBytes);
const draft = parsePinnedSrt(draftBytes);
assert.equal(source.length, 467);
assert.equal(draft.length, source.length);
for (let i = 0; i < source.length; i += 1) {
  assert.equal(draft[i].id, source[i].id);
  assert.equal(draft[i].timing, source[i].timing);
}
const previous = journalBytes.toString('utf8').trimEnd()
  .split(/\r?\n/u).map(JSON.parse);
assert.equal(previous.length, 36);
const requests = [];
for (const item of natural) {
  const targets = [];
  const context = [];
  for (let id = Math.max(1, item.start - 2);
    id <= Math.min(source.length, item.end + 2); id += 1) {
    const cue = { segment_id: id, line_index: 0,
      source_original: source[id - 1].text };
    if (id >= item.start && id <= item.end)
      targets.push({ ...cue, draft_ru: draft[id - 1].text });
    else context.push(cue);
  }
  requests.push({ case_id: item.id, family: 'natural', targets, context });
}
for (const id of negative) {
  const matches = previous.filter(row => row.case_id === id &&
    row.arm === 'baseline');
  assert.equal(matches.length, 1);
  const row = matches[0];
  assert.equal(row.status, 'valid_unreviewed');
  assert.equal(digest(Buffer.from(JSON.stringify(row.request))),
    row.request_sha256);
  const parts = row.request.messages[0].content.split('Input JSON:\n');
  assert.equal(parts.length, 2);
  const original = JSON.parse(parts[1]);
  assert.deepEqual(original.target_slots.map(cue => cue.segment_id),
    row.target_ids);
  assert.deepEqual(row.translations.map(cue => cue.segment_id), row.target_ids);
  const targets = original.target_slots.map((cue, index) => ({
    segment_id: cue.segment_id, line_index: cue.line_index,
    source_original: cue.source_original,
    draft_ru: row.translations[index].text }));
  const context = original.source_context.map(cue => ({
    segment_id: cue.segment_id, line_index: cue.line_index,
    source_original: cue.source_original }));
  requests.push({ case_id: id, family: 'reg066_negative', targets, context });
}
assert.equal(requests.length, limits.cases);
const planned = requests.map(item => {
  const { request, envelope } = buildScenePostEditRequest({
    targets: item.targets, context: item.context,
    modelAlias: manifest.model_alias, seed: limits.seed });
  const sourceInventory = [...envelope.target_slots, ...envelope.source_context]
    .map(({ segment_id, line_index, source_original }) =>
      ({ segment_id, line_index, source_original }))
    .sort((a, b) => a.segment_id - b.segment_id);
  return { ...item, request,
    target_ids: item.targets.map(cue => cue.segment_id),
    baseline_sha256: digest(Buffer.from(JSON.stringify(item.targets.map(
      cue => ({ id: cue.segment_id, text: cue.draft_ru }))))),
    inventory_sha256: digest(Buffer.from(JSON.stringify(sourceInventory))),
    request_sha256: digest(Buffer.from(JSON.stringify(request))),
    prompt_sha256: digest(Buffer.from(request.messages[0].content)) };
});
const frozen = { schema_version: 1,
  experiment: 'VIVO-SCENE-POST-EDIT-2026-10-10-v1',
  split: 'exposed_natural_and_reg066_negative_development_not_holdout',
  pinned: { ...pinned, helper: helperSha, harness: harnessSha },
  limits, model_alias: manifest.model_alias,
  requests: planned.map(({ case_id, family, target_ids, baseline_sha256,
    inventory_sha256, request_sha256, prompt_sha256 }) =>
    ({ case_id, family, target_ids, baseline_sha256,
      inventory_sha256, request_sha256, prompt_sha256 })) };
const frozenBytes = `${JSON.stringify(frozen, null, 2)}\n`;
if (mode === '--freeze') {
  await fs.writeFile(freezePath, frozenBytes, { flag: 'wx' });
  console.log(`Post-edit screen frozen: ${planned.length} requests, ${digest(Buffer.from(frozenBytes))}`);
  process.exit(0);
}
assert.equal(await fs.readFile(freezePath, 'utf8'), frozenBytes);
if (mode === '--preflight') {
  console.log(`Post-edit preflight: ${planned.length} request hashes verified, no model calls`);
  process.exit(0);
}

const parent = path.join(root, '.cache/eval/vivo-scene-post-edit-v1');
await fs.mkdir(parent, { recursive: true });
const workspace = await fs.mkdtemp(path.join(parent, 'attempt-'));
const journal = await fs.open(path.join(workspace, 'requests.jsonl'), 'wx');
const reportPath = path.join(workspace, 'report.json');
const started = performance.now();
const report = { schema_version: 1, experiment: frozen.experiment,
  status: 'running', started_at: new Date().toISOString(),
  git_head: execFileSync('git', ['rev-parse', 'HEAD'],
    { cwd: root, encoding: 'utf8' }).trim(),
  git_status: execFileSync('git', ['status', '--short'],
    { cwd: root, encoding: 'utf8' }).trim(),
  freeze_sha256: digest(Buffer.from(frozenBytes)),
  harness_sha256: harnessSha, helper_sha256: helperSha,
  pinned, limits, planned_requests: frozen.requests,
  requests: [], resources: {}, failures: [], total_tokens: 0 };
const save = () => fs.writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`);
const remaining = () => {
  const ms = limits.max_wall_ms - (performance.now() - started);
  assert(ms > 0, 'declared wall budget exhausted');
  return ms;
};
const post = async (url, endpoint, body, timeoutMs) => {
  const bytes = Buffer.from(JSON.stringify(body));
  const began = performance.now();
  const response = await fetch(`${url}${endpoint}`, { method: 'POST',
    headers: { 'content-type': 'application/json' }, body: bytes,
    signal: AbortSignal.timeout(Math.min(timeoutMs, remaining())) });
  return { endpoint, request_sha256: digest(bytes), request: body,
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
  const runtimeEnv = { ...process.env,
    PATH: `${path.dirname(runtimePath)};${path.join(modelRoot,
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
        target_ids: item.target_ids, request_sha256: item.request_sha256,
        baseline_sha256: item.baseline_sha256,
        inventory_sha256: item.inventory_sha256,
        request: item.request, started_at: new Date().toISOString(),
        preflight: [], status: 'running' };
      try {
        const template = await post(url, 'apply-template',
          { messages: item.request.messages, model: item.request.model,
            response_format: item.request.response_format },
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
          limits.safety_tokens, 'rendered prompt exceeds frozen token budget');
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
        entry.translations = validateScenePostEditReply(entry.raw_candidate,
          item.targets);
        entry.status = 'valid_unreviewed';
      } catch (error) {
        entry.status = 'invalid_or_request_failed';
        entry.error = String(error);
        report.failures.push({ case_id: item.case_id, message: String(error) });
      }
      entry.finished_at = new Date().toISOString();
      await journal.write(`${JSON.stringify(entry)}\n`);
      await journal.sync();
      report.requests.push({ case_id: item.case_id,
        family: item.family, target_ids: item.target_ids,
        request_sha256: item.request_sha256,
        baseline_sha256: item.baseline_sha256,
        inventory_sha256: item.inventory_sha256,
        status: entry.status, error: entry.error ?? null,
        prompt_tokens_preflight: entry.prompt_tokens_preflight ?? null,
        usage: entry.usage ?? null,
        translations: entry.translations ?? null,
        preflight_count: entry.preflight.length,
        chat_elapsed_ms: entry.chat?.elapsed_ms ?? null });
      await save();
      console.log(`${item.case_id}: ${entry.status}`);
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
  console.log(`Post-edit screen ${report.status}: ${reportPath}`);
}
