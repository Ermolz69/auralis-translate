import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { gunzipSync } from 'node:zlib';
import { digest } from './flores-file-fixture.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const stem = '2026-09-29-long-v6-scene';
const dir = path.join(root, 'eval/reports');
const summary = JSON.parse(await fs.readFile(path.join(dir, `${stem}.json`)));
const rowsBytes = await fs.readFile(path.join(dir, summary.report_file));
const report = JSON.parse(rowsBytes);
const compressed = await fs.readFile(path.join(dir, summary.journal_file));
const journalBytes = gunzipSync(compressed);
const journal = JSON.parse(journalBytes);

assert.equal(summary.experiment, 'long-v6-slot-scene-1024-v1');
assert.equal(summary.outcome, 'passed_structural_unreviewed');
assert.equal(summary.code_commit, '5c557cc6e8a0d87d9a9fb96c065d62b612ac437b');
assert.equal(summary.report_sha256, digest(rowsBytes));
assert.equal(summary.journal_gzip_sha256, digest(compressed));
assert.equal(summary.journal_uncompressed_sha256, digest(journalBytes));
assert.equal(summary.run_id, report.run_id);
assert.equal(summary.run_id, journal.run_id);
assert.equal(summary.result_id, journal.result.result_id);
assert.equal(summary.cue_count, 1024);
assert.equal(summary.text_slot_count, 1280);
assert.equal(report.rows.length, 1024);
assert.equal(summary.planned_blocks, journal.checkpoints.length);
assert.equal(journal.run.state, 'validated');
assert.equal(journal.result.review_state, 'needs_review');
assert.equal(summary.source_sha256, digest(Buffer.from(journal.source_srt_utf8)));
assert.equal(summary.reference_sha256, digest(Buffer.from(journal.reference_srt_utf8)));
assert.equal(summary.output_sha256, digest(Buffer.from(journal.output_srt_utf8)));
assert.equal(summary.profile_sha256, digest(await fs.readFile(path.join(root,
  'models/manifests/hy_mt2_1_8b_q4_k_m.context_v6_slot.experimental.json'))));
assert.equal(report.profile_sha256, summary.profile_sha256);
assert.equal(report.model_sha256, summary.model_sha256);
assert.equal(report.cli_executable_sha256, summary.cli_executable_sha256);
assert.equal(summary.runtime_executable_sha256,
  '6f15be27bd80b6b4d52afefa49094e18fcfab55d5da354d717971f2d2537b2f4');
assert.equal(report.source_sha256, summary.source_sha256);
assert.equal(report.output_sha256, summary.output_sha256);
assert.equal(report.quality_verdict, 'unreviewed');
assert.equal(summary.quality_verdict, 'unreviewed');
assert.equal(summary.subtitle_holdout, false);
assert.equal(summary.bilingual_reviewed, false);
assert.equal(summary.request_count, journal.requests.length);
assert.equal(summary.request_count,
  summary.requests_by_kind_outcome.reduce((total, group) => total + group.count, 0));
assert(journal.requests.every((request, index) =>
  (index === 0 || request.sequence > journal.requests[index - 1].sequence) &&
  request.request_sha256 === digest(Buffer.from(request.rendered_request)) &&
  (request.outcome === 'pending' ? request.elapsed_ms === null : request.elapsed_ms !== null)));
assert.equal(summary.pending_request_count,
  journal.requests.filter((request) => request.outcome === 'pending').length);
assert(summary.pending_request_count <= 1);
const chats = journal.requests.filter((request) => request.request_kind === 'chat_completion');
const sumKnown = (field) => chats.reduce((sum, request) => sum + (request[field] ?? 0), 0);
assert.equal(summary.chat_request_count, chats.length);
assert.equal(summary.chat_prompt_tokens_recorded, sumKnown('prompt_tokens'));
assert.equal(summary.chat_completion_tokens_recorded, sumKnown('completion_tokens'));
assert.equal(summary.chat_elapsed_ms_sum, sumKnown('elapsed_ms'));
assert.equal(summary.resource_sample_count, report.resources.samples.length);
assert(journal.requests.filter((request) => request.outcome === 'validated_line').length >=
  summary.text_slot_count);
assert.equal(summary.source_preserved, true);
assert.equal(summary.saved_prefix_preserved, true);
assert.equal(summary.no_partial_publication, true);
assert.equal(summary.offline_reexport_identical, true);
console.log(`Verified v6 archive: ${summary.cue_count} cues, ${summary.text_slot_count} accepted lines, ${summary.request_count} complete requests; quality unreviewed`);
