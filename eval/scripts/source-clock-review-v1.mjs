const MAX_PREVIOUS_GAP_MS = 4000;

function adjacentPrevious(current, previous) {
  return previous && previous.id + 1 === current.id &&
    current.startMs >= previous.endMs &&
    current.startMs - previous.endMs <= MAX_PREVIOUS_GAP_MS;
}

export function sourceClockClass(current, previous = null) {
  const text = current.text;
  const context = adjacentPrevious(current, previous) ? previous.text : '';
  if (/晚上十一二点/u.test(text)) return 'late_evening_eleven_twelve';
  if (/下午一点(?:到|至)两点/u.test(text)) return 'afternoon_one_two';
  const afterMidnight = /半夜|凌晨/u.test(text) || /半夜|凌晨/u.test(context);
  if (!afterMidnight) return null;
  if (/(?:一两|一二|一到两|一至两)点(?:钟)?|一点多/u.test(text))
    return 'after_midnight_one_two';
  if (/两点(?:钟)?/u.test(text) && /(?:十二|12)点后/u.test(context))
    return 'after_midnight_one_two';
  return null;
}

const ELEVEN_TWELVE = /(?:одиннадцат\p{L}*|11)\s*(?:[-–—]|до|и|или)\s*(?:двенадцат\p{L}*|12)/u;
const ONE_TWO = /(?:один\p{L}*|одн\p{L}*|час\p{L}*|1)\s*(?:[-–—]|до|и|или)\s*(?:дв\p{L}*|2)/u;
const HOUR_11_12 = /(?:11:00|12:00|23:00|00:00)\s*(?:[-–—]|до)\s*(?:11:00|12:00|23:00|00:00)/u;
const HOUR_01_02 = /(?:01:00|02:00|1:00|2:00)\s*(?:[-–—]|до)\s*(?:01:00|02:00|1:00|2:00)/u;

function hasLocalNegation(text, match) {
  return /(?:^|[^\p{L}])не\s+(?:(?:до|в|около|с)\s+)?$/u.test(
    text.slice(Math.max(0, match.index - 15), match.index));
}

export function targetClockClass(text) {
  const lower = text.toLowerCase();
  for (const [pattern, kind] of [
    [HOUR_11_12, 'eleven_twelve'],
    [ELEVEN_TWELVE, 'eleven_twelve'],
    [HOUR_01_02, 'one_two'],
    [ONE_TWO, 'one_two'],
  ]) {
    const match = pattern.exec(lower);
    if (match) return hasLocalNegation(lower, match) ? null : kind;
  }
  return null;
}

export function sourceClockWarning(current, previous, translatedText) {
  const expected = sourceClockClass(current, previous);
  if (!expected) return null;
  const observed = targetClockClass(translatedText);
  if (!observed) return null;
  const incompatible = expected === 'after_midnight_one_two'
    ? observed === 'eleven_twelve'
    : observed === 'one_two' &&
      (expected === 'late_evening_eleven_twelve' ||
        /ноч\p{L}*|утр\p{L}*/u.test(translatedText.toLowerCase()));
  return incompatible ? { cue_id: current.id, expected, observed } : null;
}
