import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { createReadStream } from 'node:fs';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { captureBoundedProcess } from './bounded-process-capture.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const executable = process.env.AURALIS_TEST_YTDLP;
const executableSha256 = '52fe3c26dcf71fbdc85b528589020bb0b8e383155cfa81b64dd447bbe35e24b8';
const candidates = [
  { id: '_Ok42iFpLpQ', commonsDurationSeconds: 1204.937 },
  { id: 'bjWlhc_RpRc', commonsDurationSeconds: 655.941 },
];
const timeoutMs = 90_000;
const maxOutputBytes = 12 * 1024 * 1024;
const hashBytes = bytes => createHash('sha256').update(bytes).digest('hex');

assert(executable && path.isAbsolute(executable), 'AURALIS_TEST_YTDLP must be absolute');
const hash = createHash('sha256');
for await (const chunk of createReadStream(executable)) hash.update(chunk);
assert.equal(hash.digest('hex'), executableSha256, 'yt-dlp executable changed');

if (process.argv.includes('--preflight')) {
  console.log(JSON.stringify({ candidates, executable_sha256: executableSha256,
    requests: candidates.length, timeout_ms_per_request: timeoutMs,
    max_output_bytes_per_request: maxOutputBytes, downloads: 0, retries: 0 }, null, 2));
  process.exit(0);
}

const parent = path.join(root, '.cache/eval/voa-mandarin-caption-inventory-v1');
await fs.mkdir(parent, { recursive: true });
const workspace = await fs.mkdtemp(path.join(parent, 'attempt-'));
const report = { experiment: 'DATA-03-voa-mandarin-caption-inventory-2026-10-02-v1',
  started_at: new Date().toISOString(), executable_sha256: executableSha256,
  budget: { requests: 2, timeout_ms_per_request: timeoutMs,
    max_output_bytes_per_request: maxOutputBytes, downloads: 0, retries: 0 },
  candidates: [] };
for (const candidate of candidates) {
  const url = `https://www.youtube.com/watch?v=${candidate.id}`;
  const args = ['--dump-single-json', '--skip-download', '--no-playlist',
    '--no-warnings', '--retries', '0', url];
  const startedAt = new Date().toISOString();
  const result = await captureBoundedProcess({ command: executable, args, cwd: root,
    env: process.env, timeoutMs, maxOutputBytes });
  await fs.writeFile(path.join(workspace, `${candidate.id}-stdout.json`), result.stdout);
  await fs.writeFile(path.join(workspace, `${candidate.id}-stderr.txt`), result.stderr);
  const entry = { ...candidate, url, args, started_at: startedAt,
    finished_at: new Date().toISOString(), outcome: result.outcome,
    timed_out: result.timedOut, output_limit_exceeded: result.outputLimitExceeded,
    stdout_bytes: result.stdout.length, stderr_bytes: result.stderr.length,
    stdout_sha256: hashBytes(result.stdout), stderr_sha256: hashBytes(result.stderr),
    metadata: null };
  if (result.outcome.exit_code === 0 && !result.timedOut && !result.outputLimitExceeded) {
    try {
      const value = JSON.parse(result.stdout.toString('utf8'));
      assert.equal(value.id, candidate.id);
      entry.metadata = { id: value.id, title: value.title ?? null,
        uploader: value.uploader ?? null, channel_id: value.channel_id ?? null,
        upload_date: value.upload_date ?? null, duration_seconds: value.duration ?? null,
        license: value.license ?? null, language: value.language ?? null,
        subtitle_languages: Object.keys(value.subtitles ?? {}).sort(),
        automatic_caption_languages: Object.keys(value.automatic_captions ?? {}).sort(),
        original_chinese_subtitles: Object.fromEntries(Object.entries(value.subtitles ?? {})
          .filter(([language]) => /^zh(?:-|$)/i.test(language))
          .map(([language, tracks]) => [language, tracks.map(track => track.ext)])),
        automatic_chinese_captions: Object.fromEntries(Object.entries(value.automatic_captions ?? {})
          .filter(([language]) => /^zh(?:-|$)/i.test(language))
          .map(([language, tracks]) => [language, tracks.map(track => track.ext)])),
      };
    } catch (error) { entry.metadata_error = String(error); }
  }
  report.candidates.push(entry);
  await fs.writeFile(path.join(workspace, 'report.json'), `${JSON.stringify(report, null, 2)}\n`);
}
report.finished_at = new Date().toISOString();
await fs.writeFile(path.join(workspace, 'report.json'), `${JSON.stringify(report, null, 2)}\n`);
console.log(`VOA subtitle-track inventory retained: ${workspace}`);
console.log(JSON.stringify(report.candidates.map(({ id, outcome, timed_out, metadata,
  metadata_error }) => ({ id, outcome, timed_out, metadata, metadata_error })), null, 2));
if (report.candidates.some(entry => entry.outcome.exit_code !== 0 || !entry.metadata)) {
  process.exitCode = 1;
}
