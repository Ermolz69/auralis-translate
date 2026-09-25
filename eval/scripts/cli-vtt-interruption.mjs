import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import net from 'node:net';
import os from 'node:os';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const executable = path.join(root, 'target/debug/auralis-translation-cli.exe');
const profilePath = path.join(root, 'models/manifests/hy_mt2_1_8b_q4_k_m.checked.experimental.json');
const serverPath = process.env.AURALIS_TEST_LLAMA_SERVER;
const modelPath = process.env.AURALIS_TEST_GGUF;
const MODEL_ALIAS = 'auralis-hy-mt2-1.8b-q4';
const SERVER_READY_MS = 120_000;
const TRANSLATION_MS = 300_000;
const POLL_MS = 200;
const SOURCE = [
  'WEBVTT',
  '',
  'NOTE provenance',
  'standalone interruption fixture',
  '',
  '00:00:01.000 --> 00:00:02.000',
  '你好。',
  '',
  '00:00:03.000 --> 00:00:04.000',
  '再见。',
  '',
  '00:00:05.000 --> 00:00:06.000',
  '谢谢。',
  '',
].join('\r\n');

function digest(bytes) {
  return createHash('sha256').update(bytes).digest('hex');
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function freeLoopbackPort() {
  const listener = net.createServer();
  await new Promise((resolve, reject) => listener.once('error', reject).listen(0, '127.0.0.1', resolve));
  const port = listener.address().port;
  await new Promise((resolve, reject) => listener.close((error) => (error ? reject(error) : resolve())));
  return port;
}

function startProcess(command, args) {
  const child = spawn(command, args, { cwd: root, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] });
  const captured = { stdout: '', stderr: '' };
  child.stdout.on('data', (chunk) => { captured.stdout += chunk.toString(); });
  child.stderr.on('data', (chunk) => { captured.stderr += chunk.toString(); });
  const ended = new Promise((resolve, reject) => {
    child.once('error', reject);
    child.once('exit', (code, signal) => resolve({ code, signal }));
  });
  return { child, captured, ended };
}

async function waitUntil(check, process, timeoutMs, description) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const value = await check();
    if (value) return value;
    if (process.child.exitCode !== null || process.child.signalCode !== null) {
      throw new Error(`${description}: process exited early\n${process.captured.stderr}`);
    }
    await wait(POLL_MS);
  }
  throw new Error(`${description}: timed out\n${process.captured.stderr}`);
}

async function stopProcess(process) {
  if (!process) return;
  if (process.child.exitCode === null && process.child.signalCode === null) process.child.kill();
  await process.ended;
}

async function waitForExit(process, timeoutMs, description) {
  let timer;
  try {
    return await Promise.race([
      process.ended,
      new Promise((_, reject) => {
        timer = setTimeout(() => reject(new Error(`${description}: timed out`)), timeoutMs);
      }),
    ]);
  } finally {
    clearTimeout(timer);
  }
}

function readState(dbPath, runId) {
  const db = new DatabaseSync(dbPath, { readOnly: true });
  try {
    return {
      run: db.prepare('SELECT state, source_sha256, translation_id FROM runs WHERE run_id = ?').get(runId),
      checkpoints: db.prepare('SELECT block_index, input_fingerprint, accepted_json, committed_at FROM block_checkpoints WHERE run_id = ? ORDER BY block_index').all(runId),
      attempts: db.prepare('SELECT attempt_id, ended_at FROM run_attempts WHERE run_id = ? ORDER BY attempt_id').all(runId),
      result: db.prepare('SELECT result_id, output_sha256, review_state FROM results WHERE run_id = ?').get(runId),
      source: db.prepare('SELECT source_locator, source_sha256 FROM translations WHERE translation_id = (SELECT translation_id FROM runs WHERE run_id = ?)').get(runId),
    };
  } finally {
    db.close();
  }
}

