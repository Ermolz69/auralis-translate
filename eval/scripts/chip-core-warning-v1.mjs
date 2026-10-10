const NEGATED_MULTICORE = /(?:不是在说多核|不是一[个颗]多核芯片)/u;
const SOURCE_PROCESSOR_MENTION = /(?:多处理器|[一二两三四五六七八九十0-9]+个处理器|双处理器|处理器数量)/u;
const QUOTED_NEGATION = /[“「"'](?:不是在说多核|不是一[个颗]多核芯片)[”」"']/u;
const TARGET_MULTIPROCESSOR = /(?<![\p{L}\p{N}])многопроцессор\p{L}*(?![\p{L}\p{N}])/iu;
const BAD_ONE_CORE_AGREEMENT = /(?<![\p{L}\p{N}])один\s+ядро(?![\p{L}\p{N}])/iu;

export function explicitNegatedMulticore(sourceText) {
  const source = sourceText.replace(/\s+/gu, '');
  return NEGATED_MULTICORE.test(source) &&
    !SOURCE_PROCESSOR_MENTION.test(source) &&
    !QUOTED_NEGATION.test(source);
}

export function chipCoreWarnings(sourceText, translatedText) {
  const warnings = [];
  if (explicitNegatedMulticore(sourceText) &&
    TARGET_MULTIPROCESSOR.test(translatedText))
    warnings.push('negated_multicore_referent_review');
  if (BAD_ONE_CORE_AGREEMENT.test(translatedText))
    warnings.push('russian_one_core_agreement_review');
  return warnings;
}
