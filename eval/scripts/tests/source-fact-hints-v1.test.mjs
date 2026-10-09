import assert from 'node:assert/strict';
import test from 'node:test';
import { attachSourceFactHints, renderSourceFactHintPrompt } from '../source-fact-hints-v1.mjs';

const slot = (id, text, start = id * 1000) => ({
  approved_terms: [], end_ms: start + 1000, line_index: 0,
  protected_facts: [], segment_id: id, source_for_translation: text,
  source_original: text, start_ms: start,
});
const context = (id, text, start = id * 1000) => {
  const { approved_terms, protected_facts, source_for_translation, ...entry } =
    slot(id, text, start);
  return entry;
};
const envelope = (targets, neighbors = []) => ({ schema_version: 7,
  target_slots: targets, source_context: neighbors });
const prompt = value => `No Markdown or prose. Input JSON:\n${JSON.stringify(value)}`;
const hints = (targets, neighbors = []) =>
  attachSourceFactHints(envelope(targets, neighbors)).envelope.target_slots
    .map(row => row.source_fact_hints ?? []);

test('current 9400 generation and explicit first ordinal remain distinct', () => {
  const [current, first] = hints([
    slot(1, '在今年的9400这1代'),
    slot(2, '这是第一代9400系列产品。'),
  ]);
  assert.equal(current[0].kind, 'current_generation_no_ordinal');
  assert.equal(current[0].model_number, 9400);
  assert(!('ordinal' in current[0]));
  assert.equal(first[0].kind, 'explicit_first_generation');
  assert.equal(first[0].ordinal, 1);
});

test('36-month advance requires adjacent planning and never masks after-start', () => {
  const before = hints([slot(10, '其实涵盖了提前36个月之久的')],
    [context(11, '联合的规划定义')])[0];
  assert.equal(before[0].kind, 'months_before_joint_planning');
  assert.deepEqual(before[0].evidence_segment_ids, [10, 11]);
  const after = hints([slot(20, '项目启动三十六个月之后，我们才开始联合开发。')])[0];
  assert.equal(after[0].kind, 'months_after_project_start');
  assert.deepEqual(hints([slot(30, '其实涵盖了提前36个月之久的')],
    [context(31, '产品已经上市')])[0], []);
});

test('team referent stays on verb cue and explicit money plus people survives', () => {
  const [verb, team] = hints([
    slot(40, 'vivo在这方面我们跟MediaTek合力投了'),
    slot(41, '超过一千多人的精英的开发团队'),
  ]);
  assert.equal(verb[0].kind, 'next_cue_team_referent');
  assert.deepEqual(verb[0].evidence_segment_ids, [40, 41]);
  assert.equal(verb[0].referent_kind, 'people_team');
  assert.deepEqual(team, []);
  const both = hints([slot(50,
    '我们投入了一千万元，也组建了一支一千人的团队。')])[0];
  assert.equal(both[0].kind, 'money_and_people_explicit');
  assert.equal(both[0].yuan, 10000000);
  assert.equal(both[0].people, 1000);
});

test('night and evening clocks do not exchange interpretations', () => {
  const afterMidnight = hints([slot(61, '一直到一两点钟去解决难题')],
    [context(60, '我们经常会在半夜的时候')])[0];
  assert.equal(afterMidnight[0].kind, 'after_midnight_clock');
  assert.deepEqual(afterMidnight[0].clock_options_24h, ['01:00', '02:00']);
  const evening = hints([slot(70, '我们工作到晚上十一二点。')])[0];
  assert.equal(evening[0].kind, 'late_evening_clock');
  assert.deepEqual(evening[0].clock_options_24h, ['23:00', '00:00']);
  assert.deepEqual(hints([slot(80, '一直到一两点钟')])[0], []);
});

test('future expectation and present availability remain separate', () => {
  const future = hints([slot(91, '有更好的产品能够带给大家')],
    [context(90, '期待你们接下来的进一步的合作')])[0];
  assert.equal(future[0].kind, 'future_expectation');
  assert.deepEqual(future[0].evidence_segment_ids, [90, 91]);
  const present = hints([slot(100, '更好的产品现在已经上市了。')])[0];
  assert.equal(present[0].kind, 'present_availability');
  assert.deepEqual(hints([slot(110, '有更好的产品能够带给大家')],
    [context(109, '谢谢大家')])[0], []);
});

test('scene gap and unrelated neighbor cannot create a target hint', () => {
  assert.deepEqual(hints([slot(121, '有更好的产品能够带给大家', 20000)],
    [context(120, '期待继续合作', 1000)])[0], []);
  assert.deepEqual(hints([slot(130, '我们投入了')],
    [context(131, '一千万元用于设备')])[0], []);
});

test('unmatched requests keep exact v8 bytes and source fields stay immutable', () => {
  const original = envelope([slot(141, '请继续说明。')],
    [context(140, '我们现在开始讨论。')]);
  const source = prompt(original);
  const result = renderSourceFactHintPrompt(source);
  assert.equal(result.hintedSlots, 0);
  assert.equal(result.prompt, source);
  const targeted = envelope([slot(150, '这是第一代9400系列产品。')],
    [context(149, '无关背景。')]);
  const copied = structuredClone(targeted);
  const changed = renderSourceFactHintPrompt(prompt(targeted));
  assert.equal(changed.hintedSlots, 1);
  const rendered = JSON.parse(changed.prompt.split('Input JSON:\n')[1]);
  const { source_fact_hints, ...kept } = rendered.target_slots[0];
  assert.equal(source_fact_hints[0].kind, 'explicit_first_generation');
  assert.deepEqual(kept, copied.target_slots[0]);
  assert.deepEqual(rendered.source_context, copied.source_context);
  assert.deepEqual(targeted, copied);
});
