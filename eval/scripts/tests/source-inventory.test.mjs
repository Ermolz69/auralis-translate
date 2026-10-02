import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { validateSourceInventory } from '../source-inventory.mjs';

const original = JSON.parse(await readFile(new URL('../../corpora/source-inventory-example-v1.json', import.meta.url), 'utf8'));
const candidates = JSON.parse(await readFile(new URL('../../corpora/commons-inspected-candidates-v1.json', import.meta.url), 'utf8'));
const copy = () => structuredClone(original);

test('authored example accounts for every source cue and explicit exclusion', () => {
  assert.deepEqual(validateSourceInventory(copy()), { source_count: 1, group_count: 1, inspected_candidate_cues: 0, eligible_cues: 0 });
  const precise = copy();
  precise.sources[0].retrieved_at = '2026-09-28T15:30:00.123Z';
  assert.equal(validateSourceInventory(precise).eligible_cues, 0);
});

test('source mapping alone never counts as reviewed eligible language material', () => {
  const mapped = copy();
  assert.equal(mapped.sources[0].state, 'source_checked');
  assert.equal(mapped.sources[0].scenes[0].alignment.state, 'none');
  assert.equal(mapped.sources[0].scenes[0].reference.state, 'none');
  assert.equal(validateSourceInventory(mapped).eligible_cues, 0);

  const rightsOnly = copy();
  rightsOnly.sources[0].rights.reference = structuredClone(original.sources[0].rights.subtitle);
  assert.equal(validateSourceInventory(rightsOnly).eligible_cues, 0);

  const alignmentOnly = copy();
  alignmentOnly.sources[0].scenes[0].alignment = {
    state: 'human_reviewed', reviewer_id: 'reviewer-1', evidence_id: 'alignment-1',
  };
  assert.equal(validateSourceInventory(alignmentOnly).eligible_cues, 0);

  const reviewed = copy();
  reviewed.sources[0].state = 'reference_reviewed';
  reviewed.sources[0].rights.reference = structuredClone(original.sources[0].rights.subtitle);
  reviewed.sources[0].scenes[0].alignment = {
    state: 'human_reviewed', reviewer_id: 'reviewer-1', evidence_id: 'alignment-1',
  };
  reviewed.sources[0].scenes[0].reference = {
    state: 'human_reviewed', reviewer_id: 'reviewer-2', evidence_id: 'reference-1',
  };
  assert.equal(validateSourceInventory(reviewed).eligible_cues, 1);

  const notPromoted = structuredClone(reviewed);
  notPromoted.sources[0].state = 'source_checked';
  assert.equal(validateSourceInventory(notPromoted).eligible_cues, 0);

  const development = structuredClone(reviewed);
  development.sources[0].state = 'development_only';
  assert.equal(validateSourceInventory(development).eligible_cues, 1);
});

test('inspected Commons bytes remain separate from eligible development or holdout cues', () => {
  assert.deepEqual(validateSourceInventory(structuredClone(candidates)), {
    source_count: 3, group_count: 3, inspected_candidate_cues: 365, eligible_cues: 0,
  });
  const split = structuredClone(candidates);
  split.sources[0].split = 'development';
  assert.throws(() => validateSourceInventory(split), /inspected candidates require unassigned split/u);
  const rights = structuredClone(candidates);
  rights.sources[0].rights.subtitle = structuredClone(original.sources[0].rights.subtitle);
  rights.sources[0].rights.audio = structuredClone(original.sources[0].rights.subtitle);
  assert.equal(validateSourceInventory(rights).eligible_cues, 0,
    'approved source rights alone cannot admit unreviewed cues');
  const falseApproval = structuredClone(candidates);
  falseApproval.sources[0].rights.subtitle = { decision: 'unknown', internal_use: true };
  assert.throws(() => validateSourceInventory(falseApproval), /cannot authorize use/u);
  const scenes = structuredClone(candidates);
  scenes.sources[0].scenes = structuredClone(original.sources[0].scenes);
  assert.throws(() => validateSourceInventory(scenes), /inspected candidates require unassigned split/u);
  const escapedPath = structuredClone(candidates);
  escapedPath.sources[0].local_candidate_path = '../source.zh.srt';
  assert.throws(() => validateSourceInventory(escapedPath), /ignored source candidate/u);
  const missingPath = structuredClone(candidates);
  delete missingPath.sources[0].local_candidate_path;
  assert.throws(() => validateSourceInventory(missingPath), /inspected candidates require unassigned split/u);
});

test('media duration requires a positive value and its source evidence', () => {
  const missingEvidence = structuredClone(candidates);
  missingEvidence.sources[0].media_duration_ms = 738000;
  assert.throws(() => validateSourceInventory(missingEvidence), /media_duration_evidence_url/u);
  const evidenceWithoutDuration = structuredClone(candidates);
  evidenceWithoutDuration.sources[0].media_duration_evidence_url = evidenceWithoutDuration.sources[0].source_url;
  assert.throws(() => validateSourceInventory(evidenceWithoutDuration), /requires media_duration_ms/u);
  const checked = structuredClone(candidates);
  checked.sources[0].media_duration_ms = 738000;
  checked.sources[0].media_duration_evidence_url = checked.sources[0].source_url;
  assert.equal(validateSourceInventory(checked).inspected_candidate_cues, 365);
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
