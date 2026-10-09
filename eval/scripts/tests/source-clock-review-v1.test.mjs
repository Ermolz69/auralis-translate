import assert from 'node:assert/strict';
import test from 'node:test';
import { sourceClockClass, sourceClockWarning, targetClockClass } from
  '../source-clock-review-v1.mjs';

const cue = (id, text, startMs = id * 3000) =>
  ({ id, text, startMs, endMs: startMs + 3000 });
const warning = (source, previous, target) =>
  sourceClockWarning(source, previous, target);

test('natural split-clause hour reversal is a review warning', () => {
  const previous = cue(327, '我们经常会在半夜的时候');
  const current = cue(328, '一直到一两点钟去解决问题');
  assert.deepEqual(warning(current, previous,
    'Работали до одиннадцати-двенадцати часов ночи'), {
    cue_id: 328, expected: 'after_midnight_one_two', observed: 'eleven_twelve',
  });
  assert.equal(warning(current, previous,
    'Работали до одного-двух часов ночи'), null);
});

test('related after-midnight forms and explicit numeric clocks', () => {
  assert.equal(sourceClockClass(cue(1, '凌晨一点多我们还在工作')),
    'after_midnight_one_two');
  assert.equal(targetClockClass('Работали с 11:00 до 12:00 ночи'),
    'eleven_twelve');
  assert(warning(cue(1, '凌晨一点多我们还在工作'), null,
    'Работали с 11:00 до 12:00 ночи'));
  assert(warning(cue(12, '直到两点钟才结束'),
    cue(11, '半夜十二点后还在讨论'), 'Закончили в 11–12 часов'));
  assert.equal(warning(cue(1, '凌晨一点多我们还在工作'), null,
    'Работали с 01:00 до 02:00 ночи'), null);
});

test('evening and afternoon keep distinct source senses', () => {
  assert.equal(warning(cue(1, '晚上十一二点还在工作'), null,
    'Работали до одиннадцати-двенадцати ночи'), null);
  assert(warning(cue(1, '晚上十一二点还在工作'), null,
    'Работали до одного-двух часов ночи'));
  assert.equal(warning(cue(1, '明天下午一点到两点开会'), null,
    'Завтра встреча с часу до двух дня'), null);
  assert(warning(cue(1, '明天下午一点到两点开会'), null,
    'Завтра встреча с часу до двух ночи'));
});

test('ambiguous, distant, changed ID and overlap context abstain', () => {
  const source = cue(8, '一直到一两点钟才结束', 9000);
  assert.equal(warning(source, null, 'До одиннадцати-двенадцати'), null);
  assert.equal(warning(source, cue(7, '半夜讨论', 1000),
    'До одиннадцати-двенадцати'), null);
  assert.equal(warning(source, cue(6, '半夜讨论', 6000),
    'До одиннадцати-двенадцати'), null);
  assert.equal(warning(source, cue(7, '半夜讨论', 7000),
    'До одиннадцати-двенадцати'), null);
});

test('unsupported paraphrases and negated mentions abstain', () => {
  const previous = cue(1, '半夜的时候');
  const source = cue(2, '一直到一两点钟才结束');
  assert.equal(warning(source, previous, 'Мы работали очень поздно'), null);
  assert.equal(warning(source, previous,
    'Не до одиннадцати-двенадцати, а до двух часов ночи'), null);
  assert(warning(source, previous, 'Работали до 23:00–00:00'));
});
