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
import { renderSourceFactHintPrompt } from './source-fact-hints-v1.mjs';

assert.equal(process.platform, 'win32');
const mode = (process.argv[2] ?? 'probe').replace(/^--/u, '');
assert(['freeze', 'preflight', 'probe'].includes(mode));
assert(process.argv.length <= 3);
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const assetRoot = process.env.AURALIS_EVAL_ASSET_ROOT ?? root;
const freezePath = path.join(root,
  'eval/experiments/2026-10-09-source-fact-hints-v1-freeze.json');
const sourcePath = path.join(root,
  '.cache/eval/youtube-geekerwan-vivo-original-caption/attempt-LQWxgw/source.zh.srt');
const priorJournalPath = path.join(root,
  '.cache/eval/reg066-natural-seams-v1/attempt-JfV5tQ/requests.jsonl');
const runtimePath = path.join(assetRoot, '.cache/runtime/llama/llama-server.exe');
const model = { id: '7b',
  file: path.join(assetRoot, '.cache/models/Hy-MT2-7B-Q4_K_M.gguf'),
  manifest: path.join(root,
    'models/manifests/hy_mt2_7b_q4_k_m.context_v8_target_first_batch4.experimental.json'),
  sha256: '9f96256500f3fc1ab4d64336b58f52a949a95ad7516b0c229476eef782f9f77b',
  manifest_sha256: 'c287c53efbb4ce78471b64648ea3dd2f521363df0e168b7a61df1fdd6ae0479a' };
const pinned = {
  source: 'b100803367b95fa55fc638b1ff39a0abfa0d5b8183ebe58d58b1a87242d9d8c4',
  prior_journal: 'fcea60a832f1a7f1d37b2f97e5ce048642f9825d11227a24fadbac49e10a0e2a',
  reg066: '33b74c9a337acd931b87a4f101e54070c95a5ed69a40f04ab342768da24b061e',
  reg067: '4f0de80972e37524bb1f1796eb35d4571354301e7529b1e7d6c4dc980cfa4e12',
  reg068: '8388f29973055ef557efd7d944099ec3cdb2615cdacebc3060c7e14cc4b4ebbf',
  extractor: '914206f782bf3b0a667d79c4d8ffa25ac22b2d87c58b5e34debab719079bcad1',
  runtime: '6f15be27bd80b6b4d52afefa49094e18fcfab55d5da354d717971f2d2537b2f4',
  prompt_prefix: '1b4a2ae96e2526a2d096d41cd94215428d87e30db7ab614a222e65b6baac8ebb',
};
const limits = { cases: 18, arms: ['baseline', 'candidate'], chats: 36,
  preflights: 72, server_starts: 1, seed: 101, retries: 0,
  max_total_tokens: 100000, context_tokens: 2048,
  response_tokens: 1024, safety_tokens: 64,
  per_request_ms: 120000, per_preflight_ms: 30000,
  readiness_ms: 180000, max_wall_ms: 720000 };
const digest = bytes => createHash('sha256').update(bytes).digest('hex');
const hashFile = async file => {
  const hash = createHash('sha256');
  for await (const chunk of createReadStream(file)) hash.update(chunk);
  return hash.digest('hex');
};
assert.equal(await hashFile(sourcePath), pinned.source);
assert.equal(await hashFile(priorJournalPath), pinned.prior_journal);
assert.equal(await hashFile(runtimePath), pinned.runtime);
assert.equal(await hashFile(model.file), model.sha256);
assert.equal(await hashFile(model.manifest), model.manifest_sha256);
assert.equal(await hashFile(path.join(root, 'eval/scripts/source-fact-hints-v1.mjs')),
  pinned.extractor);
const manifest = JSON.parse(await fs.readFile(model.manifest, 'utf8'));
assert.equal(manifest.prompt_version, 8);
assert.equal(manifest.target_segments_per_block, 4);
assert.equal(manifest.model_file_sha256, model.sha256);
model.alias = manifest.model_alias;
const packPaths = [
  'eval/regressions/reg-066-vivo-v8-cross-model-facts-v1.json',
  'eval/regressions/reg-067-vivo-shifted-tail-id-omission-v1.json',
  'eval/regressions/reg-068-vivo-shifted-mixed-script-v1.json',
];
const packBytes = await Promise.all(packPaths.map(name => fs.readFile(path.join(root, name))));
assert.deepEqual(packBytes.map(digest),
  [pinned.reg066, pinned.reg067, pinned.reg068]);
