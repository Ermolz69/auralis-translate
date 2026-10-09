import { createHash } from 'node:crypto';

const ordinal = /第[零〇一二三四五六七八九十百千万两]+(?:个|颗|块|款|种|次)/gu;
const arabicChineseUnit = /(?<![A-Za-z0-9])\d+(?:[.,]\d+)?(?:%|％|年|个月|月|天|日|小时|分钟|秒|点|人|台|部|颗|块|款|种|次|亿|万|元|米|纳米)/u;
const arabicLatinUnit = /(?<![A-Za-z0-9])\d+(?:[.,]\d+)?\s*(?:nm|GB|MB)(?![A-Za-z])/iu;
const chineseUnit = /[零〇一二三四五六七八九十百千万两]+(?:年|个月|月|天|日|小时|分钟|秒|人|台|部|亿|万|元|米|纳米|%|％)/u;
const chineseCount = /[二三四五六七八九十百千万两]+(?:个|颗|块|款|种|次)/u;
const chineseClock = /(?:[零〇二三四五六七八九十百千万两]+|一两|十一|十二)点(?:钟|半)?|一点钟|一点半|(?:凌晨|早上|上午|中午|下午|晚上|夜里|半夜)\s*一点/u;
const arabicClock = /(?<!\d)\d{1,2}:\d{2}(?!\d)/u;

export const sourceQuantityFeatureV2Identity = createHash('sha256')
  .update('source-quantity-feature-v2|strip-ordinals|clock-context|no-cross-word-unit')
  .digest('hex');

export function hasExplicitSourceQuantityV2(text) {
  const source = text.replace(ordinal, '');
  return arabicChineseUnit.test(source) || arabicLatinUnit.test(source) ||
    chineseUnit.test(source) || chineseCount.test(source) ||
    chineseClock.test(source) || arabicClock.test(source);
}
