import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { buildContextCorpus } from '../context-case-build.mjs';
import { CATEGORIES, modelInputForScenario, SCENARIOS, validateContextCases } from '../context-cases.mjs';

const corpus = JSON.parse(await readFile(new URL('../../corpora/context-contrasts-v1.json', import.meta.url), 'utf8'));
const copy = () => structuredClone(corpus);

test('authored corpus freezes 12 targets per category and 240 scenario IDs', () => {
  const counts = validateContextCases(corpus);
  assert.equal(counts.target_count, 60);
  assert.equal(counts.scenario_count, 240);
  for (const category of CATEGORIES) assert.equal(counts.categories[category], 12);
  assert.deepEqual(corpus, buildContextCorpus());
  const scenarioIds = corpus.cases.flatMap(item => SCENARIOS.map(scenario => modelInputForScenario(item, scenario).scenario_id));
  assert.equal(new Set(scenarioIds).size, 240);
});

test('model input contains only target and source context, never proposed references or facts', () => {
  for (const item of corpus.cases) {
    for (const scenario of SCENARIOS) {
      const input = modelInputForScenario(item, scenario);
      assert.deepEqual(Object.keys(input), ['scenario_id', 'target_zh', 'context_before_zh', 'context_after_zh']);
      assert.equal(input.target_zh, item.target_zh);
      assert.doesNotMatch(JSON.stringify(input), /\p{Script=Cyrillic}/u);
      if (scenario === 'isolated') assert.deepEqual(input.context_before_zh, []);
      if (scenario === 'unrelated') assert.deepEqual(input.context_before_zh, item.unrelated.before_zh);
    }
  }
});

test('duplicate or imbalanced targets cannot inflate the suite', () => {
  const duplicate = copy();
  duplicate.cases[1].id = duplicate.cases[0].id;
  assert.throws(() => validateContextCases(duplicate), /unique stable ID/u);
  const imbalance = copy();
  imbalance.cases[0].category = 'money_fact';
  assert.throws(() => validateContextCases(imbalance), /12 targets in each category/u);
  const repeatedTarget = copy();
  repeatedTarget.cases[1].target_zh = repeatedTarget.cases[0].target_zh;
  assert.throws(() => validateContextCases(repeatedTarget), /unique target/u);
});

test('context, reference and stated contrast controls are required', () => {
  const missing = copy();
  missing.cases[0].relevant.before_zh = [];
  missing.cases[0].relevant.after_zh = [];
  assert.throws(() => validateContextCases(missing), /must include context/u);
  const leaked = copy();
  leaked.cases[0].counterfactual.before_zh = ['Он пришёл.'];
  assert.throws(() => validateContextCases(leaked), /without Russian text/u);
  const flat = copy();
  flat.cases[0].counterfactual.reference_ru = flat.cases[0].relevant.reference_ru;
  flat.cases[0].counterfactual.expected_facts = [...flat.cases[0].relevant.expected_facts];
  assert.throws(() => validateContextCases(flat), /no stated meaning contrast/u);
});