const [reg066, reg067, reg068] = packBytes.map(JSON.parse);
const previous = (await fs.readFile(priorJournalPath, 'utf8')).trimEnd()
  .split('\n').map(JSON.parse).filter(row => row.model === '7b');
assert.equal(previous.length, 15);
const marker = 'Input JSON:\n';
const natural = reg066.model_response_reproducers.map(repro => {
  const prior = previous.find(row => row.kind === 'natural' &&
    row.variant === 'original' && row.focus === repro.focus_cue);
  assert(prior && prior.status === 'valid_unreviewed');
  return { id: `natural_${repro.focus_cue}`, family: 'natural',
    request: prior.request, expected_target_ids: prior.source_ids };
});
const oldNegatives = reg066.negative_controls.map(control => {
  const prior = previous.find(row => row.kind === 'negative' &&
    row.case_id === control.id);
  assert(prior && prior.status === 'valid_unreviewed');
  return { id: control.id, family: 'reg066_negative',
    request: prior.request, expected_target_ids: prior.source_ids };
});
assert.equal(natural.length, 5);
assert.equal(oldNegatives.length, 5);
const prefix = natural[0].request.messages[0].content.split(marker)[0];
assert.equal(digest(Buffer.from(prefix)), pinned.prompt_prefix);
const makeSynthetic = (id, family, lines, index) => {
  assert(Array.isArray(lines) && lines.length >= 2 && lines.length <= 4);
  const first = 2001 + index * 10;
  const targetSlots = lines.map((source, position) => {
    assert(!/\p{Script=Cyrillic}/u.test(source));
    const start = index * 10000 + position * 1500;
    return { approved_terms: [], end_ms: start + 1500,
      line_index: 0, protected_facts: [], segment_id: first + position,
      source_for_translation: source, source_original: source,
      start_ms: start };
  });
  const request = structuredClone(natural[0].request);
  request.messages[0].content = `${prefix}${marker}${JSON.stringify({
    schema_version: 7, target_slots: targetSlots, source_context: [] })}`;
  request.response_format.schema.properties.translations.minItems = lines.length;
  request.response_format.schema.properties.translations.maxItems = lines.length;
  return { id, family, request,
    expected_target_ids: targetSlots.map(slot => slot.segment_id) };
};
const authored = [];
for (const [family, pack] of [['reg067', reg067], ['reg068', reg068]]) {
  for (const group of ['related_controls', 'negative_controls']) {
    for (const control of pack[group]) {
      if (control.source_lines) authored.push(makeSynthetic(control.id,
        `${family}_${group}`, control.source_lines, authored.length));
      else {
        assert.equal(control.id, 'original_three_slot_tail');
        const prior = previous.find(row => row.kind === 'natural' &&
          row.variant === 'original' && row.focus === 466);
        assert(prior);
        authored.push({ id: control.id, family: `${family}_${group}`,
          request: prior.request, expected_target_ids: prior.source_ids,
          repeated_natural_request: true });
      }
    }
  }
}
assert.equal(authored.length, 8);
const cases = [...natural, ...oldNegatives, ...authored];
assert.equal(cases.length, limits.cases);
assert.equal(new Set(cases.map(row => row.id)).size, cases.length);
const planned = cases.flatMap((item, index) => {
  const baseline = structuredClone(item.request);
  assert.equal(baseline.seed, limits.seed);
  assert.equal(baseline.model, model.alias);
  const { prompt, hintedSlots } = renderSourceFactHintPrompt(
    baseline.messages[0].content);
  const candidate = structuredClone(baseline);
  candidate.messages[0].content = prompt;
  if (hintedSlots === 0) assert.deepEqual(candidate, baseline);
  const order = index % 2 === 0 ? ['baseline', 'candidate']
    : ['candidate', 'baseline'];
  return order.map(arm => {
    const request = arm === 'baseline' ? baseline : candidate;
    const template = { messages: request.messages, model: request.model,
      response_format: request.response_format };
    const targetIds = JSON.parse(request.messages[0].content.split(marker)[1])
      .target_slots.map(slot => slot.segment_id);
    assert.deepEqual(targetIds, item.expected_target_ids);
    assert(!/\p{Script=Cyrillic}/u.test(request.messages[0].content.split(marker)[1]));
    return { case_id: item.id, family: item.family, arm, hinted_slots: hintedSlots,
      repeated_natural_request: item.repeated_natural_request ?? false,
      target_ids: targetIds, request,
      request_sha256: digest(Buffer.from(JSON.stringify(request))),
      prompt_sha256: digest(Buffer.from(request.messages[0].content)), template };
  });
});
assert.equal(planned.length, limits.chats);
const freeze = { schema_version: 1,
  experiment: 'source-fact-hints-v1-7b-paired-2026-10-09',
  split: 'known_natural_and_authored_development_not_holdout',
  pinned, limits,
  model: { id: model.id, sha256: model.sha256,
    manifest_sha256: model.manifest_sha256, alias: model.alias },
  requests: planned.map(({ case_id, family, arm, hinted_slots,
    repeated_natural_request, target_ids, request_sha256, prompt_sha256 }) =>
    ({ case_id, family, arm, hinted_slots, repeated_natural_request,
      target_ids, request_sha256, prompt_sha256 })) };
