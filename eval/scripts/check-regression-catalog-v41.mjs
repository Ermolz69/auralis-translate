import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { sha256 } from './target-term-scope.mjs';

const read = file => fs.readFile(new URL(`../../${file}`,import.meta.url));
const catalog = JSON.parse(await read('eval/regressions/catalog-v41.json'));
assert.equal(catalog.schema_version,41);
assert.equal(catalog.catalog_id,'zh-ru-development-regressions-v41');
assert.equal(sha256(await read(`eval/regressions/${catalog.base_catalog_file}`)),catalog.base_catalog_sha256);
assert.deepEqual(catalog.entries.map(row=>row.id),['REG-061','REG-062']);
const reportBytes = await read('eval/reports/2026-10-03-reg-061-target-terms-v1.json');
const report = JSON.parse(reportBytes);
assert.equal(report.decision,'reject_keep_product_v8');
assert.equal(report.checkpoint_count,0);
assert.equal(report.published_results,0);
for (const entry of catalog.entries) {
  const bytes = await read(`eval/regressions/${entry.pack_file}`);
  assert.equal(sha256(bytes),entry.pack_sha256);
  const pack = JSON.parse(bytes);
  for (const field of ['id','source_family','split','category','profile_scope','expected_invariant','severity'])
    assert.equal(pack[field],entry[field]);
  assert.equal(pack.minimal_reproducers.length,entry.minimal_reproducer_count);
  assert.equal(pack.related_controls.length,entry.related_control_count);
  assert.equal(pack.negative_controls.length,entry.negative_control_count);
  assert.equal(pack.human_bilingual_review_count,0);
  assert.equal(pack.release_gate,'open');
  await read(entry.evidence_record);
  if (pack.id==='REG-061') {
    assert.equal(sha256(await read(`eval/regressions/${pack.base_pack_file}`)),pack.base_pack_sha256);
    assert.equal(pack.followup.public_report_sha256,sha256(reportBytes));
    assert.equal(pack.followup.private_report_sha256,report.private_report_sha256);
    assert.equal(pack.followup.ai_review_sha256,report.ai_review_sha256);
    assert.equal(pack.followup.decision,report.decision);
    assert.equal(pack.followup.identical_pairs,report.identical_pairs);
    for (const control of [...pack.related_controls,...pack.negative_controls]) {
      assert.equal(control.model_runs,2);
      const paired = report.rows.filter(row=>row.id===control.id);
      assert.equal(paired.length,2);
      assert(paired.every(row=>row.source===control.source && row.expected_meaning===control.expected_meaning));
    }
  } else {
    assert.equal(pack.public_report_sha256,sha256(reportBytes));
    assert.equal(pack.private_report_sha256,report.private_report_sha256);
    for (const repro of pack.minimal_reproducers) {
      const scoped = report.rows.find(row=>row.id===repro.control_id && row.variant==='scoped');
      const baseline = report.rows.find(row=>row.id===repro.control_id && row.variant==='baseline');
      assert.equal(scoped.candidate,repro.scoped_candidate);
      assert.equal(baseline.candidate,repro.baseline_candidate);
      assert.equal(scoped.source,repro.source);
      assert.equal(scoped.request_sha256,repro.scoped_request_sha256);
      assert.equal(scoped.raw_response_sha256,repro.scoped_raw_response_sha256);
    }
    assert([...pack.related_controls,...pack.negative_controls].every(row=>row.model_runs===0));
  }
}
console.log('Catalog v41: REG-061 isolation outcome and REG-062 contrast failure retained; human/release gates open.');
