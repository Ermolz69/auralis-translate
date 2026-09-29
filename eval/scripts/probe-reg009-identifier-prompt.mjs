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
const serverPath = process.env.AURALIS_TEST_LLAMA_SERVER;
const modelPath = process.env.AURALIS_TEST_GGUF_1B;
assert(serverPath && path.isAbsolute(serverPath));
assert(modelPath && path.isAbsolute(modelPath));
const serverSha = '6f15be27bd80b6b4d52afefa49094e18fcfab55d5da354d717971f2d2537b2f4';
const modelSha = 'dc5f44fcf1fa496ee7ad725982c0c8c553a4de00259b53af84c4b89fb0c06699';
const archiveSha = '4037c071a17ef38ed7b9bc4989601ef8da0784fb39881b9138abb9d008701a8c';
const caseIds = [1, 2, 514, 1000];
const requestHashes = [
  'd8b471e2d98f8f134a178a5bfa70ff0e16ea5dc55f12620a98792a12d253391b',
  'dd22e6617ee5b63aa607a82d4e1566c734aca3c8869d6795376857b2c970e39c',
  'f63855e1afba4b81d6718f19f75f4e6131810c407c06515fda5017c22444ed66',
  '80eb33cf4bc83e18fbb291c9c118e42ad92b6626f9a2509e484ff8b4d58699e6',
];
const seeds = [101, 202];
const budgetMs = 20 * 60_000;
const perRequestMs = 120_000;
const reminder = 'Preserve every ASCII identifier in the target source with uppercase letters, a hyphen and digits exactly once in the Russian text; copy its spelling and digits unchanged, and do not copy identifiers from context. ';
const outputContract = 'Return exactly one JSON object';
const shaFile = async file => {
  const hash = createHash('sha256');
  for await (const chunk of createReadStream(file)) hash.update(chunk);
  return hash.digest('hex');
};
assert.equal(await shaFile(serverPath), serverSha);
assert.equal(await shaFile(modelPath), modelSha);
const profilePath = path.join(root, 'models/manifests/hy_mt2_1_8b_q4_k_m.context_v6_slot.experimental.json');
const profileBytes = await fs.readFile(profilePath);
const profile = JSON.parse(profileBytes);
assert.equal(profile.prompt_version, 6);
assert.equal(profile.model_file_sha256, modelSha);
const archiveBytes = await fs.readFile(path.join(root,
  'eval/reports/2026-09-29-long-v6-postlength-v2-journal.json.gz'));
assert.equal(digest(archiveBytes), archiveSha);
const archive = JSON.parse(gunzipSync(archiveBytes));
const sourceRows = caseIds.map((id, index) => {
  const requests = archive.requests.filter(row => row.segment_id === id
    && row.line_index === 0 && row.request_kind === 'chat_completion');
  assert.equal(requests.length, 1);
  const row = requests[0];
  assert.equal(row.request_sha256, requestHashes[index]);
  assert.equal(row.outcome, 'validated_line');
  const request = JSON.parse(row.rendered_request);
  assert.equal(request.model, profile.model_alias);
  assert.equal(request.messages.length, 1);
  assert.equal(request.messages[0].role, 'user');
  assert.doesNotMatch(request.messages[0].content, /\p{Script=Cyrillic}/u);
  const input = JSON.parse(request.messages[0].content.split('Input JSON:\n')[1]);
  assert.equal(input.target_slots.length, 1);
  assert.equal(input.target_slots[0].segment_id, id);
  assert.equal(input.target_slots[0].line_index, 0);
  const source = input.target_slots[0].source_original;
  assert.equal(source, input.target_slots[0].source_for_translation);
  const expected = source.match(/(?<![\p{L}\p{N}_])[A-Z]{2,}-[0-9]{2,8}(?![\p{L}\p{N}_])/gu);
  assert.deepEqual(expected, [`AUR-${String(id).padStart(4, '0')}`]);
  assert.equal(request.messages[0].content.split(outputContract).length, 2);
  return { id, source, expected, request };
});
const planned = seeds.flatMap(seed => sourceRows.flatMap((row, index) => {
  const armOrder = index % 2 === 0 ? ['baseline', 'reminder'] : ['reminder', 'baseline'];
  return armOrder.map(arm => {
    const request = structuredClone(row.request);
    request.seed = seed;
    if (arm === 'reminder') {
      request.messages[0].content = request.messages[0].content.replace(outputContract,
        `${reminder}${outputContract}`);
    }
    const requestBytes = Buffer.from(JSON.stringify(request));
    return { cue_id: row.id, seed, arm, expected: row.expected, source: row.source,
      request, request_sha256: digest(requestBytes),
      prompt_sha256: digest(Buffer.from(request.messages[0].content)) };
  });
}));
assert.equal(planned.length, 16);
for (const row of sourceRows) for (const seed of seeds) {
  const baseline = planned.find(item => item.cue_id === row.id && item.seed === seed && item.arm === 'baseline');
  const changed = planned.find(item => item.cue_id === row.id && item.seed === seed && item.arm === 'reminder');
  assert.equal(changed.request.messages[0].content,
    baseline.request.messages[0].content.replace(outputContract, `${reminder}${outputContract}`));
  const rest = structuredClone(changed.request);
  rest.messages[0].content = baseline.request.messages[0].content;
  assert.deepEqual(rest, baseline.request);
}

