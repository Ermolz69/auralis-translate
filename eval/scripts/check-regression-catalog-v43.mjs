import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildCatalogV43, writeOrCheckCatalogV43 } from './build-regression-catalog-v43.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const read = file => fs.readFile(path.join(root,file));
const built = await writeOrCheckCatalogV43(false);
const expected = await buildCatalogV43();
assert.deepEqual(built.packV2,expected.packV2);
assert.equal(built.catalogV43.schema_version,43);
assert.deepEqual(built.catalogV43.entries.map(item=>item.id),['REG-062']);
assert.equal(built.packV2.base_pack_file,'reg-062-contrast-referent-contamination-v1.json');
assert.equal(built.packV2.followup.decision,'reject_keep_product_v8');
assert.equal(built.packV2.followup.minimal_reproducer_paired_runs.length,6);
assert(built.packV2.followup.minimal_reproducer_paired_runs
  .filter(row=>row.variant==='occurrence').every(row=>
    row.candidate.includes('коврик для мыши') && !/подставк|стойк|креплен|кронштейн/u.test(row.candidate)));
for (const control of [...built.packV2.related_controls,...built.packV2.negative_controls]) {
  assert.equal(control.model_runs,6);
  const rows=built.report.rows.filter(row=>row.id===control.id);
  assert.equal(rows.length,6);
  assert(rows.every(row=>row.source===control.source));
}
assert.equal(built.report.review_counts.candidate_fail,8);
assert.equal(built.report.review_counts.candidate_needs_review,4);
assert.equal(built.review.human_bilingual_review_count,0);
await read('eval/experiments/2026-10-03-reg-062-occurrence-terms-v1-result.md');
console.log('Catalog v43: rejected REG-062 recurrence, all formerly unrun controls and zero human review verified.');
