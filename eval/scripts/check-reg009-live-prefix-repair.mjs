import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { gunzipSync } from 'node:zlib';
import { digest } from './flores-file-fixture.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const reports = path.join(root, 'eval/reports');
const stem = '2026-09-29-reg009-live-prefix-repair';
const summaryBytes = await fs.readFile(path.join(reports, `${stem}-summary.json`));
assert.equal(digest(summaryBytes), '5388be229dae37710322f1143497d48e5e98037437fa11319943d03dd2e51c64');
const summary = JSON.parse(summaryBytes);
assert.equal(summary.outcome, 'development_fact_screen_unreviewed');
assert.equal(summary.release_gate, 'open');
assert.equal(summary.model_selection, 'unselected');
assert.equal(summary.human_review, 'missing');
assert.equal(summary.sealed_holdout, false);
const reportBytes = await fs.readFile(path.join(reports, summary.report_file));
const requestsGzip = await fs.readFile(path.join(reports, summary.requests_file));
const resourceGzip = await fs.readFile(path.join(reports, summary.resource_file));
assert.equal(digest(reportBytes), summary.report_sha256);
assert.equal(digest(requestsGzip), summary.requests_gzip_sha256);
assert.equal(digest(resourceGzip), summary.resources_gzip_sha256);
const requestBytes = gunzipSync(requestsGzip);
const resourceBytes = gunzipSync(resourceGzip);
assert.equal(digest(requestBytes), summary.requests_uncompressed_sha256);
assert.equal(digest(resourceBytes), summary.resources_uncompressed_sha256);
const report = JSON.parse(reportBytes);
const entries = requestBytes.toString('utf8').trim().split('\n').map(JSON.parse);
const resources = resourceBytes.toString('utf8').trim().split('\n').map(JSON.parse);
assert.equal(report.status, 'complete_observations_unreviewed');
assert.equal(report.identity.git_head, 'fcaf91128ff82d05cf24b9ad10c075f89e1028a3');
assert.equal(report.identity.harness_sha256,
  digest(await fs.readFile(path.join(root, 'eval/scripts/probe-reg009-live-prefix-repair.mjs'))));
assert.equal(report.identity.manifest_sha256,
  digest(await fs.readFile(path.join(root,
    'models/manifests/hy_mt2_1_8b_q4_k_m.context_v6_prefix_repair.experimental.json'))));
assert.equal(report.identity.archive_sha256,
  digest(await fs.readFile(path.join(root,
    'eval/reports/2026-09-29-long-v6-postlength-v2-journal.json.gz'))));
assert.equal(report.requests.length, 81);
assert.equal(entries.length, 81);
assert.equal(report.failures.length, 0);
assert.deepEqual(resources, report.resources.samples);
assert.equal(summary.counts.requests, 81);
assert.equal(summary.counts.raw_exact_identifiers, 36);
assert.equal(summary.counts.accepted_exact_identifiers, 81);
assert.equal(summary.counts.inserted_review_required, 45);
assert.equal(summary.counts.rejected, 0);
assert.equal(summary.counts.raw_exact_numeric_facts, 81);
assert.equal(summary.counts.accepted_exact_numeric_facts, 81);
const ids = text => text.match(/(?<![\p{L}\p{N}_])[A-Z]{2,}-[0-9]{2,8}(?![\p{L}\p{N}_])/gu)?.sort() ?? [];
let rawExact = 0;
let inserted = 0;
for (const [index, row] of entries.entries()) {
  const planned = report.planned_requests[index];
  const observed = report.requests[index];
  assert.equal(row.cue_id, planned.cue_id);
  assert.equal(row.seed, planned.seed);
  assert.equal(row.request_sha256, digest(Buffer.from(JSON.stringify(row.request))));
  assert.equal(row.request_sha256, planned.request_sha256);
  assert.equal(row.policy_outcome, observed.policy_outcome);
  assert.equal(row.http_status, 200);
  assert.equal(row.finish_reason, 'stop');
  assert.doesNotMatch(row.request.messages[0].content, /\p{Script=Cyrillic}/u);
  const target = JSON.parse(row.request.messages[0].content.split('Input JSON:\n')[1]).target_slots[0];
  assert.equal(target.segment_id, row.cue_id);
  assert.equal(target.line_index, 0);
  assert.equal(target.source_original, row.source_zh);
  const raw = JSON.parse(JSON.parse(row.raw_response).choices[0].message.content).translations[0];
  assert.equal(raw.segment_id, row.cue_id);
  assert.equal(raw.line_index, 0);
  assert.equal(raw.text, row.restored_candidate);
  const expected = [`AUR-${String(row.cue_id).padStart(4, '0')}`];
  assert.deepEqual(ids(row.source_zh), expected);
  if (JSON.stringify(ids(row.restored_candidate)) === JSON.stringify(expected)) rawExact++;
  assert.deepEqual(ids(row.accepted_candidate), expected);
  if (row.review_flag) {
    inserted++;
    assert.equal(row.accepted_candidate, `${expected[0]}: ${row.restored_candidate}`);
    assert.equal(row.policy_outcome, 'accepted_inserted');
  } else {
    assert.equal(row.accepted_candidate, row.restored_candidate);
    assert.equal(row.policy_outcome, 'accepted_exact');
  }
}
assert.equal(rawExact, 36);
assert.equal(inserted, 45);
for (const cue of report.budget.cue_ids) for (const seed of report.budget.seeds) {
  assert.equal(entries.filter(row => row.cue_id === cue && row.seed === seed).length, 1);
}
console.log('REG-009 archive verified: 81 paired raw/projected responses, 45 flagged insertions, meaning unreviewed.');
