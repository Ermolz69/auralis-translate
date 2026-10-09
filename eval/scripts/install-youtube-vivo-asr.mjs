import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { captureBoundedProcess } from './bounded-process-capture.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const parent = path.join(root, '.cache/eval/vivo-asr-install');
const target = path.join(root, '.cache/eval/vivo-asr-packages');
const previous = await fs.readdir(parent).catch(error => {
  if (error.code === 'ENOENT') return [];
  throw error;
});
assert.equal(previous.length, 0, 'The one-install budget is already consumed');
await fs.mkdir(parent, { recursive: true });
const attempt = await fs.mkdtemp(path.join(parent, 'attempt-'));
const args = ['-m', 'pip', 'install', '--target', target, '--no-input',
  '--disable-pip-version-check', '--retries', '0', '--timeout', '30',
  'faster-whisper==1.2.1'];
const startedAt = new Date().toISOString();
const { outcome, timedOut, outputLimitExceeded, stdout, stderr } =
  await captureBoundedProcess({ command: 'python', args, cwd: root,
    env: process.env, timeoutMs: 300_000, maxOutputBytes: 2 * 1024 * 1024 });
await Promise.all([
  fs.writeFile(path.join(attempt, 'pip-stdout.txt'), stdout, { flag: 'wx' }),
  fs.writeFile(path.join(attempt, 'pip-stderr.txt'), stderr, { flag: 'wx' }),
]);
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
const report = { schema_version: 1,
  experiment: 'DATA-03-vivo-audio-asr-package-2026-10-09-v1',
  package: 'faster-whisper==1.2.1', args, started_at: startedAt,
  finished_at: new Date().toISOString(), timeout_ms: 300_000,
  output_cap_bytes: 2 * 1024 * 1024,
  outcome: { ...outcome, timed_out: timedOut,
    output_limit_exceeded: outputLimitExceeded, stdout_bytes: stdout.length,
    stderr_bytes: stderr.length, stdout_sha256: sha256(stdout),
    stderr_sha256: sha256(stderr) } };
await fs.writeFile(path.join(attempt, 'install.json'),
  `${JSON.stringify(report, null, 2)}\n`, { flag: 'wx' });
console.log(`Private ASR install attempt: ${attempt}`);
console.log(JSON.stringify(report.outcome));
if (outcome.exit_code !== 0 || timedOut || outputLimitExceeded)
  process.exitCode = 1;
