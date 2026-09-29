import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { createReadStream } from 'node:fs';
import fs from 'node:fs/promises';
import path from 'node:path';
import { performance } from 'node:perf_hooks';
import { fileURLToPath } from 'node:url';
import { gunzipSync } from 'node:zlib';
import { digest } from './flores-file-fixture.mjs';
import { freeLoopbackPort, startProcess, stopProcess, waitForHealthyServer } from './local-process.mjs';
import { runtimeSampler } from './runtime-sampler.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const modelPath = process.env.AURALIS_TEST_GGUF_1B;
const runtimePath = process.env.AURALIS_TEST_LLAMA_SERVER;
const modelSha = 'dc5f44fcf1fa496ee7ad725982c0c8c553a4de00259b53af84c4b89fb0c06699';
const runtimeSha = '6f15be27bd80b6b4d52afefa49094e18fcfab55d5da354d717971f2d2537b2f4';
const profileSha = 'e80c80b0cf1db26d62ce5f644091f30e42fea752d27a0ce201fcab33f29ecb69';
const summarySha = '5388be229dae37710322f1143497d48e5e98037437fa11319943d03dd2e51c64';
const journalSha = '59444550a646c73d2b354c4e11ee0abbfead55636b98c76978c633a9219275d3';
const sourceJournalSha = '4037c071a17ef38ed7b9bc4989601ef8da0784fb39881b9138abb9d008701a8c';
const expectedAggregate = '230b44cb198e330b96fd2880bc4442ca8ac92e73138a854867b90084b2d42c36';
const ids = [1, 2, 3, 4, 5, 6, 7, 8, 129, 130, 505, 506, 507, 508, 509,
  510, 511, 512, 513, 1017, 1018, 1019, 1020, 1021, 1022, 1023, 1024];
const seeds = [101, 202, 303];
const budgetMs = 15 * 60_000;
const requestMs = 120_000;
const identifierPattern = /(?<![\p{L}\p{N}_])[A-Z]{2,}-[0-9]{2,8}(?![\p{L}\p{N}_])/gu;
const identifiers = value => value.match(identifierPattern)?.sort() ?? [];
const numeric = value => value.replace(identifierPattern, '').match(/\d{1,2}:\d{2}|\d+/gu)?.sort() ?? [];
const same = (left, right) => JSON.stringify(left) === JSON.stringify(right);
const shaFile = async file => {
  const hash = createHash('sha256');
  for await (const chunk of createReadStream(file)) hash.update(chunk);
  return hash.digest('hex');
};

assert(modelPath && path.isAbsolute(modelPath));
assert(runtimePath && path.isAbsolute(runtimePath));
assert.equal(await shaFile(modelPath), modelSha);
assert.equal(await shaFile(runtimePath), runtimeSha);
const profileBytes = await fs.readFile(path.join(root,
  'models/manifests/hy_mt2_1_8b_q4_k_m.context_v6_prefix_repair.experimental.json'));
assert.equal(digest(profileBytes), profileSha);
const profile = JSON.parse(profileBytes);
const summaryBytes = await fs.readFile(path.join(root,
  'eval/reports/2026-09-29-reg009-live-prefix-repair-summary.json'));
assert.equal(digest(summaryBytes), summarySha);
const summary = JSON.parse(summaryBytes);
assert.equal(summary.identity.archive_sha256, sourceJournalSha);
assert.equal(await shaFile(path.join(root,
  'eval/reports/2026-09-29-long-v6-postlength-v2-journal.json.gz')),
sourceJournalSha);
assert.deepEqual(summary.budget.cue_ids, ids);
assert.deepEqual(summary.budget.seeds, seeds);
assert.equal(summary.counts.requests, 81);
const journalBytes = await fs.readFile(path.join(root,
  'eval/reports/2026-09-29-reg009-live-prefix-repair-requests.jsonl.gz'));
