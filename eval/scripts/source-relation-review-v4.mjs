import { sourceRelationsV3, sourceRelationWarningsV3 } from
  './source-relation-review-v3.mjs';

const HALL_STICK_COMPOUND = /霍尔(?:式)?(?:摇杆|操纵杆)/u;
const STICK_BEFORE_HALL = /(?:摇杆|操纵杆)([^，。；,.;!?？！]{0,10})霍尔/u;
const HALL = /(?:холл\p{L}*|hall(?:[- ]?effect)?)/iu;
const STICK = /(?:^|[^\p{L}])(?:стик(?:и|а|е|у|ом|ов|ам|ами|ах)?|джойстик(?:и|а|е|у|ом|ов|ам|ами|ах)?|рычаг\p{L}*\s+управления|аналогов\p{L}*\s+(?:рычаг|ручк)\p{L}*)(?=$|[^\p{L}])/iu;

function hasHallStickSource(text) {
  const compact = text.replace(/\s+/gu, '');
  if (HALL_STICK_COMPOUND.test(compact)) return true;
  const match = STICK_BEFORE_HALL.exec(compact);
  return Boolean(match && !/(?:扳机|肩键|按键)/u.test(match[1]));
}

export function sourceRelationsV4(current, previous, next) {
  const kinds = sourceRelationsV3(current, previous, next);
  if (hasHallStickSource(current.text)) kinds.push('hall_stick_referent');
  return kinds;
}

export function sourceRelationWarningsV4(current, previous, next,
  translatedText) {
  const warnings = sourceRelationWarningsV3(current, previous, next,
    translatedText);
  if (!hasHallStickSource(current.text)) return warnings;
  const missing = [];
  if (!HALL.test(translatedText)) missing.push('hall');
  if (!STICK.test(translatedText)) missing.push('stick');
  if (missing.length)
    warnings.push({ cue_id: current.id, kind: 'hall_stick_referent_missing',
      missing });
  return warnings;
}
