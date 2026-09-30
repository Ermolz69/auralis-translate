import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { createReadStream } from 'node:fs';
import fs from 'node:fs/promises';
import path from 'node:path';
import { performance } from 'node:perf_hooks';
import { fileURLToPath } from 'node:url';
import { freeLoopbackPort, startProcess, stopProcess, waitForExit, waitForHealthyServer } from './local-process.mjs';
import { runtimeSampler } from './runtime-sampler.mjs';

assert.equal(process.platform, 'win32');
assert.deepEqual(process.argv.slice(2).filter(arg => arg !== '--preflight'), []);
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const runtimePath = process.env.AURALIS_TEST_LLAMA_SERVER;
const modelPath = process.env.AURALIS_TEST_GGUF_7B;
const cliPath = path.join(root, 'target/release/auralis-translation-cli.exe');
const modelSha256 = '9f96256500f3fc1ab4d64336b58f52a949a95ad7516b0c229476eef782f9f77b';
const runtimeSha256 = '6f15be27bd80b6b4d52afefa49094e18fcfab55d5da354d717971f2d2537b2f4';
const cliSha256 = '82df0fbd0167b9163f945c58d8387a1edf2c6eedfed9f38086f617f74914df1d';
const profilePath = path.join(root, 'models/manifests/hy_mt2_7b_q4_k_m.context_v5_scene.experimental.json');
const profileSha256 = '9b34d86d3b0d872720ee729131efef99281e71a0000d202abea169d625a92e73';
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const hashFile = async file => {
  const digester = createHash('sha256');
  for await (const chunk of createReadStream(file)) digester.update(chunk);
  return digester.digest('hex');
};
const readPinned = async (file, expected) => {
  const bytes = await fs.readFile(file);
  assert.equal(hash(bytes), expected, file);
  return bytes;
};
assert(runtimePath && path.isAbsolute(runtimePath));
assert(modelPath && path.isAbsolute(modelPath));
assert.equal(await hashFile(runtimePath), runtimeSha256);
assert.equal(await hashFile(modelPath), modelSha256);
assert.equal(await hashFile(cliPath), cliSha256);
const profile = JSON.parse(await readPinned(profilePath, profileSha256));
assert.equal(profile.temperature, 0.7);
assert.equal(profile.model_file_sha256, modelSha256);
const sources = [
  { id: 'asus', source: '.cache/eval/commons-asus-rog-ally-892592485/source.zh.srt',
    source_sha256: '923aed3991c2308d92b89c45181cea8ec7ece74e9b4d3a3ce0234d95e329913b',
    report: '.cache/eval/commons-asus-full-7b-v1/run-nCoZTy/report.json',
    report_sha256: 'd86f4264ae1c65f3508c3c8539cdcee3fd4fcae9de1fbc14ee0d83e02bc216ba',
    cues: [
      { number: 226, request_sha256: '2b4866629265b44c0660639be802945b1ccdc27326e783ea86a2d1df3779f44f', baseline: 'valid' },
      { number: 227, request_sha256: '945dda8849ffbfd948794a01311e94274e4f00b388a214025dfb709c7e226848', baseline: 'invalid_srt' },
    ] },
  { id: 'vivo', source: '.cache/eval/commons-vivo-979826861/source.zh.srt',
    source_sha256: '8c41e66f52000a5b67ab27bfc319accd11d89290b60e50fc5c60f4ee8230a000',
    report: '.cache/eval/commons-vivo-full-7b-v1/run-zxrN7F/report.json',
    report_sha256: 'acce4016734648c500a4abeb5ae7619e138d1af46955c50232a39cb450ec59b2',
    cues: [
      { number: 275, request_sha256: '20bfcc48756b63d2656b49924a3c8aa3c168d7948ebd1f54940e2cca776afff1', baseline: 'valid' },
      { number: 276, request_sha256: '24b553c5217f75f55232adeb2b646acb3c865cfb834f972731dfba3b3960081d', baseline: 'invalid_srt' },
    ] },
];
const cases = [];
for (const source of sources) {
  await readPinned(path.join(root, source.source), source.source_sha256);
  const report = JSON.parse(await readPinned(path.join(root, source.report), source.report_sha256));
  const chats = report.requests.filter(row => row.path === '/v1/chat/completions');
  for (const cue of source.cues) {
    const prior = chats[cue.number - 1];
    assert(prior);
    assert.equal(prior.request_sha256, cue.request_sha256);
    assert.equal(hash(Buffer.from(JSON.stringify(prior.request))), cue.request_sha256);
    assert.equal(prior.request.temperature, 0.7);
    assert.equal(prior.request.model, profile.model_alias);
    const envelope = JSON.parse(prior.request.messages[0].content.split('Input JSON:\n')[1]);
    assert.equal(envelope.target_slots.length, 1);
    assert.equal(envelope.target_slots[0].segment_id, cue.number);
    assert(!/\p{Script=Cyrillic}/u.test(prior.request.messages[0].content));
    const variant = structuredClone(prior.request);
    variant.temperature = 0;
    const onlyTemperatureChanged = structuredClone(variant);
    onlyTemperatureChanged.temperature = 0.7;
    assert.deepEqual(onlyTemperatureChanged, prior.request);
    cases.push({ id: `${source.id}-${cue.number}`, source_id: source.id,
      cue: cue.number, baseline: cue.baseline,
      baseline_request_sha256: cue.request_sha256,
      baseline_raw_candidate_sha256: hash(Buffer.from(prior.raw_candidate)),
      request: variant, request_sha256: hash(Buffer.from(JSON.stringify(variant))) });
  }
}
assert.equal(cases.length, 4);
const planned = [1, 2].flatMap(repetition => cases.map(item => ({ ...item, repetition })));
const limits = { chat_requests: 8, repetitions_per_case: 2, server_starts: 1,
  retries: 0, per_request_ms: 120_000, readiness_ms: 180_000,
  total_wall_ms: 300_000 };
