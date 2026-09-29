import assert from 'node:assert/strict';
import { test } from 'node:test';
import { runCheckedProcess } from '../run-checked-process.mjs';

test('postflight command inherits an explicit environment and captures completion', async () => {
  let started = 0;
  const stdout = await runCheckedProcess({
    command: process.execPath,
    args: ['-e', 'process.stdout.write(process.env.AURALIS_POSTFLIGHT_CONTROL)'],
    cwd: process.cwd(),
    env: { ...process.env, AURALIS_POSTFLIGHT_CONTROL: 'ready' },
    timeoutMs: 10_000,
    onStart: () => { started += 1; },
  });
  assert.equal(stdout, 'ready');
  assert.equal(started, 1);
});

test('postflight command retains nonzero exit as failure', async () => {
  await assert.rejects(runCheckedProcess({
    command: process.execPath,
    args: ['-e', 'process.stderr.write("bad candidate"); process.exit(7)'],
    cwd: process.cwd(), env: process.env, timeoutMs: 10_000,
  }), /Process failed: 7[\s\S]*bad candidate/u);
});

test('postflight command enforces its finite wall timeout', async () => {
  await assert.rejects(runCheckedProcess({
    command: process.execPath,
    args: ['-e', 'setTimeout(() => {}, 30_000)'],
    cwd: process.cwd(), env: process.env, timeoutMs: 100,
  }), /Process timeout/u);
});
