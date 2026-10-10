import assert from 'node:assert/strict';
import test from 'node:test';
import { scoreAudioWindow } from '../source-asr-window-score.mjs';

test('window boundaries exclude a cue ending at start and one starting at end', () => {
  const cues = [
    { id: 1, startMs: 0, endMs: 1000, text: '前面前面前面' },
    { id: 2, startMs: 1000, endMs: 2000, text: '中间中间中间' },
    { id: 3, startMs: 2000, endMs: 3000, text: '后面后面后面' },
  ];
  const segments = [{ start: 1, end: 2, text: '中间中间中间' }];
  const result = scoreAudioWindow(cues, segments, segments, 1000, 1000);
  assert.deepEqual(result.cue_ids, [2]);
  assert.equal(result.cues_with_raw_asr_overlap, 1);
  assert.deepEqual(result.normalized_low_recall_ids, []);
});

test('missing segment leaves a review priority rather than inferred speech', () => {
  const cues = [{ id: 1, startMs: 0, endMs: 1000, text: '没有声音吗' }];
  const result = scoreAudioWindow(cues, [], [], 0, 1000);
  assert.deepEqual(result.raw_low_recall_ids, [1]);
  assert.equal(result.cues_with_raw_asr_overlap, 0);
});
