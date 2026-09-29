import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
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
const serverPath = process.env.AURALIS_TEST_LLAMA_SERVER;
assert(serverPath && path.isAbsolute(serverPath));
const runtimeSha = '6f15be27bd80b6b4d52afefa49094e18fcfab55d5da354d717971f2d2537b2f4';
const profileStem = model => `models/manifests/hy_mt2_${model}_q4_k_m.context_v6_slot.experimental.json`;
const models = [
  { key: '1b', stem: '1_8b', path: process.env.AURALIS_TEST_GGUF_1B,
    sha256: 'dc5f44fcf1fa496ee7ad725982c0c8c553a4de00259b53af84c4b89fb0c06699' },
  { key: '7b', stem: '7b', path: process.env.AURALIS_TEST_GGUF_7B,
    sha256: '9f96256500f3fc1ab4d64336b58f52a949a95ad7516b0c229476eef782f9f77b' },
];
const shaFile = async file => {
  const hash = createHash('sha256');
  for await (const chunk of createReadStream(file)) hash.update(chunk);
  return hash.digest('hex');
};
for (const model of models) {
  assert(model.path && path.isAbsolute(model.path));
  model.profileBytes = await fs.readFile(path.join(root, profileStem(model.stem)));
  model.profile = JSON.parse(model.profileBytes);
  assert.equal(model.profile.prompt_version, 6);
  assert.equal(model.profile.model_file_sha256, model.sha256);
  assert.equal(await shaFile(model.path), model.sha256);
}
assert.equal(digest(await fs.readFile(serverPath)), runtimeSha);
const cliSha = digest(await fs.readFile(path.join(root, 'target/release/auralis-translation-cli.exe')));
assert.equal(cliSha, '76ab2844996a3d68e9be96035f22f32bfcad79e085a5eacdecddbfa27626452a');
const regressionBytes = await fs.readFile(path.join(root, 'eval/regressions/long-v6-length-repeat-v1.json'));
const regression = JSON.parse(regressionBytes);
const archiveBytes = await fs.readFile(path.join(root, 'eval/reports/2026-09-29-long-v6-relocated-continuation-failure-journal.json.gz'));
assert.equal(digest(archiveBytes), '09944a0cefd47eb124fa780157bf6fc5d27bec1db4c7c19612500ec7bd49c388');
const archive = JSON.parse(gunzipSync(archiveBytes));
const failed = archive.requests.at(-1);
assert.equal(failed.request_sha256, regression.reproduction.request_sha256);
const archivedRequest = JSON.parse(failed.rendered_request);
const originalSource = regression.reproduction.source_zh;
const originalPrompt = archivedRequest.messages[0].content;
assert.equal(originalPrompt.split(originalSource).length - 1, 2);
assert.doesNotMatch(originalPrompt, /\p{Script=Cyrillic}/u);
const cases = [
  { id: regression.failed_case_id, source_zh: originalSource },
  ...regression.related_cases.map(row => ({ id: row.id, source_zh: row.source_zh })),
  { id: regression.negative_control.id, source_zh: regression.negative_control.source_zh },
];
assert.equal(cases.length, 4);
assert(cases.every(row => row.source_zh.startsWith('工程 AUR-0983：')));
const seeds = [101, 202];
const budgetMs = 20 * 60_000;
const perRequestMs = 120_000;
const parent = path.join(root, '.cache/eval/long-v6-length-model-probes');
await fs.mkdir(parent, { recursive: true });
const workspace = await fs.mkdtemp(path.join(parent, 'run-'));
console.log(`REG-006 paired model workspace: ${workspace}`);
const started = performance.now();
const report = {
  schema_version: 1, experiment: 'reg-006-v6-1b-7b-paired-v1', status: 'running',
  started_at: new Date().toISOString(),
  identity: { regression_sha256: digest(regressionBytes), archived_failure_journal_sha256: digest(archiveBytes),
    archived_failed_request_sha256: failed.request_sha256, runtime_sha256: runtimeSha, cli_sha256: cliSha,
    models: models.map(model => ({ key: model.key, alias: model.profile.model_alias,
      revision: model.profile.model_revision, model_sha256: model.sha256,
      profile_sha256: digest(model.profileBytes) })) },
  budget: { seeds, cases: cases.map(row => row.id), chat_requests: 16, server_starts: 2,
    per_request_ms: perRequestMs, total_wall_ms: budgetMs, no_retries: true },
  source_group: 'project_authored_development', sealed_holdout: false, human_review: 'missing',
  quality_verdict: 'unreviewed', requests: [], failures: [], resources: {},
};
const save = async () => fs.writeFile(path.join(workspace, 'report.json'), `${JSON.stringify(report, null, 2)}\n`);
const journal = await fs.open(path.join(workspace, 'requests.jsonl'), 'a');
const remaining = () => {
  const ms = budgetMs - (performance.now() - started);
  assert(ms > 0, 'REG-006 total wall budget exhausted');
  return ms;
};
const buildRequest = (model, row, seed) => {
  const request = structuredClone(archivedRequest);
  request.model = model.profile.model_alias;
  request.seed = seed;
  request.messages[0].content = originalPrompt.replaceAll(originalSource, row.source_zh);
  assert.equal(request.messages[0].content.split(row.source_zh).length - 1, 2);
  const envelope = JSON.parse(request.messages[0].content.split('Input JSON:\n')[1]);
  assert.equal(envelope.target_slots[0].segment_id, 983);
  assert.equal(envelope.target_slots[0].source_original, row.source_zh);
  assert.equal(envelope.target_slots[0].source_for_translation, row.source_zh);
  assert.deepEqual(envelope.source_context.map(cue => cue.segment_id), [982, 984]);
  assert.doesNotMatch(request.messages[0].content, /\p{Script=Cyrillic}/u);
  return request;
};
const planned = models.flatMap(model => seeds.flatMap(seed => cases.map(row => {
  const request = buildRequest(model, row, seed);
  const body = Buffer.from(JSON.stringify(request));
  return { model: model.key, case_id: row.id, seed, source_zh: row.source_zh,
    request, body, request_sha256: digest(body) };
})));
assert.equal(planned.length, 16);
for (const item of planned.filter(row => row.model === '1b')) {
  const paired = planned.find(row => row.model === '7b' && row.case_id === item.case_id && row.seed === item.seed);
  const sameInput = structuredClone(paired.request);
  sameInput.model = item.request.model;
  assert.deepEqual(sameInput, item.request, 'Paired requests must differ only in checked model alias');
}
report.planned_requests = planned.map(({ model, case_id, seed, request_sha256 }) =>
  ({ model, case_id, seed, request_sha256 }));
