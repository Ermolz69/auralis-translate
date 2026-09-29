import assert from 'node:assert/strict';
import test from 'node:test';
import { deriveChineseSrt } from '../mandarin-triline-srt.mjs';

const cue = (label, start, end, chinese) =>
  `${label}\n00:00:${start},000 --> 00:00:${end},000\npin yin\n${chinese}\nEnglish text`;

test('extracts only the Chinese line and sorts a unique late block by time', () => {
  const source = [cue(1, '01', '02', '开头'), cue(2, '05', '06', '结尾'),
    cue(3, '03', '04', '中间')].join('\n\n') + '\n';
  const derived = deriveChineseSrt(source);
  assert.deepEqual(derived.mapping.map(item => item.original_label), [1, 3, 2]);
  assert.deepEqual(derived.mapping.map(item => item.derived_label), [1, 2, 3]);
  assert(!derived.srt.includes('pin yin'));
  assert(!derived.srt.includes('English text'));
  assert(derived.srt.includes('00:00:03,000 --> 00:00:04,000\n中间'));
});

test('rejects a cue whose Chinese line is missing or moved', () => {
  assert.throws(() => deriveChineseSrt(cue(1, '01', '02', 'Latin only')), /Chinese is not exactly/);
  assert.throws(() => deriveChineseSrt(cue(1, '01', '02', '开头').replace('pin yin', '汉字')),
    /Chinese is not exactly/);
});

test('rejects duplicate labels and out-of-media timing', () => {
  assert.throws(() => deriveChineseSrt(`${cue(1, '01', '02', '开头')}\n\n${cue(1, '03', '04', '结尾')}`),
    /repeated or unsafe label/);
  assert.throws(() => deriveChineseSrt('1\n00:13:47,000 --> 00:13:48,000\npin yin\n结尾\nEnglish text'),
    /timing outside source media/);
});
