import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { digest } from '../flores-file-fixture.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const pack = JSON.parse(await fs.readFile(path.join(root,
  'eval/regressions/long-v6-identifier-loss-v1.json')));
const reportBytes = await fs.readFile(path.join(root,
  'eval/reports/2026-09-29-long-v6-postlength-v2-report.json'));
const summary = JSON.parse(await fs.readFile(path.join(root,
  'eval/reports/2026-09-29-long-v6-postlength-v2-summary.json')));
const report = JSON.parse(reportBytes);

assert.equal(pack.id, 'REG-009');
assert.equal(digest(reportBytes), pack.source_report_sha256);
assert.equal(summary.journal_gzip_sha256, pack.source_journal_sha256);
assert.equal(summary.profile_sha256, pack.affected_profile_sha256);
assert.equal(summary.identifier_violation_count, 665);
assert.equal(summary.quality_verdict, 'failed_identifier_preservation_unreviewed');
assert.equal(pack.human_review, 'missing');
assert.equal(pack.release_gate, 'open');

const failure = report.identifier_violations.find(row =>
  row.segment_id === pack.failure.segment_id
  && row.line_index === pack.failure.line_index);
assert(failure);
assert.equal(failure.source_zh, pack.failure.source_zh);
assert.equal(failure.candidate_ru, pack.failure.accepted_ru);
assert.equal(failure.expected_identifier, pack.failure.required_identifier);
assert(!failure.candidate_ru.includes(pack.failure.required_identifier));

const ids = line => [...line.matchAll(/(?<![\p{L}\p{N}_])[A-Z]{2,}-[0-9]{2,8}(?![\p{L}\p{N}_])/gu)]
  .map(match => match[0]).sort();
for (const control of [...pack.related_controls, ...pack.negative_controls]) {
  assert.equal(
    JSON.stringify(ids(control.source_zh)) !== JSON.stringify(ids(control.candidate_ru)),
    control.expected_warning,
    control.id,
  );
}
assert(report.identifier_violations.some(row => row.segment_id <= 10));
assert(report.identifier_violations.some(row => row.segment_id >= 512 && row.segment_id <= 900));
assert(report.identifier_violations.some(row => row.segment_id >= 1000));
