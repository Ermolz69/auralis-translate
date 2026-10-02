import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { checkCueMediaCoverage } from './cue-media-coverage.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const directory = path.join(root, '.cache/eval/commons-wikipedia-lesson-media/attempt-UGi9xp');
const ffprobe = 'C:/Users/Ermolz/AppData/Local/Microsoft/WinGet/Packages/Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe/ffmpeg-8.1.2-full_build/bin/ffprobe.exe';
const cli = path.join(root, 'target/debug', process.platform === 'win32'
  ? 'auralis-translation-cli.exe' : 'auralis-translation-cli');
const caption = path.join(root,
  '.cache/eval/commons-wikipedia-lesson-derivative-v1/source.zh.srt');
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
const expected = {
  acquisition: 'f7eb459d7ac93d7ab6c61a9769d6ad5acb2e30290ea28b36935ecabd4c2d13f0',
  media: 'bb72661298bbb6df017ee7e2a5f9cb93123592a810d8e19e6aa87c6cf4cd9ad1',
  ffprobe: '9df3b0b5275e830961df6d94e1f7a71121a7abd5ff708e9fec8a0b6084a55015',
  caption: '3d4569cdc6d9be7fa58c8d5e7e2c5d0ff70e354c80543c276ef98d63ff6c82b5',
};
if (process.argv.includes('--preflight')) {
  console.log(JSON.stringify({ directory, ffprobe, expected,
    ffprobe_processes: 1, cli_processes: 1,
    timeout_ms_each: 30_000, max_output_bytes_each: 1_048_576 }, null, 2));
  process.exit(0);
}

const media = path.join(directory, 'source.ogv');
assert.equal(sha256(await fs.readFile(path.join(directory, 'acquisition.json'))),
  expected.acquisition);
assert.equal(sha256(await fs.readFile(media)), expected.media);
assert.equal(sha256(await fs.readFile(ffprobe)), expected.ffprobe);
assert.equal(sha256(await fs.readFile(caption)), expected.caption);
const run = (executable, args) => spawnSync(executable, args, {
  cwd: root, encoding: 'utf8', timeout: 30_000, maxBuffer: 1_048_576,
  windowsHide: true });
const measured = run(ffprobe,
  ['-v', 'error', '-show_format', '-show_streams', '-of', 'json', media]);
assert(!measured.error, String(measured.error));
assert.equal(measured.status, 0, measured.stderr);
assert.equal(measured.stderr.trim(), '');
const probe = JSON.parse(measured.stdout);
const video = probe.streams.filter(stream => stream.codec_type === 'video');
const audio = probe.streams.filter(stream => stream.codec_type === 'audio');
assert.equal(video.length, 1);
assert.equal(audio.length, 1);
const durationMs = Math.round(Number(probe.format.duration) * 1000);
assert(Number.isSafeInteger(durationMs) && durationMs > 0);
const inspected = run(cli, ['--json', 'inspect', caption]);
assert(!inspected.error, String(inspected.error));
assert.equal(inspected.status, 0, inspected.stderr);
const envelope = JSON.parse(inspected.stdout);
assert.equal(envelope.report?.report?.source_sha256, expected.caption);
const segments = envelope.report.report.segments;
assert.equal(segments.length, 37);
const coverage = checkCueMediaCoverage(segments, durationMs);
assert.equal(coverage.covers_media, true);
const result = { experiment: 'DATA-03-commons-wikipedia-lesson-media-check-2026-10-02-v1',
  acquisition_sha256: expected.acquisition, media_sha256: expected.media,
  caption_sha256: expected.caption, ffprobe_sha256: expected.ffprobe,
  ffprobe_output_sha256: sha256(Buffer.from(measured.stdout)),
  video: { codec: video[0].codec_name, width: video[0].width,
    height: video[0].height },
  audio: { codec: audio[0].codec_name, sample_rate: Number(audio[0].sample_rate),
    channels: audio[0].channels },
  coverage, language_listened: false, cue_alignment_listened: false };
const recordPath = path.join(directory, 'media-check.json');
try {
  await fs.writeFile(recordPath, `${JSON.stringify(result, null, 2)}\n`, { flag: 'wx' });
  await fs.writeFile(path.join(directory, 'ffprobe.json'), measured.stdout, { flag: 'wx' });
} catch (error) {
  if (error.code !== 'EEXIST') throw error;
  assert.deepEqual(JSON.parse(await fs.readFile(recordPath, 'utf8')), result);
}
console.log(JSON.stringify(result, null, 2));
