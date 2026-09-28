export function sceneRequestBudget(cueCount, caseCount) {
  if (!Number.isSafeInteger(cueCount) || cueCount < 1 || !Number.isSafeInteger(caseCount) || caseCount < 1) throw new Error('Invalid scene request budget dimensions');
  return 6 * cueCount + 6 * caseCount + 8;
}
