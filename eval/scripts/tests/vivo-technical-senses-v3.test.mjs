import assert from 'node:assert/strict';
import test from 'node:test';
import { technicalSenseRequestV2 } from '../vivo-technical-senses-v2.mjs';
import { negatedMulticoreTarget, technicalSenseRequestV3 } from
  '../vivo-technical-senses-v3.mjs';

const baseline = source => ({ model: 'checked-v8', messages: [{ role: 'user',
  content: `v8. Input JSON:\n${JSON.stringify({ schema_version: 7,
    target_slots: [{ segment_id: 3001, line_index: 0,
      source_original: source, source_for_translation: source,
      approved_terms: [], protected_facts: [] }], source_context: [] })}` }] });

test('REG-076 reproducer receives only a scoped source-sense note', () => {
  const input = baseline('设备里有三颗不同的芯片，不是在说多核。');
  const result = technicalSenseRequestV3(input);
  assert.deepEqual(result.eligible_terms, ['negated:多核']);
  assert.equal(result.baseline_identical, false);
  assert.equal(JSON.stringify(input), JSON.stringify(baseline(
    '设备里有三颗不同的芯片，不是在说多核。')));
  assert(result.request.messages[0].content.includes('distinct from multiple processors'));
  assert.deepEqual(JSON.parse(result.request.messages[0].content.split(
    'Input JSON:\n')[1]), JSON.parse(input.messages[0].content.split(
    'Input JSON:\n')[1]));
});

test('related negated-core forms are scoped; processor and quote cases abstain', () => {
  for (const source of ['这里有两颗独立芯片，不是一个多核芯片。',
    '这并不是多核设计。', '它并非多核架构。', '这没有多核设计。'])
    assert.equal(negatedMulticoreTarget(source), true, source);
  for (const source of ['两颗芯片各自都是多核，但不是多处理器系统。',
    '这不是多处理器系统，而是一颗多核芯片。',
    '我们讨论“多核”这个词。', '我们只讨论三颗独立芯片。']) {
    assert.equal(negatedMulticoreTarget(source), false, source);
    const input = baseline(source);
    assert.equal(JSON.stringify(technicalSenseRequestV3(input).request),
      JSON.stringify(technicalSenseRequestV2(input).request), source);
  }
});

test('all six new REG-076 controls receive expected scope', () => {
  const controls = [
    ['这里有两颗独立芯片，不是一个多核芯片。', true],
    ['两颗芯片各自都是多核，但不是多处理器系统。', false],
    ['我们增加的是CPU核心，不是处理器数量。', false],
    ['系统确实有多个处理器，但每个处理器只有单核。', false],
    ['这不是多处理器系统，而是一颗多核芯片。', false],
    ['我们只讨论三颗独立芯片，没有说明核心数量。', false],
  ];
  for (const [source, scoped] of controls) {
    const input = baseline(source);
    const result = technicalSenseRequestV3(input);
    assert.equal(result.eligible_terms.includes('negated:多核'), scoped, source);
    if (!scoped) assert.equal(JSON.stringify(result.request),
      JSON.stringify(technicalSenseRequestV2(input).request), source);
  }
});

test('unrelated and affirmative target requests preserve v2 bytes', () => {
  for (const source of ['这颗芯片需要更强的多核性能。',
    '全大核架构提高了性能', '研发先进制程', '我们规划产品场景']) {
    const input = baseline(source);
    assert.equal(JSON.stringify(technicalSenseRequestV3(input).request),
      JSON.stringify(technicalSenseRequestV2(input).request), source);
  }
});