assert.equal(digest(journalBytes), journalSha);
const baseline = gunzipSync(journalBytes).toString('utf8').trim().split('\n').map(JSON.parse);
assert.equal(baseline.length, 81);
const planned = baseline.map((row, index) => {
  assert.equal(row.seed, seeds[Math.floor(index / ids.length)]);
  assert.equal(row.cue_id, ids[index % ids.length]);
  assert.equal(row.request.temperature, 0.7);
  assert.equal(digest(Buffer.from(JSON.stringify(row.request))), row.request_sha256);
  assert.equal(row.request.model, profile.model_alias);
  assert.equal(row.request.messages.length, 1);
  const prompt = row.request.messages[0].content;
  assert.doesNotMatch(prompt, /\p{Script=Cyrillic}/u);
  const input = JSON.parse(prompt.split('Input JSON:\n')[1]);
  assert.equal(input.target_slots.length, 1);
  assert.equal(input.target_slots[0].segment_id, row.cue_id);
  assert.equal(input.target_slots[0].source_original, row.source_zh);
  assert.deepEqual(input.source_context.map(item => item.segment_id),
    input.source_context.map(item => item.segment_id).sort((a, b) => a - b));
  const request = { ...row.request, temperature: 0 };
  const body = Buffer.from(JSON.stringify(request));
  return { cue_id: row.cue_id, seed: row.seed, source_zh: row.source_zh,
    baseline_request_sha256: row.request_sha256,
    prompt_sha256: digest(Buffer.from(prompt)),
    request_sha256: digest(body), body };
});
const aggregate = digest(Buffer.from(`${planned.map(row => row.request_sha256).join('\n')}\n`));
assert.equal(aggregate, expectedAggregate);
assert.equal(planned[0].request_sha256,
  'dac5ac78e1d22950ea5ac314258ca8b2a22e2e5c6d77cd21efded8c845c4417f');
assert.equal(planned.at(-1).request_sha256,
  'fbe7714ebd0e3a1318ffb48136f475b612a8ee10929ab64009ac49c431f873ed');
assert.equal(new Set(planned.map(row => `${row.cue_id}:${row.seed}`)).size, 81);
if (process.argv.includes('--preflight')) {
  console.log(JSON.stringify({ experiment: 'reg009-greedy81-v1', count: planned.length,
    baseline_summary_sha256: summarySha, baseline_journal_sha256: journalSha,
    ordered_request_hashes_sha256: aggregate, first: planned[0].request_sha256,
    last: planned.at(-1).request_sha256, cue_ids: ids, seeds }, null, 2));
  process.exit(0);
}

const parent = path.join(root, '.cache/eval/reg009-greedy81');
await fs.mkdir(parent, { recursive: true });
const workspace = await fs.mkdtemp(path.join(parent, 'run-'));
console.log(`REG-009 greedy workspace: ${workspace}`);
const started = performance.now();
const report = { schema_version: 1, experiment: 'reg009-greedy81-v1',
  status: 'running', started_at: new Date().toISOString(),
  source_family: 'project_authored_synthetic_development',
  human_review: 'missing', sealed_holdout: false,
  identity: { git_head: execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim(),
    git_status: execFileSync('git', ['status', '--short'], { cwd: root, encoding: 'utf8' }).trim(),
    runner_sha256: await shaFile(fileURLToPath(import.meta.url)),
    model_sha256: modelSha, runtime_sha256: runtimeSha, profile_sha256: profileSha,
    baseline_summary_sha256: summarySha, baseline_journal_sha256: journalSha,
    source_journal_sha256: sourceJournalSha,
    ordered_request_hashes_sha256: aggregate },
  budget: { cue_ids: ids, seeds, requests: 81, retries: 0, server_starts: 1,
    request_ms: requestMs, wall_ms: budgetMs },
  planned_requests: planned.map(({ cue_id, seed, request_sha256, prompt_sha256,
    baseline_request_sha256 }) => ({ cue_id, seed, request_sha256,
    prompt_sha256, baseline_request_sha256 })),
  requests: [], errors: [], resources: null };
const save = () => fs.writeFile(path.join(workspace, 'report.json'),
  `${JSON.stringify(report, null, 2)}\n`);
