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
const runtimePath = process.env.AURALIS_TEST_LLAMA_SERVER;
assert(runtimePath && path.isAbsolute(runtimePath));
const runtimeSha = '6f15be27bd80b6b4d52afefa49094e18fcfab55d5da354d717971f2d2537b2f4';
const archiveSha = '4037c071a17ef38ed7b9bc4989601ef8da0784fb39881b9138abb9d008701a8c';
const promptSha = '137efcbd09400d7ad2ab6c257077f96e09d7ff0c2eac2a35c067cdcbd7ef6a18';
const models = [
  { key: '1b', stem: '1_8b', path: process.env.AURALIS_TEST_GGUF_1B,
    sha256: 'dc5f44fcf1fa496ee7ad725982c0c8c553a4de00259b53af84c4b89fb0c06699' },
  { key: '7b', stem: '7b', path: process.env.AURALIS_TEST_GGUF_7B,
    sha256: '9f96256500f3fc1ab4d64336b58f52a949a95ad7516b0c229476eef782f9f77b' },
];
const caseIds = [1, 2, 3, 4, 5, 6, 7, 8, 129, 130,
  505, 506, 507, 508, 509, 510, 511, 512, 513,
  1017, 1018, 1019, 1020, 1021, 1022, 1023, 1024];
const seeds = [101, 202, 303];
const budgetMs = 25 * 60_000;
const perRequestMs = 120_000;
const inputMarker = 'Input JSON:\n';
const shaFile = async file => {
  const hash = createHash('sha256');
  for await (const chunk of createReadStream(file)) hash.update(chunk);
  return hash.digest('hex');
};
assert.equal(await shaFile(runtimePath), runtimeSha);
for (const model of models) {
  assert(model.path && path.isAbsolute(model.path));
  const profilePath = path.join(root,
    `models/manifests/hy_mt2_${model.stem}_q4_k_m.context_v6_slot.experimental.json`);
  model.profileBytes = await fs.readFile(profilePath);
  model.profile = JSON.parse(model.profileBytes);
  assert.equal(model.profile.prompt_version, 6);
  assert.equal(model.profile.prompt_template_sha256, promptSha);
  assert.equal(model.profile.model_file_sha256, model.sha256);
  assert.equal(await shaFile(model.path), model.sha256);
}
for (const key of ['target_segments_per_block', 'context_before_segments',
  'context_after_segments', 'temperature', 'top_p', 'top_k', 'repeat_penalty',
  'max_tokens_per_line', 'token_safety_margin_tokens']) {
  assert.equal(models[0].profile[key], models[1].profile[key], key);
}
const archiveBytes = await fs.readFile(path.join(root,
  'eval/reports/2026-09-29-long-v6-postlength-v2-journal.json.gz'));
assert.equal(digest(archiveBytes), archiveSha);
const archive = JSON.parse(gunzipSync(archiveBytes));
const identifiers = text => text.match(/(?<![\p{L}\p{N}_])[A-Z]{2,}-[0-9]{2,8}(?![\p{L}\p{N}_])/gu) ?? [];
const numericFacts = text => text.replace(/(?<![\p{L}\p{N}_])[A-Z]{2,}-[0-9]{2,8}(?![\p{L}\p{N}_])/gu, '')
  .match(/(?<![\p{L}\p{N}_])(?:\d{1,2}:\d{2}|\d+)(?![\p{L}\p{N}_])/gu)?.map(value =>
    /^\d{1,2}:\d{2}$/u.test(value) ? `${Number(value.split(':')[0])}:${value.split(':')[1]}` : value) ?? [];
