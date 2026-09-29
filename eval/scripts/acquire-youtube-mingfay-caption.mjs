import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const parent = path.join(root, '.cache/eval/youtube-mingfay');
const inventoryDir = path.join(parent, 'inventory-n0W3n5');
const expectedMetadataSha256 = '2be4f02ccd4c92fa1a86e051ada703c07810e88f548467312d42f6b9614c6f00';
const expectedUrlSha256 = '8362542cbcee5f4a424caefd810a4bc9400e04433812c5e1425f9ab0af1c5443';
const videoId = '0hoTgJKET7Q';
const language = 'zh-CN';
const format = 'srt';
const timeoutMs = 90_000;
const maxBytes = 2 * 1024 * 1024;
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');

const metadataBytes = await fs.readFile(path.join(inventoryDir, 'extractor-stdout.json'));
assert.equal(sha256(metadataBytes), expectedMetadataSha256, 'frozen extractor metadata changed');
const metadata = JSON.parse(metadataBytes.toString('utf8'));
assert.equal(metadata.id, videoId);
const tracks = metadata.subtitles?.[language]?.filter(track => track.ext === format);
assert.equal(tracks?.length, 1, 'expected exactly one regular Chinese SRT track');
const trackUrl = tracks[0].url;
assert.equal(sha256(Buffer.from(trackUrl)), expectedUrlSha256, 'frozen caption URL changed');
const url = new URL(trackUrl);
assert.equal(url.protocol, 'https:');
assert.equal(url.hostname, 'www.youtube.com');
assert.equal(url.pathname, '/api/timedtext');
assert.equal(url.searchParams.get('v'), videoId);
assert.equal(url.searchParams.get('lang'), language);
assert.equal(url.searchParams.get('fmt'), format);

if (process.argv.includes('--preflight')) {
  console.log(JSON.stringify({ video_id: videoId, language, format,
    metadata_sha256: expectedMetadataSha256, caption_url_sha256: expectedUrlSha256,
    max_requests: 1, timeout_ms: timeoutMs, max_bytes: maxBytes,
    raw_storage: '.cache/eval/youtube-mingfay/caption-*' }, null, 2));
  process.exit(0);
}

const workspace = await fs.mkdtemp(path.join(parent, 'caption-'));
const record = { experiment: 'DATA-03-youtube-mingfay-caption-2026-09-29-v1',
  video_id: videoId, language, format, metadata_sha256: expectedMetadataSha256,
  caption_url_sha256: expectedUrlSha256, started_at: new Date().toISOString(),
  budget: { requests: 1, timeout_ms: timeoutMs, max_bytes: maxBytes, retries: 0 },
  outcome: { http_status: null, bytes: 0, sha256: null, error: null, complete: false } };
try {
  const response = await fetch(url, { redirect: 'error', signal: AbortSignal.timeout(timeoutMs),
    headers: { 'User-Agent': 'AuralisTranslateResearch/0.1 (https://github.com/Ermolz69/auralis-translate)' } });
  record.outcome.http_status = response.status;
  assert(response.body, 'caption response had no body');
  const chunks = [];
  let count = 0;
  const reader = response.body.getReader();
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    count += value.length;
    if (count > maxBytes) {
      await reader.cancel();
      throw new Error('caption response exceeded declared byte budget');
    }
    chunks.push(value);
  }
  const bytes = Buffer.concat(chunks, count);
  record.outcome.bytes = count;
  record.outcome.sha256 = sha256(bytes);
  await fs.writeFile(path.join(workspace, response.ok ? 'source.zh.srt' : 'http-body.bin'), bytes);
  assert.equal(response.status, 200, `caption response HTTP ${response.status}`);
  assert(count > 0, 'caption response was empty');
  record.outcome.complete = true;
} catch (error) {
  record.outcome.error = String(error);
} finally {
  record.finished_at = new Date().toISOString();
  await fs.writeFile(path.join(workspace, 'acquisition.json'), `${JSON.stringify(record, null, 2)}\n`);
}
console.log(`Private caption acquisition retained: ${workspace}`);
console.log(JSON.stringify(record, null, 2));
if (!record.outcome.complete) process.exitCode = 1;
