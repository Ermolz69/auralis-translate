import assert from 'node:assert/strict';
import test from 'node:test';
import { sourceRelationWarnings } from '../source-relation-review-v1.mjs';
import { sourceRelationWarningsV2 } from '../source-relation-review-v2.mjs';

const cue = (id, text, startMs = id * 3000) =>
  ({ id, text, startMs, endMs: startMs + 3000 });
const previous = cue(465, '期待你们接下来的进一步的合作');
const current = cue(466, '有更好的产品能够带给大家');
const warn = (now, prior, target) =>
  sourceRelationWarningsV2(now, prior, null, target);

test('REG-071 minimal shorthand false negative is warned by v2', () => {
  const target = 'Есть лучшие продукты, которые могут принести пользу всем';
  assert.deepEqual(sourceRelationWarnings(current, previous, null,
    target), []);
  assert.deepEqual(warn(current, previous, target),
    [{ cue_id: 466, kind: 'future_product_expectation' }]);
});

test('related bare availability forms and existing owner form', () => {
  assert.equal(warn(current, previous,
    'Есть хорошие продукты для всех').length, 1);
  assert.equal(warn(current, previous,
    'Есть более качественные продукты для всех').length, 1);
  assert.equal(warn(current, previous,
    'У нас есть лучшие продукты').length, 1);
});

test('hope, negation, present source and broken adjacency abstain', () => {
  assert.deepEqual(warn(current, previous,
    'Есть надежда, что появятся лучшие продукты'), []);
  assert.deepEqual(warn(current, previous,
    'Нет, лучших продуктов пока нет'), []);
  assert.deepEqual(warn(cue(2, '更好的产品已经上市了'),
    cue(1, '我们已经准备好了', 0),
    'Есть лучшие продукты в продаже'), []);
  assert.deepEqual(warn(current, cue(464, '期待合作'),
    'Есть лучшие продукты'), []);
  assert.deepEqual(warn(current, cue(465, '期待合作', 1000),
    'Есть лучшие продукты'), []);
});

test('v1 planning and team warnings remain available', () => {
  assert.deepEqual(sourceRelationWarningsV2(cue(276,
    '提前36个月之久的'), null,
  cue(277, '联合的规划定义'),
  'за 36 месяцев до самого раннего этапа'),
  [{ cue_id: 276, kind: 'planning_in_advance' }]);
  assert.deepEqual(sourceRelationWarningsV2(cue(280,
    '两家公司共同投入了'), null,
  cue(281, '一千人的开发团队'), 'вложили средства'),
  [{ cue_id: 280, kind: 'people_team_referent' }]);
});
