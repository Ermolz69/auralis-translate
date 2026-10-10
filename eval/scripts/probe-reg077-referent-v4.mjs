import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { createReadStream } from 'node:fs';
import fs from 'node:fs/promises';
import path from 'node:path';
import { performance } from 'node:perf_hooks';
import { fileURLToPath } from 'node:url';
import { parsePinnedSrt } from './cross-source-relation-screen.mjs';
import { decodeTechnicalSenseReply } from './vivo-technical-senses-v2.mjs';
import { reg077ReferentRequestV4 } from './reg077-referent-v4.mjs';
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
const sourcePath = path.join(assetRoot,
  '.cache/eval/v8-vivo-original-long-v1/attempt-MAaX5T/7b/source.zh.srt');
const priorPath = path.join(assetRoot,
  '.cache/eval/source-fact-hints-v1/attempt-HtkAPR/requests.jsonl');
const modelPath = path.join(modelRoot,
  '.cache/models/Hy-MT2-7B-Q4_K_M.gguf');
const runtimePath = path.join(modelRoot,
  '.cache/runtime/llama/llama-server.exe');
const manifestPath = path.join(root,
  'models/manifests/hy_mt2_7b_q4_k_m.context_v8_target_first_batch4.experimental.json');
const packPath = path.join(root,
  'eval/regressions/reg-073-vivo-stratified-blindspots-v1.json');
const reg075Path = path.join(root,
  'eval/regressions/reg-075-continuation-not-negation-v1.json');
const reg076Path = path.join(root,
  'eval/regressions/reg-076-negated-multicore-v1.json');
const reg077Path = path.join(root,
  'eval/regressions/reg-077-chip-core-contrast-v1.json');
const reg078Path = path.join(root,
  'eval/regressions/reg-078-one-core-russian-agreement-v1.json');
const priorFreezePath = path.join(root,
  'eval/experiments/2026-10-10-reg-076-negated-multicore-v3-freeze.json');
const helperPath = path.join(root, 'eval/scripts/reg077-referent-v4.mjs');
const freezePath = path.join(root,
  'eval/experiments/2026-10-10-reg-077-referent-v4-freeze.json');
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const hashFile = async file => {
  const hash = createHash('sha256');
  for await (const chunk of createReadStream(file)) hash.update(chunk);
  return hash.digest('hex');
};
const pinned = {
  source: 'b100803367b95fa55fc638b1ff39a0abfa0d5b8183ebe58d58b1a87242d9d8c4',
  prior: '72e52f740ffa1b4dce7e88168a6872eb2687ab44e1f39fd19e0316a10b8f767f',
  model: '9f96256500f3fc1ab4d64336b58f52a949a95ad7516b0c229476eef782f9f77b',
  runtime: '6f15be27bd80b6b4d52afefa49094e18fcfab55d5da354d717971f2d2537b2f4',
  manifest: 'c287c53efbb4ce78471b64648ea3dd2f521363df0e168b7a61df1fdd6ae0479a',
};
const limits = { cases: 32, seeds: [101, 202, 303], chats: 192,
  preflights: 384, server_starts: 1, retries: 0,
  max_total_tokens: 180000, context_tokens: 2048,
  response_tokens: 1024, safety_tokens: 64,
  per_request_ms: 120000, per_preflight_ms: 30000,
  readiness_ms: 180000, max_wall_ms: 1200000 };
const [sourceBytes, priorBytes, packBytes, reg075Bytes, reg076Bytes,
  reg077Bytes, reg078Bytes,
  priorFreezeBytes,
  helperSha, harnessSha, modelSha, runtimeSha, manifestSha] = await Promise.all([
  fs.readFile(sourcePath), fs.readFile(priorPath), fs.readFile(packPath),
  fs.readFile(reg075Path), fs.readFile(reg076Path),
  fs.readFile(reg077Path), fs.readFile(reg078Path),
  fs.readFile(priorFreezePath),
  hashFile(helperPath), hashFile(fileURLToPath(import.meta.url)),
  hashFile(modelPath), hashFile(runtimePath), hashFile(manifestPath),
]);
assert.equal(sha(sourceBytes), pinned.source);
assert.equal(sha(priorBytes), pinned.prior);
assert.equal(modelSha, pinned.model);
assert.equal(runtimeSha, pinned.runtime);
assert.equal(manifestSha, pinned.manifest);
const pack = JSON.parse(packBytes);
assert.equal(pack.id, 'REG-073');
assert.equal(pack.source_sha256, pinned.source);
assert.equal(sha(priorFreezeBytes),
  '9a8a91ec5d91f2c6338b181f4272854b968f6559d973bf72944b51b0c8c7d8a7');
