import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const parent = path.join(root, '.cache/eval/youtube-xiaolin');
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
const loadPinned = async (directory, expectedHash) => {
  const bytes = await fs.readFile(path.join(parent, directory, 'inventory.json'));
  assert.equal(sha256(bytes), expectedHash, `${directory} record changed`);
  return JSON.parse(bytes.toString('utf8'));
};

const failed = await loadPinned('inventory-wyKdOp',
  'b936f1871664d46dae46424ac2b6dbf278b4939bd4653301d8c5735e3f0bd7d3');
assert.equal(failed.video_id, 'i0hac3c_xhs');
assert.equal(failed.outcome.error, 'Error: spawn EPERM');
assert.equal(failed.outcome.stdout_bytes, 0);
assert.equal(failed.outcome.stderr_bytes, 0);
assert.equal(failed.metadata, null);

const success = await loadPinned('inventory-nVDJYN',
  '480c032761e7720c9d2eda9ecdb3848d185b6ad4855d5b474f9ea9bff1036f55');
assert.equal(success.video_id, 'i0hac3c_xhs');
assert.equal(success.executable_sha256,
  '52fe3c26dcf71fbdc85b528589020bb0b8e383155cfa81b64dd447bbe35e24b8');
assert.deepEqual(success.budget, { extractor_invocations: 1, timeout_ms: 90000,
  max_output_bytes: 12582912, downloads: 0, retries: 0 });
assert.equal(success.outcome.exit_code, 0);
assert.equal(success.outcome.timed_out, false);
assert.equal(success.outcome.output_limit_exceeded, false);
assert.equal(success.outcome.stdout_bytes, 88599);
const raw = await fs.readFile(path.join(parent, 'inventory-nVDJYN', 'extractor-stdout.json'));
assert.equal(sha256(raw), success.outcome.stdout_sha256);
assert.equal(sha256(raw), '0ceeca3130da6b6c15803b27b68f8c70481da39cda8985952c7883cb1e0c7ca4');
const metadata = JSON.parse(raw.toString('utf8'));
assert.equal(metadata.id, success.video_id);
assert.equal(metadata.duration, 776);
assert.deepEqual(metadata.subtitles, {});
assert.deepEqual(metadata.automatic_captions, {});
assert.deepEqual(success.metadata.subtitle_languages, []);
assert.deepEqual(success.metadata.automatic_caption_languages, []);
assert.deepEqual(success.metadata.chinese_subtitle_formats, {});
console.log('Xiaolin source inventory verified: one retained spawn failure, one metadata-only success, zero advertised caption tracks.');
