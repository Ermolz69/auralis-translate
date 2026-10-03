import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const read = file => fs.readFile(path.join(root, file));
const bytes = await read('eval/reports/2026-10-03-source-name-registry-v1.json');
assert.equal(hash(bytes), '191b9a1af432c95a94f5e415f24e6f71b346eefe65a043aef58a4784f80406c8');
const report = JSON.parse(bytes);
const reviewBytes = await read('eval/reports/2026-10-03-source-name-registry-v1-ai-review.json');
const review = JSON.parse(reviewBytes);
const parent = '.cache/eval/source-name-registry-v1/freeze-02';
const guard = JSON.parse(await read(`${parent}/attempt-started.json`));
const retainedBytes = await read(`${parent}/${path.basename(guard.workspace)}/report.json`);
assert.equal(hash(retainedBytes), report.report_sha256);
const retained = JSON.parse(retainedBytes);
assert.equal(report.observations.length, 84);
assert.equal(review.new_semantic_errors, 9);
const facts = {
  1: 'Address Xiao Li and invite them to enter; Bai/Bley is unsupported.',
  6: 'Ask Xiao Li at what time they can arrive; neither file transfer nor departure is the target action.',
  11: 'Meet Xiao Li on Friday; do not replace Li with Bai.'
};
const traces = [];
for (const row of review.rows) {
  for (const repetition of row.new_error_repetitions) {
    const select = variant => report.observations.find(o => o.variant === variant && o.repetition === repetition && o.segment_id === row.segment_id);
    const baseline = select('baseline');
    const registry = select('registry');
    const arm = retained.arms.find(a => a.index === registry.arm_index);
    const checkpoint = arm.checkpoints.find(c => c.block_index === row.segment_id - 1);
    assert(checkpoint);
    assert.deepEqual(JSON.parse(checkpoint.accepted_json)[0].lines, [registry.accepted]);
    for (const observation of [baseline, registry]) {
      assert.equal(hash(observation.rendered_request), observation.request_sha256);
      assert.equal(hash(observation.raw_response), observation.raw_response_sha256);
      const envelope = JSON.parse(JSON.parse(observation.rendered_request).messages[0].content.split('Input JSON:\n')[1]);
      assert.equal(envelope.target_slots[0].source_original, observation.source);
      assert.deepEqual(envelope.source_context, observation.context);
      assert.deepEqual(envelope.target_slots[0].name_proposals ?? [], observation.hints);
    }
    assert(registry.hints.every(h => h.status === 'needs_review'));
    traces.push({segment_id: row.segment_id, repetition, expected_source_fact: facts[row.segment_id],
      source: registry.source, context: registry.context, proposals: registry.hints,
      baseline, registry, accepted_checkpoint: checkpoint,
      registry_revision: arm.registries[0], run_binding: arm.bindings[0],
      ai_judgment: row.reason, human_review_count: 0});
  }
}
assert.equal(traces.length, 9);
const result = {schema_version: 1, experiment: 'name-action-trace-v1',
  parent_report_sha256: hash(bytes), parent_review_sha256: hash(reviewBytes),
  parent_retained_report_sha256: hash(retainedBytes), frozen_observations: 84,
  traced_new_errors: 9, new_inference_calls: 0, human_review_count: 0, traces};
const output = 'eval/reports/2026-10-03-name-action-trace-v1.json';
if (process.argv[2] === '--write') await fs.writeFile(path.join(root, output), `${JSON.stringify(result, null, 2)}\n`, {flag: 'wx'});
else assert.deepEqual(JSON.parse(await read(output)), result);
console.log('NAME-02: all nine exact source/context/proposal/request/raw/checkpoint traces verified; zero new inference.');
