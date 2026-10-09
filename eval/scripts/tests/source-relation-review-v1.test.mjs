import assert from 'node:assert/strict';
import test from 'node:test';
import { sourceRelations, sourceRelationWarnings } from
  '../source-relation-review-v1.mjs';

const cue = (id, text, startMs = id * 3000) =>
  ({ id, text, startMs, endMs: startMs + 3000 });
const warned = (current, previous, next, target) =>
  sourceRelationWarnings(current, previous, next, target).map(row => row.kind);

test('REG-066 36-month relation and related wording', () => {
  const current = cue(276, '其实涵盖了从最早期提前36个月之久的');
  const next = cue(277, '联合的规划定义');
  assert.deepEqual(warned(current, null, next,
    'начинающийся за 36 месяцев до самого раннего этапа'),
  ['planning_in_advance']);
  assert.deepEqual(warned(cue(1, '我们提前三十六个月'), null,
    cue(2, '联合规划定义', 6000), 'после тридцати шести месяцев'),
  ['planning_in_advance']);
  assert.deepEqual(warned(current, null, next,
    'совместное планирование началось за 36 месяцев'), []);
  assert.deepEqual(sourceRelations(cue(1,
    '项目启动三十六个月之后才提前36个月'), null,
    cue(2, '联合规划定义', 6000)), []);
});

test('REG-066 people-team referent and explicit-money contrast', () => {
  const current = cue(280, 'vivo在这方面我们跟MediaTek合力投了');
  const next = cue(281, '超过一千多人的精英的开发团队');
  assert.deepEqual(warned(current, null, next,
    'vivo совместно с MediaTek вложили средства'),
  ['people_team_referent']);
  assert.deepEqual(warned(cue(1, '两家公司共同投入了'), null,
    cue(2, '一千人的开发团队', 6000), 'инвестировали деньги'),
  ['people_team_referent']);
  assert.deepEqual(warned(current, null, next,
    'vivo и MediaTek объединили команду из тысячи разработчиков'), []);
  assert.deepEqual(warned(cue(1, '两家公司投入了一千万元'), null,
    cue(2, '一千人的开发团队', 3000), 'вложили деньги'), []);
  assert.deepEqual(warned(cue(1, '合力投了一千万元'), null,
    cue(2, '一千人的开发团队', 3000), 'вложили деньги'), []);
});

test('REG-066 future product expectation and present-availability contrast', () => {
  const previous = cue(465, '期待你们接下来的进一步的合作');
  const current = cue(466, '有更好的产品能够带给大家');
  assert.deepEqual(warned(current, previous, null,
    'У нас есть лучшие продукты, которые смогут принести пользу всем'),
  ['future_product_expectation']);
  assert.deepEqual(warned(cue(2, '更好的产品能带给大家'),
    cue(1, '希望今后合作', 0), null,
    'Лучшие продукты у нас уже есть'),
  ['future_product_expectation']);
  assert.deepEqual(warned(current, previous, null,
    'Надеюсь, дальнейшая работа принесёт всем лучшие продукты'), []);
  assert.deepEqual(warned(cue(2, '更好的产品已经上市'),
    cue(1, '期待今后合作', 0), null,
    'У нас есть лучшие продукты'), []);
});

test('source boundaries, missing context and negation abstain', () => {
  const current = cue(8, '有更好的产品能够带给大家', 9000);
  for (const prior of [null, cue(6, '期待合作', 6000),
    cue(7, '期待合作', 1000), cue(7, '期待合作', 7000)])
    assert.deepEqual(warned(current, prior, null,
      'У нас есть лучшие продукты'), []);
  const team = cue(3, '我们合力投了', 9000);
  assert.deepEqual(warned(team, null,
    cue(5, '一千人的开发团队', 12000), 'вложили средства'), []);
  assert.deepEqual(warned(team, null,
    cue(4, '一千人的开发团队', 10000), 'вложили средства'), []);
  assert.deepEqual(warned(team, null,
    cue(4, '一千人的开发团队', 12000),
    'не вложили средства, а создали команду'), []);
});
