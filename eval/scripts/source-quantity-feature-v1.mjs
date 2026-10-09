import { createHash } from 'node:crypto';

// A bare 一个 is often an indefinite article, so require an explicit unit
// or a non-one count classifier before treating a cue as numeric risk.
const arabicUnit = /(?<![A-Za-z0-9])\d+(?:[.,]\d+)?\s*(?:%|％|年|个月|月|天|日|小时|分钟|秒|点|人|台|部|颗|块|款|种|次|亿|万|元|米|纳米|nm|GB|MB)/iu;
const chineseUnit = /[零〇一二三四五六七八九十百千万两]+(?:年|个月|月|天|日|小时|分钟|秒|点|人|台|部|亿|万|元|米|纳米|%|％)/u;
const chineseCount = /[二三四五六七八九十百千万两]+(?:个|颗|块|款|种|次)/u;
const clock = /(?<!\d)\d{1,2}:\d{2}(?!\d)/u;

export const sourceQuantityFeatureVersion = createHash('sha256')
  .update('source-quantity-feature-v1|explicit-unit-or-count|no-bare-one')
  .digest('hex');

export function hasExplicitSourceQuantity(text) {
  return arabicUnit.test(text) || chineseUnit.test(text) ||
    chineseCount.test(text) || clock.test(text);
}
