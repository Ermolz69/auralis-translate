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
const [baseBytes, machineBytes, aiBytes, packBytes] = await Promise.all([
  read('eval/regressions/catalog-v51.json'),
  read('eval/reports/2026-10-10-vivo-stratified-blindspot-v1.json'),
  read('eval/reports/2026-10-10-vivo-stratified-blindspot-v1-ai-review.json'),
  read('eval/regressions/reg-073-vivo-stratified-blindspots-v1.json'),
]);
assert.equal(sha(baseBytes),
  '9e8c9990164e0ebe49bd639704df792bf47d9daef1a1989e8a7e2ee299ea2004');
assert.equal(sha(machineBytes),
  '94ed2dce1bf48b4eef4b71fa34c12cbd50ad60834599dcdfba6741e02ec4b396');
assert.equal(sha(aiBytes),
  '2c8e7bc4088b9e0d584173b605a2f352154f868e5c3b49f43988684f278eb77e');
const base = JSON.parse(baseBytes);
const machine = JSON.parse(machineBytes);
const ai = JSON.parse(aiBytes);
const pack = JSON.parse(packBytes);
assert.equal(base.schema_version, 51);
assert.equal(base.entries.at(-1).id, 'REG-072');
assert.equal(machine.source_cues, 467);
assert.equal(machine.selected_windows, 15);
assert.equal(machine.unique_source_cues, 45);
assert.equal(machine.source_target_pairs, 90);
assert.equal(ai.summary.clear_major_windows_ai_only, 6);
assert.equal(ai.summary.human_bilingual_reviews, 0);
assert.equal(ai.summary.full_file_quality_accepted, false);
assert.equal(pack.id, 'REG-073');
assert.equal(pack.source_sha256, machine.source_sha256);
assert.deepEqual(pack.draft_sha256, machine.draft_sha256);
assert.equal(pack.machine_report_sha256, sha(machineBytes));
assert.equal(pack.ai_review_sha256, sha(aiBytes));
assert.equal(pack.minimal_reproducers.length, 6);
assert.equal(pack.related_controls.length, 6);
assert.equal(pack.negative_controls.length, 6);
assert.equal(pack.control_model_runs, 0);
assert.equal(pack.human_review, 'missing');
const major = ai.window_reviews.filter(row => row.verdict === 'clear_major');
assert.equal(major.length, 6);
const allCases = new Set();
for (const repro of pack.minimal_reproducers) {
  assert(!allCases.has(repro.id));
  allCases.add(repro.id);
  assert(repro.cue_ids.length === repro.source_text_sha256.length);
  assert(repro.cue_ids.length === repro.oneB_text_sha256.length);
  assert(repro.cue_ids.length === repro.sevenB_text_sha256.length);
  const window = machine.windows.find(row =>
    row.cue_ids.includes(repro.cue_ids[0]));
  assert(window, `Missing frozen window for ${repro.id}`);
  const aiRow = major.find(row => row.start === window.start);
  assert(aiRow, `Missing AI finding for ${repro.id}`);
  assert.deepEqual(repro.ai_affected_arms, aiRow.clear_major_arms);
  for (const [index, id] of repro.cue_ids.entries()) {
    if (!window.cue_ids.includes(id)) {
      assert.equal(repro.id, 'next_cue_not_duplicated');
      assert.equal(id, 458);
      assert.equal(repro.source_text_sha256[index],
        '89e45f7d07f8acf3afecba739e1376a20856bcbdd1f836ddf135080fd341f473');
      assert.equal(repro.oneB_text_sha256[index],
        '0789699f6cfeda5757214d322ec0e24180e524cff8dc087c4067d193112829e2');
      assert.equal(repro.sevenB_text_sha256[index],
        '41525a1cf8928e583ce50bb9d12d7804739d21ac7d376fe54b0a56d4a402df77');
      assert.equal(repro.oneB_text_sha256[index],
        repro.oneB_text_sha256[index - 1],
        'The saved adjacent 1.8B cue must be identical');
      continue;
    }
    assert.equal(repro.source_text_sha256[index],
      window.source_text_sha256.find(row => row.id === id)?.sha256);
    for (const [arm, key] of [['oneB', 'oneB_text_sha256'],
      ['sevenB', 'sevenB_text_sha256']]) {
      assert.equal(repro[key][index],
        window.drafts_text_sha256[arm].find(row => row.id === id)?.sha256);
    }
  }
}
for (const kind of ['related_controls', 'negative_controls']) {
  const seen = new Set();
  for (const control of pack[kind]) {
    assert(!seen.has(control.family), `Duplicate ${kind} family`);
    seen.add(control.family);
    assert(allCases.has(control.family));
    assert(control.source_lines.length > 0);
    assert(control.expected_fact.length > 0);
  }
  assert.equal(seen.size, allCases.size);
}
const evidence = 'eval/experiments/2026-10-10-vivo-stratified-blindspot-v1-result.md';
await read(evidence);
const catalog = { schema_version: 52,
  catalog_id: 'zh-ru-development-regressions-v52',
  base_catalog_file: 'catalog-v51.json',
  base_catalog_sha256: sha(baseBytes),
  entries: [...base.entries, {
    id: pack.id, source_family: pack.source_family, split: pack.split,
    category: 'long_file_source_meaning_and_neighbor_cue_drift',
    profile_scope: pack.profile_scope,
    expected_invariant: 'Technical architecture, process terminology, scene causality, and adjacent-cue meaning must survive complete-file translation.',
    severity: pack.severity,
    pack_file: 'reg-073-vivo-stratified-blindspots-v1.json',
    pack_sha256: sha(packBytes),
    minimal_reproducer_count: pack.minimal_reproducers.length,
    related_control_count: pack.related_controls.length,
    negative_control_count: pack.negative_controls.length,
    evidence_record: evidence,
    paired_machine_report_sha256: sha(machineBytes),
    ai_review_sha256: sha(aiBytes),
    last_outcome: 'Six purposively sampled windows have AI-only major meaning/scene findings across two retained full-file drafts; no human review, model calls, or quality admission.'
  }] };
const output = `${JSON.stringify(catalog, null, 2)}\n`;
const outputPath = path.join(root, 'eval/regressions/catalog-v52.json');
if (write) await fs.writeFile(outputPath, output, { flag: 'wx' });
else assert.equal(await fs.readFile(outputPath, 'utf8'), output);
console.log(`Catalog v52 ${write ? 'written' : 'verified'}: six AI-only blind spots pinned; v8 unchanged.`);
