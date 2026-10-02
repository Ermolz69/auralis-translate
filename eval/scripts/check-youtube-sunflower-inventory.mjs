import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const directory = path.join(root, '.cache/eval/youtube-sunflower/inventory-ZHBwaD');
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
const recordBytes = await fs.readFile(path.join(directory, 'inventory.json'));
assert.equal(sha256(recordBytes),
  '08c4635502aa2f170c8181d421adf36d75f67fcd218ea155421a89756d0fb889');
const record = JSON.parse(recordBytes.toString('utf8'));
assert.equal(record.video_id, 'VQyTbi74bmk');
assert.equal(record.executable_sha256,
  '52fe3c26dcf71fbdc85b528589020bb0b8e383155cfa81b64dd447bbe35e24b8');
assert.deepEqual(record.budget, { extractor_invocations: 1, timeout_ms: 90000,
  max_output_bytes: 12582912, downloads: 0, retries: 0 });
assert.equal(record.outcome.exit_code, 0);
assert.equal(record.outcome.timed_out, false);
assert.equal(record.outcome.output_limit_exceeded, false);
assert.equal(record.outcome.stdout_bytes, 536146);
assert.equal(record.outcome.stderr_bytes, 0);
const rawBytes = await fs.readFile(path.join(directory, 'extractor-stdout.json'));
assert.equal(sha256(rawBytes), record.outcome.stdout_sha256);
assert.equal(sha256(rawBytes),
  '6eceacc263c990a42beec8270d545194d76a4e8f2c72822f8d947a09cf4d4210');
const raw = JSON.parse(rawBytes.toString('utf8'));
assert.equal(raw.id, 'VQyTbi74bmk');
assert.equal(raw.duration, 1819);
assert.equal(raw.language, 'ja');
assert.deepEqual(raw.subtitles, {});
assert(Array.isArray(raw.automatic_captions['ja-orig']));
assert(Array.isArray(raw.automatic_captions['zh-Hans']));
assert(Array.isArray(raw.automatic_captions['zh-Hant']));
assert.deepEqual(record.metadata.subtitle_languages, []);
assert.deepEqual(record.metadata.chinese_subtitle_formats, {});
console.log('Sunflower source screen verified: no manual captions; automatic Chinese translations cannot be admitted as source text.');