const priorFreeze = JSON.parse(priorFreezeBytes);
const reg075 = JSON.parse(reg075Bytes);
assert.equal(reg075.id, 'REG-075');
assert.equal(sha(packBytes), priorFreeze.pinned.pack);
assert.equal(sha(reg075Bytes), priorFreeze.pinned.reg075);
const reg076 = JSON.parse(reg076Bytes);
assert.equal(reg076.id, 'REG-076');
assert.equal(sha(reg076Bytes),
  '35bf72512f537d388c6b3a884bbbb2b9fc5f9d63db8a0750f13df35762dbf120');
assert.equal(reg076.machine_report_sha256,
  '2c962bb859e2ffa585853e13370d0eda8bdc597d7ae02d952201fc68df003043');
const reg077 = JSON.parse(reg077Bytes);
const reg078 = JSON.parse(reg078Bytes);
assert.equal(reg077.id, 'REG-077');
assert.equal(reg078.id, 'REG-078');
assert.equal(sha(reg077Bytes),
  'f7ac5bd4c9f5310719f23cb4b7a987fe38c09013d2c17e18f9d8b36f61f46bfa');
assert.equal(sha(reg078Bytes),
  'cb02e941b73d822119b2e5ed75f5b00dc7e0e3db8bc7a2f3408701dcd3565eed');
const manifest = JSON.parse(await fs.readFile(manifestPath));
assert.equal(manifest.prompt_version, 8);
assert.equal(manifest.model_file_sha256, pinned.model);
const source = parsePinnedSrt(sourceBytes);
assert.equal(source.length, 467);
const priorRows = priorBytes.toString('utf8').trimEnd().split(/\r?\n/u)
  .map(JSON.parse);
const prior = priorRows.find(row => row.case_id === 'natural_60' &&
  row.arm === 'baseline');
assert(prior && prior.status === 'valid_unreviewed');
const template = prior.request;
assert.equal(sha(Buffer.from(JSON.stringify(template))),
  prior.request_sha256);
assert.equal(template.model, manifest.model_alias);
assert.equal(template.seed, limits.seeds[0]);
const marker = 'Input JSON:\n';
const prefix = template.messages[0].content.split(marker)[0];
assert(prefix.includes('Translate every target_slots entry into Russian'));
assert.equal(prefix.split('Input JSON:').length, 1);
const slot = cue => ({ approved_terms: [], end_ms: cue.endMs,
  line_index: 0, protected_facts: [], segment_id: cue.id,
  source_for_translation: cue.text, source_original: cue.text,
  start_ms: cue.startMs });
const contextSlot = cue => ({ end_ms: cue.endMs, line_index: 0,
  segment_id: cue.id, source_original: cue.text, start_ms: cue.startMs });
