import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { createHash, randomUUID } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { promisify } from 'node:util';
import { checkCueMediaCoverage } from './cue-media-coverage.mjs';

const run = promisify(execFile);
const root = resolve('.');
const parent = join(root, '.cache/eval/commons-sethlui-media');
const mediaDirectory = join(parent, 'media-86cd634d-fa4e-43eb-ba4b-472b4bf5c9e1');
const sourcePath = join(root,
  '.cache/eval/commons-sethlui-caption/caption-Cgsmq4/source.zh.srt');
const ffprobe = 'C:/Users/Ermolz/AppData/Local/Microsoft/WinGet/Packages/Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe/ffmpeg-8.1.2-full_build/bin/ffprobe.exe';
const expected = {
  source: '077aef6a49aa7128f5ddd349f38ffc84dd669f5e4bbfae6d692efa2d78304967',
  acquisition: '63dbde64f502e06021a5edf635168a4c14d2a6344bb62569116e0b4e007dd1af',
  media: '6e29f1512a76f553bdfc1678f458a69cf010e4653ac3f1cdfc4c45742bfb39d6',
  ffprobe: '9df3b0b5275e830961df6d94e1f7a71121a7abd5ff708e9fec8a0b6084a55015',
};
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
if (process.argv.includes('--preflight')) {
  console.log(JSON.stringify({ media_directory: mediaDirectory, source_path: sourcePath,
    ffprobe, expected, ffprobe_processes: 1, ffprobe_timeout_ms: 30_000,
    ffprobe_max_output_bytes: 1_048_576,
    derivative_policy: 'retain exact source cues 1-263 only if cue 264 starts after measured media end' }, null, 2));
  process.exit(0);
}
const output = join(parent, `derived-${randomUUID()}`);
await mkdir(output, { recursive: true });
const started = Date.now();
const report = { experiment: 'DATA-03-commons-sethlui-stream-derivative-2026-10-01-v1',
  started_at: new Date(started).toISOString(), status: 'running',
  source_sha256: expected.source, acquisition_sha256: expected.acquisition,
  media_sha256: expected.media, ffprobe_sha256: expected.ffprobe,
  ffprobe_timeout_ms: 30_000, ffprobe_max_output_bytes: 1_048_576 };
