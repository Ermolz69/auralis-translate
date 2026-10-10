import assert from 'node:assert/strict';
import test from 'node:test';
import { chipCoreWarnings, explicitNegatedMulticore } from
  '../chip-core-warning-v1.mjs';

test('REG-077/079 warns on changed negated referent without editing text', () => {
  for (const source of ['设备里有三颗不同的芯片，不是在说多核。',
    '这里有两颗独立芯片，不是一个多核芯片。',
    '三颗芯片彼此独立，不是一颗多核芯片。']) {
    const wrong = 'Это не один многопроцессорный чип.';
    assert.equal(explicitNegatedMulticore(source), true);
    assert.deepEqual(chipCoreWarnings(source, wrong),
      ['negated_multicore_referent_review']);
    assert.equal(wrong, 'Это не один многопроцессорный чип.');
  }
});

test('correct core contrast, reverse polarity, processor mentions and quotations abstain', () => {
  const cases = [
    ['这里有两颗独立芯片，不是一个多核芯片。',
      'Два отдельных чипа, а не один многоядерный чип.'],
    ['这不是多处理器系统，而是一颗多核芯片。',
      'Это не многопроцессорная система, а один многоядерный чип.'],
    ['这里有两个处理器，不是一个多核芯片。',
      'Это не один многопроцессорный чип.'],
    ['我们讨论“不是一个多核芯片”这句话。',
      'Мы обсуждаем фразу «не многопроцессорный чип».'],
    ['这里有两颗独立芯片，不是一个多核芯片。',
      'Здесь есть два отдельных чипа.'],
  ];
  for (const [source, target] of cases)
    assert.deepEqual(chipCoreWarnings(source, target), [], source);
});

test('REG-078/080 grammar warning is separate from chip/processor counts', () => {
  assert.deepEqual(chipCoreWarnings('每个处理器只有一个核心。',
    'В каждом процессоре есть только один ядро.'),
  ['russian_one_core_agreement_review']);
  for (const target of ['У каждого из двух чипов по одному ядру.',
    'У процессора одно ядро.', 'Каждый процессор имеет два ядра.'])
    assert.deepEqual(chipCoreWarnings('两颗芯片各自只有一个核心。',
      target), []);
});