if (process.argv.includes('--preflight')) {
  console.log(JSON.stringify({ cases: cases.map(item => item.id), requests: planned.length,
    source_report_sha256: sources.map(item => item.report_sha256),
    model_sha256: modelSha256, inference: false }));
  process.exit(0);
}

const parent = path.join(root, '.cache/eval/natural-json-tail-temperature-zero-v1');
await fs.mkdir(parent, { recursive: true });
const workspace = await fs.mkdtemp(path.join(parent, 'run-'));
const started = performance.now();
const report = { schema_version: 1, experiment: 'natural-json-tail-temperature-zero-v1',
  status: 'running', started_at: new Date().toISOString(),
  git_head: execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim(),
  git_status: execFileSync('git', ['status', '--short'], { cwd: root, encoding: 'utf8' }).trim(),
  harness_sha256: await hashFile(fileURLToPath(import.meta.url)),
  model_sha256: modelSha256, runtime_sha256: runtimeSha256,
  cli_sha256: cliSha256, profile_sha256: profileSha256,
  source_identities: sources.map(({ id, source_sha256, report_sha256 }) =>
    ({ id, source_sha256, report_sha256 })),
  changed_factor: { field: 'temperature', baseline: 0.7, variant: 0 },
  limits, planned: planned.map(({ id, repetition, baseline_request_sha256,
    request_sha256 }) => ({ id, repetition, baseline_request_sha256, request_sha256 })),
  requests: [], failures: [], resources: null,
  human_review: 'missing', ai_review: 'pending' };
const save = async () => fs.writeFile(path.join(workspace, 'report.json'),
  `${JSON.stringify(report, null, 2)}\n`);
