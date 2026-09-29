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
import { translationWaitMs } from './long-run-budget.mjs';
import { relocateCopiedSource } from './relocate-copied-source.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const original = path.join(root, '.cache/eval/long-v6-relocated-continuation-runs/continuation-cXUYur');
const parent = path.join(root, '.cache/eval/long-v6-postlength-resume-runs');
const runId = '86876d9c-bb84-4450-9214-8eb21f7d262c';
const totalBudgetMs = 20 * 60_000;
const modelSha256 = 'dc5f44fcf1fa496ee7ad725982c0c8c553a4de00259b53af84c4b89fb0c06699';
async function hashFile(file) {
  const hash = createHash('sha256');
  for await (const chunk of createReadStream(file)) hash.update(chunk);
  return hash.digest('hex');
}
const expectedDbHashes = {
  'auralis-translate.sqlite': '26acd2e45baf0fc3175227686a8772db5dc45fd8d6336f28dd0976fbdeaa66af',
  'auralis-translate.sqlite-wal': 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
  'auralis-translate.sqlite-shm': 'fd4c9fda9cd3f9ae7c962b0ddf37232294d55580e1aa165aa06129b8549389eb',
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
    `Frozen failed-run database component changed: ${name}`);
}
const fixtureBytes = await fs.readFile(path.join(original, 'fixture-manifest.json'));
assert.equal(digest(fixtureBytes), '0527cab3c4ea38aa91ae65c6f4e52103d7e0c5cde1ab778dc7e9da1a46c43986');
const predecessorSummary = await fs.readFile(path.join(root,
  'eval/reports/2026-09-29-long-v6-relocated-continuation-failure.json'));
