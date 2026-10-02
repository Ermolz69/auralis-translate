import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { normalizeSrtMilliseconds } from './normalize-srt-millisecond-fields.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const base = path.join(root, '.cache/eval/commons-wikipedia-lesson-caption');
const originalPath = path.join(base, 'attempt-joeurN/source.zh.srt');
const derivedPath = path.join(base, 'derived-v1/source.zh.srt');
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
const original = await fs.readFile(originalPath);
const derived = await fs.readFile(derivedPath);
assert.equal(sha256(original),
  'a94f5aeaf53e1420d7ecfcfeecf18c436b4eb042d215c7a1f445e9e06852078d');
assert.equal(sha256(derived),
  '3d4569cdc6d9be7fa58c8d5e7e2c5d0ff70e354c80543c276ef98d63ff6c82b5');
const acquisition = await fs.readFile(path.join(base, 'attempt-joeurN/acquisition.json'));
assert.equal(sha256(acquisition),
  '5f5f3c159b834cbde19e2ddf1f47f547858fa827cf8163e1c74652b5de694a3f');
const derivation = await fs.readFile(path.join(base, 'derived-v1/derivation.json'));
assert.equal(sha256(derivation),
  '52d7a776421b2d4fe07f85e391004627de3443d541bdbf8ff2d6375d7e679826');
const mapped = normalizeSrtMilliseconds(new TextDecoder('utf-8', { fatal: true }).decode(original));
assert.deepEqual(Buffer.from(mapped.srt, 'utf8'), derived);
assert.deepEqual(JSON.parse(derivation).mapping, mapped.mapping);
assert.equal(mapped.mapping.length, 37);
assert.equal(mapped.mapping.filter(cue => cue.original_timing !== cue.derived_timing).length, 10);

const cli = path.join(root, 'target/debug', process.platform === 'win32'
  ? 'auralis-translation-cli.exe' : 'auralis-translation-cli');
const inspect = source => spawnSync(cli, ['--json', 'inspect', source], {
  cwd: root, encoding: 'utf8', timeout: 30_000, maxBuffer: 2 * 1024 * 1024,
  windowsHide: true });
const rejected = inspect(originalPath);
assert(!rejected.error);
assert.notEqual(rejected.status, 0, 'original noncanonical timing must be rejected');
const admitted = inspect(derivedPath);
assert(!admitted.error);
assert.equal(admitted.status, 0, admitted.stderr);
const envelope = JSON.parse(admitted.stdout);
assert.equal(envelope.report?.report?.source_sha256, sha256(derived));
assert.equal(envelope.report.report.segments.length, 37);
assert.equal(envelope.report.report.segments.at(-1).end_ms, 231640);
assert.equal(envelope.terminal?.event, 'completed');
console.log(JSON.stringify({ original_rejected: true, derivative_admitted: true,
  original_sha256: sha256(original), derivative_sha256: sha256(derived),
  changed_timing_fields: 10, cue_count: 37, last_cue_end_ms: 231640,
  eligible_cues: 0 }, null, 2));
