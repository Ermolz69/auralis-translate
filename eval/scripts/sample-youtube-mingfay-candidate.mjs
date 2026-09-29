import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const file = path.join(root, '.cache/eval/youtube-mingfay-derived/source.zh.srt');
const bytes = await fs.readFile(file);
assert.equal(createHash('sha256').update(bytes).digest('hex'),
  '42109fc054cba93b0ef343853628b6a248b31664786d579bdefa415ccaacf9ee');
const cues = bytes.toString('utf8').trimEnd().split(/\n\n+/).map(block => {
  const [label, timing, text] = block.split('\n');
  return { label: Number(label), timing, text };
});
assert.equal(cues.length, 230);
for (const [name, first, last] of [['start', 1, 4], ['middle', 114, 117],
  ['repaired_boundary', 209, 212], ['end', 227, 230]]) {
  console.log(`${name}:`);
  for (let id = first; id <= last; id++) {
    const cue = cues[id - 1];
    assert.equal(cue.label, id);
    console.log(`${cue.label} ${cue.timing} ${cue.text}`);
  }
}
