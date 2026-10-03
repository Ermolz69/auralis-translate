import assert from 'node:assert/strict';
import { buildReg062 } from './build-reg-062-occurrences-v1.mjs';

const state = await buildReg062();
const rows = state.planned[0].rows;
assert.equal(state.frozen.cases.length,20);
assert.equal(rows.length,120);
assert.equal(new Set(state.frozen.cases.map(item=>item.id)).size,20);
for (const item of state.frozen.cases) {
  const caseRows = rows.filter(row=>row.control_id===item.id);
  assert.equal(caseRows.length,6);
  for (const run of [1,2,3]) {
    const pair = caseRows.filter(row=>row.run===run);
    assert.deepEqual(new Set(pair.map(row=>row.variant)),
      new Set(['baseline','occurrence']));
    const baseline = pair.find(row=>row.variant==='baseline');
    const occurrence = pair.find(row=>row.variant==='occurrence');
    const original = baseline.request.messages[0].content.split('Input JSON:\n')[1];
    const candidate = occurrence.request.messages[0].content.split('Input JSON:\n')[1];
    assert.equal(candidate,original);
    assert.equal(JSON.parse(original).target_slots[0].source_original,item.source);
    assert.equal(JSON.parse(candidate).target_slots[0].source_for_translation,item.source);
    for (const fact of item.source_facts) {
      assert(!JSON.stringify(baseline.request).includes(fact));
      assert(!JSON.stringify(occurrence.request).includes(fact));
    }
    if (occurrence.baseline_identical)
      assert.equal(JSON.stringify(occurrence.request),JSON.stringify(baseline.request));
  }
}
assert.equal(rows.filter(row=>row.variant==='baseline'
  && row.original_reg061_baseline_sha256!==null).length,45);
assert.equal(rows.filter(row=>row.variant==='occurrence' && row.baseline_identical).length>0,true);
console.log('REG-062 plan: 20 development cues, 3 paired runs, 120 chats, exact target sources and v8 fallbacks.');
