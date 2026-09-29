import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { digest } from './flores-file-fixture.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const bytes = await fs.readFile(path.join(root, 'eval/reports/2026-09-29-slot-schema-ablation.json'));
assert.equal(digest(bytes), '7a53c67769e59cee113aea10fc25b4e04f77acc6aadd4d9b1fb918fe6d4473d5');
const report = JSON.parse(bytes);
assert.equal(report.experiment, 'slot-schema-ablation-2026-09-29-v1');
assert.equal(report.status, 'completed');
assert.equal(report.identity.code_commit, 'ca9299d20b5d91ff609e1e6e0fe677176d8de4b1');
assert.equal(report.identity.journal_gzip_sha256, 'ea54a97843fb107e3181b66d60f80d1169fc85b40f5565dd05a49692dc7ebc58');
assert.equal(report.identity.model_sha256_verified_by_doctor, 'dc5f44fcf1fa496ee7ad725982c0c8c553a4de00259b53af84c4b89fb0c06699');
assert.equal(report.case.target_segment_id, 72);
assert.deepEqual(report.case.context_segment_ids, [71, 73]);
assert.deepEqual(report.budget.seeds, [101, 202]);
assert.equal(report.requests.length, 4);
assert.equal(JSON.parse(report.doctor).verified, true);
assert(report.resources.samples.length >= 1);
assert(report.wall_ms > 0 && report.wall_ms < report.budget.total_wall_ms);

for (let pair = 0; pair < 2; pair++) {
  const [baseline, constrained] = report.requests.slice(pair * 2, pair * 2 + 2);
  assert.equal(baseline.arm, 'baseline');
  assert.equal(constrained.arm, 'const_schema');
  assert.equal(baseline.seed, report.budget.seeds[pair]);
  assert.equal(constrained.seed, baseline.seed);
  const expected = structuredClone(baseline.request);
  expected.response_format.schema.properties.translations.items.properties.segment_id = { const: 72 };
  expected.response_format.schema.properties.translations.items.properties.line_index = { const: 0 };
  assert.deepEqual(constrained.request, expected, 'Only target-slot schema constants may differ within a pair');
  for (const row of [baseline, constrained]) {
    assert.equal(row.request_sha256, digest(Buffer.from(JSON.stringify(row.request))));
    assert.equal(row.http_status, 200);
    assert(row.elapsed_ms > 0);
    assert(row.usage.prompt_tokens > 0 && row.usage.completion_tokens > 0);
    const response = JSON.parse(row.raw_response);
    assert.equal(response.choices[0].message.content, row.raw_candidate);
    assert.deepEqual(JSON.parse(row.raw_candidate), row.candidate);
    const [slot] = row.candidate.translations;
    assert.equal(row.candidate.translations.length, 1);
    assert.equal(slot.segment_id, 72);
    assert.equal(slot.line_index, 0);
    assert.equal(row.structurally_accepted, true);
    assert(!row.request.messages[0].content.includes(report.case.expected_meaning_outside_requests));
  }
}
console.log('Target-slot ablation verified: 2 paired seeds, 4 raw real-model responses, both arms structurally accepted; no demonstrated reliability gain.');
