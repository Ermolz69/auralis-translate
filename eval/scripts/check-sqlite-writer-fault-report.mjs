import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const reportBytes = fs.readFileSync(path.join(root,
  'eval/reports/2026-10-10-sqlite-writer-fault-v1.json'));
const sha = (bytes) => createHash('sha256').update(bytes).digest('hex');
assert.equal(sha(reportBytes),
  'fce568a49463e3b8ff285ab827bedbddd15939471139657f5f2a483159aeadb7');
const report = JSON.parse(reportBytes);
assert.equal(report.schema_version, 1);
assert.equal(report.experiment,
  'LONG-05-sqlite-writer-fault-capture-2026-10-10-v1');
assert.equal(report.baseline_commit,
  '0004343a15f962773291d0f2bbba8c64be10a78f');
assert.equal(report.dirty_before_run, false);
assert.equal(sha(fs.readFileSync(path.join(root, report.test_source_path))),
  report.test_source_sha256);
assert.equal(report.fixture, 'owned_two_cue_strict_srt');
assert.equal(report.command, 'task test:sqlite:writer-fault');
assert.equal(report.platform, 'win32');
assert.equal(report.exit_code, 0);
assert.equal(report.process_error, null);
assert.equal(report.status, 'passed_bounded_db_fault_only');
assert.deepEqual(report.cases, [
  'locked_first_checkpoint_leaves_no_prefix_or_result',
  'locked_later_checkpoint_preserves_prefix_and_resumes',
]);
assert.equal(report.passed_cases, 2);
assert(report.wall_elapsed_ms > 0 &&
  report.wall_elapsed_ms < report.timeout_ms);
const clockMs = Date.parse(report.ended_utc) - Date.parse(report.started_utc);
assert(Number.isFinite(clockMs) && clockMs >= 0 &&
  Math.abs(clockMs - report.wall_elapsed_ms) < 1000);
for (const kind of ['model_requests', 'media_requests', 'tts_requests',
  'retry_count', 'human_language_reviews']) assert.equal(report[kind], 0);
assert.equal(report.g7_accepted, false);
assert.equal(report.resource_peak_bytes, null);
assert.match(report.resource_peak_reason, /not_sampled/u);
for (const kind of ['stdout_sha256', 'stderr_sha256'])
  assert.match(report[kind], /^[0-9a-f]{64}$/u);
console.log('Pinned SQLite writer-fault capture verified: 2/2 cases; G7 open.');
