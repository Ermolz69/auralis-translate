import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = resolve('.');
const directory = resolve(root,
  '.cache/eval/commons-train-media/inventory-ff397445-ed45-43db-aac2-efc46805fbac');
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
const source = await readFile(resolve(root, '.cache/eval/commons-train-1144114810/source.zh.srt'));
assert.equal(sha256(source), 'ccc47105cdc2c782d82421d9790e5babf5801a8196d1b6b744d6b8df71bf9b4c');
const reportBytes = await readFile(resolve(directory, 'report.json'));
assert.equal(sha256(reportBytes), '697f947d7389fdbb0e7623e9546be74b3741b08c2d85dd4215a304445d74656e');
const report = JSON.parse(reportBytes);
assert.equal(report.status, 'inventoried_unreviewed');
assert.equal(report.http_status, 200);
assert.equal(report.original_bytes, 2729386526);
assert.equal(report.original_sha1, '5c6666838149c38b919b80519164c0adb091cb0e');
const raw = await readFile(resolve(directory, 'raw-api.json'));
assert.equal(sha256(raw), report.raw_sha256);
assert.equal(raw.length, report.raw_bytes);
const page = Object.values(JSON.parse(raw).query.pages)[0];
assert.equal(page.title.replaceAll(' ', '_'), report.media_title);
assert(report.derivatives.some(row => row.height === 240
  && row.type === 'video/webm; codecs="vp9, opus"'
  && row.url.startsWith('https://upload.wikimedia.org/wikipedia/commons/transcoded/')));
console.log('Commons train metadata verified: original and 240p derivative identities; media/alignment not checked.');
