import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { performance } from 'node:perf_hooks';
import { fileURLToPath } from 'node:url';
import { startProcess, waitForExit, stopProcess } from './local-process.mjs';
import { sha256, statistics, summarizeDatabase, summarizeTiming } from './stage-timing-analysis.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const sourcePath = path.join(root, '.cache/eval/commons-asus-rog-ally-892592485/source.zh.srt');
const modelPath = process.env.AURALIS_TEST_GGUF_LARGE;
const serverPath = process.env.AURALIS_TEST_LLAMA_SERVER;
const cliPath = process.env.PERF03_CLI_PATH || path.join(root, 'target/release/auralis-translation-cli.exe');
const label = process.env.PERF03_LABEL || 'unlabelled';
assert(/^[a-z0-9-]{1,32}$/u.test(label));
const expected = {
  source: '923aed3991c2308d92b89c45181cea8ec7ece74e9b4d3a3ce0234d95e329913b',
  prefix: 'fd6cd05e2a2fcf223a25216122161be75e940ec0f43068b217ea51c04587cd73',
  model: '9f96256500f3fc1ab4d64336b58f52a949a95ad7516b0c229476eef782f9f77b',
  runtime: '6f15be27bd80b6b4d52afefa49094e18fcfab55d5da354d717971f2d2537b2f4',
  profile: 'a7850c4eb44b52597e1c3ba53d3342009d86373d8c320dd136e58dff563bfbf9',
};
const digest = bytes => createHash('sha256').update(bytes).digest('hex');
assert(modelPath && serverPath && path.isAbsolute(modelPath) && path.isAbsolute(serverPath));
const source = await fs.readFile(sourcePath);
assert.equal(digest(source), expected.source);
assert.equal(await sha256(modelPath), expected.model);
assert.equal(await sha256(serverPath), expected.runtime);
const sourceBlocks = source.toString('utf8').trimEnd().split(/\r?\n\r?\n/u);
assert.equal(sourceBlocks.length, 268);
const prefix = Buffer.from(`${sourceBlocks.slice(0, 32).join('\n\n')}\n`);
assert.equal(digest(prefix), expected.prefix);
const manifestPath = path.join(root, 'models/manifests/hy_mt2_7b_q4_k_m.context_v8_target_first_batch4.experimental.json');
const profile = JSON.parse(await fs.readFile(manifestPath, 'utf8'));
profile.context_before_segments = 0;
profile.context_after_segments = 0;
profile.max_context_bytes = 0;
const profileBytes = Buffer.from(`${JSON.stringify(profile, null, 2)}\n`);
assert.equal(digest(profileBytes), expected.profile);
const head = (await fs.readFile(path.join(root, '.git/HEAD'), 'utf8')).trim();
const codeCommit = head.startsWith('ref: ')
  ? (await fs.readFile(path.join(root, '.git', head.slice(5)), 'utf8')).trim() : head;
assert(/^[0-9a-f]{40}$/u.test(codeCommit));
const parent = path.join(root, '.cache/eval/journal-latency-v1');
await fs.mkdir(parent, { recursive: true });
const directory = await fs.mkdtemp(path.join(parent, `${label}-`));
const input = path.join(directory, 'source.zh.srt');
const output = path.join(directory, 'candidate.ru.srt');
const replay = path.join(directory, 'replay.ru.srt');
const localProfile = path.join(directory, 'profile.json');
const state = path.join(directory, 'state');
await fs.writeFile(input, prefix, { flag: 'wx' });
await fs.writeFile(localProfile, profileBytes, { flag: 'wx' });
const report = {
  schema_version: 1, experiment: 'PERF-03', label,
  started_at: new Date().toISOString(),
  code_commit: codeCommit,
  dirty_state: 'uncommitted PERF-03 instrumentation; binary SHA-256 identifies code',
  cli_sha256: await sha256(cliPath), model_sha256: expected.model,
  runtime_sha256: expected.runtime, profile_sha256: expected.profile,
  source_sha256: expected.prefix, status: 'running',
};
const save = () => fs.writeFile(path.join(directory, 'report.json'), `${JSON.stringify(report, null, 2)}\n`);
await save();
async function waitForReviewedExit(child, timeoutMs) {
  try {
    await waitForExit(child, timeoutMs);
  } catch (error) {
    const hasResult = child.stdout.split(/\r?\n/u).some(line => line.includes('"event":"result"'));
    if (child.child.exitCode !== 3 || !hasResult) throw error;
  }
}
const env = { ...process.env, AURALIS_EVAL_TIMINGS: '1', AURALIS_EVAL_JOURNAL_PHASES: '1',
  AURALIS_EVAL_JOURNAL_WAL: process.env.PERF03_WAL_OBSERVE === '1' ? '1' : '0',
  PATH: `${path.dirname(serverPath)};${path.join(root, '.cache/runtime/cudart')};${process.env.PATH}` };
