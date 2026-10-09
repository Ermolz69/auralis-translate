import assert from 'node:assert/strict';
import { technicalSenseRequestV2 } from './vivo-technical-senses-v2.mjs';

const MARKER = 'Input JSON:\n';
const NEGATED_MULTICORE = /(?:并)?不是(?:在说|一个|一颗)?多核|并非多核|没有多核/u;
const QUOTED_MULTICORE = /[“「"']多核[”」"']/u;

export function negatedMulticoreTarget(source) {
  return !QUOTED_MULTICORE.test(source) && NEGATED_MULTICORE.test(source);
}

export function technicalSenseRequestV3(baseline) {
  const originalBytes = JSON.stringify(baseline);
  const v2 = technicalSenseRequestV2(baseline);
  const content = baseline.messages?.[0]?.content;
  assert.equal(typeof content, 'string');
  const at = content.indexOf(MARKER);
  assert(at >= 0);
  const envelope = JSON.parse(content.slice(at + MARKER.length));
  assert.equal(envelope.target_slots.length, 1);
  const target = envelope.target_slots[0];
  assert.equal(target.source_original, target.source_for_translation);
  if (!negatedMulticoreTarget(target.source_original)) {
    if (v2.baseline_identical)
      assert.equal(JSON.stringify(v2.request), originalBytes);
    return v2;
  }
  assert(v2.baseline_identical, 'negated multi-core must be excluded by v2');
  const note = `For target slot ${target.segment_id}/${target.line_index} only, ` +
    'source 多核 concerns multiple CPU cores within a chip, distinct from ' +
    'multiple processors. Preserve the explicit negation of the multi-core ' +
    'claim and any separate chip count. Do not infer a processor-count ' +
    'claim absent from this target source. ';
  const request = structuredClone(baseline);
  request.messages[0].content = content.slice(0, at) + note +
    content.slice(at);
  assert.deepEqual(JSON.parse(request.messages[0].content.split(MARKER)[1]),
    envelope, 'source and target slots must stay unchanged');
  return { request, eligible_terms: ['negated:多核'],
    baseline_identical: false };
}
