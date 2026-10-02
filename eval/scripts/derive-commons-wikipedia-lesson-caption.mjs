import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { normalizeSrtMilliseconds } from './normalize-srt-millisecond-fields.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const acquisition = path.join(root,
  '.cache/eval/commons-wikipedia-lesson-caption/attempt-joeurN');
const originalSha = 'a94f5aeaf53e1420d7ecfcfeecf18c436b4eb042d215c7a1f445e9e06852078d';
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
const output = path.join(root, '.cache/eval/commons-wikipedia-lesson-caption/derived-v1');

if (process.argv.includes('--preflight')) {
  console.log(JSON.stringify({ acquisition, original_sha256: originalSha,
    expected_revision: 100755166, expected_cues: 37, output,
    network_requests: 0, model_requests: 0 }, null, 2));
  process.exit(0);
}

const report = JSON.parse(await fs.readFile(path.join(acquisition, 'acquisition.json'), 'utf8'));
assert.equal(report.outcome, 'retained_private_unreviewed');
assert.equal(report.revision?.id, 100755166);
assert.equal(report.requests?.[1]?.sha256, originalSha);
const original = await fs.readFile(path.join(acquisition, 'source.zh.srt'));
assert.equal(sha256(original), originalSha);
const text = new TextDecoder('utf-8', { fatal: true }).decode(original);
const result = normalizeSrtMilliseconds(text);
assert.equal(result.mapping.length, 37);
const derived = Buffer.from(result.srt, 'utf8');
const derivation = { experiment: 'DATA-03-commons-wikipedia-lesson-timing-2026-10-02-v1',
  original_revision: 100755166, original_sha256: originalSha,
  derived_sha256: sha256(derived), original_bytes: original.length,
  derived_bytes: derived.length, cue_count: result.mapping.length,
  changed_timing_count: result.mapping.filter(cue =>
    cue.original_timing !== cue.derived_timing).length,
  mapping: result.mapping };
await fs.mkdir(output, { recursive: true });
const target = path.join(output, 'source.zh.srt');
try {
  await fs.writeFile(target, derived, { flag: 'wx' });
  await fs.writeFile(path.join(output, 'derivation.json'),
    `${JSON.stringify(derivation, null, 2)}\n`, { flag: 'wx' });
} catch (error) {
  if (error.code !== 'EEXIST') throw error;
  assert.deepEqual(await fs.readFile(target), derived,
    'existing derivative changed');
  assert.deepEqual(JSON.parse(await fs.readFile(path.join(output, 'derivation.json'), 'utf8')),
    derivation, 'existing mapping changed');
}
console.log(JSON.stringify({ output, ...Object.fromEntries(Object.entries(derivation)
  .filter(([key]) => key !== 'mapping')) }, null, 2));
