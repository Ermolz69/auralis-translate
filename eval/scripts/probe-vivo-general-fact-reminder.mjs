import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { createReadStream } from 'node:fs';
import fs from 'node:fs/promises';
import path from 'node:path';
import { performance } from 'node:perf_hooks';
import { fileURLToPath } from 'node:url';
import { freeLoopbackPort, startProcess, stopProcess, waitForHealthyServer } from './local-process.mjs';
import { runtimeSampler } from './runtime-sampler.mjs';

assert.equal(process.platform, 'win32');
assert.deepEqual(process.argv.slice(2).filter(arg => arg !== '--preflight'), []);
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const baselineDirectory = path.join(root, '.cache/eval/commons-vivo-fact-model-screen-v1/run-uuRubD');
const runtimePath = process.env.AURALIS_TEST_LLAMA_SERVER;
const modelPath = process.env.AURALIS_TEST_GGUF_7B;
const modelSha256 = '9f96256500f3fc1ab4d64336b58f52a949a95ad7516b0c229476eef782f9f77b';
const runtimeSha256 = '6f15be27bd80b6b4d52afefa49094e18fcfab55d5da354d717971f2d2537b2f4';
const sourceSha256 = '8c41e66f52000a5b67ab27bfc319accd11d89290b60e50fc5c60f4ee8230a000';
const controlsSha256 = '3119d4d1c0b6489618d214808662195f0c1d6d0d47946a4726fcd5d7409a67ef';
const baselineReportSha256 = '1334cd24bd471f0c7ce9e9ac0d29459706b2da943939fbc1f4ddb830c3c3a7cd';
const baselineJournalSha256 = '3b680456c4166ae54e2ce4cc7f374e85f68639c88a4f1b0a9d5730f30c58062d';
const profilePath = path.join(root,
  'models/manifests/hy_mt2_7b_q4_k_m.context_v5_scene.experimental.json');
