export const CATEGORIES = ['pronoun', 'split_negation', 'name_term', 'money_fact', 'idiom_irony'];
export const SCENARIOS = ['isolated', 'relevant', 'unrelated', 'counterfactual'];

function fail(path, message) { throw new Error(`${path}: ${message}`); }
function object(value, path) { if (!value || typeof value !== 'object' || Array.isArray(value)) fail(path, 'must be an object'); return value; }
function keys(value, required, path) {
  object(value, path);
  if (Object.keys(value).some(key => !required.includes(key)) || required.some(key => !Object.hasOwn(value, key))) fail(path, 'has missing or unknown fields');
}
function text(value, path) { if (typeof value !== 'string' || !value.trim()) fail(path, 'must be nonempty text'); }
function sourceText(value, path) { text(value, path); if (/\p{Script=Cyrillic}|[\r\n\x00-\x1f]/u.test(value)) fail(path, 'must be a single source-language line without Russian text'); }
function reference(value, path) { text(value, path); if (!/\p{Script=Cyrillic}/u.test(value)) fail(path, 'must contain a Russian-language proposal'); }
function facts(value, path) { if (!Array.isArray(value) || !value.length) fail(path, 'must list at least one fact'); for (const fact of value) text(fact, path); }
function controls(value, path) {
  keys(value, ['before_zh', 'after_zh'], path);
  if (!Array.isArray(value.before_zh) || !Array.isArray(value.after_zh) || !value.before_zh.length && !value.after_zh.length) fail(path, 'must include context');
  for (const [index, line] of value.before_zh.entries()) sourceText(line, `${path}.before_zh[${index}]`);
  for (const [index, line] of value.after_zh.entries()) sourceText(line, `${path}.after_zh[${index}]`);
}
function scoredScenario(value, path) {
  keys(value, ['before_zh', 'after_zh', 'reference_ru', 'expected_facts', 'prohibited_facts'], path);
  controls({ before_zh: value.before_zh, after_zh: value.after_zh }, path);
  reference(value.reference_ru, `${path}.reference_ru`);
  facts(value.expected_facts, `${path}.expected_facts`);
  facts(value.prohibited_facts, `${path}.prohibited_facts`);
}

export function validateContextCases(corpus) {
  keys(corpus, ['schema_version', 'corpus_id', 'provenance', 'split', 'cases'], 'corpus');
  if (corpus.schema_version !== 1 || corpus.provenance !== 'ai_authored_unreviewed' || corpus.split !== 'development') fail('corpus', 'must be the authored development schema');
  text(corpus.corpus_id, 'corpus.corpus_id');
  if (!Array.isArray(corpus.cases) || corpus.cases.length !== 60) fail('corpus.cases', 'must contain exactly 60 target cases');
  const ids = new Set();
  const targets = new Set();
  const counts = Object.fromEntries(CATEGORIES.map(category => [category, 0]));
  for (const [index, item] of corpus.cases.entries()) {
    const at = `corpus.cases[${index}]`;
    keys(item, ['id', 'category', 'target_zh', 'uncertain_when_isolated', 'isolated', 'relevant', 'unrelated', 'counterfactual'], at);
    if (typeof item.id !== 'string' || !/^[a-z][a-z0-9-]+$/u.test(item.id) || ids.has(item.id)) fail(`${at}.id`, 'must be a unique stable ID');
    ids.add(item.id);
    if (!CATEGORIES.includes(item.category)) fail(`${at}.category`, 'is unknown');
    counts[item.category] += 1;
    sourceText(item.target_zh, `${at}.target_zh`);
    if (targets.has(item.target_zh)) fail(`${at}.target_zh`, 'must be a unique target');
    targets.add(item.target_zh);
    if (typeof item.uncertain_when_isolated !== 'boolean') fail(`${at}.uncertain_when_isolated`, 'must be boolean');
    keys(item.isolated, ['reference_ru', 'expected_facts', 'prohibited_facts'], `${at}.isolated`);
    reference(item.isolated.reference_ru, `${at}.isolated.reference_ru`);
    facts(item.isolated.expected_facts, `${at}.isolated.expected_facts`);
    facts(item.isolated.prohibited_facts, `${at}.isolated.prohibited_facts`);
    scoredScenario(item.relevant, `${at}.relevant`);
    controls(item.unrelated, `${at}.unrelated`);
    scoredScenario(item.counterfactual, `${at}.counterfactual`);
    if (JSON.stringify([item.relevant.before_zh, item.relevant.after_zh]) === JSON.stringify([item.counterfactual.before_zh, item.counterfactual.after_zh])) fail(at, 'counterfactual duplicates relevant context');
    if (JSON.stringify([item.relevant.before_zh, item.relevant.after_zh]) === JSON.stringify([item.unrelated.before_zh, item.unrelated.after_zh])) fail(at, 'unrelated context duplicates relevant context');
    if (item.relevant.reference_ru === item.counterfactual.reference_ru
        && JSON.stringify(item.relevant.expected_facts) === JSON.stringify(item.counterfactual.expected_facts)) fail(at, 'counterfactual has no stated meaning contrast');
  }
  if (Object.values(counts).some(count => count !== 12)) fail('corpus.cases', 'must have 12 targets in each category');
  return { target_count: ids.size, scenario_count: ids.size * SCENARIOS.length, categories: counts };
}

export function modelInputForScenario(item, scenario) {
  if (!SCENARIOS.includes(scenario)) throw new Error(`unknown scenario: ${scenario}`);
  const context = scenario === 'isolated' ? { before_zh: [], after_zh: [] } : item[scenario];
  return {
    scenario_id: `${item.id}-${scenario}`,
    target_zh: item.target_zh,
    context_before_zh: [...context.before_zh],
    context_after_zh: [...context.after_zh]
  };
}
