import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const sourcePath = path.join(root,
  '.cache/eval/paywall-chinese-caption/caption-0pzS77/source.zh-tw.srt');
const candidatePath = path.join(root, '.cache/eval/paywall-chinese-caption/source.zh.srt');
const expected = '3406fcd365446d727f31c4ecf576de6c3b5e168658c3f5d276fea8142ddb5a4b';
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
const source = await fs.readFile(sourcePath);
assert.equal(sha256(source), expected, 'immutable original source changed');
try {
  await fs.writeFile(candidatePath, source, { flag: 'wx' });
} catch (error) {
  if (error.code !== 'EEXIST') throw error;
}
const candidate = await fs.readFile(candidatePath);
assert.equal(sha256(candidate), expected, 'staged candidate differs from the original');
console.log(JSON.stringify({ original_sha256: expected,
  candidate_sha256: sha256(candidate), bytes: candidate.length,
  outcome: 'private_exact_copy_unreviewed' }));
