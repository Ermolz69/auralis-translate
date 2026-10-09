import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';

const SEED = 'vivo-stratified-v1';
const THIRDS = [
  { id: 'beginning', first: 1, last: 156, anchor: 8 },
  { id: 'middle', first: 157, last: 312, anchor: 232 },
  { id: 'end', first: 313, last: 467, anchor: 450 },
];
const EXCLUDED = [[57, 60], [273, 282], [325, 329], [464, 467]];
const FEATURES = [
  ['numeric', text => /[0-9０-９]|[零〇一二三四五六七八九十百千万两](?:个|年|点|人|次|亿|万|元|月|代)/u.test(text)],
  ['negation', text => /不|没有|没|未|无法|不能|无/u.test(text)],
  ['entity', text => /vivo|MediaTek|天玑|联发科/iu.test(text)],
  ['batch_seam', (_text, start) => start % 4 === 3],
];
const digest = bytes => createHash('sha256').update(bytes).digest('hex');
const rank = (third, kind, start) =>
  digest(Buffer.from(`${SEED}|${third}|${kind}|${start}`));
const range = (first, last) => Array.from({ length: last - first + 1 },
  (_, index) => first + index);

export function selectVivoBlindspotWindows(cues) {
  assert.equal(cues.length, 467);
  cues.forEach((cue, index) => {
    assert.equal(cue.id, index + 1);
    assert.equal(typeof cue.text, 'string');
    assert(cue.text.trim());
    assert.equal(typeof cue.timing, 'string');
  });
  const chosen = [];
  const occupied = new Set();
  const available = start => range(start, start + 2).every(id =>
    !occupied.has(id) && !EXCLUDED.some(([first, last]) =>
      id >= first && id <= last));
  const add = (third, kind, start, featureMet) => {
    assert(available(start));
    const ids = range(start, start + 2);
    ids.forEach(id => occupied.add(id));
    const source = ids.map(id => ({ id, timing: cues[id - 1].timing,
      text: cues[id - 1].text }));
    chosen.push({ third: third.id, kind, start, end: start + 2,
      feature_met: featureMet, cue_ids: ids,
      source_window_sha256: digest(Buffer.from(JSON.stringify(source))),
      source_text_sha256: source.map(cue => ({ id: cue.id,
        sha256: digest(Buffer.from(cue.text)) })) });
  };
  for (const third of THIRDS) {
    add(third, 'anchor', third.anchor, true);
    for (const [kind, predicate] of FEATURES) {
      const candidates = range(third.first, third.last - 2)
        .filter(available)
        .map(start => ({ start,
          featureMet: predicate(cues.slice(start - 1, start + 2)
            .map(cue => cue.text).join('\n'), start),
          rank: rank(third.id, kind, start) }));
      assert(candidates.length > 0, 'no nonoverlapping source window');
      const matched = candidates.filter(row => row.featureMet);
      const selected = (matched.length ? matched : candidates)
        .sort((a, b) => a.rank.localeCompare(b.rank))[0];
      add(third, kind, selected.start, selected.featureMet);
    }
  }
  assert.equal(chosen.length, 15);
  assert.equal(occupied.size, 45);
  return { seed: SEED, thirds: THIRDS.map(({ id, first, last }) =>
    ({ id, first, last })), excluded_ranges: EXCLUDED,
    windows: chosen };
}
