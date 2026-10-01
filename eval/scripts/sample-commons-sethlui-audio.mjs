import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { createHash, randomUUID } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { promisify } from 'node:util';

const run = promisify(execFile);
const root = resolve('.');
const media = join(root,
  '.cache/eval/commons-sethlui-media/media-86cd634d-fa4e-43eb-ba4b-472b4bf5c9e1/source.240p.webm');
const source = join(root,
  '.cache/eval/commons-sethlui-caption/caption-Cgsmq4/source.zh.srt');
const derivation = join(root,
  '.cache/eval/commons-sethlui-media/derived-1e655c9c-f93e-4b03-938c-f2510640fa2b/derivation.json');
const ffmpeg = 'C:/Users/Ermolz/AppData/Local/Microsoft/WinGet/Packages/Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe/ffmpeg-8.1.2-full_build/bin/ffmpeg.exe';
const expected = {
  media: '6e29f1512a76f553bdfc1678f458a69cf010e4653ac3f1cdfc4c45742bfb39d6',
  source: '077aef6a49aa7128f5ddd349f38ffc84dd669f5e4bbfae6d692efa2d78304967',
  derivation: 'da63dec61c03ccbfcc307aa028e9499b8ba9a65de41c1df6b0daab5a629a9a4f',
  ffmpeg: 'ad8f211bc894755e0061c55ab280ae00e8d3d4f15a8cc4372b24cfa247b5942e',
};
const windows = [
  { label: 'start', start_seconds: 8, expected_cues: [1, 2, 3, 4, 5, 6] },
  { label: 'middle', start_seconds: 360, expected_cues: [123, 124, 125, 126, 127, 128, 129] },
  { label: 'end', start_seconds: 725, expected_cues: [260, 261, 262, 263] },
];
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
if (process.argv.includes('--preflight')) {
  console.log(JSON.stringify({ media, source, derivation, ffmpeg, expected,
    windows, ffmpeg_processes: 3, process_timeout_ms: 30_000,
    requested_clip_seconds: 12, network_requests: 0, model_requests: 0,
    retries: 0 }, null, 2));
  process.exit(0);
}

function inspectPcmWav(bytes) {
  assert.equal(bytes.toString('ascii', 0, 4), 'RIFF');
  assert.equal(bytes.toString('ascii', 8, 12), 'WAVE');
  let offset = 12;
  let format = null;
  let pcm = null;
  while (offset + 8 <= bytes.length) {
    const id = bytes.toString('ascii', offset, offset + 4);
    const size = bytes.readUInt32LE(offset + 4);
    const dataStart = offset + 8;
    assert(dataStart + size <= bytes.length, 'incomplete WAV chunk');
    if (id === 'fmt ') {
      assert(size >= 16);
      format = { codec_id: bytes.readUInt16LE(dataStart),
        channels: bytes.readUInt16LE(dataStart + 2),
        sample_rate: bytes.readUInt32LE(dataStart + 4),
        bit_depth: bytes.readUInt16LE(dataStart + 14) };
    }
    if (id === 'data') pcm = bytes.subarray(dataStart, dataStart + size);
    offset = dataStart + size + (size % 2);
  }
  assert.deepEqual(format,
    { codec_id: 1, channels: 1, sample_rate: 16000, bit_depth: 16 });
  assert(pcm && pcm.length >= 300_000 && pcm.length <= 390_000);
  assert.equal(pcm.length % 2, 0);
  let nonzero = 0;
  for (let index = 0; index < pcm.length; index += 2)
    if (pcm.readInt16LE(index) !== 0) nonzero++;
  assert(nonzero > 0, 'all-zero source audio');
  return { ...format, pcm_bytes: pcm.length,
    decoded_duration_ms: Math.round(pcm.length / 2 / 16000 * 1000),
    nonzero_samples: nonzero };
}

