import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { technicalSenseRequest } from '../vivo-technical-senses-v1.mjs';
import { technicalSenseRequestV2 } from '../vivo-technical-senses-v2.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const pack = JSON.parse(fs.readFileSync(path.join(root,
  'eval/regressions/reg-075-continuation-not-negation-v1.json')));
const baseline = source => ({ model: 'checked-v8',
  messages: [{ role: 'user', content: `v8. Input JSON:\n${JSON.stringify({
    schema_version: 7, target_slots: [{ segment_id: 393, line_index: 0,
      source_original: source, source_for_translation: source,
      approved_terms: [], protected_facts: [] }], source_context: [] })}` }] });

test('REG-075 continuation differs only where the old scope false-abstained', () => {
  const source = '在MediaTek这边我们会不断的开发先进的制程';
  assert.deepEqual(technicalSenseRequest(baseline(source)).eligible_terms, []);
  assert.deepEqual(technicalSenseRequestV2(baseline(source)).eligible_terms,
    pack.minimal_reproducer.expected_v2_eligible_terms);
  for (const control of [...pack.related_controls, ...pack.negative_controls]) {
    const input = baseline(control.source_line);
    const result = technicalSenseRequestV2(input);
    assert.deepEqual(result.eligible_terms,
      control.expected_term ? [control.expected_term] : [], control.id);
    if (control.expected_term === null)
      assert.equal(JSON.stringify(result.request), JSON.stringify(input),
        control.id);
  }
});

test('all v1 unaffected cases preserve exact request bytes', () => {
  for (const source of ['需要多核能力', '全大核架构提高性能',
    '研发先进制程', '不是多核而是两颗芯片',
    '这次不采用全大核架构', '他们讨论“制程”这个词',
    '我们规划产品场景']) {
    const input = baseline(source);
    assert.equal(JSON.stringify(technicalSenseRequestV2(input).request),
      JSON.stringify(technicalSenseRequest(input).request), source);
  }
});
