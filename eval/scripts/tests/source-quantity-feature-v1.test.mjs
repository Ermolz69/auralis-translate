import assert from 'node:assert/strict';
import test from 'node:test';
import { hasExplicitSourceQuantity } from '../source-quantity-feature-v1.mjs';

test('recognizes explicit quantities and time without the target draft', () => {
  for (const text of [
    '36个月的开发时间', '成本增加了25%', '凌晨一两点才结束',
    '两三年后推出', '3到4年才能量产', '这颗芯片用了4纳米制程',
    '三款不同产品', '两颗芯片', '我们在11:30结束', '不是三个人',
    '花了五亿元', '容量达到16GB',
  ]) assert.equal(hasExplicitSourceQuantity(text), true, text);
});

test('does not classify generic one or product labels as measured quantities', () => {
  for (const text of [
    '一个全新的想法', '一种很好的方法', '其中的一个原因',
    'X200是新产品', 'vivo X200 Pro', '全大核架构',
    '没有人回答', '我认为有一个问题',
  ]) assert.equal(hasExplicitSourceQuantity(text), false, text);
});
