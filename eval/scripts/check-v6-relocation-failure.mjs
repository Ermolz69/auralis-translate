import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { gunzipSync } from 'node:zlib';
import { readRunSnapshot } from './cli-run-state.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const archive = path.join(root, 'eval/reports/2026-09-29-v6-timeout-continuation-v1');
const original = path.join(root, '.cache/eval/long-v6-scene-runs/recovery-NhHJxM/srt/state');
const failed = path.join(root, '.cache/eval/long-v6-continuation-runs/continuation-8cHMWm/srt');
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const expectedLogs = {
  'failure.json': '6779d94dfe9120360fd57d823b3fca24cee81684f88edd0948cf0f8ffdf58386',
  'cli.log.gz': '4bce60f2b111913bed459d51d0aad3ce6a2c14c14e53ffa7c8aaa6613c880ae1',
  'server.log.gz': 'fe49b9773dad71e38d397e484cab0fb6e09f368563b82e299d226e9d851854ed',
  'resources.jsonl.gz': '21aecd7019128640e39474ec625be0111ace61137f9dcaa4ea37229d2b232941',
};
for (const [name, expected] of Object.entries(expectedLogs)) {
  const bytes = await fs.readFile(path.join(archive, name));
  assert.equal(sha(name.endsWith('.gz') ? gunzipSync(bytes) : bytes), expected);
}
const cliLog = gunzipSync(await fs.readFile(path.join(archive, 'cli.log.gz'))).toString('utf8');
const serverLog = gunzipSync(await fs.readFile(path.join(archive, 'server.log.gz'))).toString('utf8');
assert.match(cliLog, /managed source lies outside the state directory/u);
assert.doesNotMatch(serverLog, /POST\s+\/(?:completion|v1\/chat\/completions|tokenize|apply-template)/u);
const expectedDb = {
  'auralis-translate.sqlite': '2d4a823aa3c0ec6a9f32dff49df5929849683ffd3870b021343100cc6b2603d5',
  'auralis-translate.sqlite-wal': 'c63ec0f00e04592b9addf0b5808fdbfc6a254386fb3c73f3a7e19755b4e9f305',
  'auralis-translate.sqlite-shm': '8eac92c7a76a6d4de10b0985d05814ad106494fdb0c750f46ecc864204ab1382',
};
for (const [name, expected] of Object.entries(expectedDb)) {
  assert.equal(sha(await fs.readFile(path.join(original, name))), expected);
}
const snapshot = readRunSnapshot(path.join(failed, 'state/auralis-translate.sqlite'), '86876d9c-bb84-4450-9214-8eb21f7d262c');
assert.equal(snapshot.run.state, 'running');
assert.equal(snapshot.checkpoints.length, 964);
assert.equal(snapshot.attempts.length, 2);
assert.equal(snapshot.results.length, 0);
assert.equal(await fs.stat(path.join(failed, 'candidate.ru.srt')).catch(() => null), null);
console.log('REG-005 retained: copied state rejected before inference; 964 checkpoints, zero result/output; original SQLite unchanged.');
