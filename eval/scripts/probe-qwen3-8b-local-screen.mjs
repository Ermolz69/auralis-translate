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
import { freeLoopbackPort, startProcess, stopProcess,
  waitForHealthyServer } from './local-process.mjs';
import { runtimeSampler } from './runtime-sampler.mjs';

assert.equal(process.platform, 'win32');
const mode = process.argv[2];
assert(['--freeze', '--preflight', '--probe'].includes(mode));
assert.equal(process.argv.length, 3);
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const assetRoot = process.env.AURALIS_EVAL_ASSET_ROOT;
const modelRoot = process.env.AURALIS_MODEL_ASSET_ROOT;
assert(assetRoot && path.isAbsolute(assetRoot));
assert(modelRoot && path.isAbsolute(modelRoot));
const sourcePath = path.join(assetRoot,
  '.cache/eval/v8-vivo-original-long-v1/attempt-MAaX5T/7b/source.zh.srt');
const templatePath = path.join(assetRoot,
  '.cache/eval/source-fact-hints-v1/attempt-HtkAPR/requests.jsonl');
const baselinePath = path.join(modelRoot,
  '.cache/models/Hy-MT2-7B-Q4_K_M.gguf');
const candidatePath = path.join(modelRoot,
  '.cache/models/Qwen3-8B-Q4_K_M.gguf');
const runtimePath = path.join(modelRoot,
  '.cache/runtime/llama/llama-server.exe');
const manifestPath = path.join(root,
  'models/manifests/hy_mt2_7b_q4_k_m.context_v8_target_first_batch4.experimental.json');
const regPath = path.join(root,
  'eval/regressions/reg-077-chip-core-contrast-v1.json');
const planPath = path.join(root,
  'eval/experiments/2026-10-10-qwen3-8b-local-screen-plan.md');
const publicFreezePath = path.join(root,
  'eval/experiments/2026-10-10-qwen3-8b-local-screen-freeze.json');
const privateRoot = path.join(root, '.cache/eval/qwen3-8b-local-screen-v1');
const privateFreezePath = path.join(privateRoot, 'freeze.json');
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const hashFile = async file => {
  const hash = createHash('sha256');
  for await (const chunk of createReadStream(file)) hash.update(chunk);
  return hash.digest('hex');
};
const pinned = {
  source: 'b100803367b95fa55fc638b1ff39a0abfa0d5b8183ebe58d58b1a87242d9d8c4',
  template_journal: '72e52f740ffa1b4dce7e88168a6872eb2687ab44e1f39fd19e0316a10b8f767f',
  baseline_model: '9f96256500f3fc1ab4d64336b58f52a949a95ad7516b0c229476eef782f9f77b',
  candidate_model: 'd98cdcbd03e17ce47681435b5150e34c1417f50b5c0019dd560e4882c5745785',
  candidate_revision: '7c41481f57cb95916b40956ab2f0b139b296d974',
  runtime: '6f15be27bd80b6b4d52afefa49094e18fcfab55d5da354d717971f2d2537b2f4',
  manifest: 'c287c53efbb4ce78471b64648ea3dd2f521363df0e168b7a61df1fdd6ae0479a',
};
const limits = { cases: 6, seeds: [101, 202, 303], chats: 36,
  preflights: 72, server_starts: 2, retries: 0,
  max_total_tokens: 30000, context_tokens: 2048,
  response_tokens: 1024, safety_tokens: 64,
  per_request_ms: 120000, per_preflight_ms: 30000,
  readiness_ms: 120000, max_wall_ms: 600000 };

