import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { digest } from './flores-file-fixture.mjs';
import { hasChineseNegationCandidate } from './source-negation-candidate.mjs';

const root = path.resolve('.');
const sourcePath = path.join(root, '.cache/eval/commons-asus-rog-ally-892592485/source.zh.srt');
const source = await fs.readFile(sourcePath);
const sourceSha256 = '923aed3991c2308d92b89c45181cea8ec7ece74e9b4d3a3ce0234d95e329913b';
assert.equal(digest(source), sourceSha256);
const cues = source.toString('utf8').trimEnd().split(/\r?\n\r?\n+/u).map((block, index) => {
  const lines = block.split(/\r?\n/u);
  assert.equal(Number(lines[0]), index + 1);
  assert(lines.length >= 3);
  return { id: index + 1, source_text: lines.slice(2).join('\n') };
});
assert.equal(cues.length, 268);
const tags = new Map();
const add = (id, tag) => {
  if (!tags.has(id)) tags.set(id, new Set());
  tags.get(id).add(tag);
};
for (const [label, ids] of [
  ['beginning', [1, 2, 3]], ['pre_failure', [19, 20, 21]],
  ['early_third', [88, 89, 90]], ['middle', [133, 134, 135]],
  ['late_third', [178, 179, 180]], ['prior_7b_failure', [225, 226, 227, 228]],
  ['end', [266, 267, 268]],
]) for (const id of ids) add(id, label);
const quartiles = [[1, 67], [68, 134], [135, 201], [202, 268]];
const categoryRules = [
  ['source_digit', text => /[0-9０-９]/u.test(text)],
  ['source_named_product', text => /ASUS|AMD|Steam|Xbox|ROG|Windows|Ryzen|华硕|微软|索尼|联想|小米|任天堂|华为|腾讯/iu.test(text)],
  ['source_negation', hasChineseNegationCandidate],
];
for (const [quartileIndex, [start, end]] of quartiles.entries()) {
  const group = cues.slice(start - 1, end);
  for (const [label, matches] of categoryRules) {
    for (const cue of group.filter(cue => matches(cue.source_text)).slice(0, 2))
      add(cue.id, `${label}_q${quartileIndex + 1}`);
  }
  const longest = group.reduce((best, cue) => {
    const length = [...cue.source_text].length;
    return length > best.length ? { id: cue.id, length } : best;
  }, { id: 0, length: -1 });
  add(longest.id, `source_longest_q${quartileIndex + 1}`);
}
const selected = [...tags.keys()].sort((a, b) => a - b).map(id => ({
  id, tags: [...tags.get(id)].sort(), source_text: cues[id - 1].source_text,
  source_text_sha256: digest(Buffer.from(cues[id - 1].source_text)),
}));
const packet = { schema_version: 1, sample: 'commons-asus-v6-source-only-review-v1',
  source_sha256: sourceSha256, source_cues: cues.length,
  candidate_sha256_for_later_review: 'aa74b20d4255f46c9a23ddfd0865dd2e221e7b08ab3cbceb8665be3b0c7b6e8b',
  fixed_groups: ['beginning', 'pre_failure', 'early_third', 'middle',
    'late_third', 'prior_7b_failure', 'end'],
  quartiles, category_names: categoryRules.map(([label]) => label),
  selected_count: selected.length, selected_ids: selected.map(row => row.id), selected };
const outputPath = path.join(root,
  '.cache/eval/commons-asus-full-v6-slot-v1/run-7XjHrR/source-only-review-sample.json');
await fs.writeFile(outputPath, `${JSON.stringify(packet, null, 2)}\n`, { flag: 'wx' });
console.log(`ASUS source-only review sample: ${selected.length}/268 cues; IDs ${packet.selected_ids.join(',')}; SHA-256 ${digest(await fs.readFile(outputPath))}`);
