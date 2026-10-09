import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { captureBoundedProcess } from './bounded-process-capture.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const parent = path.join(root, '.cache/eval/vivo-asr-probe');
const previous = await fs.readdir(parent).catch(error => {
  if (error.code === 'ENOENT') return [];
  throw error;
});
assert.equal(previous.length, 0, 'The one-probe budget is already consumed');
const packageDirectory = path.join(root, '.cache/eval/vivo-asr-packages');
assert((await fs.stat(packageDirectory)).isDirectory(), 'Pinned ASR package is missing');
await fs.mkdir(parent, { recursive: true });
const attempt = await fs.mkdtemp(path.join(parent, 'attempt-'));
const startedAt = new Date().toISOString();
const args = [path.join(root, 'eval/scripts/probe-youtube-vivo-audio-asr.py')];
const { outcome, timedOut, outputLimitExceeded, stdout, stderr } =
  await captureBoundedProcess({ command: 'python', args, cwd: root,
    env: { ...process.env, AURALIS_ASR_ATTEMPT_DIR: attempt },
    timeoutMs: 600_000, maxOutputBytes: 1024 * 1024 });
await Promise.all([
  fs.writeFile(path.join(attempt, 'python-stdout.txt'), stdout, { flag: 'wx' }),
  fs.writeFile(path.join(attempt, 'python-stderr.txt'), stderr, { flag: 'wx' }),
]);
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
const report = { schema_version: 1,
  experiment: 'DATA-03-vivo-audio-asr-three-windows-2026-10-09-v1',
  model_revision: 'ebe41f70d5b6dfa9166e2c581c45c9c0cfc57b66',
  started_at: startedAt, finished_at: new Date().toISOString(),
  timeout_ms: 600_000, output_cap_bytes: 1024 * 1024,
  outcome: { ...outcome, timed_out: timedOut,
    output_limit_exceeded: outputLimitExceeded, stdout_bytes: stdout.length,
    stderr_bytes: stderr.length, stdout_sha256: sha256(stdout),
    stderr_sha256: sha256(stderr) } };
await fs.writeFile(path.join(attempt, 'process.json'),
  `${JSON.stringify(report, null, 2)}\n`, { flag: 'wx' });
console.log(`Private ASR process attempt: ${attempt}`);
console.log(JSON.stringify(report.outcome));
if (outcome.exit_code !== 0 || timedOut || outputLimitExceeded)
  process.exitCode = 1;
