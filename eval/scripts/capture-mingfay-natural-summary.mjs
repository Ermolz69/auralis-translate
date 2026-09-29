import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { constants } from 'node:fs';
import { copyFile, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const privatePath = path.join(root, '.cache/eval/youtube-mingfay/natural-model-screen-summary.json');
const publicPath = path.join(root, 'eval/reports/2026-09-29-mingfay-natural-summary.json');
const bytes = await readFile(privatePath);
const summary = JSON.parse(bytes);
assert.equal(summary.experiment, 'mingfay-natural-matched-2026-09-29-v1');
assert.equal(summary.release_denominator, 0);
assert.equal(summary.human_review, 'not_performed');
assert.equal(summary.variants.length, 2);
assert(!bytes.includes(Buffer.from('raw_candidate')));
assert(!bytes.includes(Buffer.from('accepted_lines')));
const sha256 = value => createHash('sha256').update(value).digest('hex');
try { await copyFile(privatePath, publicPath, constants.COPYFILE_EXCL); }
catch (error) { if (error.code !== 'EEXIST') throw error; }
assert.equal(sha256(await readFile(publicPath)), sha256(bytes), 'public redacted archive changed');
console.log(`Redacted natural model summary archived: sha256=${sha256(bytes)}`);
