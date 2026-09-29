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
const modelPath = process.env.AURALIS_TEST_GGUF_1B;
const runtimeSha = '6f15be27bd80b6b4d52afefa49094e18fcfab55d5da354d717971f2d2537b2f4';
const modelSha = 'dc5f44fcf1fa496ee7ad725982c0c8c553a4de00259b53af84c4b89fb0c06699';
const archiveSha = '4037c071a17ef38ed7b9bc4989601ef8da0784fb39881b9138abb9d008701a8c';
const packSha = '54e4eccbed99a0158dff67b2a597d0a3bd95fdae53987a7de38a24e5e26489d3';
const manifestSha = 'e80c80b0cf1db26d62ce5f644091f30e42fea752d27a0ce201fcab33f29ecb69';
const caseIds = [1, 2, 3, 4, 5, 6, 7, 8, 129, 130,
  505, 506, 507, 508, 509, 510, 511, 512, 513,
  1017, 1018, 1019, 1020, 1021, 1022, 1023, 1024];
const seeds = [101, 202, 303];
const budgetMs = 15 * 60_000;
const perRequestMs = 120_000;
const identifierPattern = /(?<![\p{L}\p{N}_])[A-Z]{2,}-[0-9]{2,8}(?![\p{L}\p{N}_])/gu;
const cyrillicCodePattern = /[А-ЯЁ]{2,}-[0-9]{2,}/u;
const identifiers = text => text.match(identifierPattern) ?? [];
const sameCodes = (source, target) => JSON.stringify(identifiers(source).sort()) ===
  JSON.stringify(identifiers(target).sort());
const numericFacts = text => text.replace(identifierPattern, '').match(/\d{1,2}:\d{2}|\d+/gu) ?? [];
const shaFile = async file => {
  const hash = createHash('sha256');
  for await (const chunk of createReadStream(file)) hash.update(chunk);
  return hash.digest('hex');
};

// This projection mirrors the separately tested Rust policy. It does not certify
// a real SQLite run, language adequacy, or the safety of a model's omitted facts.
function projectStrictPolicy(source, candidate) {
  if (sameCodes(source, candidate)) return { outcome: 'accepted_exact', text: candidate, review: false };
  const expected = identifiers(source);
  const colon = source.indexOf('：');
  if (expected.length === 1 && identifiers(candidate).length === 0 &&
    !cyrillicCodePattern.test(candidate) && candidate.trim() && colon >= 0) {
    const prefix = source.slice(0, colon);
    if ([...prefix].length <= 80 && !/[\r\n]/u.test(prefix) &&
      JSON.stringify(identifiers(prefix)) === JSON.stringify(expected)) {
      const text = `${expected[0]}: ${candidate}`;
      assert(sameCodes(source, text));
      return { outcome: 'accepted_inserted', text, review: true };
    }
  }
  return { outcome: 'rejected_identifier', text: null, review: false };
}

assert(runtimePath && path.isAbsolute(runtimePath));
assert(modelPath && path.isAbsolute(modelPath));
assert.equal(await shaFile(runtimePath), runtimeSha);
assert.equal(await shaFile(modelPath), modelSha);
const manifestPath = path.join(root, 'models/manifests/hy_mt2_1_8b_q4_k_m.context_v6_prefix_repair.experimental.json');
const manifestBytes = await fs.readFile(manifestPath);
assert.equal(digest(manifestBytes), manifestSha);
const manifest = JSON.parse(manifestBytes);
assert.equal(manifest.model_file_sha256, modelSha);
assert.equal(manifest.prompt_version, 6);
assert.equal(manifest.strict_source_identifiers, true);
assert.equal(manifest.source_prefix_repair, true);
const archiveBytes = await fs.readFile(path.join(root, 'eval/reports/2026-09-29-long-v6-postlength-v2-journal.json.gz'));
assert.equal(digest(archiveBytes), archiveSha);
assert.equal(await shaFile(path.join(root, 'eval/regressions/long-v6-identifier-loss-v1.json')), packSha);
const archive = JSON.parse(gunzipSync(archiveBytes));
const sourceRows = caseIds.map(id => {
  const rows = archive.requests.filter(row => row.segment_id === id && row.line_index === 0 &&
    row.request_kind === 'chat_completion');
  assert.equal(rows.length, 1, `archived cue ${id}`);
  const request = JSON.parse(rows[0].rendered_request);
  assert.equal(request.model, manifest.model_alias);
  const prompt = request.messages?.[0]?.content;
  assert.equal(typeof prompt, 'string');
  assert.doesNotMatch(prompt, /\p{Script=Cyrillic}/u);
  const input = JSON.parse(prompt.split('Input JSON:\n')[1]);
  assert.equal(input.target_slots.length, 1);
  assert.equal(input.target_slots[0].segment_id, id);
  assert.equal(input.target_slots[0].line_index, 0);
  assert.equal(input.target_slots[0].source_original, input.target_slots[0].source_for_translation);
  const source = input.target_slots[0].source_original;
  assert.deepEqual(identifiers(source), [`AUR-${String(id).padStart(4, '0')}`]);
  return { id, source, request, original_request_sha256: rows[0].request_sha256 };
});
const planned = seeds.flatMap(seed => sourceRows.map(row => {
  const request = structuredClone(row.request);
  request.seed = seed;
  const body = Buffer.from(JSON.stringify(request));
  return { ...row, seed, request, body, request_sha256: digest(body),
    prompt_sha256: digest(Buffer.from(request.messages[0].content)) };
}));
assert.equal(planned.length, 81);
if (process.argv.includes('--preflight')) {
  console.log('REG-009 preflight: checked 1.8B, fixed v6 prompt, 27 source-only cues, 3 seeds, 81 requests.');
  process.exit(0);
}