const [sourceBytes, templateBytes, manifestBytes, regBytes, planBytes,
  sourceSha, templateSha, baselineSha, candidateSha, runtimeSha,
  manifestSha, regSha, harnessSha] = await Promise.all([
  fs.readFile(sourcePath), fs.readFile(templatePath),
  fs.readFile(manifestPath), fs.readFile(regPath), fs.readFile(planPath),
  hashFile(sourcePath), hashFile(templatePath), hashFile(baselinePath),
  hashFile(candidatePath), hashFile(runtimePath), hashFile(manifestPath),
  hashFile(regPath), hashFile(fileURLToPath(import.meta.url)),
]);
assert.equal(sourceSha, pinned.source);
assert.equal(templateSha, pinned.template_journal);
assert.equal(baselineSha, pinned.baseline_model);
assert.equal(candidateSha, pinned.candidate_model);
assert.equal(runtimeSha, pinned.runtime);
assert.equal(manifestSha, pinned.manifest);
const manifest = JSON.parse(manifestBytes);
assert.equal(manifest.prompt_version, 8);
assert.equal(manifest.model_alias, 'auralis-hy-mt2-7b-q4');
const source = parsePinnedSrt(sourceBytes);
assert.equal(source.length, 467);
const priorRows = templateBytes.toString('utf8').trimEnd().split(/\r?\n/u)
  .map(JSON.parse);
const prior = priorRows.find(row => row.case_id === 'natural_60' &&
  row.arm === 'baseline');
assert(prior && prior.status === 'valid_unreviewed');
const template = prior.request;
assert.equal(template.model, manifest.model_alias);
assert.equal(template.seed, 101);
assert.equal(sha(Buffer.from(JSON.stringify(template))), prior.request_sha256);
const marker = 'Input JSON:\n';
const prefix = template.messages[0].content.split(marker)[0];
assert(prefix.startsWith('Translate every target_slots entry into Russian'));
assert.equal(prefix.split('Input JSON:').length, 1);
const reg = JSON.parse(regBytes);
assert.equal(reg.id, 'REG-077');
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
].map(([caseId, id, fragment]) => {
  const cue = source[id - 1];
  assert(cue.text.includes(fragment));
  return { case_id: caseId, family: 'natural_exposed',
    target: slot(cue), context: [source[id - 2], source[id]].map(contextSlot) };
});
const authoredSource = [
  ['not_multicore_but_separate_chips',
    reg.minimal_reproducers.find(row =>
      row.case_id === 'not_multicore_but_separate_chips').source_lines[0]],
  ['three_independent_not_one_multicore',
    reg.related_controls.find(row =>
      row.id === 'three_independent_not_one_multicore').source_lines[0]],
  ['real_dual_processor_single_core',
    reg.negative_controls.find(row =>
      row.id === 'real_dual_processor_single_core').source_lines[0]],
];
const authored = authoredSource.map(([caseId, value], index) => ({
  case_id: caseId, family: 'authored_exposed',
  target: slot({ id: 7001 + index, text: value,
    startMs: index * 2000, endMs: index * 2000 + 1500 }),
  context: [],
}));
const cases = [...natural, ...authored];
assert.equal(cases.length, limits.cases);
const planned = cases.flatMap(item => limits.seeds.flatMap(seed => {
  const envelope = { schema_version: 7,
    target_slots: [item.target], source_context: item.context };
  const baseline = structuredClone(template);
  baseline.seed = seed;
  baseline.messages[0].content = `${prefix}${marker}${JSON.stringify(envelope)}`;
  baseline.response_format.schema.properties.translations.minItems = 1;
  baseline.response_format.schema.properties.translations.maxItems = 1;
  const candidate = structuredClone(baseline);
  candidate.model = 'auralis-qwen3-8b-q4-eval';
  candidate.messages[0].content = `${prefix}/no_think\n${marker}${JSON.stringify(envelope)}`;
  return [['candidate', candidate], ['baseline', baseline]].map(([arm, request]) => ({
    case_id: item.case_id, family: item.family, seed, arm,
    target_id: item.target.segment_id,
    source_text_sha256: sha(Buffer.from(item.target.source_original)),
    source_inventory_sha256: sha(Buffer.from(JSON.stringify(envelope))),
    request, request_sha256: sha(Buffer.from(JSON.stringify(request))),
    prompt_sha256: sha(Buffer.from(request.messages[0].content)),
  }));
}));
assert.equal(planned.length, limits.chats);
const freeze = { schema_version: 1,
  experiment: 'qwen3-8b-local-screen-2026-10-10-v1',
  split: 'exposed_natural_and_authored_development_not_holdout',
  pinned: { ...pinned, plan: sha(planBytes), reg077: regSha,
    harness: harnessSha, prompt_prefix: sha(Buffer.from(prefix)) },
  limits, planned };