const freezeBytes = `${JSON.stringify(freeze, null, 2)}\n`;
if (mode === 'freeze') {
  await fs.writeFile(freezePath, freezeBytes, { flag: 'wx' });
  console.log(`Source-fact screen frozen: ${planned.length} requests, ${digest(Buffer.from(freezeBytes))}`);
  process.exit(0);
}
assert.equal(await fs.readFile(freezePath, 'utf8'), freezeBytes);
if (mode === 'preflight') {
  console.log(`Source-fact screen preflight: ${planned.length} paired requests, no model calls`);
  process.exit(0);
}

const parent = path.join(root, '.cache/eval/source-fact-hints-v1');
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
  extractor_sha256: pinned.extractor,
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
  return { endpoint, request_sha256: digest(request), request: body,
    http_status: response.status, raw_response: await response.text(),
    elapsed_ms: Math.round(performance.now() - began) };
};
let server;
try {
  await save();
  const port = await freeLoopbackPort();
  const url = `http://127.0.0.1:${port}/`;
  const args = ['--model', model.file, '--alias', model.alias,
    '--host', '127.0.0.1', '--port', String(port), '-c', '2048', '-ngl', '99',
    '--parallel', '1', '--jinja', '--cache-ram', '0'];
  const runtimeEnv = { ...process.env, PATH: `${path.dirname(runtimePath)};${path.join(assetRoot,
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
      const entry = { case_id: item.case_id, family: item.family, arm: item.arm,
        hinted_slots: item.hinted_slots,
        repeated_natural_request: item.repeated_natural_request,
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
          assert.deepEqual(translations.map(row => row.segment_id), item.target_ids);
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
        report.failures.push({ case_id: item.case_id, arm: item.arm,
          message: String(error) });
      }
      entry.finished_at = new Date().toISOString();
      await journal.write(`${JSON.stringify(entry)}\n`);
      await journal.sync();
      report.requests.push({ case_id: item.case_id, family: item.family,
        arm: item.arm, hinted_slots: item.hinted_slots,
        repeated_natural_request: item.repeated_natural_request,
        target_ids: item.target_ids, request_sha256: item.request_sha256,
        prompt_sha256: item.prompt_sha256, status: entry.status,
        prompt_tokens_preflight: entry.prompt_tokens_preflight ?? null,
        usage: entry.usage ?? null, translations: entry.translations ?? null,
        preflight_count: entry.preflight.length,
        chat_elapsed_ms: entry.chat?.elapsed_ms ?? null });
      await save();
      console.log(`${item.case_id} ${item.arm}: ${entry.status}`);
      if (entry.status === 'request_or_budget_failed') throw new Error(entry.error);
    }
  } finally {
    report.resources[model.id] = await sampler.stop();
    await stopProcess(server);
    await fs.writeFile(path.join(workspace, '7b-server.log'),
      `${server.stdout}\n${server.stderr}\n`);
    server = null;
    await save();
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
  console.log(`Source-fact screen ${report.status}: ${reportPath}`);
}
