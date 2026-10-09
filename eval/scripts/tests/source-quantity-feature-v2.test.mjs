import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { hasExplicitSourceQuantityV2 } from '../source-quantity-feature-v2.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const pack = JSON.parse(fs.readFileSync(path.join(root,
  'eval/regressions/reg-074-source-quantity-false-positives-v1.json')));

test('REG-074 related and counterexamples distinguish facts from idioms', () => {
  assert.equal(pack.related_controls.length, 5);
  assert.equal(pack.negative_controls.length, 5);
  for (const control of [...pack.related_controls, ...pack.negative_controls])
    assert.equal(hasExplicitSourceQuantityV2(control.source_line),
      control.expected_match, control.id);
});

test('v2 retains relevant clocks and quantities without reading a draft', () => {
  for (const value of ['凌晨一两点钟', '十一点以后', '两点之前',
    '今天晚上九点', '4纳米', '36个月', '25%', '16 GB', '三款产品'])
    assert.equal(hasExplicitSourceQuantityV2(value), true, value);
  for (const value of ['这一点', '快了一点', '第十二个问题',
    '天玑9300 天玑9400', '一个想法', 'vivo X200'])
    assert.equal(hasExplicitSourceQuantityV2(value), false, value);
});
