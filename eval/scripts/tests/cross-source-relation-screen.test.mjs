import assert from 'node:assert/strict';
import test from 'node:test';
import { parsePinnedSrt, screenSourceAndDrafts } from
  '../cross-source-relation-screen.mjs';

const srt = rows => Buffer.from(rows.map(([id, start, end, text]) =>
  `${id}\n00:00:${start} --> 00:00:${end}\n${text}`).join('\n\n') + '\n');

test('three aligned cues preserve one recognized source relation per draft', () => {
  const source = parsePinnedSrt(srt([
    [1, '00,000', '02,000', '期待更好的合作'],
    [2, '02,000', '04,000', '有更好的产品能够带给大家'],
    [3, '04,000', '06,000', '谢谢大家'],
  ]));
  const wrong = parsePinnedSrt(srt([
    [1, '00,000', '02,000', 'Мы ждём лучшего сотрудничества'],
    [2, '02,000', '04,000', 'Есть хорошие продукты для всех'],
    [3, '04,000', '06,000', 'Спасибо всем'],
  ]));
  const safe = parsePinnedSrt(srt([
    [1, '00,000', '02,000', 'Мы ждём лучшего сотрудничества'],
    [2, '02,000', '04,000', 'Надеемся представить хорошие продукты'],
    [3, '04,000', '06,000', 'Спасибо всем'],
  ]));
  const result = screenSourceAndDrafts(source,
    [{ id: 'wrong', cues: wrong }, { id: 'safe', cues: safe }]);
  assert.deepEqual(result.recognized_relations,
    [{ cue_id: 2, kind: 'future_product_expectation' }]);
  assert.deepEqual(result.drafts.map(draft => draft.warning_count), [1, 0]);
  assert(result.drafts.every(draft => draft.warning_precision === null &&
    draft.warning_precision_reason === 'no_independent_source_review'));
});

test('zero recognized relations does not become a precision estimate', () => {
  const source = parsePinnedSrt(srt([[1, '00,000', '02,000', '大家好']]));
  const draft = parsePinnedSrt(srt([[1, '00,000', '02,000', 'Здравствуйте']]));
  const result = screenSourceAndDrafts(source, [{ id: 'one', cues: draft }]);
  assert.equal(result.drafts[0].warning_count, 0);
  assert.equal(result.drafts[0].warning_precision, null);
  assert.equal(result.drafts[0].warning_precision_reason,
    'no_source_relations_recognized');
});

test('changed source timing and cue identity reject the whole screen', () => {
  const source = parsePinnedSrt(srt([[1, '00,000', '02,000', '大家好']]));
  const shifted = parsePinnedSrt(srt([[1, '00,001', '02,000', 'Здравствуйте']]));
  assert.throws(() => screenSourceAndDrafts(source,
    [{ id: 'shifted', cues: shifted }]), /timing differs/u);
  assert.throws(() => parsePinnedSrt(srt([[2, '00,000', '02,000', '大家好']])),
    /identity changed/u);
});
