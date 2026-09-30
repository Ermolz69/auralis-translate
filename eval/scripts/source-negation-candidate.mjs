export function hasChineseNegationCandidate(text) {
  return /不|没|无|非(?!常)/u.test(text);
}
