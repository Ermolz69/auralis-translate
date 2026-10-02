import assert from 'node:assert/strict';
import test from 'node:test';
import { validateCrossInventorySourceGroups } from '../cross-inventory-source-groups.mjs';
import { parseSrtText, screenCrossGroupCaptionOverlap } from '../source-caption-overlap.mjs';

const chinese = (count, offset = 0) => Array.from({ length: count }, (_, index) =>
  String.fromCodePoint(0x4e00 + offset + index)).join('');
const source = (id, group_id, text) => ({ id, group_id, text });
const flagged = (...sources) => screenCrossGroupCaptionOverlap(sources).flagged_pairs;

test('changed SRT timing and cue boundaries cannot hide one transcript', () => {
  const text = chinese(200);
  const one = `1\n00:00:01,000 --> 00:00:09,000\n${text}\n`;
  const two = `1\n00:00:02,000 --> 00:00:05,000\n${text.slice(0, 100)}\n\n2\n00:00:05,000 --> 00:00:10,000\n${text.slice(100)}\n`;
  assert.equal(flagged(source('a', 'group-a', parseSrtText(one).text),
    source('b', 'group-b', parseSrtText(two).text)).length, 1);
});

test('exact hash and media-ID controls alone miss a relabeled transcript copy', () => {
  const caption = chinese(200);
  const inventories = [
    { sources: [{ id: 'a', group_id: 'group-a', split: 'unassigned', sha256: 'a'.repeat(64),
      media_url: 'https://example.org/a.webm' }] },
    { sources: [{ id: 'b', group_id: 'group-b', split: 'unassigned', sha256: 'b'.repeat(64),
      media_url: 'https://example.org/b.webm' }] },
  ];
  assert.deepEqual(validateCrossInventorySourceGroups(inventories),
    { source_count: 2, group_count: 2 });
  assert.equal(flagged(source('a', 'group-a', caption), source('b', 'group-b', caption)).length, 1);
});

test('a substantial partial copy is flagged across groups', () => {
  const matches = flagged(source('a', 'group-a', chinese(400)),
    source('b', 'group-b', chinese(180) + chinese(220, 500)));
  assert.equal(matches.length, 1);
  assert(matches[0].shared_windows >= 64);
});

test('sparse changed characters still leave detectable copied spans', () => {
  const original = Array.from(chinese(500));
  const edited = original.map((character, index) => (index % 50 === 49 ? '改' : character)).join('');
  assert.equal(flagged(source('a', 'group-a', original.join('')),
    source('b', 'group-b', edited)).length, 1);
});

test('alternate revisions of one media group remain together', () => {
  const screen = screenCrossGroupCaptionOverlap([source('a', 'group-a', chinese(200)),
    source('b', 'group-a', chinese(200))]);
  assert.deepEqual(screen.flagged_pairs, []);
  assert.equal(screen.same_group_pairs.length, 1);
  assert(screen.same_group_pairs[0].shared_windows >= 64);
});

test('unrelated text and a short common phrase do not trigger the screen', () => {
  assert.deepEqual(flagged(source('a', 'group-a', chinese(400)),
    source('b', 'group-b', chinese(400, 500))), []);
  assert.deepEqual(flagged(source('a', 'group-a', chinese(60) + chinese(300, 500)),
    source('b', 'group-b', chinese(60) + chinese(300, 1000))), []);
});

test('case, punctuation and spacing do not hide a long shared passage', () => {
  const passage = `A${chinese(160)}B`;
  const changed = `a, ${chinese(80)}\n${chinese(80, 80)}! b`;
  assert.equal(flagged(source('a', 'group-a', passage),
    source('b', 'group-b', changed)).length, 1);
});

test('repeated short boilerplate has too few distinct windows', () => {
  assert.deepEqual(flagged(source('a', 'group-a', '中国'.repeat(300)),
    source('b', 'group-b', '中国'.repeat(300))), []);
});

test('malformed subtitle blocks are rejected rather than silently scanned', () => {
  assert.throws(() => parseSrtText('1\nwrong timing\n中文\n'), /timing/u);
});
