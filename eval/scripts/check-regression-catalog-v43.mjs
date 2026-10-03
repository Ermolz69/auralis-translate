import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { createHash } from 'node:crypto';
const read = file => fs.readFile(new URL(`../../${file}`,import.meta.url));
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const parentBytes = await read('eval/regressions/catalog-v42.json');
const original = JSON.parse(await read('eval/regressions/reg-063-name-proposal-neighbor-action-v1.json'));
const fixture = JSON.parse(await read('eval/corpora/name-action-admission-development-v1.json'));
const traceBytes = await read('eval/reports/2026-10-03-name-action-trace-v1.json');
const pack = {...original, schema_version:2,
  profile_scope:'Hy-MT2 1.8B Q4_K_M v8 source-name profiles; NAME-02 admission-only safety containment',
  original_pack_file:'reg-063-name-proposal-neighbor-action-v1.json',
  original_pack_sha256:hash(await read('eval/regressions/reg-063-name-proposal-neighbor-action-v1.json')),
  admission_controls:fixture.cases.map(c=>({...c,model_runs:0,verification:'deterministic admission; no new language output'})),
  trace_file:'eval/reports/2026-10-03-name-action-trace-v1.json',trace_sha256:hash(traceBytes),
  evidence_check:'task eval:name-action:check',
  backlog_fix:'NAME-02 fail-closed admission contains active proposals before checkpoint; linguistic fix and human review remain open. Keep baseline v8, no long file.'};
const packBytes = Buffer.from(`${JSON.stringify(pack,null,2)}\n`);
const entry = {...JSON.parse(parentBytes).entries[0],profile_scope:pack.profile_scope,
  pack_file:'reg-063-name-proposal-neighbor-action-v2.json',pack_sha256:hash(packBytes),
  evidence_record:'eval/experiments/2026-10-03-name-action-admission-v1-result.md',last_outcome:pack.backlog_fix,
  deterministic_admission_control_count:20,new_model_runs:0};
const catalog = {schema_version:43,catalog_id:'zh-ru-development-regressions-v43',
  base_catalog_file:'catalog-v42.json',base_catalog_sha256:hash(parentBytes),entries:[entry]};
if (process.argv[2] === '--write') {
  await fs.writeFile(new URL('../regressions/reg-063-name-proposal-neighbor-action-v2.json',import.meta.url),packBytes,{flag:'wx'});
  await fs.writeFile(new URL('../regressions/catalog-v43.json',import.meta.url),`${JSON.stringify(catalog,null,2)}\n`,{flag:'wx'});
  console.log('Catalog v43 appended; original v42 and REG-063 bytes preserved.'); process.exit(0);
}
assert.deepEqual(JSON.parse(await read('eval/regressions/catalog-v43.json')),catalog);
assert.equal(hash(await read('eval/regressions/reg-063-name-proposal-neighbor-action-v2.json')),hash(packBytes));
const report = JSON.parse(await read('eval/reports/2026-10-03-name-action-admission-v1.json'));
const trace = JSON.parse(traceBytes);
assert.equal(trace.traces.length,9);
for(const row of trace.traces) {
  const selected = report.replay.frozen_replays.find(o=>o.original.variant==='registry' &&
    o.original.segment_id===row.segment_id && o.original.repetition===row.repetition);
  assert.equal(selected.replay_outcome,'name_proposal_review_required');
  assert.equal(selected.original.request_sha256,row.registry.request_sha256);
  assert.equal(selected.original.raw_response_sha256,row.registry.raw_response_sha256);
  assert.equal(selected.new_accepted_checkpoint,null);
}
await read(entry.evidence_record);
console.log('Catalog v43 verified: nine unsafe accepted observations contained, 20 deterministic controls, language fix and human gates open.');
