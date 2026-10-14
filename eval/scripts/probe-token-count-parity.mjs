import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { createReadStream } from 'node:fs';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { performance } from 'node:perf_hooks';
import { fileURLToPath } from 'node:url';
import { freeLoopbackPort, startProcess, stopProcess, waitForHealthyServer } from './local-process.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const serverPath = process.env.AURALIS_TEST_LLAMA_SERVER;
const modelPath = process.env.AURALIS_TEST_GGUF;
const profilePath = process.env.AURALIS_TEST_PROFILE;
assert(serverPath && modelPath && profilePath);
assert.equal(process.platform, 'win32');

const sources = [
  ['v5', 'inference-preflight-p01-v1/run-dM8h6a/p01/scene/state/auralis-translate.sqlite', 'c2091a405057abe1c91860430dbc65172c42adbda3a3e0451cd30265d62fa341'],
  ['v6', 'commons-asus-full-v6-slot-v1/run-7XjHrR/state/auralis-translate.sqlite', '76e074663d67d40246aae8e7f1b725918bc4cfd13af1bb81d4b15a80a13ac294'],
  ['v7', 'v7-authored-batch-v1/attempt-WUmq4Q/batch-1/state/auralis-translate.sqlite', '760b730a354e56c81a2bb11bc26f1f2bf25c3546e67138199555ec1dac4d1bd0'],
  ['v8_1_8b', 'v8-asus-natural-long-v1/attempt-UhjJZn/1_8b/state/auralis-translate.sqlite', 'e0d87164c730c362168e8109b3adbea9bb23965845f69f0bb31f02eac5a5f851'],
  ['v8_7b', 'v8-asus-natural-long-v1/attempt-UhjJZn/7b/state/auralis-translate.sqlite', '142290cb9cad56b83013fb00db57de7611a80ee6e8a7072a85d3410a1ca575c0'],
];
const maxWallMs = 600_000;
const started = performance.now();
const remaining = () => {
  const ms = maxWallMs - (performance.now() - started);
  if (ms <= 0) throw new Error('Probe wall budget exhausted');
  return ms;
};
async function sha256(file) {
  const hash = createHash('sha256');
  for await (const chunk of createReadStream(file)) hash.update(chunk);
  return hash.digest('hex');
}
function selectRows(rows) {
  const selected = [rows[0], rows[Math.floor(rows.length / 2)], rows.at(-1),
    rows.reduce((best, row) => row.rendered_request.length > best.rendered_request.length ? row : best)];
  return [...new Map(selected.map(row => [row.sequence, row])).values()];
}
async function post(url, route, body, report) {
  remaining();
  const start = performance.now();
  const response = await fetch(new URL(route, url), {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body), signal: AbortSignal.timeout(Math.min(30_000, remaining())),
  });
  const raw = await response.text();
  const elapsedMs = performance.now() - start;
  const entry = { route, body, status: response.status, raw, elapsed_ms: elapsedMs };
  report.requests.push(entry);
  assert(response.ok, `${route} returned HTTP ${response.status}`);
  return JSON.parse(raw);
}
async function oldCount(url, body, report) {
  const applied = await post(url, '/apply-template', body, report);
  assert.equal(typeof applied.prompt, 'string');
  assert(applied.prompt.length > 0);
  const tokenized = await post(url, '/tokenize',
    { content: applied.prompt, add_special: false, parse_special: true }, report);
  assert(Array.isArray(tokenized.tokens) && tokenized.tokens.length > 0);
  assert(tokenized.tokens.every(token => Number.isSafeInteger(token) && token >= 0));
  return tokenized.tokens.length;
}
async function newCount(url, body, report) {
  const counted = await post(url, '/v1/chat/completions/input_tokens', body, report);
  assert(Number.isSafeInteger(counted.input_tokens) && counted.input_tokens > 0);
  return counted.input_tokens;
}

const profileBytes = await fs.readFile(profilePath);
const profile = JSON.parse(profileBytes);
assert.equal(profile.runtime_build_info, 'b10977-0ecb159c9');
assert.equal((await fs.stat(modelPath)).size, profile.model_file_bytes);
assert.equal(await sha256(modelPath), profile.model_file_sha256);
const runtimeSha256 = await sha256(serverPath);
assert.equal(runtimeSha256, '6f15be27bd80b6b4d52afefa49094e18fcfab55d5da354d717971f2d2537b2f4');

