import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const summary = JSON.parse(await fs.readFile(path.join(root,
  'eval/reports/voa-mandarin-caption-inventory-2026-10-02.json'), 'utf8'));
assert.equal(summary.schema_version, 1);
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
const readPinned = async ({ private_report: relativePath, sha256: expected }) => {
  const bytes = await fs.readFile(path.join(root, relativePath));
  assert.equal(sha256(bytes), expected);
  return JSON.parse(bytes.toString('utf8'));
};
const failed = await readPinned(summary.sandbox_failure);
assert.equal(failed.candidates.length, 2);
for (const candidate of failed.candidates) {
  assert.match(candidate.outcome.error, /spawn EPERM/);
  assert.equal(candidate.outcome.exit_code, null);
  assert.equal(candidate.stdout_bytes, 0);
  assert.equal(candidate.stderr_bytes, 0);
}
const permitted = await readPinned(summary.permitted_attempt);
assert.equal(permitted.candidates.length, 2);
assert.equal(permitted.started_at, summary.permitted_attempt.started_at);
assert.equal(permitted.finished_at, summary.permitted_attempt.finished_at);
assert.equal(permitted.executable_sha256, summary.extractor_sha256);
assert.equal(permitted.budget.requests, 2);
assert.equal(permitted.budget.downloads, 0);
assert.equal(permitted.budget.retries, 0);
assert.equal(summary.source_admission, 'rejected_no_chinese_subtitle_track');
assert.equal(summary.human_review, 'not_performed');
for (const [index, candidate] of permitted.candidates.entries()) {
  const publicCandidate = summary.permitted_attempt.candidates[index];
  assert.equal(candidate.id, publicCandidate.youtube_id);
  assert.equal(candidate.commonsDurationSeconds, publicCandidate.commons_duration_seconds);
  assert.equal(candidate.metadata.id, candidate.id);
  assert.equal(candidate.metadata.duration_seconds, publicCandidate.original_duration_seconds);
  assert.ok(Math.abs(candidate.metadata.duration_seconds - candidate.commonsDurationSeconds) < 1);
  assert.equal(candidate.outcome.exit_code, 0);
  assert.equal(candidate.timed_out, false);
  assert.equal(candidate.output_limit_exceeded, false);
  assert.equal(candidate.stdout_sha256, publicCandidate.stdout_sha256);
  assert.deepEqual(Object.keys(candidate.metadata.original_chinese_subtitles),
    publicCandidate.original_chinese_subtitle_languages);
  assert.deepEqual(Object.keys(candidate.metadata.automatic_chinese_captions),
    publicCandidate.automatic_chinese_caption_languages);
  assert.equal(publicCandidate.eligible_cues_added, 0);
  assert.deepEqual(candidate.metadata.subtitle_languages, []);
  assert.deepEqual(candidate.metadata.automatic_caption_languages, []);
}
console.log('VOA Mandarin caption inventory and retained sandbox failure verified');
