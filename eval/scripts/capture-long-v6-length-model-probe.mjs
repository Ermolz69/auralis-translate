import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { gzipSync } from 'node:zlib';
import { digest } from './flores-file-fixture.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const workspace = path.resolve(process.argv[2] ?? '');
assert(workspace.startsWith(path.join(root, '.cache/eval/long-v6-length-model-probes') + path.sep));
const reportBytes = await fs.readFile(path.join(workspace, 'report.json'));
const requestBytes = await fs.readFile(path.join(workspace, 'requests.jsonl'));
const report = JSON.parse(reportBytes);
const entries = requestBytes.toString('utf8').trim().split(/\r?\n/u).map(line => JSON.parse(line));
assert.equal(report.experiment, 'reg-006-v6-1b-7b-paired-v1');
assert.equal(report.status, 'complete_observations_unreviewed');
assert.equal(report.failures.length, 0);
assert.equal(report.requests.length, 16);
assert.equal(report.planned_requests.length, 16);
assert.equal(entries.length, 16);
assert.equal(report.human_review, 'missing');
assert.equal(report.sealed_holdout, false);
const cases = ['zh-983-amin-tomorrow', 'zh-983-amin-day-after',
  'zh-983-ahua-tomorrow', 'zh-983-amin-today'];
for (let i = 0; i < entries.length; i++) {
  const entry = entries[i];
  const summary = report.requests[i];
  const planned = report.planned_requests[i];
  assert.equal(entry.request_sha256, digest(Buffer.from(JSON.stringify(entry.request))));
  assert.equal(summary.request_sha256, entry.request_sha256);
  assert.equal(planned.request_sha256, entry.request_sha256);
  assert.equal(entry.model, i < 8 ? '1b' : '7b');
  assert.equal(entry.seed, i % 8 < 4 ? 101 : 202);
  assert.equal(entry.case_id, cases[i % 4]);
  assert.equal(entry.http_status, 200);
  assert.equal(entry.finish_reason, 'stop');
  assert.equal(entry.structural_outcome, 'valid_unreviewed');
  assert.equal(summary.accepted_candidate, entry.accepted_candidate);
  assert.equal(JSON.parse(entry.raw_response).choices[0].message.content, entry.raw_candidate);
  assert.equal(entry.request.messages[0].content.split(entry.source_zh).length - 1, 2);
  assert.doesNotMatch(entry.request.messages[0].content, /\p{Script=Cyrillic}/u);
}
for (let i = 0; i < 8; i++) {
  const a = structuredClone(entries[i].request);
  const b = structuredClone(entries[i + 8].request);
  b.model = a.model;
  assert.deepEqual(a, b);
}
const serverLogs = Object.fromEntries(await Promise.all(['1b', '7b'].map(async model =>
  [model, await fs.readFile(path.join(workspace, `${model}-server.log`), 'utf8')])));
const logsBytes = Buffer.from(`${JSON.stringify(serverLogs, null, 2)}\n`);
const requestsGzip = gzipSync(requestBytes, { mtime: 0 });
const logsGzip = gzipSync(logsBytes, { mtime: 0 });
const stem = '2026-09-29-reg-006-paired-model-probe';
const summary = {
  schema_version: 1, experiment: report.experiment, captured_at: new Date().toISOString(),
  report_sha256: digest(reportBytes), requests_uncompressed_sha256: digest(requestBytes),
  requests_gzip_sha256: digest(requestsGzip), server_logs_uncompressed_sha256: digest(logsBytes),
  server_logs_gzip_sha256: digest(logsGzip),
  request_count: entries.length, source_case_count: cases.length, seed_count: 2,
  model_sha256: report.identity.models.map(row => ({ model: row.key, sha256: row.model_sha256 })),
  model_summaries: ['1b', '7b'].map(model => {
    const rows = report.requests.filter(row => row.model === model);
    const sorted = rows.map(row => row.elapsed_ms).sort((a, b) => a - b);
    const samples = report.resources[model].samples;
    return { model, structurally_valid: rows.filter(row => row.structural_outcome === 'valid_unreviewed').length,
      prompt_tokens: rows.reduce((sum, row) => sum + row.usage.prompt_tokens, 0),
      completion_tokens: rows.reduce((sum, row) => sum + row.usage.completion_tokens, 0),
      request_elapsed_sum_ms: rows.reduce((sum, row) => sum + row.elapsed_ms, 0),
      median_request_ms: (sorted[3] + sorted[4]) / 2,
      min_request_ms: sorted[0], max_request_ms: sorted.at(-1),
      resource_samples: samples.length,
      peak_tracked_working_set_bytes: Math.max(...samples.map(sample =>
        sample.processes.reduce((sum, process) => sum + (process.WorkingSet64 ?? 0), 0))),
      peak_tracked_private_bytes: Math.max(...samples.map(sample =>
        sample.processes.reduce((sum, process) => sum + (process.PrivateMemorySize64 ?? 0), 0))),
      peak_device_gpu_mib: Math.max(...samples.map(sample => Number(sample.gpu_device.split(',')[1]))),
    };
  }),
  human_review: 'missing', quality_verdict: 'unreviewed',
};
const out = path.join(root, 'eval/reports');
for (const name of [`${stem}.json`, `${stem}-report.json`, `${stem}-requests.jsonl.gz`,
  `${stem}-server-logs.json.gz`]) {
  assert.equal(await fs.stat(path.join(out, name)).catch(() => null), null);
}
await fs.writeFile(path.join(out, `${stem}-report.json`), reportBytes, { flag: 'wx' });
await fs.writeFile(path.join(out, `${stem}-requests.jsonl.gz`), requestsGzip, { flag: 'wx' });
await fs.writeFile(path.join(out, `${stem}-server-logs.json.gz`), logsGzip, { flag: 'wx' });
await fs.writeFile(path.join(out, `${stem}.json`), `${JSON.stringify(summary, null, 2)}\n`, { flag: 'wx' });
console.log('Archived REG-006 paired screen: 16 matched raw responses, both resource series and server logs; quality unreviewed.');
