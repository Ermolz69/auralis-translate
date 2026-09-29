import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { gunzipSync } from 'node:zlib';
import test from 'node:test';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const failure = JSON.parse(await fs.readFile(path.join(root, 'eval/regressions/long-v6-today-omission-v1.json')));
const summaryBytes = await fs.readFile(path.join(root, 'eval/reports/2026-09-29-reg-006-paired-model-probe.json'));
const requestsGzip = await fs.readFile(path.join(root, 'eval/reports/2026-09-29-reg-006-paired-model-probe-requests.jsonl.gz'));
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const requests = gunzipSync(requestsGzip).toString('utf8').trim().split(/\r?\n/u).map(line => JSON.parse(line));

test('REG-007: both archived 1.8B negatives omit the explicit day despite valid JSON', () => {
  assert.equal(hash(summaryBytes), failure.paired_probe_summary_sha256);
  assert.equal(hash(requestsGzip), failure.paired_probe_requests_gzip_sha256);
  const selected = requests.filter(row => row.model === '1b' && row.case_id === 'zh-983-amin-today');
  assert.deepEqual(selected.map(row => row.seed), failure.reproduction.seeds);
  assert.deepEqual(selected.map(row => row.accepted_candidate), failure.reproduction.observed_1b_candidates);
  for (const row of selected) {
    assert.equal(row.structural_outcome, 'valid_unreviewed');
    assert(row.request.messages[0].content.includes(failure.reproduction.source_zh));
    assert.doesNotMatch(row.accepted_candidate, /сегодня/u);
    assert.doesNotMatch(row.request.messages[0].content, /\p{Script=Cyrillic}/u);
  }
  const large = requests.filter(row => row.model === '7b' && row.case_id === 'zh-983-amin-today');
  assert.equal(large.length, 2);
  assert(large.every(row => /сегодня/u.test(row.accepted_candidate)));
});

test('REG-007: source-only controls distinguish changed day from no explicit day', () => {
  const cases = [failure.reproduction, ...failure.related_controls, failure.negative_control];
  assert.equal(new Set(cases.map(row => row.source_zh)).size, 4);
  assert(cases.every(row => row.source_zh.startsWith('工程 AUR-0983：')));
  assert.match(failure.related_controls[0].source_zh, /改到今天/u);
  assert.match(failure.related_controls[1].source_zh, /明天/u);
  assert.doesNotMatch(failure.negative_control.source_zh, /今天|明天/u);
});
