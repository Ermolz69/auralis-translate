import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const write = process.argv.length === 3 && process.argv[2] === '--write';
assert(process.argv.length === 2 || write);
const read = relative => fs.readFile(path.join(root, relative));
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const [baseBytes, v1Bytes, v2Bytes, machineBytes, aiBytes,
  pack75Bytes, pack76Bytes] = await Promise.all([
  read('eval/regressions/catalog-v53.json'),
  read('eval/experiments/2026-10-10-vivo-technical-senses-v1-freeze.json'),
  read('eval/experiments/2026-10-10-vivo-technical-senses-v2-freeze.json'),
  read('eval/reports/2026-10-10-vivo-technical-senses-v2.json'),
  read('eval/reports/2026-10-10-vivo-technical-senses-v2-ai-review.json'),
  read('eval/regressions/reg-075-continuation-not-negation-v1.json'),
  read('eval/regressions/reg-076-negated-multicore-v1.json'),
]);
for (const [bytes, pinned] of [
  [baseBytes, '4bfc790f8f4bef116381631f8d95316e62bcc5d5d50ae36e6abf2475ce192378'],
  [v1Bytes, 'c2816d2a50571ec1abf168b1eb317891911094867e1311ab897162226bba7f61'],
  [v2Bytes, '466b0cb47164bd7f8fa2873f6ca318ab1af12724b674737728c8b31ee691f208'],
  [machineBytes, '2c962bb859e2ffa585853e13370d0eda8bdc597d7ae02d952201fc68df003043'],
  [aiBytes, 'c7a1afdc0ae7bb0e0529c10c0a5b4f582b41e96baf9ab5dba2fffbf7e1d2de7d'],
  [pack75Bytes, '26a3f3d021ce7f2bb0ec794bbd1f46812b2432b8a291fbc6f8b959f374684168'],
  [pack76Bytes, '35bf72512f537d388c6b3a884bbbb2b9fc5f9d63db8a0750f13df35762dbf120'],
]) assert.equal(sha(bytes), pinned);
const base = JSON.parse(baseBytes);
const v1 = JSON.parse(v1Bytes);
const v2 = JSON.parse(v2Bytes);
const machine = JSON.parse(machineBytes);
const ai = JSON.parse(aiBytes);
const pack75 = JSON.parse(pack75Bytes);
const pack76 = JSON.parse(pack76Bytes);
assert.equal(base.schema_version, 53);
assert.equal(base.entries.at(-1).id, 'REG-074');
assert.equal(pack75.id, 'REG-075');
assert.equal(pack76.id, 'REG-076');
assert.equal(pack75.freeze_sha256, sha(v1Bytes));
assert.equal(pack76.machine_report_sha256, sha(machineBytes));
assert.equal(ai.machine_report_sha256, sha(machineBytes));
assert.equal(v1.planned.length, 20);
assert.equal(v2.planned.length, 28);
const processV1 = v1.planned.filter(row => row.case_id === 'natural_process');
const processV2 = v2.planned.filter(row => row.case_id === 'natural_process');
assert.equal(processV1.length, 2);
assert.equal(processV2.length, 2);
assert.equal(processV1[0].request_sha256, processV1[1].request_sha256);
assert.deepEqual(processV1[1].eligible_terms, []);
assert.deepEqual(processV2.find(row => row.arm === 'candidate').eligible_terms,
  ['制程']);
assert.notEqual(processV2.find(row => row.arm === 'baseline').request_sha256,
  processV2.find(row => row.arm === 'candidate').request_sha256);
assert.equal(pack75.minimal_reproducer.source_text_sha256,
  processV1[0].source_text_sha256);
