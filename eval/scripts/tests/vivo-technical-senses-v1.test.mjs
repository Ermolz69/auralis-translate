import assert from 'node:assert/strict';
import test from 'node:test';
import { technicalSenseRequest, decodeTechnicalSenseReply } from
  '../vivo-technical-senses-v1.mjs';

const baseline = source => ({ model: 'checked-v8', temperature: 0.7,
  messages: [{ role: 'user', content: `v8 instruction. Input JSON:\n${JSON.stringify({
    schema_version: 7, target_slots: [{ segment_id: 172,
      line_index: 0, source_original: source,
      source_for_translation: source, approved_terms: [],
      protected_facts: [] }], source_context: [
      { segment_id: 171, line_index: 0, source_original: '无关的上下文' }] })}` }],
  response_format: { type: 'json_object' } });

test('technical senses are target-only and do not alter the source envelope', () => {
  for (const [source, term] of [
    ['需要多核能力', '多核'], ['全大核架构提高性能', '全大核'],
    ['研发先进制程', '制程']]) {
    const input = baseline(source);
    const before = JSON.stringify(input);
    const result = technicalSenseRequest(input);
    assert.deepEqual(result.eligible_terms, [term]);
    assert(!result.baseline_identical);
    assert.equal(JSON.stringify(input), before);
    assert(result.request.messages[0].content.includes(term));
    assert.deepEqual(JSON.parse(result.request.messages[0].content
      .split('Input JSON:\n')[1]), JSON.parse(input.messages[0].content
      .split('Input JSON:\n')[1]));
  }
});

test('absence, source-context hits, negation and word mentions preserve v8 bytes', () => {
  for (const source of ['我们规划产品场景', '不是多核而是两颗芯片',
    '这次不采用全大核架构', '他们讨论“制程”这个词']) {
    const input = baseline(source);
    const result = technicalSenseRequest(input);
    assert(result.baseline_identical);
    assert.equal(JSON.stringify(result.request), JSON.stringify(input));
  }
});

test('decoder refuses wrong target identity and malformed output', () => {
  const raw = id => JSON.stringify({ choices: [{ finish_reason: 'stop',
    message: { content: JSON.stringify({ translations: [
      { segment_id: id, line_index: 0, text: 'Многоядерная способность' }] }) } }] });
  assert.equal(decodeTechnicalSenseReply(raw(172), 172),
    'Многоядерная способность');
  assert.throws(() => decodeTechnicalSenseReply(raw(173), 172));
});
