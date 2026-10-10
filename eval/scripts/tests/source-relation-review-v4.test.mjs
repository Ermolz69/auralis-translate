import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { sourceRelationsV4, sourceRelationWarningsV4 } from
  '../source-relation-review-v4.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)),
  '../../..');
const pack = JSON.parse(fs.readFileSync(path.join(root,
  'eval/regressions/reg-083-asus-hall-stick-substitution-v1.json')));
const cue = (id, text) => ({ id, text, startMs: id * 1000,
  endMs: id * 1000 + 900 });
const warning = (source, target) => sourceRelationWarningsV4(
  cue(24, source), null, null, target).find(
  row => row.kind === 'hall_stick_referent_missing');

test('the REG-083 source and target relation is retained as a warning', () => {
  const source = '这个机器的摇杆并没有用霍尔摇杆';
  assert(sourceRelationsV4(cue(24, source), null, null)
    .includes('hall_stick_referent'));
  assert.deepEqual(warning(source,
    'У этой консоли рычаг управления не является гальванометрическим'),
  { cue_id: 24, kind: 'hall_stick_referent_missing', missing: ['hall'] });
  assert.equal(warning(source, 'Эти стики не используют датчики Холла.'),
    undefined);
});

for (const item of pack.related_controls) {
  test(`${item.id}: related Hall-stick source keeps both referents`, () => {
    assert(sourceRelationsV4(cue(24, item.source_line), null, null)
      .includes('hall_stick_referent'));
    assert.deepEqual(warning(item.source_line,
      'Джойстики не используют гальванометрический рычаг.'),
    { cue_id: 24, kind: 'hall_stick_referent_missing', missing: ['hall'] });
    assert.equal(warning(item.source_line,
      'Стики и триггеры различаются по датчикам Холла.'), undefined);
  });
}

for (const item of pack.negative_controls) {
  test(`${item.id}: source scope is respected`, () => {
    const recognized = sourceRelationsV4(cue(24, item.source_line),
      null, null).includes('hall_stick_referent');
    assert.equal(recognized, item.id === 'hall_sticks_present');
    if (!recognized) assert.equal(warning(item.source_line,
      'Гальванометрический рычаг.'), undefined);
  });
}

test('missing stick and missing Hall remain distinct review reasons', () => {
  const source = '左右两个摇杆都不是霍尔式的。';
  assert.deepEqual(warning(source, 'Датчиков Холла нет.'),
    { cue_id: 24, kind: 'hall_stick_referent_missing',
      missing: ['stick'] });
  assert.deepEqual(warning(source, 'Это обычные джойстики.'),
    { cue_id: 24, kind: 'hall_stick_referent_missing',
      missing: ['hall'] });
  assert.deepEqual(warning(source, 'Таких датчиков здесь нет.'),
    { cue_id: 24, kind: 'hall_stick_referent_missing',
      missing: ['hall', 'stick'] });
});

test('a trigger separated from the stick does not create a relation', () => {
  const source = '摇杆采用普通结构，霍尔传感器用于扳机。';
  assert(!sourceRelationsV4(cue(24, source), null, null)
    .includes('hall_stick_referent'));
  assert.equal(warning(source, 'Обычные стики и датчики Холла в триггерах.'),
    undefined);
});

test('the adjacent RGB cue cannot inherit the Hall relation', () => {
  const previous = cue(23, '这个机器的摇杆并没有用霍尔摇杆');
  const current = cue(24, '两个摇杆只有底下的RGB圆环');
  assert(!sourceRelationsV4(current, previous, null)
    .includes('hall_stick_referent'));
  assert(!sourceRelationWarningsV4(current, previous, null,
    'Джойстики имеют RGB-кольцо.').some(row =>
    row.kind === 'hall_stick_referent_missing'));
});