assert.equal(pack75.related_controls.length, 3);
assert.equal(pack75.negative_controls.length, 3);
assert.equal(machine.chats, 28);
assert.equal(machine.preflights, 56);
assert.equal(machine.total_tokens, 8119);
assert.equal(machine.human_bilingual_reviews, 0);
assert.equal(ai.case_reviews.length, 14);
assert.equal(ai.summary.natural_technical_fact_repairs, 2);
assert.equal(ai.summary.shared_major_control_errors, 1);
assert.equal(ai.summary.new_major_candidate_errors, 0);
assert.equal(ai.summary.candidate_shortlisted, false);
assert.equal(ai.summary.human_bilingual_reviews, 0);
const repro = pack76.minimal_reproducer;
const paired = machine.rows.filter(row => row.case_id === repro.case_id);
assert.equal(paired.length, 2);
assert.equal(paired[0].request_sha256, paired[1].request_sha256);
assert.equal(paired[0].accepted_text_sha256,
  paired[1].accepted_text_sha256);
assert.equal(paired[0].source_text_sha256,
  repro.source_text_sha256);
assert.equal(paired[0].source_inventory_sha256,
  repro.source_inventory_sha256);
for (const row of paired) {
  assert.equal(row.request_sha256,
    repro[`${row.arm}_request_sha256`]);
  assert.equal(row.raw_http_sha256,
    repro[`${row.arm}_raw_http_sha256`]);
  assert.equal(row.accepted_text_sha256,
    repro.accepted_text_sha256_both);
}
for (const pack of [pack75, pack76]) {
  assert.equal(pack.related_controls.length, 3);
  assert.equal(pack.negative_controls.length, 3);
  assert.equal(new Set([...pack.related_controls, ...pack.negative_controls]
    .map(row => row.id)).size, 6);
}
const evidence75 = 'eval/experiments/2026-10-10-vivo-technical-senses-v1-preflight-result.md';
const evidence76 = 'eval/experiments/2026-10-10-vivo-technical-senses-v2-result.md';
await Promise.all([read(evidence75), read(evidence76)]);
const catalog = { schema_version: 54,
  catalog_id: 'zh-ru-development-regressions-v54',
  base_catalog_file: 'catalog-v53.json',
  base_catalog_sha256: sha(baseBytes),
  entries: [...base.entries,
    { id: pack75.id, source_family: pack75.source_family,
      split: pack75.split, category: 'affirmative_continuation_false_negation',
      profile_scope: 'rejected evaluation-only technical sense v1',
      expected_invariant: pack75.expected_invariant,
      severity: pack75.severity,
      pack_file: 'reg-075-continuation-not-negation-v1.json',
      pack_sha256: sha(pack75Bytes), minimal_reproducer_count: 1,
      related_control_count: 3, negative_control_count: 3,
      evidence_record: evidence75, freeze_sha256: sha(v1Bytes),
      last_outcome: 'The frozen v1 candidate falsely abstained on affirmative process development; rejected before any model call.' },
    { id: pack76.id, source_family: pack76.source_family,
      split: pack76.split, category: 'negated_multicore_as_multiprocessor',
      profile_scope: pack76.profile_scope,
      expected_invariant: pack76.expected_invariant,
      severity: pack76.severity,
      pack_file: 'reg-076-negated-multicore-v1.json',
      pack_sha256: sha(pack76Bytes), minimal_reproducer_count: 1,
      related_control_count: 3, negative_control_count: 3,
      evidence_record: evidence76,
      paired_machine_report_sha256: sha(machineBytes),
      ai_review_sha256: sha(aiBytes),
      last_outcome: 'Twenty-eight real chats were structurally valid and two natural technical meanings improved, but the shared negated multi-core control failed; candidate rejected, v8 unchanged.' }
  ] };
const output = `${JSON.stringify(catalog, null, 2)}\n`;
const outputPath = path.join(root, 'eval/regressions/catalog-v54.json');
if (write) await fs.writeFile(outputPath, output, { flag: 'wx' });
else assert.equal(await fs.readFile(outputPath, 'utf8'), output);
console.log(`Catalog v54 ${write ? 'written' : 'verified'}: REG-075/076 retained; technical candidate rejected.`);
