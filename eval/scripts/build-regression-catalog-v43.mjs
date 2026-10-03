import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const read = file => fs.readFile(path.join(root,file));
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const json = async file => JSON.parse(await read(file));
const packV1Path = 'eval/regressions/reg-062-contrast-referent-contamination-v1.json';
const packV2Path = 'eval/regressions/reg-062-contrast-referent-contamination-v2.json';
const catalogV42Path = 'eval/regressions/catalog-v42.json';
const catalogV43Path = 'eval/regressions/catalog-v43.json';
const reportPath = 'eval/reports/2026-10-03-reg-062-occurrence-terms-v1.json';
const reviewPath = 'eval/reports/2026-10-03-reg-062-occurrence-terms-v1-ai-review.json';
const resultPath = 'eval/experiments/2026-10-03-reg-062-occurrence-terms-v1-result.md';

export async function buildCatalogV43() {
  const [packV1Bytes,catalogV42Bytes,reportBytes,reviewBytes] = await Promise.all([
    read(packV1Path),read(catalogV42Path),read(reportPath),read(reviewPath)]);
  await read(resultPath);
  const packV1 = JSON.parse(packV1Bytes);
  const report = JSON.parse(reportBytes);
  const review = JSON.parse(reviewBytes);
  assert.equal(packV1.id,'REG-062');
  assert.equal(report.experiment,'reg-062-occurrence-terms-v1');
  assert.equal(report.decision,'reject_keep_product_v8');
  assert.equal(report.chats,120);
  assert.equal(report.preflights,240);
  assert.equal(report.human_bilingual_review_count,0);
  assert.equal(review.rows.length,120);
  assert.equal(hash(reviewBytes),report.ai_review_sha256);
  const reviewByKey = new Map(review.rows.map(item=>[
    `${item.id}/${item.run}/${item.variant}`,item]));
  const outcomes = ids => ids.map(id => ({id,
    baseline:Array.from({length:3},(_,index)=>reviewByKey.get(`${id}/${index+1}/baseline`)?.fact_verdict),
    occurrence:Array.from({length:3},(_,index)=>reviewByKey.get(`${id}/${index+1}/occurrence`)?.fact_verdict)}));
  const newControlIds = [...packV1.related_controls,...packV1.negative_controls].map(item=>item.id);
  const extraIds = ['reverse_availability_at_start','speaker_split_at_end'];
  const repro = report.rows.filter(row=>row.id==='pad_out_stand_available')
    .map(row=>({run:row.run,variant:row.variant,candidate:row.candidate,
      request_sha256:row.request_sha256,raw_response_sha256:row.raw_response_sha256}));
  assert.equal(repro.length,6);
  const packV2 = {...packV1,schema_version:2,
    profile_scope:'Hy-MT2 7B Q4_K_M v8 plus rejected target-scoped and exact-occurrence experimental term transformers',
    related_controls:packV1.related_controls.map(item=>({...item,model_runs:6})),
    negative_controls:packV1.negative_controls.map(item=>({...item,model_runs:6})),
    base_pack_file:path.basename(packV1Path),base_pack_sha256:hash(packV1Bytes),
    followup:{experiment:report.experiment,evidence_record:resultPath,
      public_report_sha256:hash(reportBytes),private_report_sha256:report.private_report_sha256,
      ai_review_sha256:hash(reviewBytes),freeze_sha256:report.freeze_sha256,
      decision:report.decision,identical_pairs:report.identical_pairs,
      candidate_review_counts:report.review_counts,
      minimal_reproducer_paired_runs:repro,
      formerly_unrun_control_outcomes:outcomes(newControlIds),
      extra_control_outcomes:outcomes(extraIds),
      human_bilingual_review_count:0,
      scope_fix:'Source-span notes preserve exact v8 absence fallback and visible positive terms, but all three pad-stockout/stand-available runs still lose the stand; product v8 is retained.'}};
  const packV2Bytes = `${JSON.stringify(packV2,null,2)}\n`;
  const catalogV43 = {schema_version:43,
    catalog_id:'zh-ru-development-regressions-v43',
    base_catalog_file:path.basename(catalogV42Path),
    base_catalog_sha256:hash(catalogV42Bytes),
    entries:[{id:packV2.id,source_family:packV2.source_family,split:packV2.split,
      category:packV2.category,profile_scope:packV2.profile_scope,
      expected_invariant:packV2.expected_invariant,severity:packV2.severity,
      pack_file:path.basename(packV2Path),pack_sha256:hash(packV2Bytes),
      minimal_reproducer_count:packV2.minimal_reproducers.length,
      related_control_count:packV2.related_controls.length,
      negative_control_count:packV2.negative_controls.length,
      evidence_record:resultPath,
      last_outcome:'Exact-occurrence candidate repairs all twelve known positive observations, but loses the available stand in all three REG-062 reproducers and all three two-speaker controls; rejected, product v8 unchanged.'}]};
  const catalogV43Bytes = `${JSON.stringify(catalogV43,null,2)}\n`;
  return {packV2Path,packV2Bytes,catalogV43Path,catalogV43Bytes,
    report,review,packV1,packV2,catalogV43};
}

export async function writeOrCheckCatalogV43(write=false) {
  const built = await buildCatalogV43();
  for (const [file,bytes] of [[built.packV2Path,built.packV2Bytes],
    [built.catalogV43Path,built.catalogV43Bytes]]) {
    if (write) await fs.writeFile(path.join(root,file),bytes,{flag:'wx'});
    else assert.equal((await read(file)).toString('utf8'),bytes);
  }
  return built;
}

if (process.argv[1] && path.resolve(process.argv[1])===fileURLToPath(import.meta.url)) {
  const write = process.argv[2]==='--write';
  assert(process.argv.length===2 || (process.argv.length===3 && write));
  const built = await writeOrCheckCatalogV43(write);
  console.log(`Catalog v43: ${built.packV2.followup.decision}; REG-062 recurrence retained.`);
}
