import assert from 'node:assert/strict';
import test from 'node:test';
import { reg077ReferentRequestV4, separateChipContrast } from
  '../reg077-referent-v4.mjs';
import { technicalSenseRequestV3 } from '../vivo-technical-senses-v3.mjs';

const baseline = source => ({ model: 'checked-v8', messages: [{ role: 'user',
  content: `v8. Input JSON:\n${JSON.stringify({ schema_version: 7,
    target_slots: [{ segment_id: 6001, line_index: 0,
      source_original: source, source_for_translation: source,
      approved_terms: [], protected_facts: [] }], source_context: [] })}` }] });

test('a source-local card preserves two distinct referents without changing source', () => {
  const input = baseline('这里有两颗独立芯片，不是一个多核芯片。');
  const before = JSON.stringify(input);
  const result = reg077ReferentRequestV4(input);
  assert.deepEqual(separateChipContrast('这里有两颗独立芯片，不是一个多核芯片。'),
    { separate_chips: 2, denied_single_multicore_chip: true });
  assert(result.eligible_terms.includes('source:separate-chip-vs-one-multicore'));
  assert(result.request.messages[0].content.includes(
    'denied_alternative=one_single_multicore_chip'));
  assert.equal(JSON.stringify(input), before);
  assert.deepEqual(JSON.parse(result.request.messages[0].content.split(
    'Input JSON:\n')[1]), JSON.parse(input.messages[0].content.split(
    'Input JSON:\n')[1]));
});

test('related chip counts qualify but opposite and unknown relations abstain', () => {
  for (const source of ['三颗芯片彼此独立，不是一颗多核芯片。',
    '四颗不同芯片，不是一个多核芯片。'])
    assert(separateChipContrast(source), source);
  for (const source of ['两颗芯片各自都是多核，但不是多处理器系统。',
    '这不是多处理器系统，而是一颗多核芯片。',
    '两颗独立芯片和一颗双核芯片不是同一个概念。',
    '两颗芯片各自有几个核心还不知道。',
    '我们讨论“不是一个多核芯片”这个说法。']) {
    assert.equal(separateChipContrast(source), null, source);
    const input = baseline(source);
    assert.equal(JSON.stringify(reg077ReferentRequestV4(input).request),
      JSON.stringify(technicalSenseRequestV3(input).request), source);
  }
});
