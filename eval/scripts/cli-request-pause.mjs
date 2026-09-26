import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { setTimeout as delay } from 'node:timers/promises';
import { digest, verifyProtectedBytes } from './flores-file-fixture.mjs';
import { readRunSnapshot, assertSavedPrefix } from './cli-run-state.mjs';
import { startProcess, stopProcess, waitForExit, freeLoopbackPort, waitForHealthyServer } from './local-process.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const RUN_TIMEOUT_MS = 300_000;
const PAUSE_TIMEOUT_MS = 10_000;
const POLL_MS = 25;
const LAST_LINE = '我们先检查原来的字幕文件，再把需要翻译的文字取出来。翻译完成以后，程序会创建一个新的文件，保留原来的时间和顺序。如果中途停止，已经保存的部分不需要重新翻译。';

async function waitUntil(check, child, timeout, description) {
  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) {
    const result = await check();
    if (result) return result;
    assert(child.child.exitCode === null && child.child.signalCode === null, `${description}: CLI exited\n${child.stderr}`);
    await delay(POLL_MS);
  }
  throw new Error(`${description}: timed out`);
}

function fixture(format) {
  const cues = Array.from({ length: 9 }, (_, index) => {
    const start = String(index * 2 + 1).padStart(2, '0');
    const end = String(index * 2 + 2).padStart(2, '0');
    const separator = format === 'srt' ? ',' : '.';
    const identity = format === 'srt' ? '7\r\n' : index === 1 ? 'cue-two\r\n' : '';
    return `${identity}00:00:${start}${separator}000 --> 00:00:${end}${separator}000\r\n${index === 8 ? LAST_LINE : '你好。'}\r\n\r\n`;
  }).join('');
  return Buffer.from(`\uFEFF${format === 'vtt' ? 'WEBVTT\r\n\r\nNOTE provenance\r\nproject-authored cancellation fixture\r\n\r\n' : ''}${cues}`);
}