const sourceRows = caseIds.map(id => {
  const requests = archive.requests.filter(row => row.segment_id === id
    && row.line_index === 0 && row.request_kind === 'chat_completion');
  assert.equal(requests.length, 1, `archived cue ${id}`);
  const row = requests[0];
  assert.equal(row.outcome, 'validated_line');
  const request = JSON.parse(row.rendered_request);
  assert.equal(request.model, models[0].profile.model_alias);
  assert.equal(request.messages.length, 1);
  assert.equal(request.messages[0].role, 'user');
  const prompt = request.messages[0].content;
  assert.equal(prompt.split(inputMarker).length, 2);
  assert.doesNotMatch(prompt, /\p{Script=Cyrillic}/u);
  const input = JSON.parse(prompt.split(inputMarker)[1]);
  assert.equal(input.target_slots.length, 1);
  assert.equal(input.target_slots[0].segment_id, id);
  assert.equal(input.target_slots[0].line_index, 0);
  assert.equal(input.target_slots[0].source_original,
    input.target_slots[0].source_for_translation);
  const source = input.target_slots[0].source_original;
  assert.deepEqual(identifiers(source), [`AUR-${String(id).padStart(4, '0')}`]);
  return { id, source, request_sha256: row.request_sha256, request,
    expected_identifiers: identifiers(source).sort(),
    expected_numeric_facts: numericFacts(source).sort() };
});
assert.deepEqual(sourceRows.slice(0, 8).map(row => row.id), [1, 2, 3, 4, 5, 6, 7, 8]);
assert.deepEqual(sourceRows.slice(-8).map(row => row.id),
  [1017, 1018, 1019, 1020, 1021, 1022, 1023, 1024]);
const planned = models.flatMap(model => seeds.flatMap(seed => sourceRows.map(row => {
  const request = structuredClone(row.request);
  request.model = model.profile.model_alias;
  request.seed = seed;
  const body = Buffer.from(JSON.stringify(request));
  return { model: model.key, cue_id: row.id, seed, source: row.source,
    expected_identifiers: row.expected_identifiers,
    expected_numeric_facts: row.expected_numeric_facts,
    original_request_sha256: row.request_sha256, request, body,
    request_sha256: digest(body), prompt_sha256: digest(Buffer.from(request.messages[0].content)) };
})));
assert.equal(planned.length, 162);
for (const item of planned.filter(row => row.model === '1b')) {
  const paired = planned.find(row => row.model === '7b'
    && row.cue_id === item.cue_id && row.seed === item.seed);
  assert(paired);
  const sameInput = structuredClone(paired.request);
  sameInput.model = item.request.model;
  assert.deepEqual(sameInput, item.request, 'paired bodies differ only in model alias');
  assert.equal(paired.prompt_sha256, item.prompt_sha256);
}
if (process.argv.includes('--preflight')) {
  console.log(`Long v6 code model preflight: ${planned.length} one-factor requests, 27 pinned cues, three seeds.`);
  process.exit(0);
}

const parent = path.join(root, '.cache/eval/long-v6-code-model-screen');
await fs.mkdir(parent, { recursive: true });
const workspace = await fs.mkdtemp(path.join(parent, 'run-'));
console.log(`Long v6 code model workspace: ${workspace}`);
const started = performance.now();
const report = {
  schema_version: 1, experiment: 'long-v6-code-model-1b-7b-paired-v1',
  status: 'running', started_at: new Date().toISOString(),
  identity: {
    git_head: execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim(),
    git_status: execFileSync('git', ['status', '--short'], { cwd: root, encoding: 'utf8' }).trim(),
    harness_sha256: await shaFile(fileURLToPath(import.meta.url)),
    runtime_sha256: runtimeSha, archive_sha256: archiveSha,
    models: models.map(model => ({ key: model.key, alias: model.profile.model_alias,
      revision: model.profile.model_revision, model_sha256: model.sha256,
      profile_sha256: digest(model.profileBytes), prompt_template_sha256: promptSha })),
  },
  budget: { cue_ids: caseIds, seeds, models: models.map(model => model.key),
    chat_requests: 162, server_starts: 2, per_request_ms: perRequestMs,
    total_wall_ms: budgetMs, no_retries: true },
  source_group: 'project_authored_synthetic_development', sealed_holdout: false,
  human_review: 'missing', quality_verdict: 'unreviewed',
  planned_requests: planned.map(({ model, cue_id, seed, original_request_sha256,
    request_sha256, prompt_sha256 }) => ({ model, cue_id, seed,
    original_request_sha256, request_sha256, prompt_sha256 })),
  requests: [], failures: [], resources: {},
};
const save = async () => fs.writeFile(path.join(workspace, 'report.json'),
  `${JSON.stringify(report, null, 2)}\n`);
