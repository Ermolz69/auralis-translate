import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const digest = bytes => createHash('sha256').update(bytes).digest('hex');
const [sourceBytes, candidateBytes, auditBytes, reportBytes, packBytes, runBytes] =
  await Promise.all([
    fs.readFile(path.join(root, '.cache/eval/commons-asus-rog-ally-892592485/source.zh.srt')),
    fs.readFile(path.join(root,
      '.cache/eval/v8-asus-single-target-v1/attempt-dVT3zA/7b/candidate.ru.srt')),
    fs.readFile(path.join(root, '.cache/eval/v8-asus-single-target-v1/risk-audit-v1.json')),
    fs.readFile(path.join(root,
      'eval/reports/2026-10-02-v8-asus-single-target-risk-audit.json')),
    fs.readFile(path.join(root, 'eval/regressions/v8-natural-7b-semantic-risk-v1.json')),
    fs.readFile(path.join(root, 'eval/reports/2026-10-02-v8-asus-single-target.json')),
  ]);
const audit = JSON.parse(auditBytes);
const report = JSON.parse(reportBytes);
const pack = JSON.parse(packBytes);
const run = JSON.parse(runBytes);
assert.equal(digest(sourceBytes), pack.source_sha256);
assert.equal(digest(candidateBytes), pack.candidate_sha256);
assert.equal(digest(auditBytes), pack.private_audit_pairs_sha256);
assert.equal(pack.private_model_report_sha256, run.private_report_sha256);
assert.equal(report.source_sha256, pack.source_sha256);
assert.equal(report.candidate_sha256, pack.candidate_sha256);
assert.equal(report.private_selection_sha256, digest(auditBytes));
assert.equal(report.selected_cues, audit.selected_ids.length);
assert.deepEqual(report.selected_ids, audit.selected_ids);
assert.equal(report.machine_warnings.total, audit.warnings.length);
assert.equal(report.machine_warnings.cue_count,
  new Set(audit.warnings.map(row => row.id)).size);
assert.equal(report.machine_warnings.digit_verbatim_warnings,
  audit.warnings.filter(row => row.category === 'ascii_digit_not_verbatim').length);
assert.equal(report.machine_warnings.latin_marker_verbatim_warnings,
  audit.warnings.filter(row => row.category === 'latin_marker_not_verbatim').length);
assert.equal(report.ai_review.reviewed_selected_cues, audit.pairs.length);
assert.deepEqual(report.ai_review.high_confidence_semantic_issue_ids,
  pack.minimal_reproducers.map(row => row.cue_id));
assert.equal(pack.minimal_reproducers.length, 6);
assert.equal(pack.related_controls.length, 6);
assert.equal(pack.negative_controls.length, 6);
for (const row of pack.minimal_reproducers) {
  const pair = audit.pairs.find(item => item.id === row.cue_id);
  assert(pair, `Cue ${row.cue_id} must be in the source-only sample`);
  assert.equal(digest(Buffer.from(pair.source)), row.source_text_sha256);
  assert.equal(digest(Buffer.from(pair.candidate)), row.candidate_text_sha256);
  assert.equal(pack.related_controls.filter(item => item.for === row.id).length, 1);
  assert.equal(pack.negative_controls.filter(item => item.for === row.id).length, 1);
}
assert([...pack.related_controls, ...pack.negative_controls]
  .every(row => row.model_runs === 0));
assert.equal(report.human_bilingual_review_count, 0);
assert.equal(report.accepted_language_quality, false);
assert.equal(report.approved_spoken_script, false);
assert.equal(pack.human_bilingual_review_count, 0);
assert.equal(pack.release_gate, 'open');
console.log('Source-aware AI audit pinned: 43 selected cues, six semantic findings and twelve unrun controls; no human acceptance.');
