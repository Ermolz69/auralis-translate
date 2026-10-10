import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { performance } from 'node:perf_hooks';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const relativeTest = 'crates/auralis-translation-sqlite/tests/sqlite_writer_fault.rs';
const expectedTestSha = 'c9dea2b2beb6e26e5249c058b65fbcf1ee63da2f19de76769c2e127a0628f0a9';
const privateDir = path.join(root, '.cache/eval/sqlite-writer-fault/final-v1');
const reportPath = path.join(privateDir, 'report.json');
const sha = (bytes) => createHash('sha256').update(bytes).digest('hex');
const run = (command, args, options = {}) => spawnSync(command, args, {
  cwd: root, encoding: 'utf8', maxBuffer: 1024 * 1024, windowsHide: true,
  ...options,
});

assert.equal(process.platform, 'win32');
assert(!fs.existsSync(privateDir), 'final-v1 attempt already exists; preserve it');
assert.equal(sha(fs.readFileSync(path.join(root, relativeTest))), expectedTestSha);
const status = run('git', ['status', '--porcelain']);
assert.equal(status.status, 0);
assert.equal(status.stdout.trim(), '', 'capture requires a clean worktree');
const revision = run('git', ['rev-parse', 'HEAD']);
assert.equal(revision.status, 0);
const commit = revision.stdout.trim();
assert.match(commit, /^[0-9a-f]{40}$/u);
fs.mkdirSync(privateDir, { recursive: true });

const startedUtc = new Date().toISOString();
const started = performance.now();
const observed = run('task', ['test:sqlite:writer-fault'], { timeout: 120_000 });
const elapsedMs = Math.round(performance.now() - started);
const endedUtc = new Date().toISOString();
const stdout = observed.stdout ?? '';
const stderr = observed.stderr ?? '';
fs.writeFileSync(path.join(privateDir, 'stdout.txt'), stdout, { flag: 'wx' });
fs.writeFileSync(path.join(privateDir, 'stderr.txt'), stderr, { flag: 'wx' });

const passed = observed.status === 0 &&
  /locked_first_checkpoint_leaves_no_prefix_or_result \.\.\. ok/u.test(stdout) &&
  /locked_later_checkpoint_preserves_prefix_and_resumes \.\.\. ok/u.test(stdout) &&
  /test result: ok\. 2 passed; 0 failed; 0 ignored;/u.test(stdout);
const report = {
  schema_version: 1,
  experiment: 'LONG-05-sqlite-writer-fault-capture-2026-10-10-v1',
  baseline_commit: commit,
  dirty_before_run: false,
  test_source_path: relativeTest,
  test_source_sha256: expectedTestSha,
  fixture: 'owned_two_cue_strict_srt',
  command: 'task test:sqlite:writer-fault',
  timeout_ms: 120_000,
  started_utc: startedUtc,
  ended_utc: endedUtc,
  wall_elapsed_ms: elapsedMs,
  platform: process.platform,
  arch: process.arch,
  os_release: os.release(),
  cpu_model: os.cpus()[0]?.model ?? null,
  total_memory_bytes: os.totalmem(),
  model_requests: 0,
  media_requests: 0,
  tts_requests: 0,
  retry_count: 0,
  exit_code: observed.status,
  process_error: observed.error?.message ?? null,
  stdout_sha256: sha(stdout),
  stderr_sha256: sha(stderr),
  cases: [
    'locked_first_checkpoint_leaves_no_prefix_or_result',
    'locked_later_checkpoint_preserves_prefix_and_resumes',
  ],
  passed_cases: passed ? 2 : null,
  status: passed ? 'passed_bounded_db_fault_only' : 'failed_retained',
  resource_peak_bytes: null,
  resource_peak_reason: 'process_peak_not_sampled_for_this_database_fixture',
  human_language_reviews: 0,
  g7_accepted: false,
};
fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, { flag: 'wx' });
console.log(JSON.stringify({ status: report.status, report: reportPath,
  wall_elapsed_ms: elapsedMs, commit }));
if (!passed) process.exitCode = 1;
