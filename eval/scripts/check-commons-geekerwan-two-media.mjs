import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { createHash, randomUUID } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { promisify } from 'node:util';

const run = promisify(execFile);
const root = resolve('.');
const bin = 'C:/Users/Ermolz/AppData/Local/Microsoft/WinGet/Packages/Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe/ffmpeg-8.1.2-full_build/bin';
const ffprobe = join(bin, 'ffprobe.exe');
const ffmpeg = join(bin, 'ffmpeg.exe');
const ffprobeSha256 = '9df3b0b5275e830961df6d94e1f7a71121a7abd5ff708e9fec8a0b6084a55015';
const ffmpegSha256 = 'ad8f211bc894755e0061c55ab280ae00e8d3d4f15a8cc4372b24cfa247b5942e';
const sources = [
  {
    id: 'asus-rog-ally', revision: '892592485',
    sourceSha256: '923aed3991c2308d92b89c45181cea8ec7ece74e9b4d3a3ce0234d95e329913b',
    attempt: 'asus-rog-ally-fd0d9bf6-f2b4-4329-a8cf-ad0b5becf72e',
    acquisitionSha256: 'd45bc1e6ba2a617cb9a9fbe26c1c1c5f9d22eaad8c42872ffc02fe827df77e7d',
    mediaSha256: '9e4271f8112de2fa65ad67c4cec3390529e916d70363bc5f4c421f4479b97cc1',
    mediaBytes: 27_074_541, durationRangeMs: [881_000, 884_000],
    positions: [{ label: 'start', seconds: 0 }, { label: 'middle', seconds: 440 },
      { label: 'end', seconds: 870 }],
  },
  {
    id: 'huawei-kirin-9010', revision: '880535591',
    sourceSha256: '57dfd9feb3bfe6381421c4142820b780af341e195e52ee81d58e8f9f12858feb',
    attempt: 'huawei-kirin-9010-8b5d98b9-25ac-42bd-a32a-ac318a97a1c2',
    acquisitionSha256: '5c4ab3ecb8ce205f0ef4f876671e51d55e922e375529104771078e55ff5a539b',
    mediaSha256: '2911c8a14b6da9fa62d46235aa09a1b240ee1409ec8e28336edc7ed90c9af586',
    mediaBytes: 18_730_911, durationRangeMs: [761_000, 764_000],
    positions: [{ label: 'start', seconds: 0 }, { label: 'middle', seconds: 380 },
      { label: 'end', seconds: 750 }],
  },
];
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
assert.equal(hash(await readFile(ffprobe)), ffprobeSha256);
assert.equal(hash(await readFile(ffmpeg)), ffmpegSha256);
let failed = false;

