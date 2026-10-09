import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const write = process.argv.length === 3 && process.argv[2] === '--write';
assert(process.argv.length === 2 || write);
const read = relative => fs.readFile(path.join(root, relative));
const digest = bytes => createHash('sha256').update(bytes).digest('hex');
const [baseBytes, machineBytes, reviewBytes, leakBytes, clockBytes] =
  await Promise.all([
    read('eval/regressions/catalog-v48.json'),
    read('eval/reports/2026-10-09-source-fact-hints-v1.json'),
    read('eval/reports/2026-10-09-source-fact-hints-v1-ai-review.json'),
    read('eval/regressions/reg-069-fact-hint-json-wrapper-leak-v1.json'),
    read('eval/regressions/reg-070-fact-hint-midnight-clock-shift-v1.json'),
  ]);
assert.equal(digest(baseBytes),
  '91b90e03817b9857a994f20b052468452994d1a19e347dccbfa7b49479c135b3');
assert.equal(digest(machineBytes),
  'fd7a661edd0aa09cafba16fddeda1d598ad8973abd8da3f6e4a4cba02dea6b96');
assert.equal(digest(reviewBytes),
  '6879f07f4d7b1343d9fe9e85abd2857449b6ea17d68f165013484fd3df6af90b');
assert.equal(digest(leakBytes),
  '99322e3ab2362cbbe1d2c48bab8834221ac0566695c5a1f556951b3428fe8990');
assert.equal(digest(clockBytes),
  'd582b30cf02a4182c7582deb9faefacf23bc8c3f65b44d8420f8f87919693d27');
const base = JSON.parse(baseBytes);
const machine = JSON.parse(machineBytes);
const review = JSON.parse(reviewBytes);
const leak = JSON.parse(leakBytes);
const clock = JSON.parse(clockBytes);
assert.equal(base.schema_version, 48);
assert.deepEqual(base.entries.map(entry => entry.id),
  ['REG-062', 'REG-063', 'REG-065', 'REG-066', 'REG-067', 'REG-068']);
assert.equal(machine.chat_requests, 36);
assert.equal(machine.template_token_preflights, 72);
assert.equal(machine.json_structure_leak_count, 1);
assert.equal(machine.identical_no_hint_pairs, 5);
assert.equal(machine.human_bilingual_reviews, 0);
assert.equal(machine.candidate_promoted, false);
assert.equal(review.machine_report_sha256, digest(machineBytes));
assert.equal(review.human_bilingual_reviews, 0);
assert.equal(review.summary.candidate_promoted, false);
assert.equal(review.summary.new_natural_major_fact_errors, 1);
assert.equal(review.summary.new_natural_product_decoder_rejections, 1);
for (const pack of [leak, clock]) {
  assert.equal(pack.source_sha256, machine.source_sha256);
  assert.equal(pack.machine_report_sha256, digest(machineBytes));
  assert(pack.related_controls.length >= 2);
  assert(pack.negative_controls.length >= 2);
  assert.equal(new Set([...pack.related_controls, ...pack.negative_controls]
    .map(row => row.id)).size,
  pack.related_controls.length + pack.negative_controls.length);
}
const find = (caseId, arm) => machine.observations.find(row =>
  row.case_id === caseId && row.arm === arm);
for (const [pack, caseId] of [[leak, 'natural_276'], [clock, 'natural_328']]) {
  const { minimal_reproducer: reproduction } = pack;
  const baseline = find(caseId, 'baseline');
  const candidate = find(caseId, 'candidate');
  assert(baseline && candidate);
  assert.deepEqual(baseline.target_ids, reproduction.target_ids);
  assert.deepEqual(candidate.target_ids, reproduction.target_ids);
  for (const [row, prefix] of [[baseline, 'baseline'], [candidate, 'candidate']]) {
    assert.equal(row.request_sha256, reproduction[`${prefix}_request_sha256`]);
    assert.equal(row.raw_http_sha256, reproduction[`${prefix}_raw_http_sha256`]);
  }
}
assert.equal(find('natural_276', 'baseline').contains_leaked_json_structure, false);
assert.equal(find('natural_276', 'candidate').contains_leaked_json_structure, true);
assert.equal(find('natural_276', 'candidate').raw_candidate_sha256,
  leak.minimal_reproducer.candidate_raw_text_sha256);
assert.equal(find('natural_328', 'baseline').contains_leaked_json_structure, false);
assert.equal(find('natural_328', 'candidate').contains_leaked_json_structure, false);
assert.equal(review.judgments.find(row => row.case_id === 'natural_328').classification,
  'new_major');