const parent = path.join(root, '.cache/eval/reg009-identifier-prompt');
await fs.mkdir(parent, { recursive: true });
const workspace = await fs.mkdtemp(path.join(parent, 'run-'));
console.log(`REG-009 prompt screen workspace: ${workspace}`);
const started = performance.now();
const report = {
  schema_version: 1, experiment: 'reg-009-v6-identifier-reminder-paired-v1',
  status: 'running', started_at: new Date().toISOString(),
  identity: { git_head: execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim(),
    git_status: execFileSync('git', ['status', '--short'], { cwd: root, encoding: 'utf8' }).trim(),
    harness_sha256: await shaFile(fileURLToPath(import.meta.url)), model_sha256: modelSha,
    server_sha256: serverSha, profile_sha256: digest(profileBytes), archive_sha256: archiveSha },
  budget: { cue_ids: caseIds, seeds, arms: ['baseline', 'reminder'],
    chat_requests: 16, server_starts: 1, per_request_ms: perRequestMs, total_wall_ms: budgetMs,
    no_retries: true },
  source_group: 'project_authored_synthetic_development', sealed_holdout: false,
  human_review: 'missing', quality_verdict: 'unreviewed',
  planned_requests: planned.map(({ cue_id, seed, arm, request_sha256, prompt_sha256 }) =>
    ({ cue_id, seed, arm, request_sha256, prompt_sha256 })),
  requests: [], failures: [], resources: null,
};
const save = async () => fs.writeFile(path.join(workspace, 'report.json'),
  `${JSON.stringify(report, null, 2)}\n`);
const journal = await fs.open(path.join(workspace, 'requests.jsonl'), 'a');
const remaining = () => {
  const ms = budgetMs - (performance.now() - started);
  assert(ms > 0, 'REG-009 total wall budget exhausted');
  return ms;
};
let currentServer;
let sampler;
try {
  await save();
  const port = await freeLoopbackPort();
  const url = `http://127.0.0.1:${port}/`;
  const args = ['--model', modelPath, '--alias', profile.model_alias,
    '--host', '127.0.0.1', '--port', String(port), '-c', '2048', '-ngl', '99',
    '--parallel', '1', '--jinja', '--cache-ram', '0'];
  currentServer = startProcess(serverPath, args, root, process.env,
    { maxCaptureCharacters: 4 * 1024 * 1024 });
  await waitForHealthyServer(url, currentServer, Math.min(180_000, remaining()));
  sampler = runtimeSampler(path.join(workspace, 'resources.jsonl'), root,
    () => [currentServer.child.pid]);
  for (const item of planned) {
    assert(report.requests.length < report.budget.chat_requests);
    const entry = { cue_id: item.cue_id, seed: item.seed, arm: item.arm,
      source_zh: item.source, expected_identifiers: item.expected,
      request_sha256: item.request_sha256, prompt_sha256: item.prompt_sha256,
      request: item.request, started_at: new Date().toISOString() };
    const callStarted = performance.now();
    try {
      const response = await fetch(`${url}v1/chat/completions`, { method: 'POST',
        headers: { 'content-type': 'application/json' }, body: JSON.stringify(item.request),
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
          assert.equal(candidate.translations?.length, 1);
          const line = candidate.translations[0];
          assert.equal(line.segment_id, item.cue_id);
          assert.equal(line.line_index, 0);
          assert(typeof line.text === 'string' && line.text.trim());
          entry.accepted_candidate = line.text;
          const observed = line.text.match(/(?<![\p{L}\p{N}_])[A-Z]{2,}-[0-9]{2,8}(?![\p{L}\p{N}_])/gu) ?? [];
          entry.identifier_preserved = JSON.stringify(observed.sort()) ===
            JSON.stringify([...item.expected].sort());
          entry.structural_outcome = 'valid_unreviewed';
        } catch (error) { entry.structural_outcome = `invalid: ${error.message}`; }
      } else entry.structural_outcome = 'incomplete_or_http_failure';
    } catch (error) {
      entry.error = String(error);
      entry.structural_outcome = 'transport_failure';
    }
    entry.elapsed_ms = Math.round(performance.now() - callStarted);
    report.requests.push({ cue_id: item.cue_id, seed: item.seed, arm: item.arm,
      request_sha256: entry.request_sha256, prompt_sha256: entry.prompt_sha256,
      http_status: entry.http_status ?? null, finish_reason: entry.finish_reason ?? null,
      structural_outcome: entry.structural_outcome,
      accepted_candidate: entry.accepted_candidate ?? null,
      identifier_preserved: entry.identifier_preserved ?? null,
      usage: entry.usage ?? null, elapsed_ms: entry.elapsed_ms });
    await journal.write(`${JSON.stringify(entry)}\n`);
    await journal.sync();
    await save();
    console.log(`${item.cue_id} ${item.seed} ${item.arm}: ${entry.structural_outcome}, code=${entry.identifier_preserved ?? 'unknown'}, ${entry.elapsed_ms} ms`);
  }
  assert.equal(report.requests.length, 16);
  report.status = 'complete_observations_unreviewed';
} catch (error) {
  report.status = 'failed';
  report.failures.push({ at: new Date().toISOString(), message: String(error),
    stack: error.stack ?? null });
  throw error;
} finally {
  if (sampler) report.resources = await sampler.stop();
  if (currentServer) {
    await stopProcess(currentServer);
    await fs.writeFile(path.join(workspace, 'server.log'),
      `${currentServer.stdout}\n${currentServer.stderr}\nstdout_truncated=${currentServer.stdoutTruncated} stderr_truncated=${currentServer.stderrTruncated}\n`);
  }
  report.finished_at = new Date().toISOString();
  report.wall_elapsed_ms = Math.round(performance.now() - started);
  await save();
  await journal.close();
}
