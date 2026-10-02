import assert from 'node:assert/strict';
import test from 'node:test';
import { compareSourceDurations } from '../source-duration-compatibility.mjs';

test('equal duration still does not prove speech and cue alignment', () => {
  assert.deepEqual(compareSourceDurations(761_818, 761_818), {
    status: 'duration_compatible_unverified', difference_ms: 0,
    alignment_verified: false,
  });
});

test('small container rounding difference remains unverified', () => {
  assert.equal(compareSourceDurations(762_000, 761_818).status,
    'duration_compatible_unverified');
  assert.equal(compareSourceDurations(763_818, 761_818).status,
    'duration_compatible_unverified');
  assert.equal(compareSourceDurations(763_819, 761_818).status,
    'duration_discrepancy');
});

test('changed original duration flags a source-version discrepancy', () => {
  assert.deepEqual(compareSourceDurations(852_000, 761_818), {
    status: 'duration_discrepancy', difference_ms: 90_182,
    alignment_verified: false,
  });
});

test('missing and invalid measurements cannot establish compatibility', () => {
  for (const original of [null, 0, -1, Number.NaN]) {
    assert.equal(compareSourceDurations(original, 761_818).status, 'unknown');
  }
});
