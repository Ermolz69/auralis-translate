import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { createReadStream } from 'node:fs';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { digest, verifyProtectedBytes } from './flores-file-fixture.mjs';
import { longFileFixture, compareLongFile } from './long-file-fixture.mjs';
import { assertSavedPrefix, readRunSnapshot } from './cli-run-state.mjs';
import { freeLoopbackPort, startProcess, stopProcess, waitForExit, waitForHealthyServer } from './local-process.mjs';
import { runtimeSampler } from './runtime-sampler.mjs';
import { runCheckedProcess } from './run-checked-process.mjs';
import { translationWaitMs } from './long-run-budget.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const original = path.join(root, '.cache/eval/long-v6-scene-runs/recovery-NhHJxM');
const parent = path.join(root, '.cache/eval/long-v6-continuation-runs');
const runId = '86876d9c-bb84-4450-9214-8eb21f7d262c';
const totalBudgetMs = 30 * 60_000;
const modelSha256 = 'dc5f44fcf1fa496ee7ad725982c0c8c553a4de00259b53af84c4b89fb0c06699';
async function hashFile(file) {
  const hash = createHash('sha256');
  for await (const chunk of createReadStream(file)) hash.update(chunk);
  return hash.digest('hex');
}
const expectedDbHashes = {
  'auralis-translate.sqlite': '2d4a823aa3c0ec6a9f32dff49df5929849683ffd3870b021343100cc6b2603d5',
  'auralis-translate.sqlite-wal': 'c63ec0f00e04592b9addf0b5808fdbfc6a254386fb3c73f3a7e19755b4e9f305',
  'auralis-translate.sqlite-shm': '8eac92c7a76a6d4de10b0985d05814ad106494fdb0c750f46ecc864204ab1382',
};
const serverPath = process.env.AURALIS_TEST_LLAMA_SERVER;
const modelPath = process.env.AURALIS_TEST_GGUF;
assert.equal(process.platform, 'win32');
assert(serverPath && path.isAbsolute(serverPath));
assert(modelPath && path.isAbsolute(modelPath));
const executable = path.join(root, 'target/release/auralis-translation-cli.exe');
assert.equal(digest(await fs.readFile(executable)), '76ab2844996a3d68e9be96035f22f32bfcad79e085a5eacdecddbfa27626452a');
assert.equal(digest(await fs.readFile(serverPath)), '6f15be27bd80b6b4d52afefa49094e18fcfab55d5da354d717971f2d2537b2f4');
assert.equal(await hashFile(modelPath), modelSha256);
for (const [name, expected] of Object.entries(expectedDbHashes)) {
  assert.equal(digest(await fs.readFile(path.join(original, 'srt/state', name))), expected,
    `Frozen timeout database component changed: ${name}`);
}
const fixtureBytes = await fs.readFile(path.join(original, 'fixture-manifest.json'));
assert.equal(digest(fixtureBytes), '0527cab3c4ea38aa91ae65c6f4e52103d7e0c5cde1ab778dc7e9da1a46c43986');
await fs.mkdir(parent, { recursive: true });
const workspace = await fs.mkdtemp(path.join(parent, 'continuation-'));
const srtDir = path.join(workspace, 'srt');
await fs.cp(path.join(original, 'srt'), srtDir, { recursive: true, force: false, errorOnExist: true });
await fs.copyFile(path.join(original, 'fixture-manifest.json'), path.join(workspace, 'fixture-manifest.json'));
console.log(`V6 timeout continuation workspace: ${workspace}`);
for (const [name, expected] of Object.entries(expectedDbHashes)) {
  assert.equal(digest(await fs.readFile(path.join(srtDir, 'state', name))), expected,
    `Copied timeout database component changed: ${name}`);
}

const stateDir = path.join(srtDir, 'state');
const dbPath = path.join(stateDir, 'auralis-translate.sqlite');
const profilePath = path.join(srtDir, 'profile.json');
const sourcePath = path.join(srtDir, 'source.srt');
const outputPath = path.join(srtDir, 'candidate.ru.srt');
const profileBytes = await fs.readFile(profilePath);
const sourceBytes = await fs.readFile(sourcePath);
assert.equal(digest(profileBytes), 'b30546f228ba230364ba79edae55456d62e7d7c5010e56fef38464c3531089c5');
assert.equal(digest(sourceBytes), 'e9b760bdcce97de9f29f5fe671dbb927088f5a15119ebe3200e73e0408391bb3');
const before = readRunSnapshot(dbPath, runId);
assert.equal(before.run.state, 'running');
assert.equal(before.checkpoints.length, 964);
assert.equal(before.results.length, 0);
assert.equal(await fs.stat(outputPath).catch(() => null), null);
assert.deepEqual(await fs.readFile(before.source.source_locator), sourceBytes);
const config = JSON.parse(fixtureBytes);
const fixture = longFileFixture(config, 'srt');
assert.deepEqual(sourceBytes, fixture.source);

