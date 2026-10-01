import assert from 'node:assert/strict';
import { createHash, randomUUID } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { createReadStream } from 'node:fs';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { checkCueMediaCoverage } from './cue-media-coverage.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const mediaDir = path.join(root, '.cache/eval/paywall-media/media-TPwlPu');
const mediaPath = path.join(mediaDir, 'source.ogv');
const captionPath = path.join(root, '.cache/eval/paywall-chinese-caption/source.zh.srt');
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
const acquisitionBytes = await fs.readFile(path.join(mediaDir, 'acquisition.json'));
const acquisition = JSON.parse(acquisitionBytes);
assert.equal(acquisition.outcome, 'acquired_private_unreviewed');
assert.equal(acquisition.sha256,
  '1bc2e667d296cfb9d11ebdf4ecfec468e3c6fd2aa969f2f6bbfb3fbe46343fd0');
const digest = createHash('sha256');
let size = 0;
for await (const chunk of createReadStream(mediaPath)) {
  digest.update(chunk);
  size += chunk.length;
}
assert.equal(size, acquisition.expected.bytes);
assert.equal(digest.digest('hex'), acquisition.sha256);
const caption = await fs.readFile(captionPath);
assert.equal(sha256(caption),
  '3406fcd365446d727f31c4ecf576de6c3b5e168658c3f5d276fea8142ddb5a4b');

const ffprobe = spawnSync('ffprobe', ['-v', 'error', '-show_format', '-show_streams',
  '-print_format', 'json', mediaPath], { cwd: root, encoding: 'utf8', timeout: 60_000,
  maxBuffer: 4 * 1024 * 1024, windowsHide: true });
assert.equal(ffprobe.status, 0, `ffprobe failed: ${ffprobe.error?.message ?? ffprobe.stderr}`);
const observed = JSON.parse(ffprobe.stdout);
const durationMs = Math.round(Number(observed.format.duration) * 1000);
assert(Math.abs(durationMs - 3_888_090) <= 1000, 'OGV duration differs from Archive metadata');
const streams = observed.streams.map(stream => ({ index: stream.index,
  type: stream.codec_type, codec: stream.codec_name, duration: stream.duration,
  sample_rate: stream.sample_rate, channels: stream.channels,
  width: stream.width, height: stream.height }));
assert(streams.some(stream => stream.type === 'video'));
assert(streams.some(stream => stream.type === 'audio'));

const cli = path.join(root, 'target/debug', process.platform === 'win32'
  ? 'auralis-translation-cli.exe' : 'auralis-translation-cli');
const inspected = spawnSync(cli, ['--json', 'inspect', captionPath], {
  cwd: root, encoding: 'utf8', timeout: 30_000, maxBuffer: 4 * 1024 * 1024,
  windowsHide: true });
assert.equal(inspected.status, 0,
  `strict SRT inspection failed: ${inspected.error?.message ?? inspected.stderr}`);
const envelope = JSON.parse(inspected.stdout);
const segments = envelope.report?.report?.segments;
assert.equal(envelope.report?.report?.source_sha256, sha256(caption));
assert.equal(segments?.length, 880);
const coverage = checkCueMediaCoverage(segments, durationMs);
assert.equal(coverage.covers_media, true, 'Chinese cues exceed observed video duration');
const report = { schema_version: 1, source_media_sha256: acquisition.sha256,
  acquisition_report_sha256: sha256(acquisitionBytes), source_caption_sha256: sha256(caption),
  media_bytes: size, media_duration_ms: durationMs, format_name: observed.format.format_name,
  streams, cue_count: segments.length, first_cue_start_ms: segments[0].start_ms,
  last_cue_end_ms: segments.at(-1).end_ms, ...coverage,
  outcome: 'technical_media_and_cue_envelope_verified',
  human_speech_alignment: 'not_reviewed', human_audio_quality: 'not_reviewed' };
const reportPath = path.join(mediaDir, `check-${randomUUID()}.json`);
await fs.writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, { flag: 'wx' });
console.log(JSON.stringify({ report_path: reportPath, ...report }, null, 2));
