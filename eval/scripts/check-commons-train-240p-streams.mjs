import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { createHash, randomUUID } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { promisify } from 'node:util';
import { join, resolve } from 'node:path';

const run = promisify(execFile);
const root = resolve('.');
const directory = join(root,
  '.cache/eval/commons-train-media/media-90d44a55-3c53-44e7-b496-32e80ab85060');
const attempt = randomUUID();
const media = join(directory, 'source.240p.webm');
const ffprobe = 'C:/Users/Ermolz/AppData/Local/Microsoft/WinGet/Packages/Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe/ffmpeg-8.1.2-full_build/bin/ffprobe.exe';
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const report = { schema_version: 1, id: 'commons-train-240p-stream-check-v1',
  source_srt_sha256: 'ccc47105cdc2c782d82421d9790e5babf5801a8196d1b6b744d6b8df71bf9b4c',
  media_sha256: 'df7f7c8116a746b690a6c7d8120ed22b738aaf7cd63e6e9b3d55b33411784365',
  ffprobe_sha256: '9df3b0b5275e830961df6d94e1f7a71121a7abd5ff708e9fec8a0b6084a55015',
  timeout_ms: 30_000, max_output_bytes: 1_048_576,
  started_at: new Date().toISOString(), status: 'running' };
try {
  assert.equal(hash(await readFile(join(root,
    '.cache/eval/commons-train-1144114810/source.zh.srt'))), report.source_srt_sha256);
  const acquisition = await readFile(join(directory, 'acquisition.json'));
  assert.equal(hash(acquisition), '0e1ca05d236359908e708f7220468954826fed304b8204c6f6dc4e882eac6fda');
  assert.equal(JSON.parse(acquisition).status, 'downloaded_private_unreviewed');
  const mediaBytes = await readFile(media);
  assert.equal(hash(mediaBytes), report.media_sha256);
  assert.equal(mediaBytes.length, 72_838_299);
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
  assert(report.duration_ms >= 1_229_000 && report.duration_ms <= 1_231_000);
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