const natural = [
  ['natural_multicore', 172, '多核'],
  ['natural_all_big_core', 232, '全大核'],
  ['natural_process', 393, '制程'],
].map(([caseId, id, term]) => {
  const cue = source[id - 1];
  assert(cue.text.includes(term));
  const repro = pack.minimal_reproducers.find(row => row.cue_ids[0] === id);
  assert(repro && repro.source_text_sha256[0] === sha(Buffer.from(cue.text)));
  return { case_id: caseId, family: 'natural_exposed',
    target: slot(cue), context: [source[id - 2], source[id]]
      .map(contextSlot) };
});
const controls = [
  ...pack.related_controls.filter(row => [
    'multicore_not_multichip', 'all_big_core_architecture',
    'advanced_manufacturing_process'].includes(row.family))
    .map(row => ({ ...row, family: 'related_positive' })),
  ...pack.negative_controls.filter(row => [
    'multicore_not_multichip', 'all_big_core_architecture',
    'advanced_manufacturing_process'].includes(row.family))
    .map(row => ({ ...row, family: 'negative_contrast' })),
  { ...pack.related_controls.find(row => row.id === 'scene_guides_imaging'),
    family: 'absence_control' },
];
assert.equal(controls.length, 7);
const authored = controls.map((row, index) => {
  assert.equal(row.source_lines.length, 1);
  const id = 3001 + index;
  return { case_id: row.id, family: row.family,
    target: slot({ id, text: row.source_lines[0], startMs: index * 2000,
      endMs: index * 2000 + 1500 }), context: [] };
});
const addedControls = [
  ...reg075.related_controls.filter(row =>
    ['continually_develop_process', 'continuation_with_chip_subject']
      .includes(row.id)),
  ...reg075.negative_controls.filter(row =>
    ['do_not_develop_process', 'no_process_work'].includes(row.id)),
];
assert.equal(addedControls.length, 4);
const extra = addedControls.map((row, index) => {
  const id = 4001 + index;
  return { case_id: row.id,
    family: row.expected_term ? 'reg075_related' : 'reg075_negative',
    target: slot({ id, text: row.source_line,
      startMs: index * 2000, endMs: index * 2000 + 1500 }),
    context: [] };
});
const reg076Controls = [
  ...reg076.related_controls.map(row => ({ ...row,
    family: 'reg076_related' })),
  ...reg076.negative_controls.map(row => ({ ...row,
    family: 'reg076_negative' })),
];
assert.equal(reg076Controls.length, 6);
const contrast = reg076Controls.map((row, index) => {
  assert.equal(row.source_lines.length, 1);
  const id = 5001 + index;
  return { case_id: row.id, family: row.family,
    target: slot({ id, text: row.source_lines[0],
      startMs: index * 2000, endMs: index * 2000 + 1500 }),
    context: [] };
});
const newControls = [
  ...reg077.related_controls.map(row => ({ ...row, family: 'reg077_related' })),
  ...reg077.negative_controls.map(row => ({ ...row, family: 'reg077_negative' })),
  ...reg078.related_controls.map(row => ({ ...row, family: 'reg078_related' })),
  ...reg078.negative_controls.map(row => ({ ...row, family: 'reg078_negative' })),
];
assert.equal(newControls.length, 12);
const next = newControls.map((row, index) => {
  assert.equal(row.source_lines.length, 1);
  const id = 6001 + index;
  return { case_id: row.id, family: row.family,
    target: slot({ id, text: row.source_lines[0],
      startMs: index * 2000, endMs: index * 2000 + 1500 }),
    context: [] };
});
const cases = [...natural, ...authored, ...extra, ...contrast, ...next];
assert.equal(cases.length, limits.cases);
assert.equal(new Set(cases.map(row => row.case_id)).size, cases.length);
const planned = cases.flatMap((item, index) => {
  const envelope = { schema_version: 7,
    target_slots: [item.target], source_context: item.context };
  return limits.seeds.flatMap((seed, repetition) => {
    const baseline = structuredClone(template);
    baseline.seed = seed;
    baseline.messages[0].content = `${prefix}${marker}${JSON.stringify(envelope)}`;
    baseline.response_format.schema.properties.translations.minItems = 1;
    baseline.response_format.schema.properties.translations.maxItems = 1;
    const scoped = reg077ReferentRequestV4(baseline);
    const arms = (index + repetition) % 2 === 0 ?
      ['baseline', 'candidate'] : ['candidate', 'baseline'];
    return arms.map(arm => {
      const request = arm === 'baseline' ? baseline : scoped.request;
      return { case_id: item.case_id, family: item.family, arm, seed,
        target_id: item.target.segment_id,
        eligible_terms: scoped.eligible_terms,
        baseline_identical: scoped.baseline_identical,
        source_text_sha256: sha(Buffer.from(item.target.source_original)),
        source_inventory_sha256: sha(Buffer.from(JSON.stringify(envelope))),
        request, request_sha256: sha(Buffer.from(JSON.stringify(request))),
        prompt_sha256: sha(Buffer.from(request.messages[0].content)) };
    });
  });
});
assert.equal(planned.length, limits.chats);
for (const item of planned.filter(row => row.target_id < 6000)) {
  const previous = priorFreeze.planned.find(row =>
    row.case_id === item.case_id && row.arm === item.arm &&
    row.seed === item.seed);
  assert(previous);
  if (item.case_id === 'not_multicore_but_separate_chips' &&
    item.arm === 'candidate') {
    assert(item.eligible_terms.includes('source:separate-chip-vs-one-multicore'));
    assert.notEqual(item.request_sha256, previous.request_sha256);
  } else assert.equal(item.request_sha256, previous.request_sha256,
    `Unintended v3 request change: ${item.case_id}/${item.arm}`);
}
for (const item of planned.filter(row => row.arm === 'candidate' &&
  row.baseline_identical)) {
  const baseline = planned.find(row => row.case_id === item.case_id &&
    row.arm === 'baseline' && row.seed === item.seed);
  assert.equal(item.request_sha256, baseline.request_sha256);
}
const freeze = { schema_version: 1,
  experiment: 'REG-077-CHIP-CORE-REFERENT-2026-10-10-v4',
  split: 'exposed_natural_and_authored_development_not_holdout',
  pinned: { ...pinned, pack: sha(packBytes), reg075: sha(reg075Bytes),
    reg076: sha(reg076Bytes), reg077: sha(reg077Bytes),
    reg078: sha(reg078Bytes), prior_freeze: sha(priorFreezeBytes), helper: helperSha,
    harness: harnessSha, prompt_prefix: sha(Buffer.from(prefix)) },
  limits, model_alias: manifest.model_alias,
  planned: planned.map(({ case_id, family, arm, seed, target_id,
    eligible_terms, baseline_identical, source_text_sha256,
    source_inventory_sha256, request_sha256, prompt_sha256 }) => ({
    case_id, family, arm, seed, target_id, eligible_terms,
    baseline_identical, source_text_sha256, source_inventory_sha256,
    request_sha256, prompt_sha256 })) };
