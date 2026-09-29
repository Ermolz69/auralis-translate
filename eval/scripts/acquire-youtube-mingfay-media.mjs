import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { spawn } from 'node:child_process';
import { createReadStream } from 'node:fs';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const parent = path.join(root, '.cache/eval/youtube-mingfay');
const inventory = path.join(parent, 'inventory-n0W3n5/extractor-stdout.json');
const executable = process.env.AURALIS_TEST_YTDLP;
const executableSha256 = '52fe3c26dcf71fbdc85b528589020bb0b8e383155cfa81b64dd447bbe35e24b8';
const metadataSha256 = '2be4f02ccd4c92fa1a86e051ada703c07810e88f548467312d42f6b9614c6f00';
const videoId = '0hoTgJKET7Q';
const formatId = '18';
const expectedBytes = 57_194_836;
const timeoutMs = 180_000;
const maxMediaBytes = 80 * 1024 * 1024;
const maxOutputBytes = 1024 * 1024;
const shaFile = async file => {
  const hash = createHash('sha256');
  for await (const chunk of createReadStream(file)) hash.update(chunk);
  return hash.digest('hex');
};
assert(executable && path.isAbsolute(executable), 'AURALIS_TEST_YTDLP must be absolute');
assert.equal(await shaFile(executable), executableSha256, 'yt-dlp executable changed');
assert.equal(await shaFile(inventory), metadataSha256, 'frozen metadata changed');
const metadata = JSON.parse(await fs.readFile(inventory, 'utf8'));
assert.equal(metadata.id, videoId);
const formats = metadata.formats.filter(format => format.format_id === formatId);
assert.equal(formats.length, 1);
assert.equal(formats[0].ext, 'mp4');
assert.equal(formats[0].resolution, '640x360');
assert.equal(formats[0].vcodec, 'avc1.42001E');
assert.equal(formats[0].acodec, 'mp4a.40.2');
assert.equal(formats[0].filesize, expectedBytes);

if (process.argv.includes('--preflight')) {
  console.log(JSON.stringify({ video_id: videoId, format_id: formatId,
    expected_bytes: expectedBytes, metadata_sha256: metadataSha256,
    executable_sha256: executableSha256, invocations: 1, retries: 0,
    timeout_ms: timeoutMs, max_media_bytes: maxMediaBytes,
    max_command_output_bytes: maxOutputBytes }, null, 2));
  process.exit(0);
}

const workspace = await fs.mkdtemp(path.join(parent, 'media-'));
const outputTemplate = path.join(workspace, 'source.%(ext)s');
const args = ['--no-playlist', '--no-warnings', '--no-progress', '--no-mtime',
  '--retries', '0', '--fragment-retries', '0', '--extractor-retries', '0',
  '--max-filesize', String(maxMediaBytes), '-f', formatId, '-o', outputTemplate,
  `https://www.youtube.com/watch?v=${videoId}`];
const record = { experiment: 'DATA-03-youtube-mingfay-media-2026-09-29-v1',
  video_id: videoId, format_id: formatId, metadata_sha256: metadataSha256,
  executable_sha256: executableSha256, started_at: new Date().toISOString(),
  args: args.map(arg => arg === outputTemplate ? '<private-output>/source.%(ext)s' : arg),
  budget: { invocations: 1, retries: 0, timeout_ms: timeoutMs,
    max_media_bytes: maxMediaBytes, max_command_output_bytes: maxOutputBytes },
  outcome: { exit_code: null, signal: null, error: null, timed_out: false,
    output_limit_exceeded: false, media_bytes: null, media_sha256: null, complete: false } };
const stdout = [];
const stderr = [];
let outputBytes = 0;
let child;
try {
  child = spawn(executable, args, { cwd: root, windowsHide: true,
    env: process.env, stdio: ['ignore', 'pipe', 'pipe'] });
  const timer = setTimeout(() => { record.outcome.timed_out = true; child.kill(); }, timeoutMs);
  const collect = chunks => part => {
    outputBytes += part.length;
    if (outputBytes > maxOutputBytes) {
      record.outcome.output_limit_exceeded = true;
      child.kill();
    } else chunks.push(part);
  };
  child.stdout.on('data', collect(stdout));
  child.stderr.on('data', collect(stderr));
  const result = await new Promise(resolve => {
    child.once('error', error => resolve({ error: String(error), exit_code: null, signal: null }));
    child.once('close', (exitCode, signal) => resolve({ exit_code: exitCode, signal }));
  });
  clearTimeout(timer);
  Object.assign(record.outcome, result);
  const media = path.join(workspace, 'source.mp4');
  try {
    const stat = await fs.stat(media);
    record.outcome.media_bytes = stat.size;
    record.outcome.media_sha256 = await shaFile(media);
    record.outcome.complete = result.exit_code === 0 && !record.outcome.timed_out
      && !record.outcome.output_limit_exceeded && stat.size === expectedBytes;
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
} catch (error) {
  record.outcome.error = String(error);
} finally {
  const out = Buffer.concat(stdout);
  const err = Buffer.concat(stderr);
  await fs.writeFile(path.join(workspace, 'yt-dlp-stdout.txt'), out);
  await fs.writeFile(path.join(workspace, 'yt-dlp-stderr.txt'), err);
  record.outcome.stdout_sha256 = createHash('sha256').update(out).digest('hex');
  record.outcome.stderr_sha256 = createHash('sha256').update(err).digest('hex');
  record.finished_at = new Date().toISOString();
  await fs.writeFile(path.join(workspace, 'acquisition.json'), `${JSON.stringify(record, null, 2)}\n`);
}
console.log(`Private media acquisition retained: ${workspace}`);
console.log(JSON.stringify(record, null, 2));
if (!record.outcome.complete) process.exitCode = 1;
