import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { checkCueMediaCoverage } from './cue-media-coverage.mjs';

const root = resolve('.');
const originalPath = join(root,
  '.cache/eval/commons-sethlui-caption/caption-Cgsmq4/source.zh.srt');
const derivativeDirectory = join(root,
  '.cache/eval/commons-sethlui-media/derived-1e655c9c-f93e-4b03-938c-f2510640fa2b');
const candidateDirectory = join(root, '.cache/eval/commons-sethlui-derived-v1');
const candidatePath = join(candidateDirectory, 'source.zh.srt');
const expected = {
  original: '077aef6a49aa7128f5ddd349f38ffc84dd669f5e4bbfae6d692efa2d78304967',
  derivative: '4777e11caa115e893f2328c2a33c25a76c7391ace8ecf0ac4b9436635fc27964',
  derivation: 'da63dec61c03ccbfcc307aa028e9499b8ba9a65de41c1df6b0daab5a629a9a4f',
};
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
const original = await readFile(originalPath);
const derivative = await readFile(join(derivativeDirectory, 'source.zh.srt'));
const derivationBytes = await readFile(join(derivativeDirectory, 'derivation.json'));
assert.equal(sha256(original), expected.original);
assert.equal(sha256(derivative), expected.derivative);
assert.equal(sha256(derivationBytes), expected.derivation);
const record = JSON.parse(derivationBytes.toString('utf8'));
assert.equal(record.status, 'derived_private_unreviewed');
assert.equal(record.media_duration_ms, 738056);
assert.equal(record.derived_cue_count, 263);
assert.equal(record.derived_sha256, expected.derivative);
assert.equal(record.mapping.length, 271);
assert.deepEqual(record.mapping.map((cue, index) => cue.original_cue_id === index + 1),
  Array(271).fill(true));
assert(record.mapping.slice(0, 263).every(cue => cue.derived_cue_id === cue.original_cue_id));
assert(record.mapping.slice(263).every(cue => cue.derived_cue_id === null));
assert.equal(record.mapping[262].end_ms, 732900);
assert.equal(record.mapping[263].start_ms, 840100);
assert.deepEqual(checkCueMediaCoverage(record.mapping.map(cue => ({
  id: cue.original_cue_id, start_ms: cue.start_ms, end_ms: cue.end_ms,
})), record.media_duration_ms), record.original_coverage);
const newline = original.includes(Buffer.from('\r\n')) ? '\r\n' : '\n';
const originalText = new TextDecoder('utf-8', { fatal: true }).decode(original);
const derivedText = new TextDecoder('utf-8', { fatal: true }).decode(derivative);
assert(originalText.startsWith(derivedText.slice(0, -newline.length)));
assert(derivedText.endsWith(newline));
if (process.argv.includes('--check')) {
  const staged = await readFile(candidatePath);
  assert.deepEqual(staged, derivative);
} else {
  await mkdir(candidateDirectory, { recursive: true });
  await writeFile(candidatePath, derivative, { flag: 'wx' });
}
assert.equal(sha256(await readFile(originalPath)), expected.original,
  'immutable original changed during staging');
console.log(JSON.stringify({ candidate_path: candidatePath,
  candidate_sha256: expected.derivative, cue_count: 263,
  excluded_original_cues: record.mapping.slice(263).map(cue => cue.original_cue_id),
  media_duration_ms: record.media_duration_ms,
  rights_and_speech_verified: false }, null, 2));
