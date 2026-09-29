import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { gunzipSync } from 'node:zlib';
import { digest } from '../flores-file-fixture.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const pack = JSON.parse(await fs.readFile(path.join(root,
  'eval/regressions/cue89-omitted-code-and-time-guard-v1.json')));
const summaryBytes = await fs.readFile(path.join(root,
  'eval/reports/2026-09-29-reg014-cue89-decode-summary.json'));
const archiveBytes = await fs.readFile(path.join(root,
  'eval/reports/2026-09-29-reg014-cue89-decode-archive.json.gz'));
const archive = JSON.parse(gunzipSync(archiveBytes));

test('REG-016 retains the real omitted-code answer with a source-only request', () => {
  assert.equal(pack.id, 'REG-016');
  assert.equal(digest(summaryBytes), pack.source_summary_sha256);
  assert.equal(digest(archiveBytes), pack.source_archive_sha256);
  const report = JSON.parse(archive.raw['report.json']);
  assert.equal(report.identity.model_sha256, pack.affected_model_sha256);
  const entries = archive.raw['requests.jsonl'].trim().split('\n').map(JSON.parse);
  assert.equal(entries.length, 6);
  const failure = entries.find(row => row.request_sha256 === pack.failure.request_sha256);
  assert(failure);
  assert.equal(failure.seed, pack.failure.seed);
  assert.equal(failure.temperature, pack.failure.temperature);
  assert.equal(failure.restored_candidate, pack.failure.raw_candidate_ru);
  assert.equal(failure.raw_exact_identifier, false);
  assert.equal(failure.time_preserved, true);
  const request = JSON.parse(failure.rendered_request);
  const source = JSON.parse(request.messages[0].content.split('Input JSON:\n')[1])
    .target_slots[0].source_original;
  assert.equal(source, pack.source_zh);
  assert.doesNotMatch(request.messages[0].content, /\p{Script=Cyrillic}/u);
});

test('REG-016 pins distinct strict-time related and negative controls', () => {
  assert.equal(pack.related_controls.length, 4);
  assert.equal(pack.negative_controls.length, 3);
  assert.equal(new Set(pack.related_controls.map(row => row.id)).size, 4);
  assert.equal(new Set(pack.negative_controls.map(row => row.id)).size, 3);
  assert(pack.related_controls.every(row => row.expected_v3_outcome === 'reject_without_checkpoint'));
  assert(pack.negative_controls.some(row => row.expected_v3_outcome === 'accept_with_review_flag'));
  assert(pack.negative_controls.some(row => row.expected_v3_outcome === 'accept_without_repair'));
  assert.equal(pack.human_review, 'missing');
  assert.equal(pack.release_gate, 'open');
});