const output = join(root, '.cache/eval/commons-sethlui-audio', `window-${randomUUID()}`);
await mkdir(output, { recursive: true });
const started = Date.now();
const report = { experiment: 'DATA-03-commons-sethlui-audio-windows-2026-10-01-v1',
  started_at: new Date(started).toISOString(), status: 'running',
  expected, windows: [], requested_clip_seconds: 12,
  process_timeout_ms: 30_000, network_requests: 0, model_requests: 0,
  speech_language_reviewed: false, alignment_reviewed: false,
  human_listening_count: 0 };
try {
  const mediaBytes = await readFile(media);
  const sourceBytes = await readFile(source);
  const derivationBytes = await readFile(derivation);
  assert.equal(sha256(mediaBytes), expected.media);
  assert.equal(sha256(sourceBytes), expected.source);
  assert.equal(sha256(derivationBytes), expected.derivation);
  assert.equal(sha256(await readFile(ffmpeg)), expected.ffmpeg);
  const mapping = JSON.parse(derivationBytes.toString('utf8')).mapping;
  assert.equal(mapping.length, 271);
  const sourceText = new TextDecoder('utf-8', { fatal: true }).decode(sourceBytes);
  const newline = sourceText.includes('\r\n') ? '\r\n' : '\n';
  const blocks = sourceText.replace(/(?:\r?\n)+$/u, '').split(newline + newline);
  assert.equal(blocks.length, mapping.length);
  for (const window of windows) {
    const startMs = window.start_seconds * 1000;
    const endMs = startMs + 12_000;
    const cues = mapping.filter(cue => cue.derived_cue_id !== null
      && cue.end_ms > startMs && cue.start_ms < endMs);
    assert.deepEqual(cues.map(cue => cue.original_cue_id), window.expected_cues);
    const clip = join(output, `${window.label}.wav`);
    const attempt = { label: window.label, start_ms: startMs,
      end_ms: endMs, requested_duration_ms: 12_000,
      source_cues: cues.map(cue => ({ original_cue_id: cue.original_cue_id,
        start_ms: cue.start_ms, end_ms: cue.end_ms,
        text: blocks[cue.original_cue_id - 1].split(newline).slice(2).join(newline) })) };
    report.windows.push(attempt);
    const clipStarted = Date.now();
    try {
      const { stdout, stderr } = await run(ffmpeg,
        ['-hide_banner', '-loglevel', 'error', '-nostdin', '-ss', String(window.start_seconds),
          '-i', media, '-t', '12', '-vn', '-ac', '1', '-ar', '16000',
          '-c:a', 'pcm_s16le', clip],
        { timeout: 30_000, maxBuffer: 1_048_576, windowsHide: true });
      attempt.stdout = stdout;
      attempt.stderr = stderr;
      assert.equal(stdout.trim(), '');
      assert.equal(stderr.trim(), '');
      const bytes = await readFile(clip);
      attempt.wav_bytes = bytes.length;
      attempt.wav_sha256 = sha256(bytes);
      attempt.pcm = inspectPcmWav(bytes);
      assert(attempt.pcm.decoded_duration_ms >= 11_900
        && attempt.pcm.decoded_duration_ms <= 12_100);
      attempt.status = 'decoded_unlistened';
    } catch (error) {
      attempt.status = 'failed';
      attempt.error = String(error);
      throw error;
    } finally {
      attempt.elapsed_ms = Date.now() - clipStarted;
    }
  }
  report.status = 'decoded_unlistened';
} catch (error) {
  report.status = 'failed';
  report.error = String(error);
  process.exitCode = 1;
} finally {
  report.finished_at = new Date().toISOString();
  report.elapsed_ms = Date.now() - started;
  await writeFile(join(output, 'review-packet.json'),
    `${JSON.stringify(report, null, 2)}\n`, { flag: 'wx' });
  console.log(JSON.stringify({ directory: output, status: report.status,
    error: report.error ?? null, windows: report.windows.map(window => ({
      label: window.label, start_ms: window.start_ms, end_ms: window.end_ms,
      cue_ids: window.source_cues.map(cue => cue.original_cue_id),
      wav_sha256: window.wav_sha256 ?? null,
      pcm: window.pcm ?? null, status: window.status,
    })), human_listening_count: report.human_listening_count }, null, 2));
}