for (const source of sources) {
  const directory = join(root, '.cache/eval/commons-geekerwan-two-media', source.attempt);
  const output = join(directory, `check-${randomUUID()}`);
  await mkdir(output, { recursive: true });
  const started = Date.now();
  const report = {
    schema_version: 1, id: source.id, source_srt_sha256: source.sourceSha256,
    acquisition_sha256: source.acquisitionSha256, media_sha256: source.mediaSha256,
    ffprobe_sha256: ffprobeSha256, ffmpeg_sha256: ffmpegSha256,
    positions: source.positions, requested_clip_seconds: 12,
    timeout_ms_per_process: 30_000,
    started_at: new Date(started).toISOString(), status: 'running', clips: [],
  };
  try {
    const sourcePath = join(root,
      `.cache/eval/commons-${source.id}-${source.revision}/source.zh.srt`);
    assert.equal(hash(await readFile(sourcePath)), source.sourceSha256);
    const acquisitionBytes = await readFile(join(directory, 'acquisition.json'));
    assert.equal(hash(acquisitionBytes), source.acquisitionSha256);
    assert.equal(JSON.parse(acquisitionBytes).status, 'downloaded_private_unreviewed');
    const media = join(directory, 'source.240p.webm');
    const mediaBytes = await readFile(media);
    assert.equal(mediaBytes.length, source.mediaBytes);
    assert.equal(hash(mediaBytes), source.mediaSha256);
    const { stdout, stderr } = await run(ffprobe,
      ['-v', 'error', '-show_format', '-show_streams', '-of', 'json', media],
      { timeout: 30_000, maxBuffer: 1_048_576 });
    assert.equal(stderr.trim(), '');
    await writeFile(join(output, 'ffprobe.json'), stdout, { flag: 'wx' });
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
    assert(report.duration_ms >= source.durationRangeMs[0]
      && report.duration_ms <= source.durationRangeMs[1]);
    report.video = { codec: video[0].codec_name, width: video[0].width,
      height: video[0].height };
    report.audio = { codec: audio[0].codec_name, channels: audio[0].channels,
      sample_rate: Number(audio[0].sample_rate) };
    for (const position of source.positions) {
      const clip = join(output, `${position.label}.wav`);
      const clipStarted = Date.now();
      try {
        const result = await run(ffmpeg, ['-hide_banner', '-loglevel', 'error',
          '-nostdin', '-ss', String(position.seconds), '-i', media, '-t', '12',
          '-vn', '-ac', '1', '-ar', '16000', '-c:a', 'pcm_s16le', clip],
        { timeout: 30_000, maxBuffer: 1_048_576 });
        assert.equal(result.stdout.trim(), '');
        assert.equal(result.stderr.trim(), '');
        const bytes = await readFile(clip);
        assert(bytes.length >= 300_000 && bytes.length <= 390_000,
          'Unexpected decoded WAV size');
        assert.equal(bytes.toString('ascii', 0, 4), 'RIFF');
        assert.equal(bytes.toString('ascii', 8, 12), 'WAVE');
        const pcm = bytes.subarray(44);
        let nonzeroSamples = 0;
        for (let offset = 0; offset + 1 < pcm.length; offset += 2)
          if (pcm.readInt16LE(offset) !== 0) nonzeroSamples++;
        assert(nonzeroSamples > 0, 'All-zero decoded PCM');
        const probed = await run(ffprobe,
          ['-v', 'error', '-show_format', '-show_streams', '-of', 'json', clip],
          { timeout: 30_000, maxBuffer: 1_048_576 });
        assert.equal(probed.stderr.trim(), '');
        const wav = JSON.parse(probed.stdout);
        assert.equal(wav.streams.length, 1);
        assert.equal(wav.streams[0].codec_name, 'pcm_s16le');
        assert.equal(wav.streams[0].channels, 1);
        assert.equal(Number(wav.streams[0].sample_rate), 16_000);
        const decodedDurationMs = Math.round(Number(wav.format.duration) * 1000);
        assert(decodedDurationMs >= 9_000 && decodedDurationMs <= 12_100,
          'Decoded sample falls outside the source inspection window');
        report.clips.push({ ...position, path: clip, bytes: bytes.length,
          sha256: hash(bytes), nonzero_samples: nonzeroSamples,
          decoded_duration_ms: decodedDurationMs,
          elapsed_ms: Date.now() - clipStarted });
      } catch (error) {
        report.clips.push({ ...position, error: error.message,
          elapsed_ms: Date.now() - clipStarted });
        throw error;
      }
    }
    report.status = 'decoded_unlistened';
    console.log(JSON.stringify({ id: source.id, duration_ms: report.duration_ms,
      video: report.video, audio: report.audio, clips: report.clips.length,
      speech_verified: false }));
  } catch (error) {
    failed = true;
    report.status = 'failed';
    report.error = error.message;
    console.error(`${source.id}: ${error.message}`);
  } finally {
    report.finished_at = new Date().toISOString();
    report.elapsed_ms = Date.now() - started;
    const reportPath = join(output, 'report.json');
    await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, { flag: 'wx' });
    console.log(`Private stream/audio check: ${reportPath}`);
  }
}
if (failed) process.exitCode = 1;