const started = Date.now();
const remaining = (phaseMs) => {
  const left = totalBudgetMs - (Date.now() - started);
  if (left <= 0) throw new Error('Continuation exceeded its 30-minute wall budget');
  return Math.min(phaseMs, left);
};
const calls = [];
let server, cli, sampler, resourceReport;
let serverLog = '';
const callCli = async (args, timeoutMs = 60_000) => {
  return runCheckedProcess({ command: executable, args, cwd: root, env: process.env,
    timeoutMs: remaining(timeoutMs), onStart: (childProcess) => {
      calls.push({ args, process: childProcess });
    } });
};
try {
  const port = await freeLoopbackPort();
  const url = `http://127.0.0.1:${port}/`;
  server = startProcess(serverPath, ['--model', modelPath, '--alias', JSON.parse(profileBytes).model_alias,
    '--host', '127.0.0.1', '--port', String(port), '-c', '2048', '-ngl', '99',
    '--parallel', '1', '--jinja', '--cache-ram', '0'], root, process.env,
  { maxCaptureCharacters: 8 * 1024 * 1024 });
  await waitForHealthyServer(url, server, remaining(180_000));
  sampler = runtimeSampler(path.join(srtDir, 'continuation-resources.jsonl'), root,
    () => [server, cli].filter((process) => process && process.child.exitCode === null &&
      process.child.signalCode === null).map((process) => process.child.pid));
  cli = startProcess(executable, ['resume', stateDir, runId, profilePath, url, outputPath],
    root, process.env, { maxCaptureCharacters: 4 * 1024 * 1024 });
  calls.push({ args: ['resume', runId], process: cli });
  await waitForExit(cli, translationWaitMs(totalBudgetMs, Date.now() - started, totalBudgetMs));
  assert(!cli.stdoutTruncated && !cli.stderrTruncated);
  const completed = readRunSnapshot(dbPath, runId);
  assert.equal(completed.run.state, 'validated');
  assert.equal(completed.checkpoints.length, 1024);
  assertSavedPrefix(before, completed);
  assert.equal(completed.results.length, 1);
  assert.equal(completed.results[0].review_state, 'needs_review');
  assert.equal(completed.attempts.length, 3);
  const outputBytes = await fs.readFile(outputPath);
  assert.equal(digest(outputBytes), completed.results[0].output_sha256);
  const sourceInspection = await callCli(['inspect', sourcePath]);
  const outputInspection = await callCli(['inspect', outputPath]);
  verifyProtectedBytes(sourceBytes, outputBytes, sourceInspection, outputInspection);
  const sourceTemplatePath = path.join(srtDir, 'continuation-source-template.json');
  const outputTemplatePath = path.join(srtDir, 'continuation-output-template.json');
  await callCli(['template', sourcePath, sourceTemplatePath]);
  await callCli(['template', outputPath, outputTemplatePath]);
  const rows = compareLongFile(fixture.rows,
    JSON.parse(await fs.readFile(sourceTemplatePath)),
    JSON.parse(await fs.readFile(outputTemplatePath)));
  assert.deepEqual(await fs.readFile(before.source.source_locator), sourceBytes);
  await stopProcess(server);
  serverLog = `${server.stdout}\n${server.stderr}\nstdout_truncated=${server.stdoutTruncated} stderr_truncated=${server.stderrTruncated}\n`;
  const reexportPath = path.join(srtDir, 'continuation-offline-reexport.ru.srt');
  await callCli(['resume', stateDir, runId, profilePath, url, reexportPath]);
  assert.deepEqual(await fs.readFile(reexportPath), outputBytes);
  resourceReport = await sampler.stop();
  for (const [name, expected] of Object.entries(expectedDbHashes)) {
    assert.equal(digest(await fs.readFile(path.join(original, 'srt/state', name))), expected,
      `Original timeout database component changed: ${name}`);
  }
  const report = {
    schema_version: 1, experiment: 'long-v6-timeout-continuation-1024-v1',
    outcome: 'passed_structural_unreviewed', created_at: new Date().toISOString(),
    original_failure_report_sha256: '66b393595abca189f457fe414a4e7d508a21a8d6c4fd653cf9842f5e79242795',
    run_id: runId, result_id: completed.results[0].result_id,
    source_sha256: digest(sourceBytes), output_sha256: digest(outputBytes),
    profile_sha256: digest(profileBytes), fixture_manifest_sha256: digest(fixtureBytes),
    cli_executable_sha256: digest(await fs.readFile(executable)),
    runtime_executable_sha256: digest(await fs.readFile(serverPath)),
    model_sha256: modelSha256,
    copied_db_component_sha256: expectedDbHashes,
    initial_checkpoints: before.checkpoints.length, completed_checkpoints: completed.checkpoints.length,
    attempts: completed.attempts.length, saved_prefix_preserved: true,
    partial_result_at_start: 0, partial_output_at_start: false,
    cue_count: 1024, text_slot_count: 1280, code_preserved_cues: rows.filter((row) => row.code_preserved).length,
    exact_draft_matches: rows.filter((row) => row.exact_draft_match).length,
    structural_checks: 'passed', offline_reexport: 'byte_identical',
    original_timeout_workspace_unchanged: true,
    full_elapsed_ms: Date.now() - started, resources: resourceReport,
    subtitle_holdout: false, bilingual_reviewed: false, quality_verdict: 'unreviewed', rows,
  };
  await fs.writeFile(path.join(srtDir, 'continuation-report.json'), `${JSON.stringify(report, null, 2)}\n`, { flag: 'wx' });
  console.log(`V6 continuation passed: 1024/1024 checkpoints; output ${outputPath}; quality unreviewed`);
} catch (error) {
  await fs.writeFile(path.join(srtDir, 'continuation-failure.json'),
    `${JSON.stringify({ created_at: new Date().toISOString(), error: error.stack ?? error.message }, null, 2)}\n`);
  throw error;
} finally {
  await stopProcess(cli);
  await stopProcess(server);
  if (sampler && !resourceReport) await sampler.stop();
  if (!serverLog && server) serverLog = `${server.stdout}\n${server.stderr}\nstdout_truncated=${server.stdoutTruncated} stderr_truncated=${server.stderrTruncated}\n`;
  await fs.writeFile(path.join(srtDir, 'continuation-server.log'), serverLog);
  await fs.writeFile(path.join(srtDir, 'continuation-cli.log'), calls.map((call) =>
    `${JSON.stringify(call.args)}\n${call.process.stdout}\n${call.process.stderr}`).join('\n'));
}
