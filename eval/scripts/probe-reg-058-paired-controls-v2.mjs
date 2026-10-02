import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { createReadStream } from 'node:fs';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { performance } from 'node:perf_hooks';
import { fileURLToPath } from 'node:url';
import { freeLoopbackPort, startProcess, stopProcess, waitForHealthyServer } from './local-process.mjs';
import { runtimeSampler } from './runtime-sampler.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const preflight = process.argv.length === 3 && process.argv[2] === '--preflight';
assert(process.argv.length === 2 || preflight);
assert.equal(process.platform, 'win32');
const packPath = path.join(root, 'eval/regressions/v8-natural-7b-semantic-risk-v1.json');
const priorPath = path.join(root,
  '.cache/eval/v8-asus-single-target-v1/attempt-dVT3zA/report.json');
const runtimePath = process.env.AURALIS_TEST_LLAMA_SERVER;
const specs = [
  { id: '1_8b', modelPath: process.env.AURALIS_TEST_GGUF_SMALL,
    manifestPath: path.join(root,
      'models/manifests/hy_mt2_1_8b_q4_k_m.context_v8_target_first_batch1.experimental.json'),
    modelSha: 'dc5f44fcf1fa496ee7ad725982c0c8c553a4de00259b53af84c4b89fb0c06699',
    manifestSha: '3762873e48f3e7864d3cf655e295d4ac383dd30ac5f7292f53f25fc5887761d7' },
  { id: '7b', modelPath: process.env.AURALIS_TEST_GGUF_LARGE,
    manifestPath: path.join(root,
      'models/manifests/hy_mt2_7b_q4_k_m.context_v8_target_first_batch1.experimental.json'),
    modelSha: '9f96256500f3fc1ab4d64336b58f52a949a95ad7516b0c229476eef782f9f77b',
    manifestSha: 'a748572cea20fc46c53ced5c39c5b8e3fb85887c2e90d559a27fd41ea818f2bc' },
];
const expected = { pack: 'fcba9d337e8bdf3dd0d431cf886917bcefa999a44d9eb30fcc5450a6147ebe09',
  prior: '9ae192177dd51611f49adf7699ca4fe9677a230dc74cbdedded2618040cc193c',
  runtime: '6f15be27bd80b6b4d52afefa49094e18fcfab55d5da354d717971f2d2537b2f4' };
const limits = { chats_per_arm: 12, preflights_per_arm: 24,
  per_chat_ms: 120000, per_preflight_ms: 15000,
  readiness_ms: 180000, wall_ms: 1200000, retries: 0,
  context_tokens: 2048, response_tokens: 256, safety_tokens: 64 };
const digest = bytes => createHash('sha256').update(bytes).digest('hex');
const hashFile = async file => {
  const hash = createHash('sha256');
  for await (const chunk of createReadStream(file)) hash.update(chunk);
  return hash.digest('hex');
};
assert(runtimePath && path.isAbsolute(runtimePath));
assert(specs.every(spec => spec.modelPath && path.isAbsolute(spec.modelPath)));
assert.equal(await hashFile(packPath), expected.pack);
assert.equal(await hashFile(priorPath), expected.prior);
assert.equal(await hashFile(runtimePath), expected.runtime);
const pack = JSON.parse(await fs.readFile(packPath));
const prior = JSON.parse(await fs.readFile(priorPath));
assert.equal(prior.experiment, 'v8-asus-single-target-v1');
assert.equal(prior.arms[1].status, 'completed');
const controls = new Map();
for (const row of pack.related_controls) controls.set(`${row.for}:positive`, row);
for (const row of pack.negative_controls) controls.set(`${row.for}:negative`, row);
assert.equal(controls.size, 12);
const originals = new Map(pack.minimal_reproducers.map(row => {
  const entry = prior.arms[1].requests.find(item => item.request_kind === 'chat_completion'
    && item.segment_id === row.cue_id);
  assert(entry);
  assert.equal(digest(Buffer.from(entry.rendered_request)), entry.request_sha256);
  return [row.id, entry];
}));
for (const spec of specs) {
  assert.equal(await hashFile(spec.modelPath), spec.modelSha);
  assert.equal(await hashFile(spec.manifestPath), spec.manifestSha);
  const manifest = JSON.parse(await fs.readFile(spec.manifestPath, 'utf8'));
  assert.equal(manifest.model_file_sha256, spec.modelSha);
  assert.equal(manifest.target_segments_per_block, 1);
  spec.alias = manifest.model_alias;
}
const planned = specs.map(spec => ({ spec, rows: pack.minimal_reproducers.flatMap((caseRow, index) => {
  const polarities = index % 2 === 0 ? ['positive', 'negative'] : ['negative', 'positive'];
  return polarities.map(polarity => {
    const control = controls.get(`${caseRow.id}:${polarity}`);
    assert(control);
    const original = originals.get(caseRow.id);
    const request = JSON.parse(original.rendered_request);
    assert.equal(request.max_tokens, limits.response_tokens);
    request.model = spec.alias;
    const [head, input] = request.messages[0].content.split('Input JSON:\n');
    assert(input && head);
    const envelope = JSON.parse(input);
    assert.equal(envelope.target_slots.length, 1);
    assert.equal(envelope.target_slots[0].segment_id, caseRow.cue_id);
    assert.deepEqual(envelope.target_slots[0].approved_terms, []);
    assert.deepEqual(envelope.target_slots[0].protected_facts, []);
    envelope.target_slots[0].source_original = control.source;
    envelope.target_slots[0].source_for_translation = control.source;
    assert.equal(envelope.target_slots[0].source_original, envelope.target_slots[0].source_for_translation);
    request.messages[0].content = `${head}Input JSON:\n${JSON.stringify(envelope)}`;
    assert(!JSON.stringify(request).includes(control.expected_meaning));
    return { case_id: caseRow.id, cue_id: caseRow.cue_id,
      control_id: control.id, polarity, original_request_sha256: original.request_sha256,
      request, request_sha256: digest(Buffer.from(JSON.stringify(request))) };
  });
}) }));
assert(planned.every(arm => arm.rows.length === limits.chats_per_arm));
if (preflight) {
  console.log(JSON.stringify({ status: 'verified', expected, limits,
    arms: planned.map(arm => ({ id: arm.spec.id, model_sha256: arm.spec.modelSha,
      manifest_sha256: arm.spec.manifestSha,
      request_hashes: arm.rows.map(row => row.request_sha256) })) }));
  process.exit(0);
}

