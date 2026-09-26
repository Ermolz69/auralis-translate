import assert from 'node:assert/strict';
import test from 'node:test';
import { startProcess, waitForExit } from '../local-process.mjs';

test('a bounded capture reports truncation instead of silently presenting a complete output', async () => {
  const child = startProcess(process.execPath, ['-e', "process.stdout.write('x'.repeat(1000)); process.stderr.write('err')"], process.cwd(), process.env, { maxCaptureCharacters: 100 });
  await waitForExit(child, 10_000);
  assert.equal(child.stdout.length, 100);
  assert.equal(child.stdoutTruncated, true);
  assert.equal(child.stderr, 'err');
  assert.equal(child.stderrTruncated, false);
});

test('split UTF-8 writes decode correctly and completion drains pipe output', async () => {
  const child = startProcess(process.execPath, ['-e', "const bytes = Buffer.from('你好, Россия'); process.stdout.write(bytes.subarray(0, 1)); setTimeout(() => process.stdout.write(bytes.subarray(1)), 10)"], process.cwd());
  await waitForExit(child, 10_000);
  assert.equal(child.stdout, '你好, Россия');
  assert.equal(child.stdoutTruncated, false);
});
