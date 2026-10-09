import assert from 'node:assert/strict';

const MARKER = 'Input JSON:\n';
const SENSES = [
  { source: '多核', sense: 'несколько вычислительных ядер внутри одного CPU; многоядерность' },
  { source: '全大核', sense: 'архитектура CPU, в которой все ядра большие' },
  { source: '制程', sense: 'технологический процесс изготовления микросхемы' },
];
const EXCLUDED = /不|没|非|无|“|”|「|」|"/u;

export function technicalSenseRequest(baseline) {
  const originalBytes = JSON.stringify(baseline);
  const request = structuredClone(baseline);
  const content = request.messages?.[0]?.content;
  assert.equal(typeof content, 'string');
  const at = content.indexOf(MARKER);
  assert(at >= 0);
  const envelope = JSON.parse(content.slice(at + MARKER.length));
  assert.equal(envelope.schema_version, 7);
  assert.equal(envelope.target_slots.length, 1);
  const slot = envelope.target_slots[0];
  assert.equal(slot.source_original, slot.source_for_translation);
  assert.deepEqual(slot.approved_terms, []);
  const eligible = EXCLUDED.test(slot.source_original) ? [] :
    SENSES.filter(term => slot.source_original.includes(term.source));
  if (!eligible.length) {
    assert.equal(JSON.stringify(request), originalBytes,
      'no eligible target term must preserve the full v8 request');
    return { request, eligible_terms: [], baseline_identical: true };
  }
  const note = eligible.map(term =>
    `For target slot ${slot.segment_id}/${slot.line_index} only, provisional technical source sense: ${term.source} means ${term.sense}. Keep the distinct source actors and objects. `).join('');
  request.messages[0].content = content.slice(0, at) + note +
    content.slice(at);
  assert.deepEqual(JSON.parse(request.messages[0].content.split(MARKER)[1]),
    envelope, 'candidate must not alter source or target slots');
  return { request, eligible_terms: eligible.map(term => term.source),
    baseline_identical: false };
}

export function decodeTechnicalSenseReply(rawResponse, targetId) {
  const outer = JSON.parse(rawResponse);
  assert.equal(outer.choices.length, 1);
  assert.equal(outer.choices[0].finish_reason, 'stop');
  const inner = JSON.parse(outer.choices[0].message.content);
  assert.deepEqual(Object.keys(inner), ['translations']);
  assert.equal(inner.translations.length, 1);
  const row = inner.translations[0];
  assert.deepEqual(Object.keys(row).sort(), ['line_index', 'segment_id', 'text']);
  assert.equal(row.segment_id, targetId);
  assert.equal(row.line_index, 0);
  assert.equal(typeof row.text, 'string');
  assert(row.text.trim());
  assert(!/[{}\[\]\u0000-\u001f]/u.test(row.text));
  return row.text;
}
