import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const write = process.argv.length === 3 && process.argv[2] === '--write';
assert(process.argv.length === 2 || write);
const read = relative => fs.readFile(path.join(root, relative));
const digest = bytes => createHash('sha256').update(bytes).digest('hex');
const [baseBytes, reportBytes, reviewBytes, packBytes] =
  await Promise.all([
    read('eval/regressions/catalog-v50.json'),
    read('eval/reports/2026-10-10-vivo-scene-post-edit-v1.json'),
    read('eval/reports/2026-10-10-vivo-scene-post-edit-v1-ai-review.json'),
    read('eval/regressions/reg-072-post-edit-time-displacement-v1.json'),
  ]);
assert.equal(digest(baseBytes),
  'fc2523ce1361e48c49d8a0bbf6ebaeba5c7f987bc3207bc5bf51b298f73486c1');
assert.equal(digest(reportBytes),
  'ea135459148721da5819e616a0a691af0c9ffe6f1fd9d6a683636ec1b3069e51');
assert.equal(digest(reviewBytes),
  '4d1670f8a7e4ebf3680d9b08017a5f2da67809101d464d7248f9a8014fd28135');
assert.equal(digest(packBytes),
  '7c4f924a72de8560d01ff60e196490a9af3d910ff01bb964da5142ae09abe96f');
const base = JSON.parse(baseBytes);
const report = JSON.parse(reportBytes);
const review = JSON.parse(reviewBytes);
const pack = JSON.parse(packBytes);
assert.equal(base.schema_version, 50);
assert.equal(base.entries.at(-1).id, 'REG-071');
assert.equal(report.chats, 10);
assert.equal(report.preflights, 20);
assert.equal(report.decision, 'rejected_new_major_time_displacement');
assert.equal(review.summary.known_primary_relations_confirmed_repaired, 0);
assert.equal(review.summary.new_major_errors, 1);
assert.equal(review.summary.candidate_shortlisted, false);
assert.equal(pack.id, 'REG-072');
assert.equal(pack.source_sha256, report.source_sha256);
assert.equal(pack.baseline_draft_sha256, report.baseline_draft_sha256);
assert.equal(pack.post_edit_report_sha256, digest(reportBytes));
const observed = report.responses.find(row =>
  row.case_id === 'natural_midnight');
assert(observed);
assert.equal(observed.request_sha256,
  pack.minimal_reproducer.request_sha256);
assert.equal(observed.raw_http_sha256,
  pack.minimal_reproducer.raw_http_sha256);
assert(observed.new_major_error);
for (const cue of pack.minimal_reproducer.cues) {
  assert(observed.changed_cue_ids.includes(cue.cue_id));
  assert.equal(observed.candidate_text_sha256.find(row =>
    row.id === cue.cue_id)?.sha256, cue.candidate_text_sha256);
}
assert.equal(pack.related_controls.length, 3);
assert.equal(pack.negative_controls.length, 3);
assert(pack.related_controls.concat(pack.negative_controls)
  .every(row => row.outcome === 'pending_model_screen'));
assert.equal(new Set(pack.related_controls.concat(pack.negative_controls)
  .map(row => row.id)).size, 6);
const evidence = 'eval/experiments/2026-10-10-vivo-scene-post-edit-v1-result.md';
await read(evidence);
const catalog = { schema_version: 51,
  catalog_id: 'zh-ru-development-regressions-v51',
  base_catalog_file: 'catalog-v50.json',
  base_catalog_sha256: digest(baseBytes),
  entries: [ ...base.entries,
    { id: pack.id, source_family: pack.source_family,
      split: pack.split,
      category: 'scene_post_edit_moves_wrong_time_to_preceding_cue',
      profile_scope: pack.profile_scope,
      expected_invariant: pack.expected_invariant,
      severity: pack.severity,
      pack_file: 'reg-072-post-edit-time-displacement-v1.json',
      pack_sha256: digest(packBytes), minimal_reproducer_count: 1,
      related_control_count: pack.related_controls.length,
      negative_control_count: pack.negative_controls.length,
      evidence_record: evidence,
      post_edit_machine_report_sha256: digest(reportBytes),
      ai_review_sha256: digest(reviewBytes),
      last_outcome: 'The 10-chat scene post-editor inserted 11–12 at night into the preceding cue and dropped the source 1–2 a.m. hour. Zero of three primary relations were confirmed repaired; candidate rejected, v8 unchanged.' } ] };
const output = `${JSON.stringify(catalog, null, 2)}\n`;
const outputPath = path.join(root, 'eval/regressions/catalog-v51.json');
if (write) await fs.writeFile(outputPath, output, { flag: 'wx' });
else assert.equal(await fs.readFile(outputPath, 'utf8'), output);
console.log(`Catalog v51 ${write ? 'written' : 'verified'}: REG-072 pinned; post-editor rejected.`);
