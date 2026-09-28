import { CASE_SEEDS, UNRELATED_CONTEXTS } from '../corpora/context-case-seeds-v1.mjs';

function context(value) {
  const [before, after] = value.split('|');
  return { before_zh: [before], after_zh: after ? [after] : [] };
}

export function buildContextCorpus() {
  return {
    schema_version: 1,
    corpus_id: 'authored-zh-ru-context-contrasts-v1',
    provenance: 'ai_authored_unreviewed',
    split: 'development',
    cases: CASE_SEEDS.map((row, index) => {
      const [id, category, target_zh, isolated_ru, isolated_fact, relevant_context, relevant_ru,
        relevant_fact, counter_context, counter_ru, counter_fact, uncertain_when_isolated] = row;
      return {
        id, category, target_zh, uncertain_when_isolated,
        isolated: { reference_ru: isolated_ru, expected_facts: [isolated_fact], prohibited_facts: ['Do not invent a referent, unit, motive or fact absent from this isolated target'] },
        relevant: { ...context(relevant_context), reference_ru: relevant_ru, expected_facts: [relevant_fact], prohibited_facts: [counter_fact] },
        unrelated: { before_zh: [UNRELATED_CONTEXTS[index % UNRELATED_CONTEXTS.length]], after_zh: [] },
        counterfactual: { ...context(counter_context), reference_ru: counter_ru, expected_facts: [counter_fact], prohibited_facts: [relevant_fact] }
      };
    })
  };
}

export function renderContextCorpus() {
  return `${JSON.stringify(buildContextCorpus(), null, 2)}\n`;
}
