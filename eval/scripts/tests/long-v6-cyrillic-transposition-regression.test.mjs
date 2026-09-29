import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { gunzipSync } from 'node:zlib';
import { digest } from '../flores-file-fixture.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const reports = path.join(root, 'eval/reports');
const stem = '2026-09-29-reg009-long-cli-prefix-repair';
const pack = JSON.parse(await fs.readFile(path.join(root,
  'eval/regressions/long-v6-cyrillic-code-transposition-v1.json')));
const summaryBytes = await fs.readFile(path.join(reports, `${stem}-summary.json`));
const archiveBytes = await fs.readFile(path.join(reports, `${stem}-archive.json.gz`));
const archive = JSON.parse(gunzipSync(archiveBytes));

test('REG-014 retains the real minimal model failure and safe durable rejection', () => {
  assert.equal(pack.schema_version, 1);
  assert.equal(pack.id, 'REG-014');
  assert.equal(pack.source_report_sha256, digest(summaryBytes));
  assert.equal(pack.source_journal_sha256, digest(archiveBytes));
  assert.equal(archive.wrapper.model_sha256, pack.affected_model_sha256);
  assert.equal(archive.wrapper.profile_sha256, pack.affected_profile_sha256);
  const failure = archive.requests.find(row => row.request_sha256 === pack.failure.request_sha256);
  assert(failure);
  assert.equal(failure.segment_id, pack.failure.cue_id);
  assert.equal(failure.line_index, pack.failure.line_index);
  assert.equal(failure.outcome, pack.failure.observed_outcome);
  assert.equal(failure.raw_response_sha256, pack.failure.raw_response_sha256);
  assert.equal(failure.restored_candidate, pack.failure.restored_candidate_ru);
  const prompt = JSON.parse(Buffer.from(failure.rendered_request_base64, 'base64'));
  const target = JSON.parse(prompt.messages[0].content.split('Input JSON:\n')[1]).target_slots[0];
  assert.equal(target.source_original, pack.failure.source_zh);
  assert.equal(target.source_for_translation, pack.failure.source_zh);
  assert(!prompt.messages[0].content.includes(pack.failure.restored_candidate_ru));
  assert.equal(archive.snapshot.checkpoints.length, pack.failure.saved_checkpoint_prefix);
  assert.equal(archive.snapshot.results.length, pack.failure.published_result_count);
  assert.equal(archive.output_srt_base64, null);
});

test('REG-014 fixture controls remain distinct from the real sampled answer', () => {
  assert.equal(pack.related_controls.length, 4);
  assert.equal(pack.negative_controls.length, 3);
  assert.equal(new Set(pack.related_controls.map(row => row.id)).size, 4);
  assert.equal(new Set(pack.negative_controls.map(row => row.id)).size, 3);
  assert(pack.related_controls.every(row => row.expected_outcome === 'reject'));
  assert(pack.related_controls.every(row => row.candidate_ru !== pack.failure.restored_candidate_ru));
  assert(pack.negative_controls.some(row => row.expected_outcome === 'accept_with_review_flag'));
  assert(pack.negative_controls.some(row => row.expected_outcome === 'accept_without_repair'));
  assert.equal(pack.human_review, 'missing');
  assert.equal(pack.release_gate, 'open');
});
