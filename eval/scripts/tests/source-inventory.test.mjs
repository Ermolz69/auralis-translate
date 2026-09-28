import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { validateSourceInventory } from '../source-inventory.mjs';

const original = JSON.parse(await readFile(new URL('../../corpora/source-inventory-example-v1.json', import.meta.url), 'utf8'));
const copy = () => structuredClone(original);

test('authored example accounts for every source cue and explicit exclusion', () => {
  assert.deepEqual(validateSourceInventory(copy()), { source_count: 1, group_count: 1, eligible_cues: 1 });
});

test('a related source cannot cross the development and holdout split', () => {
  const inventory = copy();
  const source = structuredClone(inventory.sources[0]);
  source.id = 'second-source';
  source.split = 'holdout';
  inventory.sources.push(source);
  assert.throws(() => validateSourceInventory(inventory), /related sources cross splits/u);
});

test('unknown rights cannot admit source or reference text', () => {
  const inventory = copy();
  inventory.sources[0].rights.subtitle = { decision: 'unknown' };
  assert.throws(() => validateSourceInventory(inventory), /approve subtitle rights/u);
  const reference = copy();
  reference.sources[0].state = 'reference_reviewed';
  reference.sources[0].scenes[0].alignment = { state: 'human_reviewed', reviewer_id: 'bilingual-1', evidence_id: 'alignment-1' };
  reference.sources[0].scenes[0].reference = { state: 'human_reviewed', reviewer_id: 'bilingual-1', evidence_id: 'reference-1' };
  assert.throws(() => validateSourceInventory(reference), /approve reference rights/u);
});

test('claimed human review requires named reviewer and evidence', () => {
  const inventory = copy();
  inventory.sources[0].scenes[0].alignment = { state: 'human_reviewed' };
  assert.throws(() => validateSourceInventory(inventory), /reviewer_id/u);
});

test('every cue must be in source order once, even when excluded from review', () => {
  const duplicate = copy();
  duplicate.sources[0].scenes[0].cue_ids = [1, 1];
  assert.throws(() => validateSourceInventory(duplicate), /duplicated/u);
  const omitted = copy();
  omitted.sources[0].scenes[0].cue_ids = [2];
  assert.throws(() => validateSourceInventory(omitted), /expected source cue 1/u);
  const unownedExclusion = copy();
  unownedExclusion.sources[0].scenes[0].exclusions[0].cue_id = 3;
  assert.throws(() => validateSourceInventory(unownedExclusion), /unique scene cue/u);
});

test('a fixture cannot masquerade as a sealed human-reviewed holdout', () => {
  const inventory = copy();
  const source = inventory.sources[0];
  source.state = 'holdout_frozen';
  source.split = 'holdout';
  source.scenes[0].alignment = { state: 'human_reviewed', reviewer_id: 'bilingual-1', evidence_id: 'alignment-1' };
  source.scenes[0].reference = { state: 'human_reviewed', reviewer_id: 'bilingual-1', evidence_id: 'reference-1' };
  source.rights.reference = { decision: 'approved', license: 'fixture', evidence_url: source.source_url, attribution: 'fixture', internal_use: true, public_redistribution: false };
  assert.throws(() => validateSourceInventory(inventory), /non-fixture sealed inventory/u);
});
