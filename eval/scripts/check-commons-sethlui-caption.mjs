import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { checkCueMediaCoverage } from './cue-media-coverage.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const directory = path.join(root, '.cache/eval/commons-sethlui-caption/caption-Cgsmq4');
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
const reportBytes = await fs.readFile(path.join(directory, 'acquisition.json'));
assert.equal(sha256(reportBytes),
  '41ee99dfd604b4333203dd022cf36f83f493914ca25cb6ef7ff78dc4d73c4c07');
const report = JSON.parse(reportBytes.toString('utf8'));
assert.equal(report.revision, '1200692574');
assert.equal(report.outcome.status, 'downloaded_private_unreviewed');
assert.equal(report.outcome.http_status, 200);
assert.equal(report.outcome.bytes, 17618);
const raw = await fs.readFile(path.join(directory, 'response.bin'));
const source = await fs.readFile(path.join(directory, 'source.zh.srt'));
assert.deepEqual(source, raw, 'raw caption copy changed');
assert.equal(sha256(raw), report.outcome.sha256);
assert.equal(sha256(raw),
  '077aef6a49aa7128f5ddd349f38ffc84dd669f5e4bbfae6d692efa2d78304967');

const text = new TextDecoder('utf-8', { fatal: true }).decode(raw);
const timing = /^([0-9]{2}):([0-9]{2}):([0-9]{2}),([0-9]{3}) --> ([0-9]{2}):([0-9]{2}):([0-9]{2}),([0-9]{3})\r?$/gmu;
const toMs = parts => (((Number(parts[0]) * 60 + Number(parts[1])) * 60
  + Number(parts[2])) * 1000 + Number(parts[3]));
const segments = [...text.matchAll(timing)].map((match, index) => ({ id: index + 1,
  start_ms: toMs(match.slice(1, 5)), end_ms: toMs(match.slice(5, 9)) }));
assert.equal(segments.length, 271, 'timing count differs from strict CLI inspection');
assert.deepEqual(segments[0], { id: 1, start_ms: 7966, end_ms: 9600 });
assert.deepEqual(segments.at(-1), { id: 271, start_ms: 855500, end_ms: 858333 });

// Commons displays 12:18, so 12:19 is a conservative upper bound here.
const coverage = checkCueMediaCoverage(segments, 739000);
assert.equal(coverage.covers_media, false);
assert(coverage.overrun_count > 0);
assert.equal(coverage.max_end_ms, 858333);
console.log(JSON.stringify({ caption_sha256: sha256(raw), cue_count: segments.length,
  catalog_media_upper_bound_ms: 739000, ...coverage,
  decision: 'rejected_for_matched_media_scene' }, null, 2));