async function runFormat({ workspace, format, executable, profilePath, profileBytes, serverPath, modelPath, gpuLayers }) {
  const directory = path.join(workspace, format);
  await fs.mkdir(directory);
  const sourcePath = path.join(directory, `original.${format}`);
  const outputPath = path.join(directory, `candidate.ru.${format}`);
  const source = fixture(format);
  await fs.writeFile(sourcePath, source, { flag: 'wx' });
  const stateDir = path.join(directory, 'state');
  const dbPath = path.join(stateDir, 'auralis-translate.sqlite');
  const profile = JSON.parse(profileBytes);
  const port = await freeLoopbackPort();
  const url = `http://127.0.0.1:${port}/`;
  const serverArgs = ['--model', modelPath, '--alias', profile.model_alias, '--host', '127.0.0.1', '--port', String(port), '-c', String(profile.min_context_tokens), '-ngl', String(gpuLayers), '--parallel', '1', '--cache-ram', '0', '--slots', '--jinja'];
  let server;
  const calls = [];
  const cli = async (args) => {
    const child = startProcess(executable, args, root);
    calls.push({ args, child });
    await waitForExit(child, RUN_TIMEOUT_MS);
    return child;
  };
  const inspect = format === 'srt' ? 'inspect' : 'inspect-vtt';
  try {
    const sourceInspection = (await cli([inspect, sourcePath])).stdout;
    server = startProcess(serverPath, serverArgs, root);
    await waitForHealthyServer(url, server, 180_000);
    const args = [format === 'srt' ? 'translate' : 'translate-vtt', sourcePath, stateDir, profilePath, url, outputPath];
    const initial = startProcess(executable, args, root);
    calls.push({ args, child: initial });
    const runId = await waitUntil(() => initial.stdout.match(/run_id=([0-9a-f-]{36})/u)?.[1], initial, RUN_TIMEOUT_MS, 'run ID');
    const active = await waitUntil(async () => {
      const snapshot = readRunSnapshot(dbPath, runId);
      if (snapshot.checkpoints.length !== 1 || snapshot.run.state !== 'running') return undefined;
      const response = await fetch(`${url}slots`, { signal: AbortSignal.timeout(1000) });
      assert(response.ok, 'Managed test server slots endpoint unavailable');
      const slots = await response.json();
      return slots.some((slot) => slot.is_processing === true) ? { snapshot, slots } : undefined;
    }, initial, RUN_TIMEOUT_MS, 'active inference after first saved block');
    const pauseStarted = performance.now();
    await cli(['pause', stateDir, runId]);
    await Promise.race([initial.ended, delay(PAUSE_TIMEOUT_MS).then(() => { throw new Error('Active request did not acknowledge pause'); })]);
    const acknowledgedMs = performance.now() - pauseStarted;
    assert.equal(initial.child.exitCode, 1);
    assert(initial.stderr.includes('pause requested'));
    const paused = readRunSnapshot(dbPath, runId);
    assert.equal(paused.run.state, 'paused');
    assert.equal(paused.checkpoints.length, 1);
    assertSavedPrefix(active.snapshot, paused);
    assert.equal(paused.results.length, 0);
    assert.equal(paused.attempts.length, 1);
    assert(paused.attempts[0].ended_at);
    assert.equal(Boolean(await fs.stat(outputPath).catch(() => null)), false);
    const releasedSlots = await waitUntil(async () => {
      const response = await fetch(`${url}slots`, { signal: AbortSignal.timeout(1000) });
      const slots = await response.json();
      return slots.every((slot) => slot.is_processing === false) ? slots : undefined;
    }, server, PAUSE_TIMEOUT_MS, 'server inference release after HTTP disconnect');
    const releasedMs = performance.now() - pauseStarted;
    await cli(['resume', stateDir, runId, profilePath, url, outputPath]);
    const completed = readRunSnapshot(dbPath, runId);
    assert.equal(completed.run.state, 'validated');
    assert.equal(completed.checkpoints.length, 2);
    assert.equal(completed.attempts.length, 2);
    assert.equal(completed.results.length, 1);
    assertSavedPrefix(paused, completed);
    assert.deepEqual(await fs.readFile(sourcePath), source);
    assert.deepEqual(await fs.readFile(completed.source.source_locator), source);
    const output = await fs.readFile(outputPath);
    const outputInspection = (await cli([inspect, outputPath])).stdout;
    verifyProtectedBytes(source, output, sourceInspection, outputInspection);
    await stopProcess(server);
    const reexport = path.join(directory, `offline.ru.${format}`);
    await cli(['resume', stateDir, runId, profilePath, url, reexport]);
    assert.deepEqual(await fs.readFile(reexport), output);
    const report = { schema_version: 1, format, created_at: new Date().toISOString(), origin: 'project-authored synthetic fixture', run_id: runId, cue_count: 9, active_slots: active.slots, released_slots: releasedSlots, pause_acknowledged_ms: acknowledgedMs, server_idle_ms: releasedMs, saved_blocks: 1, completed_blocks: 2, partial_result: false, partial_output: false, retained_checkpoint: 'exact', source_sha256: digest(source), output_sha256: digest(output), profile_sha256: digest(profileBytes), cli_sha256: digest(await fs.readFile(executable)), model_sha256: profile.model_file_sha256, runtime_build: profile.runtime_build_info, server_args: serverArgs, quality_verdict: 'unreviewed', bilingual_reviewed: false, offline_reexport: 'identical', active_snapshot: active.snapshot, paused_snapshot: paused, completed_snapshot: completed };
    await fs.writeFile(path.join(directory, 'report.json'), `${JSON.stringify(report, null, 2)}\n`, { flag: 'wx' });
    console.log(`${format}: paused active inference in ${Math.round(acknowledgedMs)} ms; retained checkpoint, resumed same run and re-exported offline`);
    return report;
  } catch (error) {
    await fs.writeFile(path.join(directory, 'failure.json'), JSON.stringify({ error: error.stack ?? String(error) }, null, 2));
    throw error;
  } finally {
    for (const { child } of calls) await stopProcess(child);
    await stopProcess(server);
    await fs.writeFile(path.join(directory, 'cli.log'), calls.map(({ args, child }) => `${JSON.stringify(args)}\n${child.stdout}\n${child.stderr}`).join('\n'));
    if (server) await fs.writeFile(path.join(directory, 'server.log'), `${server.stdout}\n${server.stderr}`);
  }
}

async function main() {
  assert.equal(process.platform, 'win32');
  const serverPath = process.env.AURALIS_TEST_LLAMA_SERVER;
  const modelPath = process.env.AURALIS_TEST_GGUF;
  for (const asset of [serverPath, modelPath]) assert(asset && path.isAbsolute(asset), 'Supply absolute installed runtime/model paths');
  const gpuLayers = Number(process.env.AURALIS_TEST_GPU_LAYERS ?? '0');
  assert(Number.isInteger(gpuLayers) && gpuLayers >= 0 && gpuLayers <= 999);
  const executable = path.join(root, 'target/release/auralis-translation-cli.exe');
  const profilePath = path.join(root, 'models/manifests/hy_mt2_1_8b_q4_k_m.checked.experimental.json');
  for (const file of [serverPath, modelPath, executable, profilePath]) assert((await fs.stat(file)).isFile());
  const profileBytes = await fs.readFile(profilePath);
  const parent = path.join(root, '.cache/eval/request-pause-runs');
  await fs.mkdir(parent, { recursive: true });
  const workspace = await fs.mkdtemp(path.join(parent, 'pause-'));
  console.log(`Local request-pause workspace: ${workspace}`);
  for (const format of ['srt', 'vtt']) await runFormat({ workspace, format, executable, profilePath, profileBytes, serverPath, modelPath, gpuLayers });
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
