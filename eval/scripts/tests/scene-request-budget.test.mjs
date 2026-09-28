import assert from 'node:assert/strict';
import test from 'node:test';
import { sceneRequestBudget } from '../scene-request-budget.mjs';

test('counts chat, template and tokenization per arm plus three preparation probes per file', () => {
  assert.equal(sceneRequestBudget(9, 3), 80);
  assert.equal(sceneRequestBudget(3, 1), 32);
});

test('refuses incomplete dimensions', () => {
  assert.throws(() => sceneRequestBudget(0, 3));
  assert.throws(() => sceneRequestBudget(9, 0));
});
