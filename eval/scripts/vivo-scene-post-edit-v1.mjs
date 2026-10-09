import assert from 'node:assert/strict';

const INSTRUCTION = `Revise Chinese-to-Russian subtitle text for the target cues.
The Chinese source is authoritative. The Russian draft is tentative and may be wrong.
Read contiguous cues together. Preserve who did what, quantity, negation, time,
future versus present, names and product terms. Do not import a fact from a
different cue. Keep each target cue ID and line index, and use natural concise
Russian. If a draft line is already accurate, you may keep it. Return only the
specified JSON object with one Russian text for each target cue in order.
Input JSON:\n`;

function validCue(cue, hasDraft) {
  assert(Number.isInteger(cue.segment_id) && cue.segment_id > 0);
  assert.equal(cue.line_index, 0);
  assert.equal(typeof cue.source_original, 'string');
  assert(cue.source_original.trim());
  if (hasDraft) {
    assert.equal(typeof cue.draft_ru, 'string');
    assert(cue.draft_ru.trim());
  } else {
    assert(!Object.hasOwn(cue, 'draft_ru'));
  }
  assert(!Object.hasOwn(cue, 'expected'));
  assert(!Object.hasOwn(cue, 'reference'));
}

export function buildScenePostEditRequest({ targets, context, modelAlias,
  seed = 101 }) {
  assert(Array.isArray(targets) && targets.length >= 2 && targets.length <= 5);
  assert(Array.isArray(context));
  assert.equal(typeof modelAlias, 'string');
  assert(modelAlias.trim());
  targets.forEach(cue => validCue(cue, true));
  context.forEach(cue => validCue(cue, false));
  const all = [...targets, ...context];
  const ids = all.map(cue => cue.segment_id);
  assert.equal(new Set(ids).size, ids.length, 'duplicate source cue ID');
  assert.deepEqual(targets.map(cue => cue.segment_id),
    [...targets.map(cue => cue.segment_id)].sort((a, b) => a - b),
    'targets must be ordered');
  const envelope = { schema_version: 1,
    target_slots: targets, source_context: context };
  const request = { model: modelAlias, temperature: 0.7, top_p: 0.6,
    seed, max_tokens: 1024, stream: false,
    messages: [{ role: 'user', content: `${INSTRUCTION}${JSON.stringify(envelope)}` }],
    response_format: { type: 'json_object', schema: {
      type: 'object', additionalProperties: false,
      properties: { translations: { type: 'array', minItems: targets.length,
        maxItems: targets.length, items: { type: 'object',
          additionalProperties: false,
          properties: { segment_id: { type: 'integer' },
            line_index: { type: 'integer' }, text: { type: 'string' } },
          required: ['segment_id', 'line_index', 'text'] } } },
      required: ['translations'] } } };
  return { request, envelope };
}

export function validateScenePostEditReply(content, targets) {
  assert.equal(typeof content, 'string');
  const parsed = JSON.parse(content);
  assert.deepEqual(Object.keys(parsed), ['translations']);
  assert(Array.isArray(parsed.translations));
  assert.equal(parsed.translations.length, targets.length);
  for (let index = 0; index < targets.length; index += 1) {
    const row = parsed.translations[index];
    assert.deepEqual(Object.keys(row), ['segment_id', 'line_index', 'text']);
    assert.equal(row.segment_id, targets[index].segment_id);
    assert.equal(row.line_index, 0);
    assert.equal(typeof row.text, 'string');
    assert(row.text.trim());
    assert(!/[\p{Cc}\p{Cf}{}\[\]]/u.test(row.text));
  }
  return parsed.translations;
}
