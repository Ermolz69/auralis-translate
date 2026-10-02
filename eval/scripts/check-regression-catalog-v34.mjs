import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve('.');
const directory = path.join(root, 'eval/regressions');
const digest = bytes => createHash('sha256').update(bytes).digest('hex');
const catalog = JSON.parse(fs.readFileSync(path.join(directory, 'catalog-v34.json')));
assert.equal(catalog.schema_version, 34);
assert.equal(catalog.catalog_id, 'zh-ru-development-regressions-v34');
assert.equal(digest(fs.readFileSync(path.join(directory, catalog.base_catalog_file))),
  catalog.base_catalog_sha256);
assert.deepEqual(catalog.entries.map(row => row.id), ['REG-052']);
const entry = catalog.entries[0];
const packBytes = fs.readFileSync(path.join(directory, entry.pack_file));
assert.equal(digest(packBytes), entry.pack_sha256);
const pack = JSON.parse(packBytes);
for (const field of ['id', 'severity', 'source_family', 'split', 'category',
  'profile_scope', 'expected_invariant']) assert.equal(pack[field], entry[field]);
assert.equal(Number(Boolean(pack.minimal_reproducer)), entry.minimal_reproducer_count);
assert.equal(pack.related_controls.length, entry.related_control_count);
assert.equal(pack.negative_controls.length, entry.negative_control_count);
assert.equal(new Set([...pack.related_controls, ...pack.negative_controls]
  .map(row => row.id)).size, 6);
assert([...pack.related_controls, ...pack.negative_controls]
  .every(row => row.model_runs === 0));
assert.equal(pack.minimal_reproducer.cue_id, 3);
assert.match(pack.minimal_reproducer.four_target_output, /Был ли.*передал/u);
const report = JSON.parse(fs.readFileSync(path.join(root,
  'eval/reports/2026-10-02-v8-authored-cli.json')));
assert.equal(pack.minimal_reproducer.private_report_sha256, report.private_report_sha256);
assert.equal(pack.minimal_reproducer.one_target_output, report.arms[0].cues[2]);
assert.equal(pack.minimal_reproducer.four_target_output, report.arms[1].cues[2]);
assert.equal(pack.human_bilingual_review_count, 0);
assert.equal(pack.release_gate, 'open');
assert(fs.existsSync(path.join(root, entry.evidence_record)));
console.log('REG-052 pinned: real v8 name/question risk and six authored future controls; human and model review open.');
