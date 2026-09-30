import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { constants } from 'node:fs';
import { copyFile, mkdir, readFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';

const root = resolve('.');
const sources = [
  {
    id: 'asus-rog-ally', revision: '892592485',
    attempt: 'asus-rog-ally-9d18b25c-06f2-496e-845f-73c00229b3a2',
    reportSha256: 'e78f6fba3e5be693e417c360e5515f149fb3008825d72de2e40ea9a841aef696',
    sourceSha256: '923aed3991c2308d92b89c45181cea8ec7ece74e9b4d3a3ce0234d95e329913b',
  },
  {
    id: 'huawei-kirin-9010', revision: '880535591',
    attempt: 'huawei-kirin-9010-20d87ecf-6102-476d-bd2c-dd0caeccae2e',
    reportSha256: 'c4d12fbaa6d69d00f6c1bfb2f211e3a761cd9b4448db0504210dd06cdaf39661',
    sourceSha256: '57dfd9feb3bfe6381421c4142820b780af341e195e52ee81d58e8f9f12858feb',
  },
];
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
for (const source of sources) {
  const attempt = join(root, '.cache/eval/commons-geekerwan-two-scenes', source.attempt);
  const reportBytes = await readFile(join(attempt, 'acquisition.json'));
  assert.equal(hash(reportBytes), source.reportSha256);
  const report = JSON.parse(reportBytes);
  assert.equal(report.status, 'downloaded_private_unreviewed');
  assert.equal(report.id, source.id);
  assert.equal(report.revision, source.revision);
  assert.equal(report.sha256, source.sourceSha256);
  const original = join(attempt, 'source.zh.srt');
  assert.equal(hash(await readFile(original)), source.sourceSha256);
  const folder = join(root, `.cache/eval/commons-${source.id}-${source.revision}`);
  const destination = join(folder, 'source.zh.srt');
  await mkdir(folder, { recursive: true });
  try {
    await copyFile(original, destination, constants.COPYFILE_EXCL);
  } catch (error) {
    if (error.code !== 'EEXIST') throw error;
  }
  assert.equal(hash(await readFile(destination)), source.sourceSha256);
  console.log(`${source.id}: original and stable private copy verified: ${source.sourceSha256}`);
}
