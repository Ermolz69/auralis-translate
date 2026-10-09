import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { countCategoryReview } from '../count-category-review-v1.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)),
  '../../..');
const frozenSha256 =
  '3266febf06462eddbd9b605d18c2cd8675f4dd688f473a11f3cad8e391851ce4';

test('all 18 precommitted REG-040 controls retain their warning decisions',
  async () => {
    const bytes = await fs.readFile(path.join(root,
      'eval/corpora/reg040-count-category-controls-v1.json'));
    assert.equal(createHash('sha256').update(bytes).digest('hex'), frozenSha256);
    const cases = JSON.parse(bytes).cases;
    assert.equal(cases.length, 18);
    for (const item of cases)
      assert.equal(countCategoryReview(item.source, item.target).warning,
        item.warn, item.id);
  });

test('unsupported or incomplete relations abstain rather than certify meaning',
  () => {
    assert.deepEqual(countCategoryReview('三十道点心',
      'Тридцать десертов и восемь закусок'),
    { source_relation: false, target_relation: false, warning: false });
    assert.deepEqual(countCategoryReview('有三十道点心，八道甜品',
      'Есть тридцать блюд из теста и восемь десертов'),
    { source_relation: true, target_relation: false, warning: false });
    assert.equal(countCategoryReview('有三十道点心，八道甜品',
      'Есть сорок десертов и восемь закусок').warning, false);
    assert.equal(countCategoryReview('有一百道点心，八道甜品',
      'Есть восемь десертов и сто закусок').source_relation, false);
  });
