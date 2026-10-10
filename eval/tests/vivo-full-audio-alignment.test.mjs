import assert from 'node:assert/strict';
import test from 'node:test';
import { normalizedCharacters, orderedCharacterRecall, scoreCue } from
  '../scripts/vivo-full-audio-alignment.mjs';

test('normalization ignores timing punctuation but retains names and numbers', () => {
  assert.deepEqual(normalizedCharacters('Vivo：东莞，12 元！'),
    Array.from('vivo东莞12元'));
  assert.equal(orderedCharacterRecall('东莞总部', '我们到了东莞总部'), 1);
  assert(orderedCharacterRecall('没有霍尔摇杆', '有霍尔摇杆') < 1);
});

test('cue mapping tolerates a 500 ms edge and rejects distant speech', () => {
  const cue = { id: 1, startMs: 1000, endMs: 3000, text: '东莞总部' };
  const segments = [
    { start: 0.1, end: 0.4, text: 'unrelated' },
    { start: 3.3, end: 3.4, text: '东莞总部' },
    { start: 4, end: 5, text: 'late' },
  ];
  const result = scoreCue(cue, segments);
  assert.equal(result.overlapping_segments, 1);
  assert.equal(result.source_character_recall, 1);
  assert.equal(scoreCue(cue, segments, 0).overlapping_segments, 0);
});

test('traditional-script overlap can look falsely low without conversion', () => {
  assert(orderedCharacterRecall('我们在东莞见面', '我們在東莞見面') < 1);
  assert(orderedCharacterRecall('从专业测试里面', '從專業測試裡面') < 0.5);
  assert.equal(orderedCharacterRecall('东莞总部', '东莞总部'), 1);
  assert(orderedCharacterRecall('东莞总部', '上海总部') < 1);
});
