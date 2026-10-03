import assert from 'node:assert/strict';
import { scopeTerms } from './target-term-scope.mjs';

const marker = 'Input JSON:\n';

const positions = (source, word) => {
  const spans = [];
  for (let at = source.indexOf(word); at !== -1; at = source.indexOf(word, at + word.length)) {
    const start = [...source.slice(0, at)].length;
    spans.push({ start, end: start + [...word].length, source: word });
  }
  return spans;
};

export function scopedOccurrences(source, policy) {
  const admitted = scopeTerms(source, policy);
  return admitted.map(decision => {
    if (decision.outcome !== 'eligible') return { ...decision, occurrences: [], distinct_referents: [] };
    const term = policy.terms.find(item => item.source === decision.source);
    assert(term);
    const occurrences = positions(source, term.source);
    assert(occurrences.length > 0);
    const distinct_referents = term.distinct_referents.flatMap(other =>
      positions(source, other.source).map(span => ({ ...span, sense: other.sense })));
    return { ...decision, occurrences, distinct_referents };
  });
}

export function occurrenceRequest(baseline, policy) {
  const baselineBytes = JSON.stringify(baseline);
  const content = baseline.messages?.[0]?.content;
  assert.equal(typeof content, 'string');
  const at = content.indexOf(marker);
  assert(at >= 0, 'Missing v8 input envelope');
  const envelope = JSON.parse(content.slice(at + marker.length));
  assert(Array.isArray(envelope.target_slots));
  const decisions = envelope.target_slots.map(slot => {
    assert.equal(slot.source_original, slot.source_for_translation,
      'Only unmasked identical source fields are admitted');
    return { segment_id: slot.segment_id, line_index: slot.line_index,
      terms: scopedOccurrences(slot.source_original, policy) };
  });
  const notes = decisions.flatMap(slot => slot.terms.filter(item => item.outcome === 'eligible')
    .map(item => {
      const term = policy.terms.find(candidate => candidate.source === item.source);
      const span = span => `[${span.start},${span.end}) "${span.source}"`;
      const bindings = item.occurrences.map(occurrence => span(occurrence)).join(', ');
      const contrasts = item.distinct_referents.map(other =>
        `${span(other)} means ${other.sense}`).join('; ');
      return `Target ${slot.segment_id}/${slot.line_index}: only source occurrence(s) ${bindings} ` +
        `mean ${term.sense}; render those occurrence(s) as "${term.target}". ` +
        `Never transfer this term to another source noun. ` +
        (contrasts ? `Separate unhinted referent(s): ${contrasts}. ` : '') +
        `Preserve each source noun, speaker, polarity, availability and relation independently. `;
    }));
  const request = structuredClone(baseline);
  if (notes.length) request.messages[0].content =
    content.slice(0, at) + notes.join('') + content.slice(at);
  else assert.equal(JSON.stringify(request), baselineBytes);
  return { request, decisions,
    review_state: decisions.some(slot => slot.terms.some(term => term.outcome === 'needs_review'))
      ? 'needs_review' : 'unreviewed',
    baseline_identical: JSON.stringify(request) === baselineBytes };
}
