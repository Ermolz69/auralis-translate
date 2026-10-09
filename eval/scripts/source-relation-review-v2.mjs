import { sourceRelations, sourceRelationWarnings } from
  './source-relation-review-v1.mjs';

const BARE_PRESENT_PRODUCTS =
  /^\s*есть\s+(?:(?:лучш\p{L}*|хорош\p{L}*|более\s+качественн\p{L}*)\s+)продукт\p{L}*/iu;

export function sourceRelationWarningsV2(current, previous, next,
  translatedText) {
  const warnings = sourceRelationWarnings(current, previous, next,
    translatedText);
  if (warnings.some(row => row.kind === 'future_product_expectation'))
    return warnings;
  if (sourceRelations(current, previous, next)
    .includes('future_product_expectation') &&
    BARE_PRESENT_PRODUCTS.test(translatedText))
    warnings.push({ cue_id: current.id,
      kind: 'future_product_expectation' });
  return warnings;
}