let cli;
try {
  const start = performance.now();
  cli = startProcess(cliPath, ['--jsonl', 'translate-local', input, state, localProfile,
    serverPath, modelPath, '99', output], root, env, { maxCaptureCharacters: 8 * 1024 * 1024 });
  try {
    await waitForReviewedExit(cli, 600_000);
    report.status = 'completed';
  } catch (error) {
    report.status = 'cli_failed';
    report.error = String(error);
  }
  report.cli_wall_ms = performance.now() - start;
  report.cli_exit_code = cli.child.exitCode;
  report.stdout_truncated = cli.stdoutTruncated;
  report.stderr_truncated = cli.stderrTruncated;
  report.timing = summarizeTiming(cli.stderr);
  const phaseRows = cli.stderr.split(/\r?\n/u).filter(line => line.startsWith('auralis_eval_journal '))
    .map(line => JSON.parse(line.slice('auralis_eval_journal '.length)));
  const configRows = cli.stderr.split(/\r?\n/u).filter(line => line.startsWith('auralis_eval_journal_config '))
    .map(line => JSON.parse(line.slice('auralis_eval_journal_config '.length)));
  report.sqlite_settings = configRows;
  report.journal_phases = {};
  for (const phase of ['mutex_wait', 'transaction_begin', 'read_validate', 'update', 'commit']) {
    report.journal_phases[phase] = statistics(phaseRows.filter(row => row.phase === phase)
      .map(row => row.elapsed_us));
  }
  const operations = [...new Set(phaseRows.map(row => row.operation))].map(id => {
    const rows = phaseRows.filter(row => row.operation === id);
    const by = name => rows.find(row => row.phase === name);
    return { operation: id, phases: Object.fromEntries(rows.filter(row => 'elapsed_us' in row)
      .map(row => [row.phase, row.elapsed_us])),
    wal_before: by('wal_before') ?? null, wal_after: by('wal_after') ?? null };
  });
  report.operations = operations;
  const salts = phaseRows.filter(row => row.phase === 'wal_before' || row.phase === 'wal_after')
    .map(row => row.wal_salt).filter(Boolean);
  report.wal_salt_changes = salts.slice(1).filter((value, index) => value !== salts[index]).length;
  report.source_after_sha256 = await sha256(input);
  assert.equal(report.source_after_sha256, expected.prefix);
  const database = path.join(state, 'auralis-translate.sqlite');
  if (await fs.stat(database).catch(() => null)) {
    report.database = summarizeDatabase(database);
    report.database_sha256 = await sha256(database);
  }
  report.output_sha256 = await sha256(output).catch(() => null);
  if (report.status === 'completed') {
    assert.equal(report.database.chats, 8);
    assert.equal(report.database.results, 1);
    assert.equal(report.timing.phases.journal_finish.count, 16);
    const resultEvent = cli.stdout.split(/\r?\n/u).filter(Boolean).map(line => JSON.parse(line))
      .find(row => row.event === 'result');
    assert(resultEvent?.run_id);
    const replayProcess = startProcess(cliPath, ['--jsonl', 'resume-local', state,
      resultEvent.run_id, localProfile, 'runtime-must-not-start', 'model-must-not-open',
      '99', replay], root, env);
    await waitForReviewedExit(replayProcess, 60_000);
    report.reexport_equal = await sha256(replay) === report.output_sha256;
    assert(report.reexport_equal);
  }
  assert(!report.stderr_truncated && !report.stdout_truncated);
} catch (error) {
  report.status = 'probe_failed';
  report.error = String(error.stack ?? error);
} finally {
  await stopProcess(cli);
  report.finished_at = new Date().toISOString();
  await save();
  await fs.writeFile(path.join(parent, 'latest.txt'), `${path.join(directory, 'report.json')}\n`);
  console.log(JSON.stringify({ label, status: report.status,
    journal_finish_us: report.timing?.phases?.journal_finish ?? null,
    commit_us: report.journal_phases?.commit ?? null,
    chats: report.database?.chats ?? null, output: Boolean(report.output_sha256),
    report: path.join(directory, 'report.json') }));
}
if (report.status !== 'completed') process.exitCode = 1;
