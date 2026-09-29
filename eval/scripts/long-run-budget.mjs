import assert from 'node:assert/strict';

export function translationWaitMs(totalBudgetMs, elapsedMs, defaultProcessTimeoutMs) {
  assert(Number.isInteger(defaultProcessTimeoutMs) && defaultProcessTimeoutMs > 0);
  assert(Number.isInteger(elapsedMs) && elapsedMs >= 0);
  if (totalBudgetMs === Infinity) return defaultProcessTimeoutMs;
  assert(Number.isInteger(totalBudgetMs) && totalBudgetMs > 0);
  const remaining = totalBudgetMs - elapsedMs;
  if (remaining <= 0) throw new Error(`Long-file experiment exceeded its ${totalBudgetMs} ms wall budget`);
  return remaining;
}
