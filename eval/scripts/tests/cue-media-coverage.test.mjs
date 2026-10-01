import assert from 'node:assert/strict';
import test from 'node:test';
import { checkCueMediaCoverage } from '../cue-media-coverage.mjs';

const cues = [
  { id: 1, start_ms: 1000, end_ms: 2000 },
  { id: 2, start_ms: 3000, end_ms: 4000 },
];

test('exact media boundary is covered', () => {
  const result = checkCueMediaCoverage(cues, 4000);
  assert.equal(result.covers_media, true);
  assert.equal(result.overrun_count, 0);
  assert.equal(result.max_end_ms, 4000);
});

test('one millisecond after the media boundary is rejected', () => {
  const result = checkCueMediaCoverage(cues, 3999);
  assert.equal(result.covers_media, false);
  assert.deepEqual(result.first_overrun,
    { cue_id: 2, start_ms: 3000, end_ms: 4000 });
});

test('an overlong middle cue is counted even if the final cue fits', () => {
  const result = checkCueMediaCoverage([
    cues[0], { id: 2, start_ms: 3900, end_ms: 5100 },
    { id: 3, start_ms: 1000, end_ms: 1500 },
  ], 5000);
  assert.equal(result.overrun_count, 1);
  assert.equal(result.first_overrun.cue_id, 2);
});

test('invalid duration and missing or inverted cue timing cannot pass', () => {
  assert.throws(() => checkCueMediaCoverage(cues, 0), /positive integer/u);
  assert.throws(() => checkCueMediaCoverage([], 4000), /requires inspected/u);
  assert.throws(() => checkCueMediaCoverage([{ id: 1, start_ms: 2000,
    end_ms: 1000 }], 4000), /invalid inspected timing/u);
});
