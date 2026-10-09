import assert from 'node:assert/strict';

const INPUT_MARKER = 'Input JSON:\n';

function sourceFields(entry) {
  assert(Number.isInteger(entry.segment_id) && entry.segment_id > 0);
  assert(Number.isInteger(entry.line_index) && entry.line_index >= 0);
  assert(Number.isInteger(entry.start_ms) && Number.isInteger(entry.end_ms));
  assert(entry.end_ms > entry.start_ms);
  assert.equal(typeof entry.source_original, 'string');
  return { segment_id: entry.segment_id, line_index: entry.line_index,
    start_ms: entry.start_ms, end_ms: entry.end_ms,
    source_original: entry.source_original };
}

function sourceInventory(envelope) {
  const all = [...envelope.target_slots, ...envelope.source_context]
    .map(sourceFields).sort((a, b) => a.segment_id - b.segment_id);
  assert.equal(new Set(all.map(row => row.segment_id)).size, all.length,
    'source cue IDs must be unique');
  return all;
}

export function isolateFocusSlot(baseline, focusId) {
  assert(Number.isInteger(focusId) && focusId > 0);
  assert.equal(baseline.messages.length, 1);
  assert.equal(baseline.messages[0].role, 'user');
  const parts = baseline.messages[0].content.split(INPUT_MARKER);
  assert.equal(parts.length, 2, 'v8 input marker required once');
  const envelope = JSON.parse(parts[1]);
  assert.equal(envelope.schema_version, 7);
  assert(Array.isArray(envelope.target_slots));
  assert(Array.isArray(envelope.source_context));
  const before = sourceInventory(envelope);
  const focus = envelope.target_slots.find(row => row.segment_id === focusId);
  assert(focus, 'focus must be an original target');
  const candidate = structuredClone(baseline);
  const nextEnvelope = {
    schema_version: envelope.schema_version,
    target_slots: [focus],
    source_context: [...envelope.source_context,
      ...envelope.target_slots.filter(row => row.segment_id !== focusId)
        .map(row => ({ end_ms: row.end_ms, line_index: row.line_index,
          segment_id: row.segment_id, source_original: row.source_original,
          start_ms: row.start_ms }))]
      .sort((a, b) => a.segment_id - b.segment_id),
  };
  assert.deepEqual(sourceInventory(nextEnvelope), before,
    'Chinese source inventory must be identical');
  candidate.messages[0].content = `${parts[0]}${INPUT_MARKER}${JSON.stringify(nextEnvelope)}`;
  candidate.response_format.schema.properties.translations.minItems = 1;
  candidate.response_format.schema.properties.translations.maxItems = 1;
  assert.deepEqual(candidate.response_format.schema.properties.translations.items,
    baseline.response_format.schema.properties.translations.items);
  assert.deepEqual({ ...candidate, messages: null, response_format: null },
    { ...baseline, messages: null, response_format: null });
  return { request: candidate, sourceInventory: before,
    baselineTargetIds: envelope.target_slots.map(row => row.segment_id) };
}
