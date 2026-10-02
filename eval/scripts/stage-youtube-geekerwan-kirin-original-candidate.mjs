import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { constants } from 'node:fs';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const check = process.argv[2] === '--check';
assert.equal(process.argv.length, check ? 3 : 2,
  'Use no arguments or --check');
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
const directory = path.join(root,
  '.cache/eval/youtube-geekerwan-kirin-original-caption/attempt-QbgkVq');
const acquisitionBytes = await fs.readFile(path.join(directory, 'acquisition.json'));
assert.equal(sha256(acquisitionBytes),
  'bb7570d9be85b99e8e8f6b4e81c5d26a57b989d1cee5706e287869fa998722d5');
const acquisition = JSON.parse(acquisitionBytes.toString('utf8'));
assert.equal(acquisition.outcome, 'acquired_private_unreviewed');
const source = await fs.readFile(path.join(directory, 'source.zh.srt'));
assert.equal(sha256(source), acquisition.response_sha256);
const manifest = JSON.parse(await fs.readFile(path.join(root,
  'eval/corpora/youtube-geekerwan-kirin-original-candidate-v1.json'), 'utf8'));
assert.equal(manifest.sources.length, 1);
const candidate = manifest.sources[0];
assert.equal(candidate.sha256, sha256(source));
assert.equal(candidate.cue_count, 343);
assert.equal(candidate.group_id, 'geekerwan-huawei-kirin-9010-analysis');
assert.equal(candidate.state, 'inspected_candidate');
assert.equal(candidate.split, 'unassigned');
assert.deepEqual(candidate.scenes, []);
const target = path.join(root, candidate.local_candidate_path);
if (!check) {
  await fs.mkdir(path.dirname(target), { recursive: true });
  await fs.copyFile(path.join(directory, 'source.zh.srt'), target,
    constants.COPYFILE_EXCL);
}
const staged = await fs.readFile(target);
assert.equal(sha256(staged), candidate.sha256);
assert(staged.equals(source));
console.log(`Kirin original candidate staged and verified: ${candidate.cue_count} strict cues, 0 admitted.`);
