import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve('.');
const directory = path.join(root, 'eval/regressions');
const digest = bytes => createHash('sha256').update(bytes).digest('hex');
const catalog = JSON.parse(fs.readFileSync(path.join(directory, 'catalog-v38.json')));
assert.equal(catalog.schema_version, 38);
assert.equal(catalog.catalog_id, 'zh-ru-development-regressions-v38');
assert.equal(digest(fs.readFileSync(path.join(directory, catalog.base_catalog_file))),
  catalog.base_catalog_sha256);
assert.deepEqual(catalog.entries.map(row => row.id), ['REG-058', 'REG-059']);
const report = JSON.parse(fs.readFileSync(path.join(root,
  'eval/reports/2026-10-02-v8-asus-single-target.json')));
const audit = JSON.parse(fs.readFileSync(path.join(root,
  'eval/reports/2026-10-02-v8-asus-single-target-risk-audit.json')));
for (const entry of catalog.entries) {
  const packBytes = fs.readFileSync(path.join(directory, entry.pack_file));
  assert.equal(digest(packBytes), entry.pack_sha256);
  const pack = JSON.parse(packBytes);
  for (const field of ['id', 'severity', 'source_family', 'split', 'category',
    'profile_scope', 'expected_invariant']) assert.equal(pack[field], entry[field]);
  assert.equal(pack.related_controls.length, entry.related_control_count);
  assert.equal(pack.negative_controls.length, entry.negative_control_count);
  assert([...pack.related_controls, ...pack.negative_controls]
    .every(row => row.model_runs === 0));
  assert.equal(pack.human_bilingual_review_count, 0);
  assert.equal(pack.release_gate, 'open');
  assert(fs.existsSync(path.join(root, entry.evidence_record)));
  if (entry.id === 'REG-058') {
    assert.equal(pack.minimal_reproducers.length, entry.minimal_reproducer_count);
    assert.deepEqual(pack.minimal_reproducers.map(row => row.cue_id),
      audit.ai_review.high_confidence_semantic_issue_ids);
    assert.equal(pack.candidate_sha256, report.arms[1].output_sha256);
    assert.equal(pack.private_model_report_sha256, report.private_report_sha256);
    assert.equal(pack.private_audit_pairs_sha256, audit.private_selection_sha256);
    for (const row of pack.minimal_reproducers) {
      assert.equal(pack.related_controls.filter(control => control.for === row.id).length, 1);
      assert.equal(pack.negative_controls.filter(control => control.for === row.id).length, 1);
    }
  } else {
    assert.equal(Number(Boolean(pack.minimal_reproducer)), entry.minimal_reproducer_count);
    assert.equal(pack.minimal_reproducer.private_report_sha256, report.private_report_sha256);
    assert.equal(pack.minimal_reproducer.request_sha256,
      report.arms[0].final_chat_request_sha256);
    assert.equal(pack.minimal_reproducer.raw_response_sha256,
      report.arms[0].final_raw_response_sha256);
    assert.equal(pack.minimal_reproducer.durable_prefix_cues,
      report.arms[0].covered_prefix_cues);
    assert.equal(pack.minimal_reproducer.target_id, report.arms[0].first_failed_target_id);
    const privateReport = JSON.parse(fs.readFileSync(path.join(root, report.private_report)));
    const chat = privateReport.arms[0].requests.at(-1);
    const raw = JSON.parse(chat.raw_response);
    assert.equal(raw.choices[0].finish_reason, 'stop');
    const inner = JSON.parse(raw.choices[0].message.content).translations[0].text;
    const lines = inner.split('\n');
    assert.equal(lines.length, pack.minimal_reproducer.repeated_inner_lines);
    assert(lines.every(line => line === lines[0]));
    assert.equal(chat.outcome, 'invalid_candidate');
  }
}
console.log('REG-058–059 pinned: six AI semantic findings and one real repeated-line rejection; controls unrun.');