const journal = await fs.open(path.join(workspace, 'requests.jsonl'), 'wx');
const remaining = () => {
  const ms = limits.total_wall_ms - (performance.now() - started);
  assert(ms > 0, 'Declared temperature-screen wall budget exhausted');
  return ms;
};
let server;
try {
  await save();
  const port = await freeLoopbackPort();
  const url = `http://127.0.0.1:${port}/`;
  const args = ['--model', modelPath, '--alias', profile.model_alias,
    '--host', '127.0.0.1', '--port', String(port), '-c', '2048', '-ngl', '99',
    '--parallel', '1', '--jinja', '--cache-ram', '0'];
  const runtimeEnv = { ...process.env, PATH: `${path.dirname(runtimePath)};${path.join(root,
    '.cache/runtime/cudart')};${process.env.PATH}` };
  server = startProcess(runtimePath, args, root, runtimeEnv,
    { maxCaptureCharacters: 4 * 1024 * 1024 });
  await waitForHealthyServer(url, server, Math.min(limits.readiness_ms, remaining()));
  const sampler = runtimeSampler(path.join(workspace, 'resources.jsonl'),
    root, () => [server.child.pid]);
  try {
    for (const item of planned) {
      assert(report.requests.length < limits.chat_requests);
      const entry = { id: item.id, source_id: item.source_id, cue: item.cue,
        repetition: item.repetition, baseline: item.baseline,
        baseline_request_sha256: item.baseline_request_sha256,
        baseline_raw_candidate_sha256: item.baseline_raw_candidate_sha256,
        request_sha256: item.request_sha256, request: item.request,
        started_at: new Date().toISOString() };
      const callStarted = performance.now();
      try {
        const response = await fetch(`${url}v1/chat/completions`, {
          method: 'POST', headers: { 'content-type': 'application/json' },
          body: JSON.stringify(item.request),
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
            const rows = JSON.parse(entry.raw_candidate).translations;
            assert.equal(rows?.length, 1);
            assert.equal(rows[0].segment_id, item.cue);
            assert.equal(rows[0].line_index, 0);
            assert(typeof rows[0].text === 'string' && rows[0].text.trim());
            entry.candidate_text = rows[0].text;
            const srt = path.join(workspace, `candidate-${item.id}-${item.repetition}.srt`);
            await fs.writeFile(srt,
              `1\n00:00:00,000 --> 00:00:05,000\n${rows[0].text}\n`);
            try {
              await waitForExit(startProcess(cliPath, ['inspect', srt], root), 10_000);
              entry.structural_outcome = 'valid_unreviewed';
            } catch (error) {
              entry.structural_outcome = 'invalid_srt';
              entry.validation_error = error.message;
            }
          } catch (error) {
            entry.structural_outcome = 'invalid_json_or_slot';
            entry.validation_error = error.message;
          }
        } else entry.structural_outcome = 'incomplete_or_http_failure';
      } catch (error) {
        entry.structural_outcome = 'transport_failure';
        entry.error = String(error);
      }
      entry.elapsed_ms = Math.round(performance.now() - callStarted);
      report.requests.push({ id: entry.id, repetition: entry.repetition,
        baseline_request_sha256: entry.baseline_request_sha256,
        request_sha256: entry.request_sha256,
        http_status: entry.http_status ?? null,
        finish_reason: entry.finish_reason ?? null,
        structural_outcome: entry.structural_outcome,
        raw_candidate_sha256: entry.raw_candidate ? hash(Buffer.from(entry.raw_candidate)) : null,
        usage: entry.usage ?? null, elapsed_ms: entry.elapsed_ms });
      await journal.write(`${JSON.stringify(entry)}\n`);
      await journal.sync();
      await save();
      console.log(`${item.id} repetition=${item.repetition}: ${entry.structural_outcome}, ${entry.elapsed_ms} ms`);
    }
  } finally {
    report.resources = await sampler.stop();
    await stopProcess(server);
    await fs.writeFile(path.join(workspace, 'server.log'),
      `${server.stdout}\n${server.stderr}\n`);
    server = null;
    await save();
  }
  assert.equal(report.requests.length, limits.chat_requests);
  report.status = 'complete_screen_unreviewed';
} catch (error) {
  report.status = 'failed';
  report.failures.push({ at: new Date().toISOString(), message: String(error) });
  throw error;
} finally {
  if (server) await stopProcess(server);
  report.finished_at = new Date().toISOString();
  report.wall_elapsed_ms = Math.round(performance.now() - started);
  await save();
  await journal.close();
  await fs.writeFile(path.join(parent, 'latest.txt'), workspace);
}
