import assert from 'node:assert/strict';
import { test } from 'node:test';
import { startProcess, waitForExit } from '../local-process.mjs';

test('a timed-out child is stopped before the caller resumes', async () => {
  const child = startProcess(process.execPath, ['-e', 'setInterval(() => {}, 1000)'], process.cwd());
  await assert.rejects(waitForExit(child, 200), /Process timeout/u);
  const exit = await child.ended;
  assert.notEqual(exit.code, 0);
  assert(child.child.exitCode !== null || child.child.signalCode !== null);
});

test('a successful child still returns its captured output', async () => {
  const child = startProcess(process.execPath, ['-e', 'process.stdout.write("ready")'], process.cwd());
  const result = await waitForExit(child, 5_000);
  assert.equal(result.stdout, 'ready');
});