const journal = await fs.open(path.join(workspace, 'requests.jsonl'), 'a');
const remaining = () => {
  const ms = budgetMs - (performance.now() - started);
  assert(ms > 0, 'long v6 model screen total wall budget exhausted');
  return ms;
};
let currentServer;
try {
  await save();
  for (const model of models) {
    const port = await freeLoopbackPort();
    const url = `http://127.0.0.1:${port}/`;
    const args = ['--model', model.path, '--alias', model.profile.model_alias,
      '--host', '127.0.0.1', '--port', String(port), '-c', '2048', '-ngl', '99',
      '--parallel', '1', '--jinja', '--cache-ram', '0'];
    currentServer = startProcess(runtimePath, args, root, process.env,
      { maxCaptureCharacters: 4 * 1024 * 1024 });
    await waitForHealthyServer(url, currentServer, Math.min(180_000, remaining()));
    const sampler = runtimeSampler(path.join(workspace, `${model.key}-resources.jsonl`), root,
      () => [currentServer.child.pid]);
    try {
      for (const item of planned.filter(row => row.model === model.key)) {
        assert(report.requests.length < report.budget.chat_requests);
        const entry = { model: item.model, cue_id: item.cue_id, seed: item.seed,
          source_zh: item.source, expected_identifiers: item.expected_identifiers,
          expected_numeric_facts: item.expected_numeric_facts,
          original_request_sha256: item.original_request_sha256,
          request_sha256: item.request_sha256, prompt_sha256: item.prompt_sha256,
          request: item.request, started_at: new Date().toISOString() };
        const callStarted = performance.now();
        try {
          const response = await fetch(`${url}v1/chat/completions`, { method: 'POST',
            headers: { 'content-type': 'application/json' }, body: item.body,
            signal: AbortSignal.timeout(Math.min(perRequestMs, remaining())) });
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
              const candidate = JSON.parse(entry.raw_candidate);
              assert.equal(candidate.translations?.length, 1);
              const line = candidate.translations[0];
              assert.equal(line.segment_id, item.cue_id);
              assert.equal(line.line_index, 0);
              assert(typeof line.text === 'string' && line.text.trim());
              entry.accepted_candidate = line.text;
              entry.identifier_preserved = JSON.stringify(identifiers(line.text).sort()) ===
                JSON.stringify(item.expected_identifiers);
              entry.numeric_facts_preserved = JSON.stringify(numericFacts(line.text).sort()) ===
                JSON.stringify(item.expected_numeric_facts);
              entry.structural_outcome = 'valid_unreviewed';
            } catch (error) { entry.structural_outcome = `invalid: ${error.message}`; }
          } else entry.structural_outcome = 'incomplete_or_http_failure';
        } catch (error) {
          entry.error = String(error);
          entry.structural_outcome = 'transport_failure';
        }
        entry.elapsed_ms = Math.round(performance.now() - callStarted);
        report.requests.push({ model: entry.model, cue_id: entry.cue_id, seed: entry.seed,
          original_request_sha256: entry.original_request_sha256,
          request_sha256: entry.request_sha256, prompt_sha256: entry.prompt_sha256,
          http_status: entry.http_status ?? null, finish_reason: entry.finish_reason ?? null,
          structural_outcome: entry.structural_outcome,
          accepted_candidate: entry.accepted_candidate ?? null,
          identifier_preserved: entry.identifier_preserved ?? null,
          numeric_facts_preserved: entry.numeric_facts_preserved ?? null,
          usage: entry.usage ?? null, elapsed_ms: entry.elapsed_ms });
        await journal.write(`${JSON.stringify(entry)}\n`);
        await journal.sync();
        await save();
        console.log(`${model.key} cue=${item.cue_id} seed=${item.seed}: ${entry.structural_outcome}, code=${entry.identifier_preserved ?? 'unknown'}, number=${entry.numeric_facts_preserved ?? 'unknown'}, ${entry.elapsed_ms} ms`);
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
  assert.equal(report.requests.length, 162);
  report.status = 'complete_observations_unreviewed';
} catch (error) {
  report.status = 'failed';
  report.failures.push({ at: new Date().toISOString(), message: String(error),
    stack: error.stack ?? null });
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