const profileSha256 = '9b34d86d3b0d872720ee729131efef99281e71a0000d202abea169d625a92e73';
const reminder = ' Preserve explicit factual relations in target_slots: quantities with their units and counted entity, who acts or receives an action, clock time, and whether an event is past, current, planned, or hoped for. Do not infer a fact from background context when the target states something narrower.';
const needle = ' Return exactly one JSON object';
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const hashFile = async file => {
  const digest = createHash('sha256');
  for await (const chunk of createReadStream(file)) digest.update(chunk);
  return digest.digest('hex');
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
const profile = JSON.parse(await readPinned(profilePath, profileSha256));
assert.equal(profile.prompt_version, 5);
assert.equal(profile.model_file_sha256, modelSha256);
assert.equal(profile.model_alias, 'auralis-hy-mt2-7b-q4');
await readPinned(path.join(root, '.cache/eval/commons-vivo-979826861/source.zh.srt'),
  sourceSha256);
const controls = JSON.parse(await readPinned(path.join(root,
  'eval/corpora/vivo-fact-controls-v1.json'), controlsSha256));
const baselineReport = JSON.parse(await readPinned(path.join(baselineDirectory,
  'report.json'), baselineReportSha256));
assert.equal(baselineReport.status, 'complete_with_failures_unreviewed');
const baselineJournal = await readPinned(path.join(baselineDirectory,
  'requests.jsonl'), baselineJournalSha256);
const baseline = baselineJournal.toString('utf8').trimEnd().split(/\r?\n/u)
  .map(JSON.parse).filter(row => row.model === '7b');
assert.equal(baseline.length, 28);
assert.equal(baseline.filter(row => row.kind === 'natural').length, 10);
assert.equal(baseline.filter(row => row.kind !== 'natural').length, 18);
const seen = new Set();
const planned = baseline.map(row => {
  assert.equal(row.request.model, profile.model_alias);
  assert.equal(hash(Buffer.from(JSON.stringify(row.request))), row.request_sha256);
  const prior = row.request.messages?.[0]?.content;
  assert.equal(typeof prior, 'string');
  assert.equal(hash(Buffer.from(prior)), row.prompt_sha256);
  assert.equal(prior.split(needle).length, 2);
  assert.equal(prior.split('Input JSON:\n').length, 2);
  assert(!/\p{Script=Cyrillic}/u.test(prior));
  const envelope = JSON.parse(prior.split('Input JSON:\n')[1]);
  assert.equal(envelope.target_slots.length, 1);
  assert.equal(envelope.target_slots[0].source_original, row.source_zh);
  if (row.kind !== 'natural') {
    const control = controls.cases.find(item => item.id === row.case_id);
    assert(control);
    assert.equal(control.source_zh, row.source_zh);
    assert(!prior.includes(control.expected_meaning_en));
  }
  const key = `${row.case_id}/${row.seed}`;
  assert(!seen.has(key));
  seen.add(key);
  const request = structuredClone(row.request);
  request.messages[0].content = prior.replace(needle, `${reminder}${needle}`);
  assert.equal(request.messages[0].content.replace(reminder, ''), prior);
  assert(!/\p{Script=Cyrillic}/u.test(request.messages[0].content));
  if (row.kind !== 'natural') {
    const control = controls.cases.find(item => item.id === row.case_id);
    assert(!request.messages[0].content.includes(control.expected_meaning_en));
  }
  const body = Buffer.from(JSON.stringify(request));
  return { case_id: row.case_id, kind: row.kind, regression_id: row.regression_id,
    seed: row.seed, source_zh: row.source_zh,
    target_segment_id: envelope.target_slots[0].segment_id,
    baseline_request_sha256: row.request_sha256,
    baseline_prompt_sha256: row.prompt_sha256,
    variant_request_sha256: hash(body),
    variant_prompt_sha256: hash(Buffer.from(request.messages[0].content)),
    request, body };
});
assert.equal(planned.length, 28);
const limits = { chat_requests: 28, server_starts: 1, retries: 0,
  per_request_ms: 120_000, readiness_ms: 180_000, total_wall_ms: 600_000 };
if (process.argv.includes('--preflight')) {
  console.log(JSON.stringify({ cases: 23, requests: planned.length,
    model_sha256: modelSha256, baseline_journal_sha256: baselineJournalSha256,
    reminder_sha256: hash(Buffer.from(reminder)), inference: false }));
  process.exit(0);
}

const parent = path.join(root, '.cache/eval/commons-vivo-general-fact-reminder-v1');
await fs.mkdir(parent, { recursive: true });
const workspace = await fs.mkdtemp(path.join(parent, 'run-'));
console.log(`Private fact-reminder screen: ${workspace}`);
const started = performance.now();
const report = { schema_version: 1, id: 'commons-vivo-general-fact-reminder-v1',
  status: 'running', started_at: new Date().toISOString(),
  git_head: execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim(),
  git_status: execFileSync('git', ['status', '--short'], { cwd: root, encoding: 'utf8' }).trim(),
  harness_sha256: await hashFile(fileURLToPath(import.meta.url)),
  source_sha256: sourceSha256, controls_sha256: controlsSha256,
  baseline_report_sha256: baselineReportSha256,
  baseline_journal_sha256: baselineJournalSha256,
  model_sha256: modelSha256, runtime_sha256: runtimeSha256,
  profile_sha256: profileSha256, reminder, reminder_sha256: hash(Buffer.from(reminder)),
  limits, quality_review: 'ai_triage_pending_human_missing',
  planned_requests: planned.map(row => ({ case_id: row.case_id, kind: row.kind,
    seed: row.seed, baseline_request_sha256: row.baseline_request_sha256,
    variant_request_sha256: row.variant_request_sha256 })),
  requests: [], failures: [], resources: null };
const save = async () => fs.writeFile(path.join(workspace, 'report.json'),
  `${JSON.stringify(report, null, 2)}\n`);
const journal = await fs.open(path.join(workspace, 'requests.jsonl'), 'wx');
const remaining = () => {
  const ms = limits.total_wall_ms - (performance.now() - started);
  assert(ms > 0, 'Declared fact-reminder wall budget exhausted');
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
      const entry = { case_id: item.case_id, kind: item.kind,
        regression_id: item.regression_id, seed: item.seed,
        source_zh: item.source_zh,
        target_segment_id: item.target_segment_id,
        baseline_request_sha256: item.baseline_request_sha256,
        variant_request_sha256: item.variant_request_sha256,
        variant_prompt_sha256: item.variant_prompt_sha256,
        request: item.request, started_at: new Date().toISOString() };
      const requestStarted = performance.now();
      try {
        const response = await fetch(`${url}v1/chat/completions`, { method: 'POST',
          headers: { 'content-type': 'application/json' }, body: item.body,
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
            const output = JSON.parse(entry.raw_candidate).translations;
            assert.equal(output?.length, 1);
            assert.equal(output[0].segment_id, item.target_segment_id);
            assert.equal(output[0].line_index, 0);
            assert(typeof output[0].text === 'string' && output[0].text.trim());
            assert(!/[\p{Cc}\p{Cf}]/u.test(output[0].text));
            entry.accepted_candidate = output[0].text;
            entry.structural_outcome = 'valid_unreviewed';
          } catch (error) { entry.structural_outcome = `invalid: ${error.message}`; }
        } else entry.structural_outcome = 'incomplete_or_http_failure';
      } catch (error) {
        entry.error = String(error);
        entry.structural_outcome = 'transport_failure';
      }
      entry.elapsed_ms = Math.round(performance.now() - requestStarted);
      report.requests.push({ case_id: item.case_id, kind: item.kind,
        seed: item.seed, baseline_request_sha256: item.baseline_request_sha256,
        variant_request_sha256: item.variant_request_sha256,
        variant_prompt_sha256: item.variant_prompt_sha256,
        http_status: entry.http_status ?? null,
        finish_reason: entry.finish_reason ?? null,
        structural_outcome: entry.structural_outcome,
        accepted_candidate: entry.accepted_candidate ?? null,
        usage: entry.usage ?? null, elapsed_ms: entry.elapsed_ms });
      await journal.write(`${JSON.stringify(entry)}\n`);
      await journal.sync();
      await save();
      console.log(`${item.case_id} seed=${item.seed}: ${entry.structural_outcome}, ${entry.elapsed_ms} ms`);
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
  report.status = report.requests.every(row => row.structural_outcome === 'valid_unreviewed')
    ? 'complete_structural_observations_unreviewed' : 'complete_with_failures_unreviewed';
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
