const MAX_NEIGHBOR_GAP_MS = 4000;

function adjacent(current, neighbor, direction) {
  if (!neighbor || neighbor.id !== current.id + direction) return false;
  const gap = direction < 0
    ? current.startMs - neighbor.endMs
    : neighbor.startMs - current.endMs;
  return gap >= 0 && gap <= MAX_NEIGHBOR_GAP_MS;
}

function sourceRelations(current, previous, next) {
  const prior = adjacent(current, previous, -1) ? previous.text : '';
  const following = adjacent(current, next, 1) ? next.text : '';
  const joinedForward = `${current.text}${following}`;
  const kinds = [];

  if (/提前(?:三十六|36)个月(?:之久)?/u.test(current.text) &&
    /联合(?:的)?规划(?:定义)?/u.test(joinedForward) &&
    !/项目启动(?:三十六|36)个月之后/u.test(current.text))
    kinds.push('planning_in_advance');

  if (/(?:合力投了|共同投入了|联合投入了)/u.test(current.text) &&
    /(?:超过)?一千(?:多)?人的.{0,12}(?:开发)?团队/u.test(following) &&
    !/(?:元|资金|经费|预算)/u.test(joinedForward))
    kinds.push('people_team_referent');

  if (/(?:有)?更好的产品(?:能够|能)带给/u.test(current.text) &&
    /期待|希望/u.test(prior) &&
    !/已经上市|现货/u.test(current.text))
    kinds.push('future_product_expectation');
  return kinds;
}

function locallyNegated(text, match) {
  return /(?:^|[^\p{L}])не\s+$/u.test(
    text.slice(Math.max(0, match.index - 8), match.index));
}

const CONTRADICTIONS = {
  planning_in_advance: /(?:до\s+(?:самого\s+)?ранн\p{L}*\s+(?:этапа|стадии)|после\s+(?:36|тридцати\s+шести)\s+месяцев)/iu,
  people_team_referent: /(?:вложил\p{L}*|инвестировал\p{L}*)\s+(?:(?:денежн\p{L}*|финансов\p{L}*)\s+)?(?:средств\p{L}*|деньг\p{L}*|финанс\p{L}*)/iu,
  future_product_expectation: /(?:у\s+нас\s+(?:уже\s+)?есть\s+(?:(?:лучш\p{L}*|хорош\p{L}*)\s+)?продукт\p{L}*|продукт\p{L}*\s+у\s+нас\s+(?:уже\s+)?есть|продукт\p{L}*\s+уже\s+(?:доступн\p{L}*|в\s+продаже))/iu,
};

export function sourceRelationWarnings(current, previous, next, translatedText) {
  const warnings = [];
  for (const kind of sourceRelations(current, previous, next)) {
    const match = CONTRADICTIONS[kind].exec(translatedText);
    if (match && !locallyNegated(translatedText, match))
      warnings.push({ cue_id: current.id, kind });
  }
  return warnings;
}

export { sourceRelations };
