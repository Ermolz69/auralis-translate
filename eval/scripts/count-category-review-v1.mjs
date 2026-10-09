const SOURCE_NUMBER = '(?:\\d{1,2}|[一二三四五六七八九两]?十[一二三四五六七八九]?|[一二三四五六七八九两])';
const SOURCE_PAIR = new RegExp(`(${SOURCE_NUMBER})(?:道|种|款|份)?(点心|甜品)`, 'gu');
const CHINESE_UNIT = new Map(Object.entries({ 一: 1, 二: 2, 两: 2, 三: 3,
  四: 4, 五: 5, 六: 6, 七: 7, 八: 8, 九: 9 }));
const RUSSIAN_UNITS = new Map(Object.entries({ один: 1, одна: 1, одно: 1,
  два: 2, две: 2, три: 3, четыре: 4, пять: 5, шесть: 6,
  семь: 7, восемь: 8, девять: 9 }));
const RUSSIAN_TEENS = new Map(Object.entries({ десять: 10, одиннадцать: 11,
  двенадцать: 12, тринадцать: 13, четырнадцать: 14,
  пятнадцать: 15, шестнадцать: 16, семнадцать: 17,
  восемнадцать: 18, девятнадцать: 19 }));
const RUSSIAN_TENS = new Map(Object.entries({ двадцать: 20, тридцать: 30,
  сорок: 40, пятьдесят: 50, шестьдесят: 60, семьдесят: 70,
  восемьдесят: 80, девяносто: 90 }));
const FILLERS = new Set(['видов', 'разновидностей']);

function chineseNumber(value) {
  if (/^\d{1,2}$/u.test(value)) {
    const number = Number(value);
    return number >= 1 && number <= 99 ? number : null;
  }
  if (!value.includes('十')) return CHINESE_UNIT.get(value) ?? null;
  const [tens, units] = value.split('十');
  if (tens === undefined || units === undefined) return null;
  const high = tens ? CHINESE_UNIT.get(tens) : 1;
  const low = units ? CHINESE_UNIT.get(units) : 0;
  return high && low !== undefined ? high * 10 + low : null;
}

function sourcePairs(text) {
  const pairs = [];
  for (const match of text.matchAll(SOURCE_PAIR)) {
    const prefix = text.slice(Math.max(0, match.index - 5), match.index);
    if (/(?:没有|不是|并非|不足|不到)\s*$/u.test(prefix)) continue;
    const count = chineseNumber(match[1]);
    if (count !== null)
      pairs.push({ count, category: match[2] === '点心' ? 'dim_sum' : 'dessert' });
  }
  if (pairs.length !== 2 || pairs[0].category === pairs[1].category ||
    pairs[0].count === pairs[1].count) return null;
  return Object.fromEntries(pairs.map(pair => [pair.category, pair.count]));
}

function russianNumber(tokens, end) {
  const last = tokens[end]?.word;
  if (!last) return null;
  if (/^\d{1,2}$/u.test(last)) {
    const number = Number(last);
    return number >= 1 && number <= 99 ? { count: number, first: end } : null;
  }
  const unit = RUSSIAN_UNITS.get(last);
  if (unit !== undefined && RUSSIAN_TENS.has(tokens[end - 1]?.word))
    return { count: RUSSIAN_TENS.get(tokens[end - 1].word) + unit,
      first: end - 1 };
  const count = unit ?? RUSSIAN_TEENS.get(last) ?? RUSSIAN_TENS.get(last);
  return count === undefined ? null : { count, first: end };
}

function targetCategory(word) {
  if (/^десерт\p{L}*$/u.test(word)) return 'dessert';
  if (/^(?:закус\p{L}*|димсам\p{L}*)$/u.test(word)) return 'dim_sum';
  return null;
}

function targetPairs(text) {
  const tokens = Array.from(text.toLowerCase().matchAll(/[\p{L}\d]+/gu),
    match => ({ word: match[0], index: match.index }));
  const pairs = [];
  for (let i = 0; i < tokens.length; i += 1) {
    const category = targetCategory(tokens[i].word);
    if (!category) continue;
    let numberEnd = i - 1;
    if (FILLERS.has(tokens[numberEnd]?.word)) numberEnd -= 1;
    const number = russianNumber(tokens, numberEnd);
    if (!number) continue;
    if (['не', 'нет'].includes(tokens[number.first - 1]?.word)) continue;
    pairs.push({ count: number.count, category });
  }
  if (pairs.length !== 2 || pairs[0].category === pairs[1].category ||
    pairs[0].count === pairs[1].count) return null;
  return Object.fromEntries(pairs.map(pair => [pair.category, pair.count]));
}

export function countCategoryReview(sourceText, targetText) {
  const source = sourcePairs(sourceText);
  if (!source) return { source_relation: false, target_relation: false,
    warning: false };
  const target = targetPairs(targetText);
  if (!target) return { source_relation: true, target_relation: false,
    warning: false };
  const sameCounts = [source.dim_sum, source.dessert].sort((a, b) => a - b)
    .every((value, index) => value ===
      [target.dim_sum, target.dessert].sort((a, b) => a - b)[index]);
  return { source_relation: true, target_relation: true,
    warning: sameCounts && source.dim_sum === target.dessert &&
      source.dessert === target.dim_sum };
}
