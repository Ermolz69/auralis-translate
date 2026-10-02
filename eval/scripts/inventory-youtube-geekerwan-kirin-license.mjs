import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { createReadStream } from 'node:fs';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { captureBoundedProcess } from './bounded-process-capture.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const experiment = 'DATA-03-youtube-geekerwan-kirin-license-2026-10-02-v1';
const videoId = '73XUeYRFsZU';
const url = `https://www.youtube.com/watch?v=${videoId}`;
const executable = process.env.AURALIS_TEST_YTDLP;
const expectedExecutableSha256 = '52fe3c26dcf71fbdc85b528589020bb0b8e383155cfa81b64dd447bbe35e24b8';
const source = '.cache/eval/commons-huawei-kirin-9010-880535591/source.zh.srt';
const expectedSourceSha256 = '57dfd9feb3bfe6381421c4142820b780af341e195e52ee81d58e8f9f12858feb';
const media = '.cache/eval/commons-geekerwan-two-media/huawei-kirin-9010-8b5d98b9-25ac-42bd-a32a-ac318a97a1c2/source.240p.webm';
const expectedMediaSha256 = '2911c8a14b6da9fa62d46235aa09a1b240ee1409ec8e28336edc7ed90c9af586';
const timeoutMs = 90_000;
const maxOutputBytes = 12 * 1024 * 1024;
const parent = path.join(root, '.cache/eval/youtube-geekerwan-kirin-license');
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');

async function shaFile(file) {
  const hash = createHash('sha256');
  for await (const chunk of createReadStream(file)) hash.update(chunk);
  return hash.digest('hex');
}

assert(executable && path.isAbsolute(executable), 'AURALIS_TEST_YTDLP must be absolute');
const [actualExecutableSha256, actualSourceSha256, actualMediaSha256] = await Promise.all([
  shaFile(executable), shaFile(path.join(root, source)), shaFile(path.join(root, media)),
]);
assert.equal(actualExecutableSha256, expectedExecutableSha256, 'yt-dlp executable changed');
assert.equal(actualSourceSha256, expectedSourceSha256, 'original candidate SRT changed');
assert.equal(actualMediaSha256, expectedMediaSha256, 'matched private media changed');
const previous = await fs.readdir(parent).catch(error => {
  if (error.code === 'ENOENT') return [];
  throw error;
});
assert.equal(previous.length, 0, 'The one-attempt budget is already consumed');

const args = ['--dump-single-json', '--skip-download', '--no-playlist',
  '--no-warnings', '--retries', '0', url];
if (process.argv.includes('--preflight')) {
  console.log(JSON.stringify({ experiment, video_id: videoId, url,
    source_sha256: actualSourceSha256, media_sha256: actualMediaSha256,
    executable_sha256: actualExecutableSha256, args,
    extractor_invocations: 1, wall_limit_ms: timeoutMs,
    max_output_bytes: maxOutputBytes, downloads: 0, retries: 0 }, null, 2));
  process.exit(0);
}

await fs.mkdir(parent, { recursive: true });
const workspace = await fs.mkdtemp(path.join(parent, 'attempt-'));
const startedAt = new Date().toISOString();
const { outcome, timedOut, outputLimitExceeded,
  stdout, stderr } = await captureBoundedProcess({
  command: executable, args, cwd: root, env: process.env, timeoutMs, maxOutputBytes,
});
await fs.writeFile(path.join(workspace, 'extractor-stdout.json'), stdout, { flag: 'wx' });
await fs.writeFile(path.join(workspace, 'extractor-stderr.txt'), stderr, { flag: 'wx' });
const report = {
  schema_version: 1, experiment, video_id: videoId, url,
  source_srt_sha256: actualSourceSha256, matched_media_sha256: actualMediaSha256,
  executable_sha256: actualExecutableSha256, args,
  budget: { extractor_invocations: 1, timeout_ms: timeoutMs,
    max_output_bytes: maxOutputBytes, downloads: 0, retries: 0 },
  started_at: startedAt, finished_at: new Date().toISOString(),
  outcome: { ...outcome, timed_out: timedOut, output_limit_exceeded: outputLimitExceeded,
    stdout_bytes: stdout.length, stderr_bytes: stderr.length,
    stdout_sha256: sha256(stdout), stderr_sha256: sha256(stderr) },
  metadata: null,
};
if (outcome.exit_code === 0 && !timedOut && !outputLimitExceeded) {
  try {
    const value = JSON.parse(stdout.toString('utf8'));
    assert.equal(value.id, videoId);
    report.metadata = {
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
  } catch (error) { report.outcome.metadata_error = String(error); }
}
await fs.writeFile(path.join(workspace, 'inventory.json'),
  `${JSON.stringify(report, null, 2)}\n`, { flag: 'wx' });
console.log(`Private metadata attempt: ${workspace}`);
console.log(JSON.stringify({ outcome: report.outcome, metadata: report.metadata }, null, 2));
if (outcome.exit_code !== 0 || timedOut || outputLimitExceeded || !report.metadata) {
  process.exitCode = 1;
}
