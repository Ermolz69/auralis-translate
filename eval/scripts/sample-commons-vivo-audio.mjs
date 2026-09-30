import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { createHash, randomUUID } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { promisify } from 'node:util';

const run = promisify(execFile);
const root = resolve('.');
const mediaDirectory = join(root,
  '.cache/eval/commons-vivo-media/media-46745446-cc07-4cff-b5e3-f98fe08262f0');
const directory = join(root, '.cache/eval/commons-vivo-audio', `samples-${randomUUID()}`);
await mkdir(directory, { recursive: true });
const media = join(mediaDirectory, 'source.240p.webm');
const ffmpeg = 'C:/Users/Ermolz/AppData/Local/Microsoft/WinGet/Packages/Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe/ffmpeg-8.1.2-full_build/bin/ffmpeg.exe';
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const report = { schema_version: 1, id: 'commons-vivo-source-audio-samples-v1',
  source_srt_sha256: '8c41e66f52000a5b67ab27bfc319accd11d89290b60e50fc5c60f4ee8230a000',
  media_sha256: '7ad0484b31a6788c31632616649c51e6aaf6cdcdd7d90083d88e1d5ee66e1507',
  ffmpeg_sha256: 'ad8f211bc894755e0061c55ab280ae00e8d3d4f15a8cc4372b24cfa247b5942e',
  positions: [{ label: 'start', cue: 1, seconds: 0 },
    { label: 'middle', cue: 234, seconds: 563 },
    { label: 'end', cue: 462, seconds: 1102 }],
  clip_seconds: 12, timeout_ms_per_clip: 30_000,
  started_at: new Date().toISOString(), status: 'running', clips: [] };
try {
  assert.equal(hash(await readFile(join(root,
    '.cache/eval/commons-vivo-979826861/source.zh.srt'))), report.source_srt_sha256);
  assert.equal(hash(await readFile(join(mediaDirectory, 'acquisition.json'))),
    '4f9a277d797e47048bc5fff159f7a3c2e0714af30f83fe224e9b19086ac7d836');
  assert.equal(hash(await readFile(media)), report.media_sha256);
  assert.equal(hash(await readFile(ffmpeg)), report.ffmpeg_sha256);
  for (const position of report.positions) {
    const output = join(directory, `${position.label}.wav`);
    const args = ['-hide_banner', '-loglevel', 'error', '-nostdin',
      '-ss', String(position.seconds), '-i', media, '-t', String(report.clip_seconds),
      '-vn', '-ac', '1', '-ar', '16000', '-c:a', 'pcm_s16le', output];
    const started = Date.now();
    try {
      const { stdout, stderr } = await run(ffmpeg, args,
        { timeout: report.timeout_ms_per_clip, maxBuffer: 1_048_576 });
      assert.equal(stdout.trim(), '');
      assert.equal(stderr.trim(), '');
      const bytes = await readFile(output);
      assert(bytes.length >= 300_000 && bytes.length <= 390_000, 'Unexpected WAV size');
      assert.equal(bytes.toString('ascii', 0, 4), 'RIFF');
      assert.equal(bytes.toString('ascii', 8, 12), 'WAVE');
      const pcm = bytes.subarray(44);
      let nonzeroSamples = 0;
      for (let offset = 0; offset + 1 < pcm.length; offset += 2)
        if (pcm.readInt16LE(offset) !== 0) nonzeroSamples++;
      assert(nonzeroSamples > 0, 'All-zero decoded PCM');
      report.clips.push({ ...position, path: output, bytes: bytes.length,
        sha256: hash(bytes), nonzero_samples: nonzeroSamples,
        elapsed_ms: Date.now() - started });
    } catch (error) {
      report.clips.push({ ...position, error: error.message, elapsed_ms: Date.now() - started });
      throw error;
    }
  }
  report.status = 'decoded_unlistened';
  console.log(JSON.stringify({ directory, clips: report.clips }));
} catch (error) {
  report.status = 'failed';
  report.error = error.message;
  process.exitCode = 1;
  console.error(error);
} finally {
  report.finished_at = new Date().toISOString();
  await writeFile(join(directory, 'report.json'), `${JSON.stringify(report, null, 2)}\n`, { flag: 'wx' });
  console.log(`Private source-audio samples: ${join(directory, 'report.json')}`);
}
