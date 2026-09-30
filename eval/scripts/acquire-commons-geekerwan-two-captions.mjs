import assert from 'node:assert/strict';
import { createHash, randomUUID } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';

const sources = [
  {
    id: 'asus-rog-ally',
    title: 'TimedText:ASUS_ROG-Handheld-Leistungsanalyse_(极客湾Geekerwan)_01.webm.zh.srt',
    revision: '892592485',
    firstCue: /^1\r?\n00:00:00,300 --> 00:00:03,336\r?\n/u,
  },
  {
    id: 'huawei-kirin-9010',
    title: 'TimedText:Huawei_Kirin_9010_in-depth_analysis_compared_to_9000s_(极客湾Geekerwan)_19.webm.zh.srt',
    revision: '880535591',
    firstCue: /^1\r?\n00:00:00,287 --> 00:00:02,807\r?\n/u,
  },
];
const root = join(resolve('.'), '.cache/eval/commons-geekerwan-two-scenes');
const maxBytes = 256 * 1024;
const timeoutMs = 90_000;
let failed = false;

for (const source of sources) {
  const endpoint = new URL('https://commons.wikimedia.org/w/index.php');
  endpoint.search = new URLSearchParams({
    title: source.title, oldid: source.revision, action: 'raw',
  }).toString();
  const directory = join(root, `${source.id}-${randomUUID()}`);
  await mkdir(directory, { recursive: true });
  const started = Date.now();
  const report = {
    schema_version: 1, id: source.id, title: source.title,
    revision: source.revision, source_url: endpoint.toString(),
    max_requests: 1, max_bytes: maxBytes, timeout_ms: timeoutMs,
    started_at: new Date(started).toISOString(), status: 'running',
  };
  try {
    const response = await fetch(endpoint, {
      signal: AbortSignal.timeout(timeoutMs), redirect: 'error',
      headers: { 'User-Agent': 'AuralisTranslateResearch/1.0 (private caption inspection)' },
    });
    report.http_status = response.status;
    report.content_type = response.headers.get('content-type');
    assert.equal(response.status, 200);
    const chunks = [];
    let size = 0;
    for await (const chunk of response.body) {
      size += chunk.length;
      assert(size <= maxBytes, 'Caption response exceeds byte budget');
      chunks.push(chunk);
    }
    const bytes = Buffer.concat(chunks);
    const text = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
    assert.match(text, source.firstCue, 'Unexpected first cue in pinned TimedText revision');
    report.bytes = bytes.length;
    report.sha256 = createHash('sha256').update(bytes).digest('hex');
    report.path = join(directory, 'source.zh.srt');
    await writeFile(report.path, bytes, { flag: 'wx' });
    report.status = 'downloaded_private_unreviewed';
    console.log(JSON.stringify({ id: source.id, path: report.path,
      bytes: report.bytes, sha256: report.sha256 }));
  } catch (error) {
    failed = true;
    report.status = 'failed';
    report.error = error.message;
    console.error(`${source.id}: ${error.message}`);
  } finally {
    report.finished_at = new Date().toISOString();
    report.elapsed_ms = Date.now() - started;
    const reportPath = join(directory, 'acquisition.json');
    await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, { flag: 'wx' });
    console.log(`Private caption acquisition: ${reportPath}`);
  }
}
if (failed) process.exitCode = 1;
