import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { createReadStream } from 'node:fs';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { captureBoundedProcess } from './bounded-process-capture.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const executable = process.env.AURALIS_TEST_YTDLP;
const expectedSha256 = '52fe3c26dcf71fbdc85b528589020bb0b8e383155cfa81b64dd447bbe35e24b8';
const videoId = 'VQyTbi74bmk';
const url = `https://www.youtube.com/watch?v=${videoId}`;
const timeoutMs = 90_000;
const maxOutputBytes = 12 * 1024 * 1024;

assert(executable && path.isAbsolute(executable), 'AURALIS_TEST_YTDLP must be absolute');
const hash = createHash('sha256');
for await (const chunk of createReadStream(executable)) hash.update(chunk);
const actualSha256 = hash.digest('hex');
assert.equal(actualSha256, expectedSha256, 'yt-dlp executable changed');

if (process.argv.includes('--preflight')) {
  console.log(JSON.stringify({ video_id: videoId, url, executable_sha256: actualSha256,
    extractor_invocations: 1, wall_limit_ms: timeoutMs,
    max_output_bytes: maxOutputBytes, downloads: 0, retries: 0 }, null, 2));
  process.exit(0);
}

const parent = path.join(root, '.cache/eval/youtube-sunflower');
await fs.mkdir(parent, { recursive: true });
const workspace = await fs.mkdtemp(path.join(parent, 'inventory-'));
const startedAt = new Date().toISOString();
const args = ['--dump-single-json', '--skip-download', '--no-playlist',
  '--no-warnings', '--retries', '0', url];
const { outcome, timedOut, outputLimitExceeded: exceeded,
  stdout: output, stderr: errorOutput } = await captureBoundedProcess({
  command: executable, args, cwd: root, env: process.env, timeoutMs, maxOutputBytes,
});
await fs.writeFile(path.join(workspace, 'extractor-stdout.json'), output);
await fs.writeFile(path.join(workspace, 'extractor-stderr.txt'), errorOutput);
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
const record = {
  experiment: 'DATA-03-youtube-sunflower-inventory-2026-10-01-v1',
  video_id: videoId, url, started_at: startedAt, finished_at: new Date().toISOString(),
  executable_sha256: actualSha256, args,
  budget: { extractor_invocations: 1, timeout_ms: timeoutMs,
    max_output_bytes: maxOutputBytes, downloads: 0, retries: 0 },
  outcome: { ...outcome, timed_out: timedOut, output_limit_exceeded: exceeded,
    stdout_bytes: output.length, stderr_bytes: errorOutput.length,
    stdout_sha256: sha256(output), stderr_sha256: sha256(errorOutput) },
  metadata: null,
};
if (outcome.exit_code === 0 && !timedOut && !exceeded) {
  try {
    const value = JSON.parse(output.toString('utf8'));
    assert.equal(value.id, videoId);
    record.metadata = {
      id: value.id, title: value.title ?? null, uploader: value.uploader ?? null,
      channel_id: value.channel_id ?? null, upload_date: value.upload_date ?? null,
      duration_seconds: value.duration ?? null, license: value.license ?? null,
      language: value.language ?? null,
      subtitle_languages: Object.keys(value.subtitles ?? {}).sort(),
      automatic_caption_languages: Object.keys(value.automatic_captions ?? {}).sort(),
      chinese_subtitle_formats: Object.fromEntries(Object.entries(value.subtitles ?? {})
        .filter(([language]) => /^zh(?:-|$)/i.test(language))
        .map(([language, tracks]) => [language, tracks.map(track => track.ext)])),
    };
  } catch (error) { record.outcome.metadata_error = String(error); }
}
await fs.writeFile(path.join(workspace, 'inventory.json'),
  `${JSON.stringify(record, null, 2)}\n`);
console.log(`YouTube candidate inventory retained: ${workspace}`);
console.log(JSON.stringify({ outcome: record.outcome, metadata: record.metadata }, null, 2));
if (outcome.exit_code !== 0 || timedOut || exceeded || !record.metadata) process.exitCode = 1;