const samples = [];
for (const [family, relative, expectedHash] of sources) {
  const file = path.join(root, '.cache/eval', relative);
  assert.equal(await sha256(file), expectedHash, `${family} journal changed`);
  const db = new DatabaseSync(file, { readOnly: true });
  try {
    const rows = db.prepare("SELECT sequence, rendered_request FROM inference_requests WHERE request_kind = 'apply_template' AND outcome = 'parsed_preflight_json' ORDER BY sequence").all();
    assert(rows.length > 0, `${family} has no preflight rows`);
    for (const row of selectRows(rows)) {
      const body = JSON.parse(Buffer.from(row.rendered_request).toString('utf8'));
      body.model = profile.model_alias;
      samples.push({ family, sequence: row.sequence, body });
    }
  } finally { db.close(); }
}
for (const family of ['v5', 'v6', 'v7', 'v8_1_8b']) {
  const base = samples.find(sample => sample.family === family);
  const body = structuredClone(base.body);
  body.messages[0].content += '\n' + '这段中文包含数字、时间和专有名词。'.repeat(180);
  samples.push({ family: `${family}_boundary`, sequence: null, body });
}
assert(samples.length * 3 <= 100, 'Probe request-pair cap exceeded');

const parent = path.join(root, '.cache/eval/token-count-preflight-v1');
await fs.mkdir(parent, { recursive: true });
const workspace = await fs.mkdtemp(path.join(parent, 'attempt-'));
const report = {
  experiment: 'PERF-01-token-count-preflight-v1', started_at: new Date().toISOString(),
  status: 'running', model_sha256: profile.model_file_sha256, profile_sha256: await sha256(profilePath),
  runtime_sha256: runtimeSha256, runtime_build: profile.runtime_build_info,
  platform: { os: `${os.type()} ${os.release()} ${os.arch()}`, cpu: os.cpus()[0].model },
  samples: samples.map(({ family, sequence, body }) => ({ family, sequence,
    body_sha256: createHash('sha256').update(JSON.stringify(body)).digest('hex') })),
  budget: { max_wall_ms: maxWallMs, repetitions: 3, max_pairs: 100, chat_requests: 0, retries: 0 },
  pairs: [], requests: [], errors: [],
};
let server;
try {
  const port = await freeLoopbackPort();
  const url = `http://127.0.0.1:${port}/`;
  const args = ['--model', modelPath, '--alias', profile.model_alias, '--host', '127.0.0.1',
    '--port', String(port), '-c', String(profile.min_context_tokens), '-ngl', '99',
    '--parallel', '1', '--jinja', '--cache-ram', '0'];
  const env = { ...process.env,
    PATH: `${path.dirname(serverPath)};${path.join(root, '.cache/runtime/cudart')};${process.env.PATH}` };
  server = startProcess(serverPath, args, root, env, { maxCaptureCharacters: 4 * 1024 * 1024 });
  await waitForHealthyServer(url, server, Math.min(180_000, remaining()));
  for (const [index, sample] of samples.entries()) {
    for (let repetition = 0; repetition < 3; repetition++) {
      const oldFirst = (index + repetition) % 2 === 0;
      const counts = oldFirst
        ? [await oldCount(url, sample.body, report), await newCount(url, sample.body, report)]
        : [await newCount(url, sample.body, report), await oldCount(url, sample.body, report)].reverse();
      const pair = { family: sample.family, sequence: sample.sequence, repetition,
        order: oldFirst ? 'old_first' : 'new_first', old_count: counts[0], new_count: counts[1] };
      report.pairs.push(pair);
      assert.equal(pair.new_count, pair.old_count,
        `Token-count mismatch: ${sample.family}/${sample.sequence}/${repetition}`);
    }
  }
  report.status = 'passed';
} catch (error) {
  report.status = 'failed';
  report.errors.push(String(error.stack ?? error));
} finally {
  await stopProcess(server);
  report.finished_at = new Date().toISOString();
  report.elapsed_ms = performance.now() - started;
  await fs.writeFile(path.join(workspace, 'report.json'), `${JSON.stringify(report, null, 2)}\n`);
  console.log(JSON.stringify({ status: report.status, workspace, pairs: report.pairs.length,
    old_requests: report.requests.filter(request => request.route !== '/v1/chat/completions/input_tokens').length,
    new_requests: report.requests.filter(request => request.route === '/v1/chat/completions/input_tokens').length,
    error: report.errors.at(0) ?? null }));
}
if (report.status !== 'passed') process.exitCode = 1;
