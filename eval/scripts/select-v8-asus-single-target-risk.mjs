import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
assert.equal(process.argv.length, 2);
const digest = bytes => createHash('sha256').update(bytes).digest('hex');
const report = JSON.parse(await fs.readFile(path.join(root,
  'eval/reports/2026-10-02-v8-asus-single-target.json')));
assert.equal(report.arms[1].status, 'completed');
const sourcePath = path.join(root, '.cache/eval/commons-asus-rog-ally-892592485/source.zh.srt');
const outputPath = path.join(root, '.cache/eval/v8-asus-single-target-v1',
  path.basename(path.dirname(path.join(root, report.private_report))),
  '7b/candidate.ru.srt');
const [sourceBytes, outputBytes] = await Promise.all([
  fs.readFile(sourcePath), fs.readFile(outputPath),
]);
assert.equal(digest(sourceBytes), report.source_sha256);
assert.equal(digest(outputBytes), report.arms[1].output_sha256);
const blocks = bytes => bytes.toString('utf8').trimEnd().split(/\r?\n\r?\n/u)
  .map(block => {
    const [id, timing, ...lines] = block.split(/\r?\n/u);
    return { id: Number(id), timing, text: lines.join('\n') };
  });
const source = blocks(sourceBytes);
const target = blocks(outputBytes);
assert.equal(source.length, 268);
assert.equal(target.length, source.length);
for (let index = 0; index < source.length; index++) {
  assert.equal(source[index].id, index + 1);
  assert.equal(target[index].id, index + 1);
  assert.equal(source[index].timing, target[index].timing);
}
const anchors = [1, 2, 79, 80, 133, 134, 140, 141, 144,
  216, 217, 244, 245, 267, 268];
const categories = {
  ascii_digit: item => /[0-9]/u.test(item.text),
  chinese_negation: item => /[不没无非]/u.test(item.text),
  latin_marker: item => /[A-Za-z]/u.test(item.text),
};
const categoryIds = {};
const chosen = new Set(anchors);
for (const [category, predicate] of Object.entries(categories)) {
  const matching = source.filter(predicate).map(item => item.id);
  assert(matching.length >= 3);
  categoryIds[category] = {
    total_source_matches: matching.length,
    selected: [matching[0], matching[Math.floor((matching.length - 1) / 2)], matching.at(-1)],
  };
  for (const id of categoryIds[category].selected) chosen.add(id);
}
const chosenBeforeNeighbors = [...chosen].sort((a, b) => a - b);
for (const id of chosenBeforeNeighbors) {
  if (id > 1) chosen.add(id - 1);
  if (id < 268) chosen.add(id + 1);
}
const selectedIds = [...chosen].sort((a, b) => a - b);
const warnings = [];
for (let index = 0; index < source.length; index++) {
  const origin = source[index].text;
  const russian = target[index].text;
  for (const number of new Set(origin.match(/[0-9]+(?:[.,][0-9]+)*/gu) ?? [])) {
    if (!russian.includes(number)) warnings.push({ id: index + 1,
      category: 'ascii_digit_not_verbatim', token: number });
  }
  for (const marker of new Set(origin.match(/[A-Za-z][A-Za-z0-9-]*/gu) ?? [])) {
    if (!russian.toLowerCase().includes(marker.toLowerCase())) warnings.push({ id: index + 1,
      category: 'latin_marker_not_verbatim', token: marker });
  }
}
const privateRecord = { schema_version: 1,
  source_sha256: report.source_sha256, output_sha256: report.arms[1].output_sha256,
  anchors, category_ids: categoryIds, selected_before_neighbors: chosenBeforeNeighbors,
  selected_ids: selectedIds, warnings,
  pairs: selectedIds.map(id => ({ id, timing: source[id - 1].timing,
    source: source[id - 1].text, candidate: target[id - 1].text })) };
const privatePath = path.join(root,
  '.cache/eval/v8-asus-single-target-v1/risk-audit-v1.json');
await fs.writeFile(privatePath, `${JSON.stringify(privateRecord, null, 2)}\n`);
console.log(JSON.stringify({ source_sha256: report.source_sha256,
  output_sha256: report.arms[1].output_sha256,
  selected_ids: selectedIds, selected_count: selectedIds.length,
  category_ids: categoryIds,
  warning_count: warnings.length,
  warning_cues: new Set(warnings.map(row => row.id)).size,
  private_record_sha256: digest(await fs.readFile(privatePath)) }));