const privateBytes = `${JSON.stringify(freeze, null, 2)}\n`;
const publicFreeze = { schema_version: 1, experiment: freeze.experiment,
  split: freeze.split, pinned: freeze.pinned, limits,
  private_freeze_sha256: sha(Buffer.from(privateBytes)),
  planned: planned.map(({ case_id, family, seed, arm, target_id,
    source_text_sha256, source_inventory_sha256, request_sha256,
    prompt_sha256 }) => ({ case_id, family, seed, arm, target_id,
    source_text_sha256, source_inventory_sha256, request_sha256,
    prompt_sha256 })) };
const publicBytes = `${JSON.stringify(publicFreeze, null, 2)}\n`;
if (mode === '--freeze') {
  await fs.mkdir(privateRoot, { recursive: true });
  await fs.writeFile(privateFreezePath, privateBytes, { flag: 'wx' });
  await fs.writeFile(publicFreezePath, publicBytes, { flag: 'wx' });
  console.log(`Qwen screen frozen: ${planned.length} chats, ${sha(Buffer.from(publicBytes))}`);
  process.exit(0);
}
assert.equal(await fs.readFile(privateFreezePath, 'utf8'), privateBytes);
assert.equal(await fs.readFile(publicFreezePath, 'utf8'), publicBytes);
if (mode === '--preflight') {
  console.log(`Qwen screen preflight: ${planned.length} exact request hashes, zero inference`);
  process.exit(0);
}