const parent = path.join(root, '.cache/eval/reg009-live-prefix-repair');
await fs.mkdir(parent, { recursive: true });
const workspace = await fs.mkdtemp(path.join(parent, 'run-'));
console.log(`REG-009 workspace: ${workspace}`);
const started = performance.now();
const report = {
  schema_version: 1, experiment: 'reg009-live-prefix-repair-v1', status: 'running',
  started_at: new Date().toISOString(), source_group: 'project_authored_synthetic_development',
  sealed_holdout: false, human_review: 'missing', language_quality: 'unreviewed',
  identity: { git_head: execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim(),
    git_status: execFileSync('git', ['status', '--short'], { cwd: root, encoding: 'utf8' }).trim(),
    harness_sha256: await shaFile(fileURLToPath(import.meta.url)),
    runtime_sha256: runtimeSha, model_sha256: modelSha, manifest_sha256: manifestSha,
    prompt_template_sha256: manifest.prompt_template_sha256,
    archive_sha256: archiveSha, regression_pack_sha256: packSha },
  budget: { cue_ids: caseIds, seeds, chat_requests: 81, server_starts: 1,
    per_request_ms: perRequestMs, wall_ms: budgetMs, retries: 0 },
  planned_requests: planned.map(({ id, seed, request_sha256, prompt_sha256,
    original_request_sha256 }) => ({ cue_id: id, seed, request_sha256,
    prompt_sha256, original_request_sha256 })),
  requests: [], failures: [], resources: null,
};
const save = () => fs.writeFile(path.join(workspace, 'report.json'), `${JSON.stringify(report, null, 2)}\n`);
const journal = await fs.open(path.join(workspace, 'requests.jsonl'), 'a');
const remaining = () => {
  const ms = budgetMs - (performance.now() - started);
  assert(ms > 0, 'REG-009 wall budget exhausted');
  return ms;
};
let server;
try {
  await save();
  const port = await freeLoopbackPort();
  const url = `http://127.0.0.1:${port}/`;
  const args = ['--model', modelPath, '--alias', manifest.model_alias, '--host', '127.0.0.1',
    '--port', String(port), '-c', '2048', '-ngl', '99', '--parallel', '1', '--jinja',
    '--cache-ram', '0'];
  server = startProcess(runtimePath, args, root, process.env, { maxCaptureCharacters: 4 * 1024 * 1024 });
  await waitForHealthyServer(url, server, Math.min(180_000, remaining()));
  const sampler = runtimeSampler(path.join(workspace, 'resources.jsonl'), root,
    () => [server.child.pid]);
  try {
    for (const item of planned) {
      assert(report.requests.length < report.budget.chat_requests);
      const entry = { cue_id: item.id, seed: item.seed, source_zh: item.source,
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
        if (response.ok && entry.finish_reason === 'stop' && typeof entry.raw_candidate === 'string') {
          try {
            const candidate = JSON.parse(entry.raw_candidate);
            assert.equal(candidate.translations?.length, 1);
            const line = candidate.translations[0];
            assert.equal(line.segment_id, item.id);
            assert.equal(line.line_index, 0);
            assert(typeof line.text === 'string' && line.text.trim());
            entry.restored_candidate = line.text;
            entry.raw_identifier_preserved = sameCodes(item.source, line.text);
            entry.raw_numeric_facts = numericFacts(line.text);
            const projected = projectStrictPolicy(item.source, line.text);
            entry.policy_outcome = projected.outcome;
            entry.accepted_candidate = projected.text;
            entry.review_flag = projected.review;
            entry.accepted_identifier_preserved = projected.text === null ? false :
              sameCodes(item.source, projected.text);
            entry.accepted_numeric_facts = projected.text === null ? null : numericFacts(projected.text);
          } catch (error) { entry.policy_outcome = `invalid_structure: ${error.message}`; }
        } else entry.policy_outcome = 'incomplete_or_http_failure';
      } catch (error) { entry.error = String(error); entry.policy_outcome = 'transport_failure'; }
      entry.elapsed_ms = Math.round(performance.now() - callStarted);
      report.requests.push({ cue_id: entry.cue_id, seed: entry.seed,
        request_sha256: entry.request_sha256, prompt_sha256: entry.prompt_sha256,
        http_status: entry.http_status ?? null, finish_reason: entry.finish_reason ?? null,
        policy_outcome: entry.policy_outcome, raw_identifier_preserved: entry.raw_identifier_preserved ?? null,
        accepted_identifier_preserved: entry.accepted_identifier_preserved ?? null,
        review_flag: entry.review_flag ?? false, usage: entry.usage ?? null,
        elapsed_ms: entry.elapsed_ms });
      await journal.write(`${JSON.stringify(entry)}\n`);
      await journal.sync();
      await save();
      console.log(`cue=${item.id} seed=${item.seed}: ${entry.policy_outcome}, raw=${entry.raw_identifier_preserved ?? 'unknown'}, ${entry.elapsed_ms} ms`);
    }
  } finally {
    report.resources = await sampler.stop();
    await stopProcess(server);
    await fs.writeFile(path.join(workspace, 'server.log'), `${server.stdout}\n${server.stderr}\n`);
    server = null;
    await save();
  }
  assert.equal(report.requests.length, 81);
  report.status = 'complete_observations_unreviewed';
} catch (error) {
  report.status = 'failed';
  report.failures.push({ at: new Date().toISOString(), message: String(error), stack: error.stack ?? null });
  throw error;
} finally {
  if (server) await stopProcess(server);
  report.finished_at = new Date().toISOString();
  report.wall_elapsed_ms = Math.round(performance.now() - started);
  await save();
  await journal.close();
}