assert.equal(digest(predecessorSummary), 'c16f0015e958e5080827241a025f87b0cbe124134bfbf98afbc3e823417703f3');
await fs.mkdir(parent, { recursive: true });
const workspace = await fs.mkdtemp(path.join(parent, 'postlength-'));
const srtDir = path.join(workspace, 'srt');
await fs.cp(path.join(original, 'srt'), srtDir, { recursive: true, force: false, errorOnExist: true });
await fs.copyFile(path.join(original, 'fixture-manifest.json'), path.join(workspace, 'fixture-manifest.json'));
console.log(`V6 post-length resume workspace: ${workspace}`);
for (const [name, expected] of Object.entries(expectedDbHashes)) {
  assert.equal(digest(await fs.readFile(path.join(srtDir, 'state', name))), expected,
    `Copied failed-run database component changed: ${name}`);
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
assert.equal(before.run.state, 'failed');
assert.equal(before.checkpoints.length, 982);
assert.equal(before.attempts.length, 3);
assert.equal(before.attempts[2].stop_reason, 'translation failed');
assert.equal(before.results.length, 0);
assert.equal(await fs.stat(outputPath).catch(() => null), null);
assert.deepEqual(await fs.readFile(before.source.source_locator), sourceBytes);
const relocation = await relocateCopiedSource({
  dbPath, runId, originalStateDir: path.join(original, 'srt/state'),
  copiedStateDir: stateDir, expectedSourceSha256: digest(sourceBytes),
});
const relocated = readRunSnapshot(dbPath, runId);
assert.deepEqual(relocated.run, before.run);
assert.deepEqual(relocated.checkpoints, before.checkpoints);
assert.deepEqual(relocated.attempts, before.attempts);
assert.deepEqual(relocated.results, before.results);
assert.equal(relocated.source.source_sha256, before.source.source_sha256);
assert.equal(relocated.source.source_locator, relocation.copiedLocator);
const config = JSON.parse(fixtureBytes);
const fixture = longFileFixture(config, 'srt');
assert.deepEqual(sourceBytes, fixture.source);

const started = Date.now();
const remaining = (phaseMs) => {
  const left = totalBudgetMs - (Date.now() - started);
  if (left <= 0) throw new Error('Post-length resume exceeded its 20-minute wall budget');
  return Math.min(phaseMs, left);
};
const calls = [];
let server, cli, sampler, resourceReport;
let serverLog = '';
const callCli = async (args, timeoutMs = 60_000) => {
  const process = startProcess(executable, args, root, process.env, { maxCaptureCharacters: 4 * 1024 * 1024 });
  calls.push({ args, process });
  try { await waitForExit(process, remaining(timeoutMs)); }
  finally { await stopProcess(process); }
  assert(!process.stdoutTruncated && !process.stderrTruncated);
  return process.stdout;
};
try {
  const port = await freeLoopbackPort();
  const url = `http://127.0.0.1:${port}/`;
  server = startProcess(serverPath, ['--model', modelPath, '--alias', JSON.parse(profileBytes).model_alias,
    '--host', '127.0.0.1', '--port', String(port), '-c', '2048', '-ngl', '99',
    '--parallel', '1', '--jinja', '--cache-ram', '0'], root, process.env,
  { maxCaptureCharacters: 8 * 1024 * 1024 });
  await waitForHealthyServer(url, server, remaining(180_000));
  sampler = runtimeSampler(path.join(srtDir, 'postlength-resources.jsonl'), root,
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
  assert.equal(completed.attempts.length, 4);
  const outputBytes = await fs.readFile(outputPath);
  assert.equal(digest(outputBytes), completed.results[0].output_sha256);
  const sourceInspection = await callCli(['inspect', sourcePath]);
  const outputInspection = await callCli(['inspect', outputPath]);
  verifyProtectedBytes(sourceBytes, outputBytes, sourceInspection, outputInspection);
  const sourceTemplatePath = path.join(srtDir, 'postlength-source-template.json');
  const outputTemplatePath = path.join(srtDir, 'postlength-output-template.json');
  await callCli(['template', sourcePath, sourceTemplatePath]);
  await callCli(['template', outputPath, outputTemplatePath]);
  const rows = compareLongFile(fixture.rows,
    JSON.parse(await fs.readFile(sourceTemplatePath)),
    JSON.parse(await fs.readFile(outputTemplatePath)));
  assert.deepEqual(await fs.readFile(before.source.source_locator), sourceBytes);
  await stopProcess(server);
  serverLog = `${server.stdout}\n${server.stderr}\nstdout_truncated=${server.stdoutTruncated} stderr_truncated=${server.stderrTruncated}\n`;
  const reexportPath = path.join(srtDir, 'postlength-offline-reexport.ru.srt');
  await callCli(['resume', stateDir, runId, profilePath, url, reexportPath]);
  assert.deepEqual(await fs.readFile(reexportPath), outputBytes);
  resourceReport = await sampler.stop();
  for (const [name, expected] of Object.entries(expectedDbHashes)) {
    assert.equal(digest(await fs.readFile(path.join(original, 'srt/state', name))), expected,
      `Predecessor failed-run database component changed: ${name}`);
  }
  const report = {
    schema_version: 1, experiment: 'long-v6-postlength-resume-1024-v3',
    outcome: 'passed_structural_unreviewed', created_at: new Date().toISOString(),
    predecessor_failure_report_sha256: digest(predecessorSummary),
    run_id: runId, result_id: completed.results[0].result_id,
    source_sha256: digest(sourceBytes), output_sha256: digest(outputBytes),
    profile_sha256: digest(profileBytes), fixture_manifest_sha256: digest(fixtureBytes),
    cli_executable_sha256: digest(await fs.readFile(executable)),
    runtime_executable_sha256: digest(await fs.readFile(serverPath)),
    model_sha256: modelSha256,
    copied_db_component_sha256: expectedDbHashes,
    copied_managed_source_relocated: true,
    initial_checkpoints: before.checkpoints.length, completed_checkpoints: completed.checkpoints.length,
    attempts: completed.attempts.length, saved_prefix_preserved: true,
    partial_result_at_start: 0, partial_output_at_start: false,
    cue_count: 1024, text_slot_count: 1280, code_preserved_cues: rows.filter((row) => row.code_preserved).length,
    exact_draft_matches: rows.filter((row) => row.exact_draft_match).length,
    structural_checks: 'passed', offline_reexport: 'byte_identical',
    predecessor_failed_workspace_unchanged: true,
    full_elapsed_ms: Date.now() - started, resources: resourceReport,
    subtitle_holdout: false, bilingual_reviewed: false, quality_verdict: 'unreviewed', rows,
  };
  await fs.writeFile(path.join(srtDir, 'postlength-report.json'), `${JSON.stringify(report, null, 2)}\n`, { flag: 'wx' });
  console.log(`V6 post-length resume passed: 1024/1024 checkpoints; output ${outputPath}; quality unreviewed`);
} catch (error) {
  await fs.writeFile(path.join(srtDir, 'postlength-failure.json'),
    `${JSON.stringify({ created_at: new Date().toISOString(), error: error.stack ?? error.message }, null, 2)}\n`, { flag: 'wx' });
  throw error;
} finally {
  await stopProcess(cli);
  await stopProcess(server);
  if (sampler && !resourceReport) await sampler.stop();
  if (!serverLog && server) serverLog = `${server.stdout}\n${server.stderr}\nstdout_truncated=${server.stdoutTruncated} stderr_truncated=${server.stderrTruncated}\n`;
  await fs.writeFile(path.join(srtDir, 'postlength-server.log'), serverLog, { flag: 'wx' });
  await fs.writeFile(path.join(srtDir, 'postlength-cli.log'), calls.map((call) =>
    `${JSON.stringify(call.args)}\n${call.process.stdout}\n${call.process.stderr}`).join('\n'), { flag: 'wx' });
}
