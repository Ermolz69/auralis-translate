import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { checkCueMediaCoverage } from './cue-media-coverage.mjs';

const root = path.resolve('.');
const regressionDir = path.join(root, 'eval/regressions');
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
const catalog = JSON.parse(fs.readFileSync(path.join(regressionDir, 'catalog-v24.json')));
assert.equal(catalog.schema_version, 24);
assert.equal(catalog.catalog_id, 'zh-ru-development-regressions-v24');
assert.equal(catalog.base_catalog_file, 'catalog-v23.json');
assert.equal(sha256(fs.readFileSync(path.join(regressionDir, catalog.base_catalog_file))),
  catalog.base_catalog_sha256);
assert.deepEqual(catalog.entries.map(entry => entry.id), ['REG-039']);
const entry = catalog.entries[0];
const packBytes = fs.readFileSync(path.join(regressionDir, entry.pack_file));
assert.equal(sha256(packBytes), entry.pack_sha256);
const pack = JSON.parse(packBytes);
for (const field of ['id', 'severity', 'source_family', 'split', 'expected_invariant']) {
  assert.equal(pack[field], entry[field]);
}
assert.equal(pack.private_reproducer.minimal_cases.length, entry.minimal_reproducer_count);
assert.equal(pack.related_controls.length, entry.related_control_count);
assert.equal(pack.negative_controls.length, entry.negative_control_count);
assert(fs.existsSync(path.join(root, entry.evidence_record)));

const directory = path.join(root, '.cache/eval/commons-sethlui-caption/caption-Cgsmq4');
const source = fs.readFileSync(path.join(directory, 'source.zh.srt'));
const acquisition = fs.readFileSync(path.join(directory, 'acquisition.json'));
assert.equal(sha256(source), pack.private_reproducer.source_sha256);
assert.equal(sha256(acquisition), pack.private_reproducer.acquisition_record_sha256);
const sourceText = new TextDecoder('utf-8', { fatal: true }).decode(source);
const [before, after] = pack.private_reproducer.minimal_cases;
assert(sourceText.includes(`${before.cue_id}\n00:12:11,300 --> 00:12:12,900`));
assert(sourceText.includes(`${after.cue_id}\n00:14:00,100 --> 00:14:03,666`));
const reproduction = checkCueMediaCoverage(pack.private_reproducer.minimal_cases
  .map(row => ({ id: row.cue_id, start_ms: row.start_ms, end_ms: row.end_ms })),
  pack.private_reproducer.catalog_media_upper_bound_ms);
assert.equal(reproduction.covers_media, false);
assert.equal(reproduction.first_overrun.cue_id, 264);
for (const control of [...pack.related_controls, ...pack.negative_controls]) {
  assert.equal(checkCueMediaCoverage(control.segments,
    control.media_duration_ms).covers_media, control.expected_coverage, control.id);
}
assert.equal(new Set([...pack.related_controls, ...pack.negative_controls]
  .map(control => control.id)).size, 6);
assert.equal(pack.control_model_runs, 0);
assert.equal(pack.human_review, 'missing');
assert.equal(pack.release_gate, 'open');
console.log('REG-039: pinned cue-263/264 media mismatch and six timing controls verified; matched-media admission remains open.');