let currentServer;
try {
  await save();
  for (const model of models) {
    const port = await freeLoopbackPort();
    const url = `http://127.0.0.1:${port}/`;
    const args = ['--model', model.path, '--alias', model.profile.model_alias, '--host', '127.0.0.1',
      '--port', String(port), '-c', '2048', '-ngl', '99', '--parallel', '1', '--jinja', '--cache-ram', '0'];
    currentServer = startProcess(serverPath, args, root, process.env, { maxCaptureCharacters: 4 * 1024 * 1024 });
    await waitForHealthyServer(url, currentServer, Math.min(180_000, remaining()));
    const sampler = runtimeSampler(path.join(workspace, `${model.key}-resources.jsonl`), root,
      () => [currentServer.child.pid]);
    try {
      for (const seed of seeds) {
        for (const row of cases) {
          assert(report.requests.length < report.budget.chat_requests);
          const { request, body } = planned.find(item => item.model === model.key &&
            item.case_id === row.id && item.seed === seed);
          const entry = { model: model.key, case_id: row.id, seed, source_zh: row.source_zh,
            request_sha256: digest(body), request, started_at: new Date().toISOString() };
          const callStarted = performance.now();
          try {
            const response = await fetch(`${url}v1/chat/completions`, { method: 'POST',
              headers: { 'content-type': 'application/json' }, body,
              signal: AbortSignal.timeout(Math.min(perRequestMs, remaining())) });
            entry.http_status = response.status;
            entry.raw_response = await response.text();
            const parsed = JSON.parse(entry.raw_response);
            entry.finish_reason = parsed.choices?.[0]?.finish_reason ?? null;
            entry.raw_candidate = parsed.choices?.[0]?.message?.content ?? null;
            entry.usage = parsed.usage ?? null;
            entry.timings = parsed.timings ?? null;
            if (response.ok && entry.finish_reason === 'stop' && typeof entry.raw_candidate === 'string') {
              try {
                const candidate = JSON.parse(entry.raw_candidate);
                const lines = candidate.translations;
                assert(Array.isArray(lines) && lines.length === 1);
                assert.equal(lines[0].segment_id, 983);
                assert.equal(lines[0].line_index, 0);
                assert(typeof lines[0].text === 'string' && lines[0].text.trim());
                entry.accepted_candidate = lines[0].text;
                entry.structural_outcome = 'valid_unreviewed';
              } catch (error) { entry.structural_outcome = `invalid: ${error.message}`; }
            } else entry.structural_outcome = 'incomplete_or_http_failure';
          } catch (error) {
            entry.error = String(error);
            entry.structural_outcome = 'transport_failure';
          }
          entry.elapsed_ms = Math.round(performance.now() - callStarted);
          report.requests.push({ model: entry.model, case_id: entry.case_id, seed: entry.seed,
            request_sha256: entry.request_sha256, http_status: entry.http_status ?? null,
            finish_reason: entry.finish_reason ?? null, structural_outcome: entry.structural_outcome,
            accepted_candidate: entry.accepted_candidate ?? null, usage: entry.usage ?? null,
            elapsed_ms: entry.elapsed_ms });
          await journal.write(`${JSON.stringify(entry)}\n`);
          await journal.sync();
          await save();
          console.log(`${model.key} ${seed} ${row.id}: ${entry.structural_outcome}, ${entry.elapsed_ms} ms`);
        }
      }
    } finally {
      report.resources[model.key] = await sampler.stop();
      await stopProcess(currentServer);
      await fs.writeFile(path.join(workspace, `${model.key}-server.log`),
        `${currentServer.stdout}\n${currentServer.stderr}\nstdout_truncated=${currentServer.stdoutTruncated} stderr_truncated=${currentServer.stderrTruncated}\n`);
      currentServer = null;
      await save();
    }
  }
  assert.equal(report.requests.length, 16);
  report.status = 'complete_observations_unreviewed';
} catch (error) {
  report.status = 'failed';
  report.failures.push({ at: new Date().toISOString(), message: String(error), stack: error.stack ?? null });
  throw error;
} finally {
  if (currentServer) {
    await stopProcess(currentServer);
    await fs.writeFile(path.join(workspace, 'failed-start-server.log'),
      `${currentServer.stdout}\n${currentServer.stderr}\nstdout_truncated=${currentServer.stdoutTruncated} stderr_truncated=${currentServer.stderrTruncated}\n`);
  }
  report.finished_at = new Date().toISOString();
  report.wall_elapsed_ms = Math.round(performance.now() - started);
  await save();
  await journal.close();
}