assert.equal(review.judgments.find(row => row.case_id === 'natural_276').classification,
  'unchanged_major_and_new_decoder_rejection');
assert.equal(find('original_three_slot_tail', 'baseline').request_sha256,
  find('natural_466', 'baseline').request_sha256);
assert.equal(find('original_three_slot_tail', 'candidate').request_sha256,
  find('natural_466', 'candidate').request_sha256);
for (const caseId of ['four_slot_future_then_repeated_thanks',
  'four_slot_ok_and_tail_thanks', 'four_distinct_complete_cues']) {
  for (const arm of ['baseline', 'candidate']) {
    const row = find(caseId, arm);
    assert.deepEqual(row.translated_ids, row.target_ids);
  }
}
for (const caseId of ['9400_current_model_near_batch_end',
  '9400_digit_one_speech_variant', 'foreign_brand_licensed',
  'quoted_french_word_licensed']) {
  for (const arm of ['baseline', 'candidate']) {
    const row = find(caseId, arm);
    assert.deepEqual(row.translated_ids, row.target_ids);
    assert.equal(row.contains_leaked_json_structure, false);
  }
}
const evidenceRecord =
  'eval/experiments/2026-10-09-source-fact-hints-v1-result.md';
await read(evidenceRecord);
const catalog = {
  schema_version: 49,
  catalog_id: 'zh-ru-development-regressions-v49',
  base_catalog_file: 'catalog-v48.json',
  base_catalog_sha256: digest(baseBytes),
  entries: [
    ...base.entries.map(entry => {
      if (!['REG-066', 'REG-067', 'REG-068'].includes(entry.id)) return entry;
      return { ...entry,
        source_fact_screen_evidence_record: evidenceRecord,
        source_fact_screen_machine_report_sha256: digest(machineBytes),
        source_fact_screen_ai_review_sha256: digest(reviewBytes),
        last_outcome: entry.id === 'REG-066'
          ? 'A 36-chat 7B source-fact-hint screen retained exact raw pairs: planning and team errors remained; a new midnight error and JSON wrapper leak reject the candidate.'
          : entry.id === 'REG-067'
            ? 'Three authored four-slot cases and the original three-slot tail returned all IDs in one 7B screen. Older shifted 1.8B/7B omissions remain historical; no fix or promotion.'
            : 'One 7B screen kept authored quoted foreign words distinct and repaired one current-9400 case. The historical 1.8B shifted mixed-script failure remains unfixed.' };
    }),
    { id: leak.id, source_family: leak.source_family, split: leak.split,
      category: 'source_fact_hint_leaks_json_wrapper_into_target_text',
      profile_scope: 'Hy-MT2 7B Q4_K_M v8 plus rejected evaluation-only source-fact hints',
      expected_invariant: leak.expected_invariant, severity: leak.severity,
      pack_file: 'reg-069-fact-hint-json-wrapper-leak-v1.json',
      pack_sha256: digest(leakBytes), minimal_reproducer_count: 1,
      related_control_count: leak.related_controls.length,
      negative_control_count: leak.negative_controls.length,
      evidence_record: evidenceRecord,
      last_outcome: 'Direct chat parsed IDs but leaked wrapper punctuation into four target strings; existing product v7/v8 decoder rejects before checkpoint. Hint candidate rejected.' },
    { id: clock.id, source_family: clock.source_family, split: clock.split,
      category: 'source_fact_hint_shifts_after_midnight_one_two_to_eleven_twelve',
      profile_scope: 'Hy-MT2 7B Q4_K_M v8 plus rejected evaluation-only source-fact hints',
      expected_invariant: clock.expected_invariant, severity: clock.severity,
      pack_file: 'reg-070-fact-hint-midnight-clock-shift-v1.json',
      pack_sha256: digest(clockBytes), minimal_reproducer_count: 1,
      related_control_count: clock.related_controls.length,
      negative_control_count: clock.negative_controls.length,
      evidence_record: evidenceRecord,
      last_outcome: 'Paired natural cue 328 changed a correct 01:00–02:00 baseline to 11:00–12:00 at night; no product fix, candidate rejected.' },
  ],
};
const output = `${JSON.stringify(catalog, null, 2)}\n`;
const outputPath = path.join(root, 'eval/regressions/catalog-v49.json');
if (write) await fs.writeFile(outputPath, output, { flag: 'wx' });
else assert.equal(await fs.readFile(outputPath, 'utf8'), output);
console.log(`Catalog v49 ${write ? 'written' : 'verified'}: REG-069/070 pinned; source-fact candidate rejected.`);
