import assert from 'node:assert/strict';
import { createHash, randomUUID } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';

const title = 'TimedText:采访vivo_&_MediaTek研发大佬：蓝厂与天玑合作背后的故事.webm.zh.srt';
const revision = '979826861';
const endpoint = new URL('https://commons.wikimedia.org/w/index.php');
endpoint.search = new URLSearchParams({ title, oldid: revision, action: 'raw' }).toString();
const directory = join(resolve('.'), '.cache/eval/commons-vivo-caption', `attempt-${randomUUID()}`);
await mkdir(directory, { recursive: true });
const started = Date.now();
const report = { schema_version: 1, id: 'commons-vivo-caption-candidate-v1',
  title, revision, source_url: endpoint.toString(), max_requests: 1,
  max_bytes: 256 * 1024, timeout_ms: 90_000,
  started_at: new Date(started).toISOString(), status: 'running' };
try {
  const response = await fetch(endpoint, { signal: AbortSignal.timeout(report.timeout_ms),
    redirect: 'error', headers: { 'User-Agent': 'AuralisTranslateResearch/1.0 (private caption inspection)' } });
  report.http_status = response.status;
  report.content_type = response.headers.get('content-type');
  assert.equal(response.status, 200);
  const chunks = [];
  let size = 0;
  for await (const chunk of response.body) {
    size += chunk.length;
    assert(size <= report.max_bytes, 'Caption response exceeds byte budget');
    chunks.push(chunk);
  }
  const bytes = Buffer.concat(chunks);
  const text = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  assert(/^1\r?\n00:00:00,100 --> 00:00:04,003\r?\n/u.test(text),
    'Unexpected first cue in pinned Chinese TimedText revision');
  report.bytes = bytes.length;
  report.sha256 = createHash('sha256').update(bytes).digest('hex');
  const file = join(directory, 'source.zh.srt');
  await writeFile(file, bytes, { flag: 'wx' });
  report.path = file;
  report.status = 'downloaded_private_unreviewed';
  console.log(JSON.stringify({ file, bytes: report.bytes, sha256: report.sha256 }));
} catch (error) {
  report.status = 'failed';
  report.error = error.message;
  process.exitCode = 1;
  console.error(error);
} finally {
  report.finished_at = new Date().toISOString();
  report.elapsed_ms = Date.now() - started;
  await writeFile(join(directory, 'acquisition.json'), `${JSON.stringify(report, null, 2)}\n`,
    { flag: 'wx' });
  console.log(`Private caption acquisition: ${join(directory, 'acquisition.json')}`);
}
