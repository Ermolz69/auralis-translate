import assert from 'node:assert/strict';
import test from 'node:test';
import { countSourceTextSlots } from '../source-slot-budget.mjs';

test('a four-cue window can require five model calls', () => {
  const blocks = [
    '15\n00:00:01,000 --> 00:00:02,000\n數字',
    '16\n00:00:02,000 --> 00:00:03,000\n名字',
    '17\n00:00:03,000 --> 00:00:04,000\n金額',
    '18\n00:00:04,000 --> 00:00:05,000\n問題\n回答',
  ];
  assert.deepEqual(countSourceTextSlots(blocks), { cues: 4, text_slots: 5 });
});

test('multi-line middle and final cues keep their full call budget', () => {
  const blocks = [
    '465\r\n00:01:01,000 --> 00:01:02,000\r\n第一行\r\n第二行',
    '466\r\n00:01:02,000 --> 00:01:03,000\r\n第三行',
    '861\r\n01:00:01,000 --> 01:00:02,000\r\n第四行\r\n第五行',
  ];
  assert.deepEqual(countSourceTextSlots(blocks), { cues: 3, text_slots: 5 });
});

test('blank text slots cannot silently reduce the budget', () => {
  assert.throws(() => countSourceTextSlots([
    '17\n00:00:01,000 --> 00:00:02,000\n金額\n ',
  ]), /nonempty/u);
});

test('a malformed cue header cannot be counted as evidence', () => {
  assert.throws(() => countSourceTextSlots([
    '17\nnot a timestamp\n金額',
  ]), /SRT cue block/u);
});
