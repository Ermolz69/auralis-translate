import assert from 'node:assert/strict';
import test from 'node:test';
import { ambiguousRussianDigitGrouping,
  sourceAliasMissing } from '../source-surface-triage.mjs';

const alias = { sourceName: '愛思唯爾',
  acceptedForms: ['Elsevier', 'Эльзевир'] };

test('REG-047 reproduces the omitted company in Paywall cue 861', () => {
  assert.equal(sourceAliasMissing({ ...alias,
    source: '我相信愛思唯爾這家公司人才濟濟\n一定有人知道新發現能造福大眾',
    translation: 'Но по поводу того, как компании можно заработать больше, не было хороших идей\nНо нет хороших идей о том, как новые открытия сделают компанию прибыльнее',
  }), true);
});

test('REG-047 related occurrence after a scene boundary is checked', () => {
  assert.equal(sourceAliasMissing({ ...alias,
    source: '愛思唯爾又提出新服務', translation: 'Они представили новую услугу',
  }), true);
});

test('REG-047 accepted alias forms and unrelated neighbor are negative controls', () => {
  assert.equal(sourceAliasMissing({ ...alias,
    source: '愛思唯爾人才濟濟', translation: 'В Elsevier много талантливых людей',
  }), false);
  assert.equal(sourceAliasMissing({ ...alias,
    source: '愛思唯爾人才濟濟', translation: 'В Эльзевире много талантливых людей',
  }), false);
  assert.equal(sourceAliasMissing({ ...alias,
    source: '這家公司人才濟濟', translation: 'В компании много талантливых людей',
  }), false);
});

test('REG-048 reproduces ambiguous comma grouping in both model outputs', () => {
  assert.equal(ambiguousRussianDigitGrouping(
    'Организация тратит 10,702 доллара в год'), true);
});

test('REG-048 related and negative numeric controls', () => {
  assert.equal(ambiguousRussianDigitGrouping('Компания заплатила 1,250,000 долларов'), true);
  assert.equal(ambiguousRussianDigitGrouping('Цена — 10 702 доллара'), false);
  assert.equal(ambiguousRussianDigitGrouping('Объём — 2,52 миллиарда долларов'), false);
  assert.equal(ambiguousRussianDigitGrouping('Дата — 2026 год'), false);
});