try {
  const source = await readFile(sourcePath);
  const media = await readFile(join(mediaDirectory, 'source.240p.webm'));
  const acquisition = await readFile(join(mediaDirectory, 'acquisition.json'));
  assert.equal(sha256(source), expected.source);
  assert.equal(sha256(media), expected.media);
  assert.equal(sha256(acquisition), expected.acquisition);
  assert.equal(sha256(await readFile(ffprobe)), expected.ffprobe);
  const acquired = JSON.parse(acquisition.toString('utf8'));
  assert.equal(acquired.status, 'downloaded_private_unreviewed');
  assert.equal(acquired.media_sha256, expected.media);
  assert.equal(acquired.media_bytes, media.length);

  const { stdout, stderr } = await run(ffprobe,
    ['-v', 'error', '-show_format', '-show_streams', '-of', 'json',
      join(mediaDirectory, 'source.240p.webm')],
    { timeout: 30_000, maxBuffer: 1_048_576, windowsHide: true });
  await writeFile(join(output, 'ffprobe.json'), stdout, { flag: 'wx' });
  report.ffprobe_output_sha256 = sha256(Buffer.from(stdout));
  report.ffprobe_stderr = stderr;
  assert.equal(stderr.trim(), '');
  const probe = JSON.parse(stdout);
  const videos = probe.streams.filter(stream => stream.codec_type === 'video');
  const audios = probe.streams.filter(stream => stream.codec_type === 'audio');
  assert.equal(videos.length, 1);
  assert.equal(audios.length, 1);
  assert.equal(videos[0].codec_name, 'vp9');
  assert.equal(audios[0].codec_name, 'opus');
  assert.equal(videos[0].width, 426);
  assert.equal(videos[0].height, 240);
  const durationMs = Math.round(Number(probe.format.duration) * 1000);
  assert(Number.isSafeInteger(durationMs) && durationMs > 0);
  report.media_duration_ms = durationMs;
  report.video = { codec: videos[0].codec_name, width: videos[0].width,
    height: videos[0].height };
  report.audio = { codec: audios[0].codec_name,
    sample_rate: Number(audios[0].sample_rate), channels: audios[0].channels };

  const sourceText = new TextDecoder('utf-8', { fatal: true }).decode(source);
  const newline = sourceText.includes('\r\n') ? '\r\n' : '\n';
  const separator = newline + newline;
  const trimmed = sourceText.replace(/(?:\r?\n)+$/u, '');
  const blocks = trimmed.split(separator);
  assert.equal(blocks.length, 271, 'original cue count changed');
  const toMs = parts => (((Number(parts[0]) * 60 + Number(parts[1])) * 60
    + Number(parts[2])) * 1000 + Number(parts[3]));
  const timing = /^([0-9]{2}):([0-9]{2}):([0-9]{2}),([0-9]{3}) --> ([0-9]{2}):([0-9]{2}):([0-9]{2}),([0-9]{3})$/u;
  const mapping = blocks.map((block, index) => {
    const lines = block.split(newline);
    assert.equal(Number(lines[0]), index + 1, 'cue identity or order changed');
    const match = timing.exec(lines[1] ?? '');
    assert(match, `cue ${index + 1} has unexpected timing`);
    assert(lines.slice(2).some(line => line.length > 0), 'empty cue text');
    return { original_cue_id: index + 1,
      derived_cue_id: index < 263 ? index + 1 : null,
      start_ms: toMs(match.slice(1, 5)), end_ms: toMs(match.slice(5, 9)),
      block_sha256: sha256(Buffer.from(block, 'utf8')) };
  });
  const originalCoverage = checkCueMediaCoverage(mapping.map(cue => ({
    id: cue.original_cue_id, start_ms: cue.start_ms, end_ms: cue.end_ms,
  })), durationMs);
  report.original_coverage = originalCoverage;
  assert.equal(originalCoverage.overrun_count, 8);
  assert.equal(originalCoverage.first_overrun.cue_id, 264);
  assert(mapping[262].end_ms <= durationMs && mapping[263].start_ms > durationMs,
    'measured stream does not isolate first 263 cues');
  const retained = mapping.slice(0, 263);
  const derivativeCoverage = checkCueMediaCoverage(retained.map(cue => ({
    id: cue.derived_cue_id, start_ms: cue.start_ms, end_ms: cue.end_ms,
  })), durationMs);
  assert.equal(derivativeCoverage.covers_media, true);
  const derivedText = blocks.slice(0, 263).join(separator) + newline;
  assert(sourceText.startsWith(derivedText.slice(0, -newline.length)),
    'derivative is not the exact source prefix');
  const derivedBytes = Buffer.from(derivedText, 'utf8');
  await writeFile(join(output, 'source.zh.srt'), derivedBytes, { flag: 'wx' });
  report.derived_sha256 = sha256(derivedBytes);
  report.derived_bytes = derivedBytes.length;
  report.derived_cue_count = retained.length;
  report.derivative_coverage = derivativeCoverage;
  report.mapping = mapping;
  report.status = 'derived_private_unreviewed';
} catch (error) {
  report.status = 'failed';
  report.error = String(error);
  process.exitCode = 1;
} finally {
  report.finished_at = new Date().toISOString();
  report.elapsed_ms = Date.now() - started;
  await writeFile(join(output, 'derivation.json'),
    `${JSON.stringify(report, null, 2)}\n`, { flag: 'wx' });
  console.log(JSON.stringify({ directory: output, status: report.status,
    error: report.error ?? null, media_duration_ms: report.media_duration_ms ?? null,
    original_coverage: report.original_coverage ?? null,
    derived_cue_count: report.derived_cue_count ?? null,
    derived_sha256: report.derived_sha256 ?? null }, null, 2));
}
