import assert from 'node:assert/strict';
import test from 'node:test';
import { sourceRelationsV3, sourceRelationWarningsV3 } from
  '../source-relation-review-v3.mjs';

const cue = (id, text, startMs = id * 1000) => ({ id, text,
  startMs, endMs: startMs + 900 });

const cases = [
  { kind: 'hall_stick_denial',
    positive: '这个机器的摇杆并没有用霍尔摇杆',
    sourceNegative: '这两个摇杆只有底下的RGB圆环',
    contradiction: 'Стики используют датчики Холла.',
    accurate: 'Стики не используют датчики Холла.' },
  { kind: 'bios_disable_absence',
    positive: '没有在BIOS里提供关核或者关超线程的选项',
    sourceNegative: '如果只开4个核就好了',
    contradiction: 'В BIOS можно отключить ядра.',
    accurate: 'В BIOS нельзя отключить ядра.' },
  { kind: 'price_unannounced_at_review',
    positive: '我现在评测的这个时间点 价格还没公布',
    sourceNegative: '值不值得买还是取决于价格',
    contradiction: 'Цена уже объявлена.',
    accurate: 'Цена ещё не объявлена.' },
];

for (const item of cases) {
  test(`${item.kind}: affirmative contradiction warns, negation abstains`, () => {
    const source = cue(2, item.positive);
    assert(sourceRelationsV3(source, null, null).includes(item.kind));
    assert.deepEqual(sourceRelationWarningsV3(source, null, null,
      item.contradiction), [{ cue_id: 2, kind: item.kind }]);
    assert.deepEqual(sourceRelationWarningsV3(source, null, null,
      item.accurate), []);
  });

  test(`${item.kind}: source-negative control does not inherit a warning`, () => {
    const source = cue(2, item.sourceNegative);
    assert(!sourceRelationsV3(source, null, null).includes(item.kind));
    assert.deepEqual(sourceRelationWarningsV3(source, null, null,
      item.contradiction), []);
  });
}

test('opposite source assertions abstain despite affirmative Russian claims', () => {
  const sources = [
    cue(1, '这个机器使用霍尔摇杆'),
    cue(2, 'BIOS里提供了关核或者关超线程的选项'),
    cue(3, '价格已经公布'),
  ];
  const targets = [
    'Стики используют датчики Холла.',
    'В BIOS можно отключить ядра.',
    'Цена уже объявлена.',
  ];
  assert(sources.every((source, index) =>
    sourceRelationWarningsV3(source, null, null, targets[index]).length === 0));
});

test('price unknown as one Russian word does not imply an announced price', () => {
  const source = cue(253, 'На момент обзора цена ещё не объявлена 价格还没公布');
  assert.deepEqual(sourceRelationWarningsV3(source, null, null,
    'Цена неизвестна.'), []);
});

test('previous Vivo relations remain available at source boundaries', () => {
  const previous = cue(1, '我们期待更好的合作', 0);
  const current = cue(2, '有更好的产品能够带给大家', 1000);
  assert(sourceRelationsV3(current, previous, null)
    .includes('future_product_expectation'));
  assert.deepEqual(sourceRelationWarningsV3(current, previous, null,
    'Есть лучшие продукты для всех'),
  [{ cue_id: 2, kind: 'future_product_expectation' }]);
  assert(!sourceRelationsV3(current, cue(8, previous.text, 0), null)
    .includes('future_product_expectation'));
});
