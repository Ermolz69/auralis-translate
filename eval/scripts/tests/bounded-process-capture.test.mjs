import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import test from 'node:test';
import { captureBoundedProcess } from '../bounded-process-capture.mjs';

const options = { command: 'fixture', args: [], cwd: '.', env: {},
  timeoutMs: 1000, maxOutputBytes: 100 };

test('synchronous spawn rejection is a retained failed outcome with empty streams', async () => {
  const result = await captureBoundedProcess({ ...options,
    spawnProcess: () => { throw Object.assign(new Error('spawn EPERM'), { code: 'EPERM' }); } });
  assert.match(result.outcome.error, /spawn EPERM/);
  assert.equal(result.outcome.exit_code, null);
  assert.equal(result.stdout.length, 0);
  assert.equal(result.stderr.length, 0);
  assert.equal(result.timedOut, false);
});

test('asynchronous child failure is retained before any close event', async () => {
  const child = new EventEmitter();
  child.stdout = new EventEmitter();
  child.stderr = new EventEmitter();
  child.kill = () => {};
  const promise = captureBoundedProcess({ ...options, spawnProcess: () => child });
  queueMicrotask(() => child.emit('error', new Error('access denied')));
  const result = await promise;
  assert.match(result.outcome.error, /access denied/);
  assert.equal(result.outcome.exit_code, null);
});

test('bounded output and exit status are captured on a completed process', async () => {
  const child = new EventEmitter();
  child.stdout = new EventEmitter();
  child.stderr = new EventEmitter();
  child.kill = () => {};
  const promise = captureBoundedProcess({ ...options, spawnProcess: () => child });
  queueMicrotask(() => {
    child.stdout.emit('data', Buffer.from('metadata'));
    child.stderr.emit('data', Buffer.from('warning'));
    child.emit('close', 0, null);
  });
  const result = await promise;
  assert.equal(result.outcome.exit_code, 0);
  assert.equal(result.stdout.toString(), 'metadata');
  assert.equal(result.stderr.toString(), 'warning');
  assert.equal(result.outputLimitExceeded, false);
});

test('over-budget extractor output is stopped and marked incomplete', async () => {
  const child = new EventEmitter();
  child.stdout = new EventEmitter();
  child.stderr = new EventEmitter();
  let kills = 0;
  child.kill = () => { kills += 1; queueMicrotask(() => child.emit('close', null, 'SIGTERM')); };
  const promise = captureBoundedProcess({ ...options, maxOutputBytes: 5,
    spawnProcess: () => child });
  queueMicrotask(() => child.stdout.emit('data', Buffer.from('oversized')));
  const result = await promise;
  assert.equal(kills, 1);
  assert.equal(result.outputLimitExceeded, true);
  assert.equal(result.stdout.length, 0);
  assert.equal(result.outcome.signal, 'SIGTERM');
});