async function main() {
  assert(process.platform === 'win32', 'This checked-model acceptance currently targets Windows');
  assert(serverPath && path.isAbsolute(serverPath), 'Set absolute AURALIS_TEST_LLAMA_SERVER');
  assert(modelPath && path.isAbsolute(modelPath), 'Set absolute AURALIS_TEST_GGUF');
  for (const file of [executable, profilePath, serverPath, modelPath]) {
    assert((await fs.stat(file)).isFile(), `Required file is missing: ${file}`);
  }
  const testRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'auralis-cli-vtt-'));
  const sourcePath = path.join(testRoot, 'source.vtt');
  const outputPath = path.join(testRoot, 'translated.vtt');
  const stateDir = path.join(testRoot, 'state');
  const dbPath = path.join(stateDir, 'auralis-translate.sqlite');
  const sourceBytes = Buffer.from(SOURCE);
  let server;
  let initial;
  let resume;
  let success = false;
  try {
    await fs.writeFile(sourcePath, sourceBytes);
    const port = await freeLoopbackPort();
    const url = `http://127.0.0.1:${port}/`;
    server = startProcess(serverPath, [
      '--model', modelPath,
      '--alias', MODEL_ALIAS,
      '--host', '127.0.0.1',
      '--port', String(port),
      '-c', '2048',
      '-ngl', '99',
      '--jinja',
    ]);
    await waitUntil(async () => {
      try {
        const response = await fetch(`${url}health`, { signal: AbortSignal.timeout(1000) });
        return response.ok && (await response.json()).status === 'ok';
      } catch { return false; }
    }, server, SERVER_READY_MS, 'checked server readiness');

    const profile = JSON.parse(await fs.readFile(profilePath, 'utf8'));
    profile.target_segments_per_block = 1;
    const testProfilePath = path.join(testRoot, 'checked-one-cue-profile.json');
    await fs.writeFile(testProfilePath, JSON.stringify(profile));
    initial = startProcess(executable, ['translate-vtt', sourcePath, stateDir, testProfilePath, url, outputPath]);
    const runId = await waitUntil(() => initial.captured.stdout.match(/run_id=([0-9a-f-]{36})/)?.[1], initial, TRANSLATION_MS, 'run ID');
    await waitUntil(() => initial.captured.stderr.includes(`run_id=${runId} saved_blocks=1/3`), initial, TRANSLATION_MS, 'first committed block');
    await stopProcess(initial);
    const interrupted = readState(dbPath, runId);
    assert.equal(interrupted.run.state, 'running');
    assert.equal(interrupted.checkpoints.length, 1, 'CLI finished another block before the kill');
    assert.equal(interrupted.checkpoints[0].block_index, 0);
    assert.equal(interrupted.attempts.length, 1);
    assert.equal(interrupted.attempts[0].ended_at, null);
    assert.equal(interrupted.result, undefined, 'Partial run published a result');
    assert.equal(await fs.stat(outputPath).then(() => true, () => false), false, 'Partial output was exposed');
    assert.equal(digest(await fs.readFile(sourcePath)), digest(sourceBytes));
    assert.equal(digest(await fs.readFile(interrupted.source.source_locator)), digest(sourceBytes));

    resume = startProcess(executable, ['resume', stateDir, runId, testProfilePath, url, outputPath]);
    const resumedExit = await waitForExit(resume, TRANSLATION_MS, 'CLI resume');
    assert.equal(resumedExit.code, 0, `Resume failed:\n${resume.captured.stderr}`);
    const completed = readState(dbPath, runId);
    assert.equal(completed.run.state, 'validated');
    assert.equal(completed.checkpoints.length, 3);
    assert.deepEqual(completed.checkpoints[0], interrupted.checkpoints[0], 'Resume replaced the committed block');
    assert.equal(completed.attempts.length, 2);
    assert.notEqual(completed.attempts[0].ended_at, null, 'Interrupted attempt stayed open');
    assert.notEqual(completed.attempts[1].ended_at, null, 'Resume attempt stayed open');
    assert.equal(completed.result.review_state, 'needs_review');
    const outputBytes = await fs.readFile(outputPath);
    assert.equal(digest(outputBytes), completed.result.output_sha256);
    assert.equal(digest(await fs.readFile(sourcePath)), digest(sourceBytes));
    assert.equal(digest(await fs.readFile(completed.source.source_locator)), digest(sourceBytes));
    const outputText = outputBytes.toString('utf8');
    assert(outputText.startsWith('WEBVTT\r\n\r\nNOTE provenance\r\nstandalone interruption fixture\r\n\r\n'));
    for (const timing of ['00:00:01.000 --> 00:00:02.000', '00:00:03.000 --> 00:00:04.000', '00:00:05.000 --> 00:00:06.000']) {
      assert(outputText.includes(timing), `Output lost timing: ${timing}`);
    }
    assert(outputText.endsWith('\r\n'));
    assert(!outputBytes.equals(sourceBytes), 'Output did not replace source text');
    success = true;
    process.stdout.write(`Standalone WebVTT CLI interruption E2E passed: run ${runId} kept its first checkpoint, resumed two missing blocks, and wrote a separate verified copy.\n`);
  } finally {
    await stopProcess(resume);
    await stopProcess(initial);
    await stopProcess(server);
    const resolvedRoot = path.resolve(testRoot);
    const allowedPrefix = `${path.resolve(os.tmpdir())}${path.sep}`;
    assert(resolvedRoot.startsWith(allowedPrefix) && path.basename(resolvedRoot).startsWith('auralis-cli-vtt-'), 'Refusing to remove a directory outside the test temp root');
    if (success) await fs.rm(resolvedRoot, { recursive: true, force: true });
    else process.stderr.write(`Failed test state retained at ${resolvedRoot}\n`);
  }
}

main().catch((error) => {
  process.stderr.write(`${error.stack ?? error}\n`);
  process.exitCode = 1;
});
