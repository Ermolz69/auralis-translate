import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const source = path.join(root,
  '.cache/eval/commons-wikipedia-lesson-caption/derived-v1/source.zh.srt');
const destination = path.join(root,
  '.cache/eval/commons-wikipedia-lesson-derivative-v1/source.zh.srt');
const bytes = await fs.readFile(source);
assert.equal(createHash('sha256').update(bytes).digest('hex'),
  '3d4569cdc6d9be7fa58c8d5e7e2c5d0ff70e354c80543c276ef98d63ff6c82b5');
await fs.mkdir(path.dirname(destination), { recursive: true });
try {
  await fs.writeFile(destination, bytes, { flag: 'wx' });
} catch (error) {
  if (error.code !== 'EEXIST') throw error;
  assert.deepEqual(await fs.readFile(destination), bytes);
}
console.log(`Staged verified private candidate: ${destination}`);