const parent = path.join(root, '.cache/eval/reg-058-paired-controls-v2');
assert.equal((await fs.readdir(parent).catch(error => error.code === 'ENOENT' ? [] :
  Promise.reject(error))).filter(name => name.startsWith('attempt-')).length, 0,
'Frozen experiment permits only one model attempt');
await fs.mkdir(parent, { recursive: true });
const workspace = await fs.mkdtemp(path.join(parent, 'attempt-'));
const started = performance.now();
const report = { schema_version: 1, experiment: 'reg-058-paired-controls-v2',
  status: 'running', started_at: new Date().toISOString(),
  expected, limits, harness_sha256: await hashFile(fileURLToPath(import.meta.url)),
  platform: { os: `${os.type()} ${os.release()} ${os.arch()}`,
    cpu: os.cpus()[0].model, ram_bytes: os.totalmem() },
  code_commit: null, arms: [], errors: [] };
const reportPath = path.join(workspace, 'report.json');
const save = () => fs.writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`);
const remaining = () => {
  const ms = limits.wall_ms - (performance.now() - started);
  assert(ms > 0, 'Frozen wall budget exhausted');
  return ms;
};
const post = async (url, endpoint, body, timeoutMs) => {
  const began = performance.now();
  const response = await fetch(`${url}${endpoint}`, { method: 'POST',
    headers: { 'content-type': 'application/json' }, body: JSON.stringify(body),
    signal: AbortSignal.timeout(Math.min(timeoutMs, remaining())) });
  const bytes = Buffer.from(await response.arrayBuffer());
  return { request_sha256: digest(Buffer.from(JSON.stringify(body))),
    raw_response: bytes.toString('utf8'), raw_response_sha256: digest(bytes),
    http_status: response.status, elapsed_ms: Math.round(performance.now() - began) };
};
try {
  const head = (await fs.readFile(path.join(root, '.git/HEAD'), 'utf8')).trim();
  assert(head.startsWith('ref: '));
  report.code_commit = (await fs.readFile(path.join(root, '.git', head.slice(5)), 'utf8')).trim();
  await save();
  for (const { spec, rows } of planned) {
    const arm = { id: spec.id, model_sha256: spec.modelSha,
      manifest_sha256: spec.manifestSha, status: 'preparing', requests: [], errors: [] };
    report.arms.push(arm);
    const directory = path.join(workspace, spec.id);
    await fs.mkdir(directory);
    const journal = await fs.open(path.join(directory, 'requests.jsonl'), 'wx');
    let server, sampler;
    try {
      const port = await freeLoopbackPort();
      const url = `http://127.0.0.1:${port}/`;
      const args = ['--model', spec.modelPath, '--alias', spec.alias,
        '--host', '127.0.0.1', '--port', String(port), '-c', '2048', '-ngl', '99',
        '--parallel', '1', '--jinja', '--cache-ram', '0'];
      const env = { ...process.env, PATH: `${path.dirname(runtimePath)};${path.join(root,
        '.cache/runtime/cudart')};${process.env.PATH}` };
      server = startProcess(runtimePath, args, root, env,
        { maxCaptureCharacters: 4 * 1024 * 1024 });
      await waitForHealthyServer(url, server,
        Math.min(limits.readiness_ms, remaining()));
      sampler = runtimeSampler(path.join(directory, 'resources.jsonl'), root,
        () => [server.child.pid]);
      arm.status = 'running';
      await save();
      for (const item of rows) {
        const entry = { case_id: item.case_id, cue_id: item.cue_id,
          control_id: item.control_id, polarity: item.polarity,
          original_request_sha256: item.original_request_sha256,
          request: item.request, request_sha256: item.request_sha256,
          preflight: [], started_at: new Date().toISOString() };
        try {
          const template = await post(url, 'apply-template', {
            model: item.request.model, messages: item.request.messages,
            response_format: item.request.response_format }, limits.per_preflight_ms);
          entry.preflight.push(template);
          assert.equal(template.http_status, 200);
          const rendered = JSON.parse(template.raw_response).prompt;
          const tokenized = await post(url, 'tokenize',
            { content: rendered, add_special: false, parse_special: true },
            limits.per_preflight_ms);
          entry.preflight.push(tokenized);
          assert.equal(tokenized.http_status, 200);
          const tokens = JSON.parse(tokenized.raw_response).tokens;
          assert(Array.isArray(tokens) && tokens.every(Number.isInteger));
          assert(tokens.length <= limits.context_tokens - limits.response_tokens -
            limits.safety_tokens, 'Rendered prompt exceeds frozen budget');
          entry.prompt_tokens_preflight = tokens.length;
          const chat = await post(url, 'v1/chat/completions', item.request,
            limits.per_chat_ms);
          entry.chat = chat;
          const parsed = JSON.parse(chat.raw_response);
          entry.finish_reason = parsed.choices?.[0]?.finish_reason ?? null;
          entry.usage = parsed.usage ?? null;
          assert.equal(entry.usage?.prompt_tokens, tokens.length);
          if (chat.http_status === 200 && entry.finish_reason === 'stop') {
            try {
              const rows = JSON.parse(parsed.choices[0].message.content).translations;
              assert.equal(rows?.length, 1);
              assert.equal(rows[0].segment_id, item.cue_id);
              assert.equal(rows[0].line_index, 0);
              assert(typeof rows[0].text === 'string' && rows[0].text.trim());
              entry.candidate = rows[0].text;
              entry.structural_outcome = 'outer_json_valid_unreviewed';
            } catch (error) { entry.structural_outcome = `invalid: ${error.message}`; }
          } else entry.structural_outcome = 'incomplete_or_http_failure';
          if (chat.http_status !== 200) throw new Error(`Chat HTTP ${chat.http_status}`);
        } catch (error) {
          entry.error = String(error);
          throw error;
        } finally {
          await journal.write(`${JSON.stringify(entry)}\n`);
          await journal.sync();
          arm.requests.push({ case_id: entry.case_id, cue_id: entry.cue_id,
            control_id: entry.control_id, polarity: entry.polarity,
            request_sha256: entry.request_sha256,
            raw_response_sha256: entry.chat?.raw_response_sha256 ?? null,
            prompt_tokens: entry.usage?.prompt_tokens ?? null,
            completion_tokens: entry.usage?.completion_tokens ?? null,
            chat_elapsed_ms: entry.chat?.elapsed_ms ?? null,
            finish_reason: entry.finish_reason ?? null,
            structural_outcome: entry.structural_outcome ?? 'aborted',
            candidate: entry.candidate ?? null });
          await save();
          console.log(`${spec.id} ${item.control_id}: ${entry.structural_outcome ?? 'aborted'}`);
        }
      }
      arm.status = 'complete_outer_json_unreviewed';
    } catch (error) {
      arm.status = 'failed';
      arm.errors.push(String(error));
    } finally {
      arm.resources = sampler ? await sampler.stop() : null;
      await stopProcess(server);
      if (server) {
        await fs.writeFile(path.join(directory, 'server.stdout.log'), server.stdout);
        await fs.writeFile(path.join(directory, 'server.stderr.log'), server.stderr);
      }
      await journal.close();
      arm.finished_at = new Date().toISOString();
      await save();
    }
    if (arm.status === 'failed') break;
  }
  report.status = report.arms.length === 2 && report.arms.every(arm =>
    arm.status === 'complete_outer_json_unreviewed') ? 'complete_outer_json_unreviewed'
    : 'completed_with_failure';
  if (report.status !== 'complete_outer_json_unreviewed') process.exitCode = 1;
} catch (error) {
  report.status = 'failed';
  report.errors.push(String(error));
  process.exitCode = 1;
} finally {
  report.finished_at = new Date().toISOString();
  report.wall_elapsed_ms = Math.round(performance.now() - started);
  await save();
  console.log(`REG-058 controls ${report.status}: ${reportPath}`);
}
