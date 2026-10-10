import assert from 'node:assert/strict';
import { technicalSenseRequestV3 } from './vivo-technical-senses-v3.mjs';

const MARKER = 'Input JSON:\n';
const CONTRAST = /^(?:这里有)?(?<count>[两三四])[颗个](?:独立|不同)?芯片(?:彼此独立)?[，,]不是一[个颗]多核芯片[。.]?$/u;
const CHIP_COUNTS = { 两: 2, 三: 3, 四: 4 };

export function separateChipContrast(source) {
  const match = CONTRAST.exec(source);
  return match ? { separate_chips: CHIP_COUNTS[match.groups.count],
    denied_single_multicore_chip: true } : null;
}

export function reg077ReferentRequestV4(baseline) {
  const prior = technicalSenseRequestV3(baseline);
  const content = baseline.messages?.[0]?.content;
  assert.equal(typeof content, 'string');
  const at = content.indexOf(MARKER);
  assert(at >= 0);
  const envelope = JSON.parse(content.slice(at + MARKER.length));
  assert.equal(envelope.target_slots.length, 1);
  const target = envelope.target_slots[0];
  assert.equal(target.source_original, target.source_for_translation);
  const relation = separateChipContrast(target.source_original);
  if (!relation) return prior;
  assert.equal(prior.baseline_identical, false);
  const priorContent = prior.request.messages[0].content;
  const priorAt = priorContent.indexOf(MARKER);
  assert(priorAt >= 0);
  const note = `For target slot ${target.segment_id}/${target.line_index} only, ` +
    `source relation: affirmed_count_of_separate_chips=${relation.separate_chips}; ` +
    'denied_alternative=one_single_multicore_chip (one chip with multiple ' +
    'cores). The negation applies to this single-chip alternative, not to ' +
    'a multi-processor system. Preserve both referents and the contrast. ';
  const request = structuredClone(prior.request);
  request.messages[0].content = priorContent.slice(0, priorAt) + note +
    priorContent.slice(priorAt);
  assert.deepEqual(JSON.parse(request.messages[0].content.split(MARKER)[1]),
    envelope);
  return { request, eligible_terms: [...prior.eligible_terms,
    'source:separate-chip-vs-one-multicore'], baseline_identical: false };
}
