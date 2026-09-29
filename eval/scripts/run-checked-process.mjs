import assert from 'node:assert/strict';
import { startProcess, stopProcess, waitForExit } from './local-process.mjs';

export async function runCheckedProcess({ command, args, cwd, env, timeoutMs, onStart }) {
  const childProcess = startProcess(command, args, cwd, env, {
    maxCaptureCharacters: 4 * 1024 * 1024,
  });
  try {
    onStart?.(childProcess);
    await waitForExit(childProcess, timeoutMs);
    assert(!childProcess.stdoutTruncated && !childProcess.stderrTruncated);
    return childProcess.stdout;
  } finally {
    await stopProcess(childProcess);
  }
}