const freezeBytes = `${JSON.stringify(freeze, null, 2)}\n`;
if (mode === '--freeze') {
  await fs.writeFile(freezePath, freezeBytes, { flag: 'wx' });
  console.log(`Technical sense screen frozen: ${planned.length} requests, ${sha(Buffer.from(freezeBytes))}`);
  process.exit(0);
}
assert.equal(await fs.readFile(freezePath, 'utf8'), freezeBytes);
if (mode === '--preflight') {
  console.log(`Technical sense preflight: ${planned.length} exact request hashes, zero model calls`);
  process.exit(0);
}

const parent = path.join(root, '.cache/eval/reg-077-referent-v4');
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
  freeze_sha256: sha(Buffer.from(freezeBytes)), pinned: freeze.pinned,
  limits, planned: freeze.planned, requests: [], failures: [],
  total_tokens: 0, resources: {} };
const save = () => fs.writeFile(reportPath,
  `${JSON.stringify(report, null, 2)}\n`);
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
  return { request_sha256: sha(bytes), request: body,
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
        arm: item.arm, seed: item.seed, target_id: item.target_id,
        eligible_terms: item.eligible_terms,
        baseline_identical: item.baseline_identical,
        source_text_sha256: item.source_text_sha256,
        source_inventory_sha256: item.source_inventory_sha256,
        request_sha256: item.request_sha256,
        prompt_sha256: item.prompt_sha256,
        request: item.request, started_at: new Date().toISOString(),
        preflight: [], status: 'running' };
      try {
        const templateResult = await post(url, 'apply-template',
          { messages: item.request.messages, model: item.request.model,
            response_format: item.request.response_format },
          limits.per_preflight_ms);
        entry.preflight.push(templateResult);
        assert.equal(templateResult.http_status, 200);
        const rendered = JSON.parse(templateResult.raw_response).prompt;
        assert.equal(typeof rendered, 'string');
        const tokenize = await post(url, 'tokenize',
          { content: rendered, add_special: false, parse_special: true },
          limits.per_preflight_ms);
        entry.preflight.push(tokenize);
        assert.equal(tokenize.http_status, 200);
        const tokens = JSON.parse(tokenize.raw_response).tokens;
        assert(Array.isArray(tokens) && tokens.length > 0);
        assert(tokens.length + limits.response_tokens + limits.safety_tokens <=
          limits.context_tokens);
        entry.prompt_tokens_preflight = tokens.length;
        const chat = await post(url, 'v1/chat/completions',
          item.request, limits.per_request_ms);
        entry.chat = chat;
        assert.equal(chat.request_sha256, item.request_sha256);
        assert.equal(chat.http_status, 200);
        const parsed = JSON.parse(chat.raw_response);
        entry.usage = parsed.usage ?? null;
        report.total_tokens += (entry.usage?.prompt_tokens ?? 0) +
          (entry.usage?.completion_tokens ?? 0);
        assert(report.total_tokens <= limits.max_total_tokens);
        entry.raw_candidate = parsed.choices?.[0]?.message?.content ?? null;
        entry.accepted_text = decodeTechnicalSenseReply(
          chat.raw_response, item.target_id);
        entry.accepted_text_sha256 = sha(Buffer.from(entry.accepted_text));
        entry.status = 'valid_unreviewed';
      } catch (error) {
        entry.status = 'request_or_validation_failed';
        entry.error = String(error);
        report.failures.push({ case_id: item.case_id, arm: item.arm,
          seed: item.seed,
          message: String(error) });
      }
      entry.finished_at = new Date().toISOString();
      await journal.write(`${JSON.stringify(entry)}\n`);
      await journal.sync();
      report.requests.push({ case_id: item.case_id, family: item.family,
        arm: item.arm, seed: item.seed, target_id: item.target_id,
        eligible_terms: item.eligible_terms,
        baseline_identical: item.baseline_identical,
        request_sha256: item.request_sha256,
        source_text_sha256: item.source_text_sha256,
        accepted_text_sha256: entry.accepted_text_sha256 ?? null,
        prompt_tokens_preflight: entry.prompt_tokens_preflight ?? null,
        usage: entry.usage ?? null, chat_elapsed_ms: entry.chat?.elapsed_ms ?? null,
        preflight_count: entry.preflight.length, status: entry.status });
      await save();
      console.log(`${item.case_id} seed=${item.seed} ${item.arm}: ${entry.status}`);
      if (entry.status !== 'valid_unreviewed') throw new Error(entry.error);
    }
  } finally {
    report.resources.server = await sampler.stop();
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
  console.log(`Technical sense screen ${report.status}: ${reportPath}`);
}
