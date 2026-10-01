import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const mediaPath = path.join(root, '.cache/eval/paywall-media/media-TPwlPu/source.ogv');
const captionPath = path.join(root, '.cache/eval/paywall-chinese-caption/source.zh.srt');
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
function pcmWavDurationMs(bytes) {
  assert.equal(bytes.toString('ascii', 0, 4), 'RIFF');
  assert.equal(bytes.toString('ascii', 8, 12), 'WAVE');
  let format;
  let dataBytes;
  for (let offset = 12; offset + 8 <= bytes.length;) {
    const chunkName = bytes.toString('ascii', offset, offset + 4);
    const chunkBytes = bytes.readUInt32LE(offset + 4);
    const body = offset + 8;
    assert(body + chunkBytes <= bytes.length, 'WAV chunk exceeds file length');
    if (chunkName === 'fmt ') {
      assert.equal(bytes.readUInt16LE(body), 1, 'Expected PCM WAV');
      format = { channels: bytes.readUInt16LE(body + 2),
        sample_rate: bytes.readUInt32LE(body + 4),
        bits_per_sample: bytes.readUInt16LE(body + 14) };
    }
    if (chunkName === 'data') dataBytes = chunkBytes;
    offset = body + chunkBytes + chunkBytes % 2;
  }
  assert.deepEqual(format, { channels: 1, sample_rate: 16000, bits_per_sample: 16 });
  assert(Number.isInteger(dataBytes) && dataBytes > 0);
  return Math.round(dataBytes / (format.sample_rate * format.channels * format.bits_per_sample / 8) * 1000);
}
const mediaReport = JSON.parse(await fs.readFile(path.join(root,
  '.cache/eval/paywall-media/media-TPwlPu/acquisition.json'), 'utf8'));
assert.equal(mediaReport.sha256, '1bc2e667d296cfb9d11ebdf4ecfec468e3c6fd2aa969f2f6bbfb3fbe46343fd0');
const caption = await fs.readFile(captionPath);
assert.equal(sha256(caption), '3406fcd365446d727f31c4ecf576de6c3b5e168658c3f5d276fea8142ddb5a4b');
const cli = path.join(root, 'target/debug', process.platform === 'win32'
  ? 'auralis-translation-cli.exe' : 'auralis-translation-cli');
const inspected = spawnSync(cli, ['--json', 'inspect', captionPath], {
  cwd: root, encoding: 'utf8', timeout: 30_000, maxBuffer: 4 * 1024 * 1024,
  windowsHide: true });
assert.equal(inspected.status, 0, inspected.error?.message ?? inspected.stderr);
const cues = JSON.parse(inspected.stdout).report.report.segments;
const windows = [300, 1920, 3600];
const durationSeconds = 20;
const maxWavBytes = 2 * 1024 * 1024;
const parent = path.join(root, '.cache/eval/paywall-audio-samples');
await fs.mkdir(parent, { recursive: true });
const workspace = await fs.mkdtemp(path.join(parent, 'samples-'));
const report = { schema_version: 1, experiment: 'DATA-03-paywall-source-audio-2026-10-01-v1',
  source_media_sha256: mediaReport.sha256, source_caption_sha256: sha256(caption),
  started_at: new Date().toISOString(), windows: [], outcome: 'running',
  budget: { windows: 3, seconds_each: durationSeconds, process_timeout_ms: 90_000,
    max_wav_bytes_each: maxWavBytes, retries: 0 } };
try {
  for (const startSeconds of windows) {
    const outputName = `source-${startSeconds}s.wav`;
    const outputPath = path.join(workspace, outputName);
    const args = ['-v', 'error', '-ss', String(startSeconds), '-i', mediaPath,
      '-map', '0:a:0', '-vn', '-t', String(durationSeconds), '-ac', '1',
      '-ar', '16000', '-c:a', 'pcm_s16le', outputPath];
    const started = performance.now();
    const decoded = spawnSync('ffmpeg', args, { cwd: root, encoding: 'utf8',
      timeout: 90_000, maxBuffer: 1024 * 1024, windowsHide: true });
    const window = { start_ms: startSeconds * 1000, end_ms: (startSeconds + durationSeconds) * 1000,
      command: 'ffmpeg ' + args.map(arg => arg === mediaPath ? '<pinned media>' :
        arg === outputPath ? outputName : arg).join(' '),
      exit_code: decoded.status, stderr: decoded.stderr,
      process_error: decoded.error?.message ?? null,
      elapsed_ms: Math.round(performance.now() - started) };
    report.windows.push(window);
    assert.equal(decoded.status, 0, `FFmpeg sample failed at ${startSeconds}s: ${window.process_error ?? window.stderr}`);
    const bytes = await fs.readFile(outputPath);
    assert(bytes.length <= maxWavBytes, `WAV exceeded byte budget at ${startSeconds}s`);
    assert(bytes.length > 44 && bytes.toString('ascii', 0, 4) === 'RIFF'
      && bytes.toString('ascii', 8, 12) === 'WAVE');
    window.wav_bytes = bytes.length;
    window.wav_sha256 = sha256(bytes);
    window.decoded_duration_ms = pcmWavDurationMs(bytes);
    assert(Math.abs(window.decoded_duration_ms - durationSeconds * 1000) <= 100,
      `WAV duration differs from declared window at ${startSeconds}s`);
    window.output_name = outputName;
    window.overlapping_cues = cues.filter(cue =>
      cue.start_ms < window.end_ms && cue.end_ms > window.start_ms).map(cue => ({
      id: cue.id, start_ms: cue.start_ms, end_ms: cue.end_ms,
      text: cue.text_slots.map(slot => slot.text).join('\n') }));
    assert(window.overlapping_cues.length > 0,
      `No Chinese cue overlaps ${startSeconds}s audio window`);
  }
  report.outcome = 'decoded_private_unreviewed';
} catch (error) {
  report.outcome = 'failed';
  report.error = String(error);
  process.exitCode = 1;
} finally {
  report.finished_at = new Date().toISOString();
  await fs.writeFile(path.join(workspace, 'report.json'),
    `${JSON.stringify(report, null, 2)}\n`, { flag: 'wx' });
  console.log(JSON.stringify({ workspace, outcome: report.outcome,
    windows: report.windows.map(window => ({ start_ms: window.start_ms,
      exit_code: window.exit_code, wav_bytes: window.wav_bytes,
      wav_sha256: window.wav_sha256, decoded_duration_ms: window.decoded_duration_ms,
      cue_count: window.overlapping_cues?.length })),
    error: report.error ?? null }, null, 2));
}
