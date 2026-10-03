import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';

const marker = 'Input JSON:\n';
export const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');

// Conservative lexical admission, not a Chinese semantic parser. Uncertain
// mentions and negated clauses fall back to the exact baseline with review.
export function scopeTerms(source, policy) {
  const clauses = source.split(new RegExp(policy.clause_delimiters, 'u'));
  return policy.terms.map(term => {
    const matching = clauses.filter(clause => clause.includes(term.source));
    if (!matching.length) return { source: term.source, outcome: 'absent' };
    if (matching.some(clause => new RegExp(policy.mention_pattern, 'u').test(clause))) {
      return { source: term.source, outcome: 'needs_review', reason: 'metalinguistic_mention' };
    }
    if (matching.some(clause => new RegExp(policy.negation_pattern, 'u').test(clause))) {
      return { source: term.source, outcome: 'needs_review', reason: 'negated_or_uncertain_clause' };
    }
    if (term.affirmative_suffix && matching.some(clause =>
      [...clause.matchAll(new RegExp(term.source, 'gu'))].some(match =>
        !new RegExp(term.affirmative_suffix, 'u').test(clause.slice(match.index + term.source.length))))) {
      return { source: term.source, outcome: 'needs_review', reason: 'unclassified_usage' };
    }
    return { source: term.source, outcome: 'eligible',
      usage: new RegExp(policy.contrast_pattern, 'u').test(source) ? 'contrast' : 'affirmative' };
  });
}

export function scopedRequest(baseline, policy) {
  const bytes = JSON.stringify(baseline);
  const content = baseline.messages[0].content;
  const at = content.indexOf(marker);
  assert(at >= 0);
  const envelope = JSON.parse(content.slice(at + marker.length));
  const decisions = envelope.target_slots.map(slot => {
    assert.equal(slot.source_original, slot.source_for_translation,
      'This development screen admits only unmasked identical source fields');
    return { segment_id: slot.segment_id, line_index: slot.line_index,
      terms: scopeTerms(slot.source_original, policy) };
  });
  const notes = decisions.flatMap(slot => slot.terms.filter(term => term.outcome === 'eligible')
    .map(decision => {
      const term = policy.terms.find(term => term.source === decision.source);
      return `Slot ${slot.segment_id}/${slot.line_index} provisional manufacturer usage (not human-approved): ${term.source} = ${term.target} (${term.sense}). Preserve contrasts, referents, numbers and negation; this hint applies only to this target slot. `;
    }));
  const request = structuredClone(baseline);
  if (notes.length) request.messages[0].content =
    content.slice(0, at) + notes.join('') + content.slice(at);
  else assert.equal(JSON.stringify(request), bytes, 'No eligible target term must mean byte-identical v8');
  return { request, decisions,
    review_state: decisions.some(slot => slot.terms.some(term => term.outcome === 'needs_review'))
      ? 'needs_review' : 'unreviewed',
    baseline_identical: JSON.stringify(request) === bytes };
}

export function resumeIdentity(request, identities) {
  for (const field of ['source_sha256', 'model_sha256', 'runtime_sha256',
    'manifest_sha256', 'policy_sha256', 'implementation_sha256']) assert(identities[field]);
  return sha256(JSON.stringify({ request, identities }));
}

export function checkBudget(promptTokens, limits) {
  assert(Number.isSafeInteger(promptTokens) && promptTokens >= 0);
  assert(promptTokens + limits.response_tokens + limits.safety_tokens <= limits.context_tokens,
    'Rendered prompt exceeds frozen budget');
}

export function decodeCandidate(chat, slot) {
  assert.equal(chat.http_status, 200);
  const outer = JSON.parse(chat.raw_response);
  assert.equal(outer.choices.length, 1);
  assert.equal(outer.choices[0].finish_reason, 'stop');
  const result = JSON.parse(outer.choices[0].message.content);
  assert.deepEqual(Object.keys(result), ['translations']);
  assert.equal(result.translations.length, 1);
  const row = result.translations[0];
  assert.deepEqual(Object.keys(row).sort(), ['line_index', 'segment_id', 'text']);
  assert.equal(row.segment_id, slot.segment_id);
  assert.equal(row.line_index, slot.line_index);
  assert(typeof row.text === 'string' && row.text.trim());
  assert(!/[{}\[\]\u0000-\u001f]/u.test(row.text), 'Invalid or leaked JSON target text');
  return row.text;
}
