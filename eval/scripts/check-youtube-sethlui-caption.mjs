import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { checkCueMediaCoverage } from './cue-media-coverage.mjs';

const root = path.resolve('.');
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const metadataDir = path.join(root, '.cache/eval/youtube-sethlui-license/inventory-T8gpxQ');
const captionDir = path.join(root, '.cache/eval/youtube-sethlui-caption/caption-JTxK6K');
const rawMetadata = fs.readFileSync(path.join(metadataDir, 'extractor-stdout.json'));
const inventoryBytes = fs.readFileSync(path.join(metadataDir, 'inventory.json'));
const acquisitionBytes = fs.readFileSync(path.join(captionDir, 'acquisition.json'));
const youtube = fs.readFileSync(path.join(captionDir, 'source.zh.srt'));
const commons = fs.readFileSync(path.join(root,
  '.cache/eval/commons-sethlui-caption/caption-Cgsmq4/source.zh.srt'));
const derivative = fs.readFileSync(path.join(root, '.cache/eval/commons-sethlui-derived-v1/source.zh.srt'));
assert.equal(sha(rawMetadata), 'ef0e47700896ec4ea2909ffcfdc12bc4075f6bc301006d86da9f8fda34ad0a8b');
assert.equal(sha(inventoryBytes), '751794247ec5d0c37dc806d5e7e941359fc324bec85a7ee892d36f1289aedf18');
assert.equal(sha(acquisitionBytes), '6e595f2c49721a3a80e700a130abb7d10157986164759ee9b2d587c87cf82a08');
assert.equal(sha(youtube), '4e5e55ec5f50dad128391d1b907e9d0ba51e9fda1c40b13a828ae1d806d380d4');
assert.equal(sha(commons), '077aef6a49aa7128f5ddd349f38ffc84dd669f5e4bbfae6d692efa2d78304967');
assert.equal(sha(derivative), '4777e11caa115e893f2328c2a33c25a76c7391ace8ecf0ac4b9436635fc27964');
const metadata = JSON.parse(rawMetadata);
const inventory = JSON.parse(inventoryBytes);
const acquisition = JSON.parse(acquisitionBytes);
assert.equal(metadata.id, 'yvCR-EqMhng');
assert.equal(metadata.uploader, 'SETHLUI.com');
assert.equal(metadata.upload_date, '20260301');
assert.equal(metadata.duration, 738);
assert.equal(metadata.license, 'Creative Commons Attribution license (reuse allowed)');
assert.equal(inventory.metadata.license, metadata.license);
assert(inventory.metadata.subtitle_languages.includes('zh-Hans'));
assert(inventory.metadata.chinese_subtitle_formats['zh-Hans'].includes('srt'));
assert.equal(acquisition.http_status, 200);
assert.equal(acquisition.outcome, 'acquired');
assert.equal(acquisition.response_sha256, sha(youtube));
assert.equal(acquisition.response_bytes, youtube.length);
assert.equal(acquisition.matches_commons_bytes, false);
assert.equal(youtube.length, commons.length + 2);
assert(youtube.subarray(0, commons.length).equals(commons));
assert.deepEqual([...youtube.subarray(commons.length)], [10, 10]);
const parse = bytes => bytes.toString('utf8').trimEnd().split(/\r?\n\r?\n+/u).map((block, index) => {
  const [label, time, ...text] = block.split(/\r?\n/u);
  assert.equal(Number(label), index + 1);
  assert(text.length > 0 && text.every(Boolean));
  const match = time.match(/^(\d\d):(\d\d):(\d\d),(\d\d\d) --> (\d\d):(\d\d):(\d\d),(\d\d\d)$/u);
  assert(match, `Invalid timing at cue ${index + 1}`);
  const toMs = (h, m, s, ms) => (((Number(h) * 60 + Number(m)) * 60 + Number(s)) * 1000 + Number(ms));
  return { id: index + 1, start_ms: toMs(...match.slice(1, 5)),
    end_ms: toMs(...match.slice(5, 9)), raw: block };
});
const sourceRows = parse(youtube);
const derivativeRows = parse(derivative);
assert.equal(sourceRows.length, 271);
assert.equal(derivativeRows.length, 263);
for (let index = 0; index < 263; index++) assert.equal(derivativeRows[index].raw, sourceRows[index].raw);
const coverage = checkCueMediaCoverage(sourceRows, 738056);
assert.equal(coverage.overrun_count, 8);
assert.equal(coverage.first_overrun.cue_id, 264);
assert.equal(sourceRows[262].end_ms, 732900);
assert.equal(sourceRows[263].start_ms, 840100);
assert.equal(sourceRows[270].end_ms, 858333);
console.log(JSON.stringify({ video_id: metadata.id, uploader: metadata.uploader,
  observed_video_license: metadata.license, youtube_cues: sourceRows.length,
  commons_prefix_bytes: commons.length, youtube_extra_bytes: 2,
  derivative_cues: derivativeRows.length, media_duration_ms: 738056,
  first_out_of_media_cue: coverage.first_overrun.cue_id,
  out_of_media_cues: coverage.overrun_count, independent_speech_reviews: 0,
  caption_rights_decision: 'unknown' }, null, 2));