const runRoot = await fs.mkdtemp(path.join(privateRoot, 'attempt-'));
const journal = await fs.open(path.join(runRoot, 'requests.jsonl'), 'wx');
const reportPath = path.join(runRoot, 'report.json');
const started = performance.now();
const report = { schema_version: 1, experiment: freeze.experiment,
  status: 'running', started_at: new Date().toISOString(),
  git_head: execFileSync('git', ['rev-parse', 'HEAD'],
    { cwd: root, encoding: 'utf8' }).trim(),
  git_status: execFileSync('git', ['status', '--short'],
    { cwd: root, encoding: 'utf8' }).trim(),
  public_freeze_sha256: sha(Buffer.from(publicBytes)),
  pinned: freeze.pinned, limits, requests: [], failures: [],
  resources: {}, total_tokens: 0 };
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
  return { request_sha256: sha(bytes), http_status: response.status,
    raw_response: await response.text(),
    elapsed_ms: Math.round(performance.now() - began) };
};
let server;
try {
  await save();
  for (const arm of ['candidate', 'baseline']) {
    const modelPath = arm === 'candidate' ? candidatePath : baselinePath;
    const alias = arm === 'candidate' ? 'auralis-qwen3-8b-q4-eval' :
      manifest.model_alias;
    const port = await freeLoopbackPort();
    const url = `http://127.0.0.1:${port}/`;
    const args = ['--model', modelPath, '--alias', alias,
      '--host', '127.0.0.1', '--port', String(port), '-c', '2048',
      '-ngl', '99', '--parallel', '1', '--jinja', '--cache-ram', '0'];
    const runtimeEnv = { ...process.env,
      PATH: `${path.dirname(runtimePath)};${path.join(modelRoot,
        '.cache/runtime/cudart')};${process.env.PATH}` };
    server = startProcess(runtimePath, args, root, runtimeEnv,
      { maxCaptureCharacters: 4 * 1024 * 1024 });
    await waitForHealthyServer(url, server,
      Math.min(limits.readiness_ms, remaining()));
    const sampler = runtimeSampler(path.join(runRoot,
      `${arm}-resources.jsonl`), root, () => [server.child.pid]);
    try {
      for (const item of planned.filter(row => row.arm === arm)) {
        const entry = { case_id: item.case_id, family: item.family,
          arm, seed: item.seed, target_id: item.target_id,
          source_text_sha256: item.source_text_sha256,
          source_inventory_sha256: item.source_inventory_sha256,
          request_sha256: item.request_sha256,
          prompt_sha256: item.prompt_sha256, request: item.request,
          started_at: new Date().toISOString(), preflight: [],
          status: 'running' };
        try {
          const applied = await post(url, 'apply-template',
            { messages: item.request.messages, model: item.request.model,
              response_format: item.request.response_format },
            limits.per_preflight_ms);
          entry.preflight.push(applied);
          assert.equal(applied.http_status, 200);
          const rendered = JSON.parse(applied.raw_response).prompt;
          assert.equal(typeof rendered, 'string');
          const tokenized = await post(url, 'tokenize',
            { content: rendered, add_special: false, parse_special: true },
            limits.per_preflight_ms);
          entry.preflight.push(tokenized);
          assert.equal(tokenized.http_status, 200);
          const tokens = JSON.parse(tokenized.raw_response).tokens;
          assert(Array.isArray(tokens));
          assert(tokens.length + limits.response_tokens + limits.safety_tokens <=
            limits.context_tokens);
          entry.prompt_tokens_preflight = tokens.length;
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
          entry.accepted_text = decodeTechnicalSenseReply(
            chat.raw_response, item.target_id);
          entry.accepted_text_sha256 = sha(Buffer.from(entry.accepted_text));
          entry.status = 'valid_unreviewed';
        } catch (error) {
          entry.status = 'request_or_validation_failed';
          entry.error = String(error);
          report.failures.push({ case_id: item.case_id, arm,
            seed: item.seed, message: String(error) });
        }
        entry.finished_at = new Date().toISOString();
        await journal.write(`${JSON.stringify(entry)}\n`);
        await journal.sync();
        report.requests.push({ case_id: item.case_id, arm,
          seed: item.seed, request_sha256: item.request_sha256,
          source_text_sha256: item.source_text_sha256,
          accepted_text_sha256: entry.accepted_text_sha256 ?? null,
          prompt_tokens_preflight: entry.prompt_tokens_preflight ?? null,
          usage: entry.usage ?? null, chat_elapsed_ms: entry.chat?.elapsed_ms ?? null,
          preflight_count: entry.preflight.length, status: entry.status });
        await save();
        console.log(`${arm} ${item.case_id} seed=${item.seed}: ${entry.status}`);
        if (entry.status !== 'valid_unreviewed') throw new Error(entry.error);
      }
    } finally {
      report.resources[arm] = await sampler.stop();
      await stopProcess(server);
      await fs.writeFile(path.join(runRoot, `${arm}-server.log`),
        `${server.stdout}\n${server.stderr}\n`);
      server = null;
      await save();
    }
  }
  assert.equal(report.requests.length, limits.chats);
  assert.equal(report.requests.reduce((sum, row) =>
    sum + row.preflight_count, 0), limits.preflights);
  report.status = 'complete_structural_observations_unreviewed';
} catch (error) {
  report.status = 'failed_retained';
  report.failures.push({ message: String(error) });
  process.exitCode = 1;
} finally {
  if (server) await stopProcess(server);
  report.finished_at = new Date().toISOString();
  report.wall_elapsed_ms = Math.round(performance.now() - started);
  await save();
  await journal.close();
  console.log(`Qwen3 local screen ${report.status}: ${reportPath}`);
}
