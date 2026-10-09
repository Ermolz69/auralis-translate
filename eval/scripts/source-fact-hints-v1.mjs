import assert from 'node:assert/strict';

const INPUT_MARKER = 'Input JSON:\n';
const MAX_NEIGHBOR_GAP_MS = 4000;
const FACT_INSTRUCTION = 'Use source_fact_hints only as source evidence for their own target slot; preserve their kind and values without copying another cue or changing any target ID. ';

function sourceLine(entry) {
  assert(Number.isInteger(entry.segment_id) && entry.segment_id > 0);
  assert.equal(typeof entry.source_original, 'string');
  assert(Number.isInteger(entry.start_ms) && Number.isInteger(entry.end_ms));
  assert(entry.end_ms >= entry.start_ms);
  return entry;
}

function adjacent(source, target, direction) {
  const other = source.get(target.segment_id + direction);
  if (!other) return null;
  const gap = direction < 0
    ? target.start_ms - other.end_ms
    : other.start_ms - target.end_ms;
  return gap >= 0 && gap <= MAX_NEIGHBOR_GAP_MS ? other : null;
}

function hint(kind, sourceSpan, evidenceIds, values = {}) {
  assert(sourceSpan && evidenceIds.length >= 1);
  return { kind, source_span: sourceSpan,
    evidence_segment_ids: evidenceIds, ...values };
}

function extractForTarget(target, source) {
  const current = target.source_original;
  const previous = adjacent(source, target, -1);
  const next = adjacent(source, target, 1);
  const facts = [];
  const explicitFirst = current.match(/第一代9400/u);
  const currentGeneration = current.match(/9400这[1一]代/u);
  if (explicitFirst) facts.push(hint('explicit_first_generation',
    explicitFirst[0], [target.segment_id], { model_number: 9400, ordinal: 1 }));
  else if (currentGeneration) facts.push(hint('current_generation_no_ordinal',
    currentGeneration[0], [target.segment_id], { model_number: 9400 }));

  const afterStart = current.match(/项目启动(?:三十六|36)个月之后/u);
  const advance = current.match(/提前(?:三十六|36)个月/u);
  if (afterStart) facts.push(hint('months_after_project_start',
    afterStart[0], [target.segment_id], { months: 36 }));
  else if (advance && next && /联合.{0,8}规划定义/u.test(next.source_original))
    facts.push(hint('months_before_joint_planning', advance[0],
      [target.segment_id, next.segment_id], { months: 36,
        anchor_source_span: next.source_original }));

  const explicitMoney = current.match(/一千万元/u);
  const explicitTeam = current.match(/一千人的团队/u);
  if (explicitMoney && explicitTeam)
    facts.push(hint('money_and_people_explicit', current,
      [target.segment_id], { yuan: 10000000, people: 1000 }));
  else if (/投了/u.test(current) && next &&
    /一千(?:多)?人的.{0,12}团队/u.test(next.source_original))
    facts.push(hint('next_cue_team_referent', '投了',
      [target.segment_id, next.segment_id],
      { referent_source_span: next.source_original,
        referent_kind: 'people_team', minimum_people: 1000 }));

  const evening = current.match(/晚上十一二点/u);
  const lateNight = current.match(/一两点钟/u);
  if (evening) facts.push(hint('late_evening_clock', evening[0],
    [target.segment_id], { clock_options_24h: ['23:00', '00:00'] }));
  else if (lateNight && previous && /半夜|凌晨/u.test(previous.source_original))
    facts.push(hint('after_midnight_clock', lateNight[0],
      [previous.segment_id, target.segment_id],
      { clock_options_24h: ['01:00', '02:00'] }));

  const alreadyOnSale = current.match(/已经上市/u);
  const betterProducts = current.match(/有更好的产品能够带给/u);
  if (alreadyOnSale) facts.push(hint('present_availability',
    alreadyOnSale[0], [target.segment_id]));
  else if (betterProducts && previous && /期待/u.test(previous.source_original))
    facts.push(hint('future_expectation', betterProducts[0],
      [previous.segment_id, target.segment_id],
      { expectation_source_span: previous.source_original }));
  return facts;
}

export function attachSourceFactHints(envelope) {
  assert.equal(envelope.schema_version, 7);
  assert(Array.isArray(envelope.target_slots) && envelope.target_slots.length > 0);
  assert(Array.isArray(envelope.source_context));
  const all = [...envelope.target_slots, ...envelope.source_context];
  const source = new Map();
  for (const entry of all) {
    sourceLine(entry);
    assert(!source.has(entry.segment_id), 'Source cue IDs must be unique');
    source.set(entry.segment_id, entry);
  }
  const updated = structuredClone(envelope);
  let hintedSlots = 0;
  for (const slot of updated.target_slots) {
    assert.equal(slot.source_original, slot.source_for_translation);
    assert.deepEqual(slot.approved_terms, []);
    assert.deepEqual(slot.protected_facts, []);
    const facts = extractForTarget(slot, source);
    if (facts.length > 0) {
      slot.source_fact_hints = facts;
      hintedSlots += 1;
    }
  }
  return { envelope: updated, hintedSlots };
}

export function renderSourceFactHintPrompt(v8Prompt) {
  assert.equal(typeof v8Prompt, 'string');
  const pieces = v8Prompt.split(INPUT_MARKER);
  assert.equal(pieces.length, 2);
  const baseline = JSON.parse(pieces[1]);
  const { envelope, hintedSlots } = attachSourceFactHints(baseline);
  if (hintedSlots === 0) return { prompt: v8Prompt, hintedSlots };
  const prompt = `${pieces[0]}${FACT_INSTRUCTION}${INPUT_MARKER}${JSON.stringify(envelope)}`;
  assert(!/\p{Script=Cyrillic}/u.test(prompt.split(INPUT_MARKER)[1]));
  return { prompt, hintedSlots };
}
