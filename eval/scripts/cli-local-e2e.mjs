import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const executable = path.join(root, 'target', 'release', 'auralis-translation-cli.exe');
const profile = path.join(root, 'models', 'manifests', 'hy_mt2_1_8b_q4_k_m.checked.experimental.json');
const server = process.env.AURALIS_TEST_LLAMA_SERVER;
const model = process.env.AURALIS_TEST_GGUF;
const gpuLayers = process.env.AURALIS_LOCAL_E2E_GPU_LAYERS ?? '99';
const timeout = 600_000;

function digest(bytes) {
  return crypto.createHash('sha256').update(bytes).digest('hex');
}

function invoke(command, args) {
  const result = spawnSync(executable, [command, ...args], {
    cwd: root,
    encoding: 'utf8',
    timeout,
    maxBuffer: 8 * 1024 * 1024,
    windowsHide: true,
  });
  if (result.error) throw result.error;
  return result;
}

function expectSuccess(result, label) {
  assert.equal(result.status, 0, `${label}: ${result.stderr}\n${result.stdout}`);
}

function runFormat(directory, format) {
  const vtt = format === 'vtt';
  const source = path.join(directory, `source.${format}`);
  const state = path.join(directory, `state-${format}`);
  const output = path.join(directory, `output.ru.${format}`);
  const replay = path.join(directory, `replay.ru.${format}`);
  const sourceBytes = Buffer.from(vtt
    ? 'WEBVTT\n\nfirst\n00:00:00.000 --> 00:00:01.000\n你好。\n\nsecond\n00:00:01.500 --> 00:00:02.500\n再见。\n'
    : '1\n00:00:00,000 --> 00:00:01,000\n你好。\n\n2\n00:00:01,500 --> 00:00:02,500\n再见。\n');
  fs.writeFileSync(source, sourceBytes);
  const command = vtt ? 'translate-vtt-local' : 'translate-local';
  const initial = invoke(command, [source, state, profile, server, model, gpuLayers, output]);
  expectSuccess(initial, `${format} translation`);
  const runId = initial.stdout.match(/run_id=([0-9a-f-]{36})/)?.[1];
  assert.ok(runId, `${format}: durable run id missing`);
  assert.match(initial.stdout, /result_id=[0-9a-f-]{36} review=needs_review/);
  const resultBytes = fs.readFileSync(output);
  assert.notEqual(digest(resultBytes), digest(sourceBytes), `${format}: output equals source`);
  assert.equal(digest(fs.readFileSync(source)), digest(sourceBytes), `${format}: source changed`);
  const resultText = resultBytes.toString('utf8');
  assert.match(resultText, vtt ? /^WEBVTT\n/ : /^1\n/);
  assert.match(resultText, vtt ? /first\n00:00:00\.000 --> 00:00:01\.000/ : /1\n00:00:00,000 --> 00:00:01,000/);
  assert.match(resultText, vtt ? /second\n00:00:01\.500 --> 00:00:02\.500/ : /2\n00:00:01,500 --> 00:00:02,500/);
  const occupied = invoke(command, [source, state, profile, server, model, gpuLayers, output]);
  assert.notEqual(occupied.status, 0, `${format}: occupied output was overwritten`);
  assert.match(occupied.stderr, /output already exists/);
  assert.deepEqual(fs.readFileSync(output), resultBytes);
  const missing = path.join(directory, 'runtime-must-not-start');
  const exported = invoke('resume-local', [state, runId, profile, missing, missing, gpuLayers, replay]);
  expectSuccess(exported, `${format} offline replay`);
  assert.deepEqual(fs.readFileSync(replay), resultBytes, `${format}: replay differs`);
  assert.deepEqual(fs.readFileSync(source), sourceBytes, `${format}: source changed after replay`);
  console.log(`${format}: source=${digest(sourceBytes)} result=${digest(resultBytes)} offline replay identical`);
}

function isFile(file) {
  try {
    return fs.statSync(file).isFile();
  } catch {
    return false;
  }
}

assert.ok(server && isFile(server), 'AURALIS_TEST_LLAMA_SERVER must point to a local executable');
assert.ok(model && isFile(model), 'AURALIS_TEST_GGUF must point to a local checked model');
assert.ok(isFile(executable), 'Release CLI is missing');
const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'auralis-cli-local-e2e-'));
try {
  runFormat(directory, 'srt');
  runFormat(directory, 'vtt');
  assert.equal(path.dirname(path.resolve(directory)), path.resolve(os.tmpdir()));
  assert.ok(path.basename(directory).startsWith('auralis-cli-local-e2e-'));
  fs.rmSync(directory, { recursive: true, force: true });
  console.log('Local CLI E2E passed; temporary run directory removed.');
} catch (error) {
  console.error(`Local CLI E2E failed; artifacts retained at ${directory}`);
  throw error;
}