const journal = await fs.open(path.join(workspace, 'requests.jsonl'), 'a');
const remaining = () => {
  const ms = budgetMs - (performance.now() - started);
  assert(ms > 0, 'REG-009 greedy wall budget exhausted');
  return ms;
};
let server;
let sampler;
try {
  await save();
  const port = await freeLoopbackPort();
  const url = `http://127.0.0.1:${port}/`;
  server = startProcess(runtimePath,
    ['--model', modelPath, '--alias', profile.model_alias, '--host', '127.0.0.1',
      '--port', String(port), '-c', '2048', '-ngl', '99', '--parallel', '1',
      '--jinja', '--cache-ram', '0'], root, process.env,
    { maxCaptureCharacters: 4 * 1024 * 1024 });
  await waitForHealthyServer(url, server, Math.min(180_000, remaining()));
  sampler = runtimeSampler(path.join(workspace, 'resources.jsonl'), root,
    () => [server.child.pid]);
  for (const item of planned) {
    const entry = { cue_id: item.cue_id, seed: item.seed, source_zh: item.source_zh,
      baseline_request_sha256: item.baseline_request_sha256,
      request_sha256: item.request_sha256, prompt_sha256: item.prompt_sha256,
      rendered_request: item.body.toString('utf8'), started_at: new Date().toISOString() };
    const clock = performance.now();
    try {
      const response = await fetch(`${url}v1/chat/completions`, { method: 'POST',
        headers: { 'content-type': 'application/json' }, body: item.body,
        signal: AbortSignal.timeout(Math.min(requestMs, remaining())) });
      entry.http_status = response.status;
      entry.raw_response = await response.text();
      assert(response.ok, `HTTP ${response.status}`);
      const envelope = JSON.parse(entry.raw_response);
      entry.finish_reason = envelope.choices?.[0]?.finish_reason ?? null;
      entry.raw_candidate = envelope.choices?.[0]?.message?.content ?? null;
      entry.usage = envelope.usage ?? null;
      entry.timings = envelope.timings ?? null;
      if (entry.finish_reason === 'stop' && typeof entry.raw_candidate === 'string') {
        try {
          const decoded = JSON.parse(entry.raw_candidate);
          assert.equal(decoded.translations?.length, 1);
          const slot = decoded.translations[0];
          assert.equal(slot.segment_id, item.cue_id);
          assert.equal(slot.line_index, 0);
          assert(typeof slot.text === 'string' && slot.text.trim());
          entry.restored_candidate = slot.text;
          entry.raw_exact_identifier = same(identifiers(item.source_zh), identifiers(slot.text));
          entry.raw_exact_numeric = same(numeric(item.source_zh), numeric(slot.text));
          entry.mixed_script_code_like = /[A-ZА-ЯЁ]*[А-ЯЁ][A-ZА-ЯЁ]*-[0-9]{2,}/u.test(slot.text);
          entry.structural_outcome = 'parsed_target_slot';
        } catch (error) { entry.structural_outcome = `invalid_target_slot: ${error.message}`; }
      } else entry.structural_outcome = 'incomplete_candidate';
    } catch (error) {
      entry.error = String(error);
      entry.structural_outcome = 'http_or_envelope_failure';
    }
    entry.elapsed_ms = Math.round(performance.now() - clock);
    report.requests.push({ cue_id: entry.cue_id, seed: entry.seed,
      request_sha256: entry.request_sha256,
      http_status: entry.http_status ?? null,
      structural_outcome: entry.structural_outcome,
      raw_exact_identifier: entry.raw_exact_identifier ?? null,
      raw_exact_numeric: entry.raw_exact_numeric ?? null,
      mixed_script_code_like: entry.mixed_script_code_like ?? null,
      usage: entry.usage ?? null, elapsed_ms: entry.elapsed_ms });
    await journal.write(`${JSON.stringify(entry)}\n`);
    await journal.sync();
    await save();
    console.log(`cue=${entry.cue_id} seed=${entry.seed}: ${entry.structural_outcome}, code=${entry.raw_exact_identifier ?? 'unknown'}, ${entry.elapsed_ms} ms`);
    if (entry.error) throw new Error(entry.error);
  }
  assert.equal(report.requests.length, 81);
  report.status = 'complete_observations_unreviewed';
} catch (error) {
  report.status = 'failed_retained';
  report.errors.push({ at: new Date().toISOString(), message: String(error),
    stack: error.stack ?? null });
  throw error;
} finally {
  if (sampler) {
    report.resources = await sampler.stop();
    const sampleErrors = report.resources.samples.flatMap(row => row.errors ?? []);
    if (sampleErrors.length) {
      report.status = 'failed_retained';
      report.errors.push({ at: new Date().toISOString(),
        message: `resource sampling: ${sampleErrors.join('; ')}` });
    }
  }
  if (server) {
    await stopProcess(server);
    await fs.writeFile(path.join(workspace, 'server.log'),
      `${server.stdout}\n${server.stderr}\n`);
  }
  report.finished_at = new Date().toISOString();
  report.wall_elapsed_ms = Math.round(performance.now() - started);
  await save();
  await journal.close();
}
assert.equal(report.status, 'complete_observations_unreviewed');
