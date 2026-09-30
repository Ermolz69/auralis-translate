import assert from 'node:assert/strict';
import test from 'node:test';
import { hasChineseNegationCandidate } from '../source-negation-candidate.mjs';

test('common negative expressions remain source-only candidates', () => {
  for (const text of ['并不是从18年就开始的', '没有预算', '无须等待', '非官方版本'])
    assert(hasChineseNegationCandidate(text));
});

test('intensifier 非常 is not a negation candidate by itself', () => {
  for (const text of ['非常好', '其实都做得非常好', '非常困难'])
    assert.equal(hasChineseNegationCandidate(text), false);
  assert(hasChineseNegationCandidate('非常不好'));
});
