import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { constants } from 'node:fs';
import { copyFile, mkdir, readFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';

const root = resolve('.');
const attempt = join(root,
  '.cache/eval/commons-vivo-caption/attempt-0a204ad7-002c-4e3c-8ea6-3f1a630871b1');
const destination = join(root, '.cache/eval/commons-vivo-979826861/source.zh.srt');
const expectedSource = '8c41e66f52000a5b67ab27bfc319accd11d89290b60e50fc5c60f4ee8230a000';
const expectedReport = 'a4d66cbe24d0233ce3a72225f40471167c76d20b8dd609479016100e19e8336e';
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const reportBytes = await readFile(join(attempt, 'acquisition.json'));
assert.equal(hash(reportBytes), expectedReport);
assert.equal(JSON.parse(reportBytes).status, 'downloaded_private_unreviewed');
const source = await readFile(join(attempt, 'source.zh.srt'));
assert.equal(hash(source), expectedSource);
await mkdir(join(root, '.cache/eval/commons-vivo-979826861'), { recursive: true });
try {
  await copyFile(join(attempt, 'source.zh.srt'), destination, constants.COPYFILE_EXCL);
} catch (error) {
  if (error.code !== 'EEXIST') throw error;
}
assert.equal(hash(await readFile(destination)), expectedSource);
console.log(`Original and stable private copy verified: ${expectedSource}`);
