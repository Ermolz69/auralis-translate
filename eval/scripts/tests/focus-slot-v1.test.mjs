import assert from 'node:assert/strict';
import test from 'node:test';
import { isolateFocusSlot } from '../focus-slot-v1.mjs';

const slot = (id, text) => ({ approved_terms: [], end_ms: id * 1000,
  line_index: 0, protected_facts: [], segment_id: id,
  source_for_translation: text, source_original: text,
  start_ms: (id - 1) * 1000 });
const context = (id, text) => ({ end_ms: id * 1000,
  line_index: 0, segment_id: id, source_original: text,
  start_ms: (id - 1) * 1000 });
const request = {
  messages: [{ role: 'user', content: 'Translate every target. Input JSON:\n' +
    JSON.stringify({ schema_version: 7,
      target_slots: [slot(2, '我们提前36个月'), slot(3, '开始联合规划')],
      source_context: [context(1, '上文'), context(4, '下文')] }) }],
  model: 'example', seed: 101,
  response_format: { type: 'json_object', schema: { properties: {
    translations: { minItems: 2, maxItems: 2,
      items: { type: 'object', properties: { segment_id: { type: 'integer' },
        line_index: { type: 'integer' }, text: { type: 'string' } } } } } } },
};

test('focus request keeps every Chinese cue and top-level model option', () => {
  const original = structuredClone(request);
  const { request: focused, sourceInventory, baselineTargetIds } =
    isolateFocusSlot(request, 2);
  assert.deepEqual(request, original);
  assert.deepEqual(baselineTargetIds, [2, 3]);
  assert.deepEqual(sourceInventory.map(row => row.segment_id), [1, 2, 3, 4]);
  assert.equal(focused.seed, request.seed);
  assert.equal(focused.response_format.schema.properties.translations.minItems, 1);
  const envelope = JSON.parse(focused.messages[0].content.split('Input JSON:\n')[1]);
  assert.deepEqual(envelope.target_slots.map(row => row.segment_id), [2]);
  assert.deepEqual(envelope.source_context.map(row => row.segment_id), [1, 3, 4]);
  assert.equal(focused.messages[0].content.split('Input JSON:\n')[0],
    request.messages[0].content.split('Input JSON:\n')[0]);
  assert(!/\p{Script=Cyrillic}/u.test(focused.messages[0].content));
});

test('missing focus, duplicate source and malformed envelope fail closed', () => {
  assert.throws(() => isolateFocusSlot(request, 9));
  const repeated = structuredClone(request);
  const prefix = repeated.messages[0].content.split('Input JSON:\n')[0];
  const envelope = JSON.parse(repeated.messages[0].content.split('Input JSON:\n')[1]);
  envelope.source_context.push(context(2, 'другое'));
  repeated.messages[0].content = `${prefix}Input JSON:\n${JSON.stringify(envelope)}`;
  assert.throws(() => isolateFocusSlot(repeated, 2));
  assert.throws(() => isolateFocusSlot({ ...request,
    messages: [{ role: 'user', content: 'no envelope' }] }, 2));
});
