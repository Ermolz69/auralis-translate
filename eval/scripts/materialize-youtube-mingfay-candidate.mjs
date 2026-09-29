import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { constants } from 'node:fs';
import { copyFile, mkdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const source = path.join(root, '.cache/eval/youtube-mingfay/derived-krjB0X/source.zh.srt');
const target = path.join(root, '.cache/eval/youtube-mingfay-derived/source.zh.srt');
const expected = '42109fc054cba93b0ef343853628b6a248b31664786d579bdefa415ccaacf9ee';
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const original = await readFile(source);
assert.equal(hash(original), expected, 'checked derivative changed');
await mkdir(path.dirname(target), { recursive: true });
try {
  await copyFile(source, target, constants.COPYFILE_EXCL);
} catch (error) {
  if (error.code !== 'EEXIST') throw error;
}
const retained = await readFile(target);
assert.equal(hash(retained), expected, 'registered candidate differs from checked derivative');
console.log(`Private candidate bytes verified: ${retained.length} bytes, sha256=${expected}`);
