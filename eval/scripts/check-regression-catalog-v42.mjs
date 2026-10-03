import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { createHash } from 'node:crypto';
const read=file=>fs.readFile(new URL(`../../${file}`,import.meta.url));
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const catalog=JSON.parse(await read('eval/regressions/catalog-v42.json'));
assert.equal(catalog.schema_version,42);
assert.equal(hash(await read(`eval/regressions/${catalog.base_catalog_file}`)),catalog.base_catalog_sha256);
assert.deepEqual(catalog.entries.map(e=>e.id),['REG-063','REG-064']);
for(const entry of catalog.entries) {
  const bytes=await read(`eval/regressions/${entry.pack_file}`);
  assert.equal(hash(bytes),entry.pack_sha256);
  const pack=JSON.parse(bytes);
  for(const field of ['id','source_family','split','category','profile_scope','expected_invariant','severity']) assert.equal(pack[field],entry[field]);
  assert.equal(pack.minimal_reproducers.length,entry.minimal_reproducer_count);
  assert.equal(pack.related_controls.length,entry.related_control_count);
  assert.equal(pack.negative_controls.length,entry.negative_control_count);
  assert([...pack.related_controls,...pack.negative_controls].every(c=>c.model_runs===0));
  assert.equal(pack.human_bilingual_review_count,0);assert.equal(pack.release_gate,'open');
  await read(entry.evidence_record);
  if(pack.id==='REG-063') {
    const reportBytes=await read('eval/reports/2026-10-03-source-name-registry-v1.json');
    const report=JSON.parse(reportBytes);
    assert.equal(pack.public_report_sha256,hash(reportBytes));
    for(const repro of pack.minimal_reproducers) {
      const observation=report.observations.find(o=>o.variant==='registry'&&o.repetition===repro.repetition&&o.segment_id===repro.segment_id);
      assert.equal(observation.source,repro.source);assert.equal(observation.accepted,repro.registry_candidate);
      assert.equal(observation.request_sha256,repro.registry_request_sha256);
      assert.equal(observation.raw_response_sha256,repro.registry_raw_response_sha256);
      assert.deepEqual(observation.context.map(c=>c.source_original),repro.source_context);
      assert.equal(report.observations.find(o=>o.variant==='baseline'&&o.repetition===repro.repetition&&o.segment_id===repro.segment_id).accepted,repro.baseline_candidate);
    }
  } else await read(pack.test_file);
}
console.log('Catalog v42: rejected name/action copy and fixed false-substring extraction retained; related semantic probes unrun, human gates open.');
