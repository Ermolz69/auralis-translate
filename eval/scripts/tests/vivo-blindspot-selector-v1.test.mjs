import assert from 'node:assert/strict';
import test from 'node:test';
import { selectVivoBlindspotWindows } from '../vivo-blindspot-selector-v1.mjs';

const source = Array.from({ length: 467 }, (_, index) => ({
  id: index + 1, timing: `source-time-${index + 1}`,
  text: `vivo 不 24个月 source ${index + 1}` }));

test('selection is source-only, deterministic and spans thirds and batch seams', () => {
  const selected = selectVivoBlindspotWindows(source);
  assert.deepEqual(selected, selectVivoBlindspotWindows(source.map(cue =>
    ({ ...cue, candidate_ru: 'untrusted target text' }))));
  assert.deepEqual(selected.windows.filter(row => row.kind === 'anchor')
    .map(row => row.start), [8, 232, 450]);
  assert.deepEqual(selected.windows.filter(row => row.kind === 'batch_seam')
    .map(row => row.start % 4), [3, 3, 3]);
  assert.equal(new Set(selected.windows.flatMap(row => row.cue_ids)).size, 45);
  assert(selected.windows.every(row => row.feature_met));
  assert(selected.windows.every(row => !row.cue_ids.some(id =>
    selected.excluded_ranges.some(([first, last]) =>
      id >= first && id <= last))));
});

test('missing source feature is disclosed without changing selection size', () => {
  const plain = source.map(cue => ({ ...cue, text: '普通的句子' }));
  const selected = selectVivoBlindspotWindows(plain);
  assert.equal(selected.windows.length, 15);
  assert.equal(selected.windows.filter(row => row.kind === 'numeric' &&
    !row.feature_met).length, 3);
  assert.equal(selected.windows.filter(row => row.kind === 'negation' &&
    !row.feature_met).length, 3);
  assert.equal(selected.windows.filter(row => row.kind === 'entity' &&
    !row.feature_met).length, 3);
  assert.equal(selected.windows.filter(row => row.kind === 'batch_seam' &&
    row.feature_met).length, 3);
});
