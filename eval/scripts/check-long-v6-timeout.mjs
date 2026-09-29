import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { gunzipSync } from 'node:zlib';
import { digest } from './flores-file-fixture.mjs';
import { longFileFixture } from './long-file-fixture.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const stem = '2026-09-29-long-v6-scene-timeout';
const reportBytes = await fs.readFile(path.join(root, `eval/reports/${stem}.json`));
const report = JSON.parse(reportBytes);
const regression = JSON.parse(await fs.readFile(path.join(root,
  'eval/regressions/long-run-time-budget-v1.json')));
const compressed = await fs.readFile(path.join(root, `eval/reports/${stem}-journal.json.gz`));
const journalBytes = gunzipSync(compressed);
const journal = JSON.parse(journalBytes);
const fixtureBytes = await fs.readFile(path.join(root, 'eval/fixtures/long-file-v1.json'));
const source = longFileFixture(JSON.parse(fixtureBytes), 'srt').source;
const profile = await fs.readFile(path.join(root,
  'models/manifests/hy_mt2_1_8b_q4_k_m.context_v6_slot.experimental.json'));

assert.equal(report.experiment, 'long-v6-slot-scene-1024-v1');
assert.equal(regression.id, 'REG-004');
assert.equal(regression.failure_report_sha256, digest(reportBytes));
assert.equal(regression.journal_gzip_sha256, digest(compressed));
assert.equal(regression.reproduction.observed_saved_blocks, report.saved_blocks);
assert.equal(regression.related_controls.length, 2);
assert.equal(report.outcome, 'failed_runner_resume_process_timeout');
assert.equal(report.code_commit, '5c557cc6e8a0d87d9a9fb96c065d62b612ac437b');
assert.equal(report.resumed_process_timeout_ms, 3_600_000);
assert.equal(report.declared_total_wall_budget_ms, 7_200_000);
assert.equal(report.source_sha256, digest(source));
assert.equal(report.source_sha256, digest(Buffer.from(journal.source_srt_utf8)));
assert.equal(report.fixture_manifest_sha256, digest(fixtureBytes));
assert.equal(report.profile_sha256, digest(profile));
assert.equal(report.journal_gzip_sha256, digest(compressed));
assert.equal(report.journal_uncompressed_sha256, digest(journalBytes));
assert.equal(report.run_id, journal.run_id);
assert.equal(journal.run.state, 'running');
assert.equal(report.interrupted_blocks, 16);
assert(report.saved_blocks >= 16 && report.saved_blocks < 1024);
assert.equal(report.planned_blocks, 1024);
assert.equal(journal.interrupted_checkpoints.length, 16);
assert.equal(journal.checkpoints.length, report.saved_blocks);
for (const [index, checkpoint] of journal.checkpoints.entries()) {
  assert.equal(checkpoint.block_index, index);
  if (index < 16) assert.deepEqual(checkpoint, journal.interrupted_checkpoints[index]);
}
assert.equal(report.result_count, 0);
assert.equal(report.partial_output_present, false);
assert.equal(report.request_count, journal.requests.length);
assert.equal(report.request_count,
  report.requests_by_kind_outcome.reduce((sum, group) => sum + group.count, 0));
assert.equal(report.pending_request_count,
  journal.requests.filter((request) => request.outcome === 'pending').length);
assert(journal.requests.every((request, index) =>
  (index === 0 || request.sequence > journal.requests[index - 1].sequence) &&
  request.request_sha256 === digest(Buffer.from(request.rendered_request))));
const cue72 = journal.requests.filter((request) => request.request_kind === 'chat_completion'
  && request.segment_id === 72 && request.line_index === 0);
assert.equal(cue72.length, 1);
assert.equal(cue72[0].outcome, 'validated_line');
const cue72Raw = JSON.parse(JSON.parse(cue72[0].raw_response).choices[0].message.content);
assert.equal(cue72Raw.translations[0].segment_id, 72);
assert.equal(cue72Raw.translations[0].line_index, 0);
assert.equal(report.subtitle_holdout, false);
assert.equal(report.bilingual_reviewed, false);
assert.equal(report.quality_verdict, 'unreviewed');
console.log(`Verified retained v6 timeout: ${report.saved_blocks}/${report.planned_blocks} blocks, ${report.request_count} requests, no published result; cue 72 raw=${JSON.stringify(cue72Raw)} tokens=${cue72[0].prompt_tokens}/${cue72[0].completion_tokens} elapsed_ms=${cue72[0].elapsed_ms}`);
