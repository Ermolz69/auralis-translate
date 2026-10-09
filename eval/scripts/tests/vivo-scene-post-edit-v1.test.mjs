import assert from 'node:assert/strict';
import test from 'node:test';
import { buildScenePostEditRequest, validateScenePostEditReply } from
  '../vivo-scene-post-edit-v1.mjs';

const targets = [
  { segment_id: 1, line_index: 0, source_original: '甲说没有三个人。',
    draft_ru: 'А сказал: есть три человека.' },
  { segment_id: 2, line_index: 0, source_original: '乙说明天再来。',
    draft_ru: 'Б уже пришёл.' },
];
const context = [{ segment_id: 3, line_index: 0,
  source_original: '他们还在等。' }];

test('post-editor receives source and tentative draft without an answer key', () => {
  const { request, envelope } = buildScenePostEditRequest({ targets, context,
    modelAlias: 'pinned-local-7b' });
  assert.deepEqual(envelope.target_slots, targets);
  assert(!request.messages[0].content.includes('reference'));
  assert(!request.messages[0].content.includes('expected'));
  assert.equal(request.response_format.schema.properties.translations.minItems, 2);
  assert.equal(request.seed, 101);
});

test('source inventory and target order reject contamination', () => {
  const build = (target, sourceContext = context) =>
    buildScenePostEditRequest({ targets: target, context: sourceContext,
      modelAlias: 'pinned-local-7b' });
  assert.throws(() => build(targets, [...context, context[0]]));
  assert.throws(() => build([...targets].reverse()));
  assert.throws(() => build([{ ...targets[0], expected: 'answer' }, targets[1]]));
  assert.throws(() => build(targets, [{ ...context[0], draft_ru: 'neighbor' }]));
});

test('candidate validator rejects wrong IDs, leaked JSON and blank text', () => {
  const raw = rows => JSON.stringify({ translations: rows });
  const rows = [{ segment_id: 1, line_index: 0, text: 'А говорит, что людей нет.' },
    { segment_id: 2, line_index: 0, text: 'Б придёт завтра.' }];
  assert.deepEqual(validateScenePostEditReply(raw(rows), targets), rows);
  assert.throws(() => validateScenePostEditReply(raw([
    { ...rows[0], segment_id: 2 }, rows[1] ]), targets));
  assert.throws(() => validateScenePostEditReply(raw([
    { ...rows[0], text: '{wrong}' }, rows[1] ]), targets));
  assert.throws(() => validateScenePostEditReply(raw([
    { ...rows[0], text: '   ' }, rows[1] ]), targets));
});
