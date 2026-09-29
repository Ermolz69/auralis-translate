import assert from 'node:assert/strict';
import test from 'node:test';
import { translationWaitMs } from '../long-run-budget.mjs';

const hour = 3_600_000;

test('REG-004: a 120-minute total budget gives the resumed process its full remaining wall time', () => {
  assert.equal(translationWaitMs(2 * hour, 60_000, hour), 2 * hour - 60_000);
  assert(translationWaitMs(2 * hour, 60_000, hour) > hour);
  assert.equal(translationWaitMs(2 * hour, hour, hour), hour);
});

test('unbounded legacy runs keep the one-hour process cap', () => {
  assert.equal(translationWaitMs(Infinity, 60_000, hour), hour);
});

test('a shorter declared total budget is never expanded and exhausted work stops', () => {
  assert.equal(translationWaitMs(20_000, 5_000, hour), 15_000);
  assert.throws(() => translationWaitMs(20_000, 20_000, hour), /exceeded its 20000 ms wall budget/u);
  assert.throws(() => translationWaitMs(20_000, 20_001, hour), /exceeded its 20000 ms wall budget/u);
});
