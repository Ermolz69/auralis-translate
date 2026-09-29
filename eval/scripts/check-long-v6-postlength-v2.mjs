import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { gunzipSync } from 'node:zlib';
import { digest } from './flores-file-fixture.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const reports = path.join(root, 'eval/reports');
const stem = '2026-09-29-long-v6-postlength-v2';
const summaryBytes = await fs.readFile(path.join(reports, `${stem}-summary.json`));
assert.equal(digest(summaryBytes), '8a1007c11133a5da95936e8d794c626b3869295fe3c068f28cb603c658fe9d4b');
const summary = JSON.parse(summaryBytes);
const reportBytes = await fs.readFile(path.join(reports, summary.report_file));
const journalArchive = await fs.readFile(path.join(reports, summary.journal_file));
const journalBytes = gunzipSync(journalArchive);
const report = JSON.parse(reportBytes);
const journal = JSON.parse(journalBytes);
assert.equal(digest(reportBytes), summary.report_sha256);
assert.equal(digest(journalArchive), summary.journal_gzip_sha256);
assert.equal(digest(journalBytes), summary.journal_uncompressed_sha256);
assert.equal(summary.outcome, 'passed_structural_with_identifier_loss_after_harness_failure');
assert.equal(summary.quality_verdict, 'failed_identifier_preservation_unreviewed');
assert.equal(summary.subtitle_holdout, false);
assert.equal(summary.bilingual_reviewed, false);
assert.equal(summary.initial_task_exit, 1);
assert.equal(summary.reg_id, 'REG-008');
assert.equal(summary.cue_count, 1024);
assert.equal(summary.text_slot_count, 1280);
assert.equal(summary.checkpoints_before, 982);
assert.equal(summary.checkpoints_after, 1024);
assert.equal(summary.saved_prefix_preserved, true);
assert.equal(summary.attempts, 4);
assert.equal(summary.result_count, 1);
assert.equal(summary.code_preserved_cues, 453);
assert.equal(summary.identifier_violation_count, 665);
assert.deepEqual(summary.identifier_violation_counts, [
  { category: 'missing', count: 656 },
  { category: 'localized_cyrillic', count: 8 },
  { category: 'wrong_or_duplicate_ascii', count: 1 },
]);
assert.equal(summary.offline_reexport, 'byte_identical');
assert.equal(summary.request_journal_unchanged_after_postflight, true);
assert.equal(report.outcome, summary.outcome);
assert.equal(report.quality_verdict, summary.quality_verdict);
assert.equal(report.initial_task_exit, 1);
assert.match(report.initial_task_error, /ReferenceError: Cannot access 'process'/u);
assert.equal(report.first_postflight_verifier_exit, 1);
assert.equal(report.identifier_violations.length, 665);
assert.equal(report.rows.length, 1024);
assert.equal(report.text_slot_count, 1280);
assert(report.rows.every((row, index) => row.segment_id === index + 1));
for (const violation of report.identifier_violations) {
  const row = report.rows[violation.segment_id - 1];
  assert.equal(violation.expected_identifier, row.code);
  assert.equal(violation.source_zh, row.source_lines[violation.line_index]);
  assert.equal(violation.candidate_ru, row.candidate_lines[violation.line_index]);
  const observed = violation.candidate_ru.match(/[A-Z]+-\d{4}/gu) ?? [];
  assert(!(observed.length === 1 && observed[0] === row.code));
}
assert(report.identifier_violations.some(row => row.segment_id === 2
  && row.candidate_ru === 'Не открывайте эту дверь.'
  && row.expected_identifier === 'AUR-0002'));
assert(report.identifier_violations.some(row => row.segment_id >= 512 && row.segment_id < 900));
assert(report.identifier_violations.some(row => row.segment_id >= 1000));

const previous = JSON.parse(gunzipSync(await fs.readFile(path.join(reports,
  '2026-09-29-long-v6-relocated-continuation-failure-journal.json.gz'))));
assert.equal(previous.checkpoints.length, 982);
assert.deepEqual(journal.checkpoints.slice(0, 982), previous.checkpoints);
assert.equal(journal.run.state, 'validated');
assert.equal(journal.checkpoints.length, 1024);
assert(journal.checkpoints.every((row, index) => row.block_index === index));
assert.equal(journal.attempts.length, 4);
assert.equal(journal.result.result_id, summary.result_id);
assert.equal(journal.result.output_sha256, summary.output_sha256);
assert.equal(journal.result.review_state, 'needs_review');
assert.equal(digest(Buffer.from(journal.source_srt_utf8)), summary.source_sha256);
assert.equal(digest(Buffer.from(journal.output_srt_utf8)), summary.output_sha256);
assert.equal(journal.requests.length, 3847);
assert.deepEqual(journal.requests.slice(0, 3688).map(row => row.request_id),
  previous.requests.map(row => row.request_id));
assert(journal.requests.every((request, index) =>
  (index === 0 || request.sequence > journal.requests[index - 1].sequence)
    && request.request_sha256 === digest(Buffer.from(request.rendered_request))));
const newRequests = journal.requests.filter(request => request.attempt_id === 4);
assert.equal(newRequests.length, 159);
assert(newRequests.every(request => request.outcome !== 'pending'));
const chats = newRequests.filter(request => request.request_kind === 'chat_completion');
assert.equal(chats.length, 53);
const sum = field => chats.reduce((total, request) => total + (request[field] ?? 0), 0);
assert.equal(sum('prompt_tokens'), summary.new_chat_prompt_tokens);
assert.equal(sum('completion_tokens'), summary.new_chat_completion_tokens);
assert.equal(sum('elapsed_ms'), summary.new_chat_elapsed_sum_ms);
for (const request of chats) {
  const expected = report.rows[request.segment_id - 1].reference_lines[request.line_index];
  assert(!request.rendered_request.includes(expected), 'Proposed reference leaked into a model request');
}
const firstFailure = await fs.readFile(path.join(reports,
  '2026-09-29-long-v6-postflight-v1-failure.json'));
assert.equal(digest(firstFailure), summary.first_postflight_failure_sha256);
assert.equal(JSON.parse(firstFailure).outcome, 'failed_identifier_preservation_assertion');
const harnessFailure = await fs.readFile(path.join(reports,
  '2026-09-29-long-v6-postlength-harness-failure.json'));
assert.equal(digest(harnessFailure), summary.initial_failure_sha256);
console.log(`Post-length archive verified: 1024 cues, 1280 slots, 3847 requests, 665 identifier losses; structural recovery only.`);
