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
const [baseBytes, focusBytes, reviewBytes, relationBytes, packBytes] =
  await Promise.all([
    read('eval/regressions/catalog-v49.json'),
    read('eval/reports/2026-10-10-vivo-focus-slot-v1.json'),
    read('eval/reports/2026-10-10-vivo-focus-slot-v1-ai-review.json'),
    read('eval/reports/2026-10-10-source-relation-review-v2.json'),
    read('eval/regressions/reg-071-future-product-shorthand-review-v1.json'),
  ]);
assert.equal(digest(baseBytes),
  '48799628072487c3924f99835944c76cb8da2af1f13840cacca6f8df6851ff97');
assert.equal(digest(focusBytes),
  'd779f08043e3410f78f25613ed7bf3ed1ef6c15d75019ed3494b9860e6dd2b75');
assert.equal(digest(reviewBytes),
  'c35520b4214f7ca64c2525bc6d63a94eeaba865f063a9932bb8f5a6bc2d18064');
assert.equal(digest(relationBytes),
  '98d72ac7e45beb9dab56ebc9c82b840b38c59e023727f46d63d3dbbacf88d0c9');
assert.equal(digest(packBytes),
  '1f44391839cc71ddc0e9c7111faabb5b6a1ddbd3e4b5c9e265a24c54de3509f2');
const base = JSON.parse(baseBytes);
const focus = JSON.parse(focusBytes);
const review = JSON.parse(reviewBytes);
const relation = JSON.parse(relationBytes);
const pack = JSON.parse(packBytes);
assert.equal(base.schema_version, 49);
assert.equal(base.entries.at(-1).id, 'REG-070');
assert.equal(focus.chats, 20);
assert.equal(focus.preflights, 40);
assert.equal(focus.ai_triage.known_relation_errors_repaired, 0);
assert.equal(focus.ai_triage.focus_candidate_shortlisted, false);
assert.equal(review.summary.human_bilingual_reviews, 0);
assert.equal(pack.id, 'REG-071');
assert.equal(pack.source_sha256, focus.source_sha256);
assert.equal(pack.focus_machine_report_sha256, digest(focusBytes));
assert.equal(relation.reg071_pack_sha256, digest(packBytes));
assert.deepEqual(relation.v2_full_draft_warnings.map(row => row.cue_id),
  [276, 280, 466]);
assert.equal(relation.new_full_draft_warnings.length, 0);
const minimal = relation.replay.find(row => row.family === 'focus' &&
  row.case_id === 'natural_466' && row.arm === 'focus');
assert(minimal);
assert.equal(minimal.request_sha256,
  pack.minimal_reproducer.focus_request_sha256);
assert.equal(minimal.raw_http_sha256,
  pack.minimal_reproducer.focus_raw_http_sha256);
assert.equal(minimal.v1_warnings.length, 0);
assert.equal(minimal.v2_warnings.length, 1);
assert.equal(pack.related_controls.length, 2);
assert.equal(pack.negative_controls.length, 3);
assert.equal(new Set([...pack.related_controls, ...pack.negative_controls]
  .map(row => row.id)).size, 5);
const focusEvidence = 'eval/experiments/2026-10-10-vivo-focus-slot-v1-result.md';
const relationEvidence =
  'eval/experiments/2026-10-10-source-relation-review-v2-result.md';
await Promise.all([read(focusEvidence), read(relationEvidence)]);
const catalog = { schema_version: 50,
  catalog_id: 'zh-ru-development-regressions-v50',
  base_catalog_file: 'catalog-v49.json',
  base_catalog_sha256: digest(baseBytes),
  entries: [
    ...base.entries.map(entry => entry.id !== 'REG-066' ? entry :
      { ...entry, focus_slot_evidence_record: focusEvidence,
        focus_slot_machine_report_sha256: digest(focusBytes),
        focus_slot_ai_review_sha256: digest(reviewBytes),
        last_outcome: 'A 20-chat same-source 7B batch/focus screen repaired zero of three primary relation errors. Five authored contrasts stayed correct; the focus candidate was rejected.' }),
    { id: pack.id, source_family: pack.source_family,
      split: pack.split,
      category: 'future_product_bare_present_assertion_escapes_v1_review',
      profile_scope: 'evaluation-only source relation diagnostic v1/v2 and rejected 7B focus-slot candidate',
      expected_invariant: pack.expected_invariant,
      severity: pack.severity,
      pack_file: 'reg-071-future-product-shorthand-review-v1.json',
      pack_sha256: digest(packBytes), minimal_reproducer_count: 1,
      related_control_count: pack.related_controls.length,
      negative_control_count: pack.negative_controls.length,
      evidence_record: relationEvidence,
      focus_slot_evidence_record: focusEvidence,
      focus_slot_machine_report_sha256: digest(focusBytes),
      relation_v2_report_sha256: digest(relationBytes),
      last_outcome: 'The saved bare-present focus reply escaped v1 but v2 warned offline. Both diagnostics remain evaluation-only; the focus candidate and product quality advancement were rejected.' },
  ] };
const output = `${JSON.stringify(catalog, null, 2)}\n`;
const outputPath = path.join(root, 'eval/regressions/catalog-v50.json');
if (write) await fs.writeFile(outputPath, output, { flag: 'wx' });
else assert.equal(await fs.readFile(outputPath, 'utf8'), output);
console.log(`Catalog v50 ${write ? 'written' : 'verified'}: REG-071 pinned; focus candidate rejected.`);
