import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { createHash, randomUUID } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { promisify } from 'node:util';
import { join, resolve } from 'node:path';

const run = promisify(execFile);
const root = resolve('.');
const directory = join(root,
  '.cache/eval/commons-vivo-media/media-46745446-cc07-4cff-b5e3-f98fe08262f0');
const attempt = randomUUID();
const media = join(directory, 'source.240p.webm');
const ffprobe = 'C:/Users/Ermolz/AppData/Local/Microsoft/WinGet/Packages/Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe/ffmpeg-8.1.2-full_build/bin/ffprobe.exe';
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const report = { schema_version: 1, id: 'commons-vivo-240p-stream-check-v1',
  source_srt_sha256: '8c41e66f52000a5b67ab27bfc319accd11d89290b60e50fc5c60f4ee8230a000',
  media_sha256: '7ad0484b31a6788c31632616649c51e6aaf6cdcdd7d90083d88e1d5ee66e1507',
  ffprobe_sha256: '9df3b0b5275e830961df6d94e1f7a71121a7abd5ff708e9fec8a0b6084a55015',
  timeout_ms: 30_000, max_output_bytes: 1_048_576,
  started_at: new Date().toISOString(), status: 'running' };
try {
  assert.equal(hash(await readFile(join(root,
    '.cache/eval/commons-vivo-979826861/source.zh.srt'))), report.source_srt_sha256);
  const acquisition = await readFile(join(directory, 'acquisition.json'));
  assert.equal(hash(acquisition), '4f9a277d797e47048bc5fff159f7a3c2e0714af30f83fe224e9b19086ac7d836');
  assert.equal(JSON.parse(acquisition).status, 'downloaded_private_unreviewed');
  const mediaBytes = await readFile(media);
  assert.equal(hash(mediaBytes), report.media_sha256);
  assert.equal(mediaBytes.length, 49_681_853);
  assert.equal(hash(await readFile(ffprobe)), report.ffprobe_sha256);
  const { stdout, stderr } = await run(ffprobe,
    ['-v', 'error', '-show_format', '-show_streams', '-of', 'json', media],
    { timeout: report.timeout_ms, maxBuffer: report.max_output_bytes });
  assert.equal(stderr.trim(), '');
  await writeFile(join(directory, `ffprobe-${attempt}.json`), stdout, { flag: 'wx' });
  report.ffprobe_output_sha256 = hash(Buffer.from(stdout));
  const parsed = JSON.parse(stdout);
  const video = parsed.streams.filter(stream => stream.codec_type === 'video');
  const audio = parsed.streams.filter(stream => stream.codec_type === 'audio');
  assert.equal(video.length, 1);
  assert.equal(audio.length, 1);
  assert.equal(video[0].codec_name, 'vp9');
  assert.equal(audio[0].codec_name, 'opus');
  assert.equal(video[0].width, 426);
  assert.equal(video[0].height, 240);
  report.duration_ms = Math.round(Number(parsed.format.duration) * 1000);
  assert(report.duration_ms >= 1_115_000 && report.duration_ms <= 1_117_000);
  report.video = { codec: video[0].codec_name, width: video[0].width, height: video[0].height };
  report.audio = { codec: audio[0].codec_name, channels: audio[0].channels,
    sample_rate: Number(audio[0].sample_rate) };
  report.status = 'streams_verified_speech_unverified';
  console.log(JSON.stringify({ duration_ms: report.duration_ms, video: report.video,
    audio: report.audio, speech_verified: false }));
} catch (error) {
  report.status = 'failed';
  report.error = error.message;
  process.exitCode = 1;
  console.error(error);
} finally {
  report.finished_at = new Date().toISOString();
  await writeFile(join(directory, `stream-check-${attempt}.json`), `${JSON.stringify(report, null, 2)}\n`,
    { flag: 'wx' });
}
