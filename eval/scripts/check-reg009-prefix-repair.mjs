import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { digest } from './flores-file-fixture.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const screenBytes = await fs.readFile(path.join(root,
  'eval/reports/2026-09-29-reg-009-prefix-repair-screen.json'));
assert.equal(digest(screenBytes), '067976f39636b873c217890685231e5a9834f6523c68f7954324e3c606b48211');
const screen = JSON.parse(screenBytes);
const baselineBytes = await fs.readFile(path.join(root,
  'eval/reports/2026-09-29-long-v6-postlength-v2-report.json'));
assert.equal(digest(baselineBytes), screen.baseline_report_sha256);
const baseline = JSON.parse(baselineBytes);
assert.equal(screen.regression_pack_sha256,
  digest(await fs.readFile(path.join(root, 'eval/regressions/long-v6-identifier-loss-v1.json'))));
assert.equal(screen.split, 'development');
assert.equal(screen.model_requests, 0);
assert.equal(screen.human_review, 'missing');
assert.equal(screen.quality_verdict, 'unreviewed');
assert.equal(screen.lines.length, 1280);
assert.equal(screen.baseline_exact_lines, 615);
assert.equal(screen.proposed_exact_lines, 1271);
assert.equal(screen.prefix_insertions, 656);
assert.equal(screen.remaining_mismatches, 9);
assert.equal(screen.related_controls_unchanged, 4);
assert.equal(screen.negative_controls_unchanged, 3);
assert(screen.elapsed_ms < 60_000 && screen.rss_bytes < 512 * 1024 ** 2);

const archived = baseline.rows.flatMap(cue => cue.source_lines.map((source, lineIndex) => ({
  segment_id: cue.segment_id, line_index: lineIndex, source_zh: source,
  candidate_ru: cue.candidate_lines[lineIndex],
})));
assert.equal(archived.length, screen.lines.length);
let inserted = 0;
const remaining = [];
for (const [index, row] of screen.lines.entries()) {
  const original = archived[index];
  assert.equal(row.segment_id, original.segment_id);
  assert.equal(row.line_index, original.line_index);
  assert.equal(row.source_zh, original.source_zh);
  assert.equal(row.candidate_ru, original.candidate_ru);
  if (row.reason === 'prefix_inserted') {
    inserted += 1;
    assert.equal(row.expected_identifiers.length, 1);
    assert.deepEqual(row.before_identifiers, []);
    assert.equal(row.proposed_ru, `${row.expected_identifiers[0]}: ${row.candidate_ru}`);
    assert.deepEqual(row.after_identifiers, row.expected_identifiers);
  } else {
    assert(['already_exact', 'not_repairable'].includes(row.reason));
    assert.equal(row.proposed_ru, row.candidate_ru);
  }
  if (JSON.stringify(row.expected_identifiers) !== JSON.stringify(row.after_identifiers)) {
    remaining.push(`${row.segment_id}:${row.line_index}`);
  }
}
assert.equal(inserted, 656);
assert.deepEqual(remaining, ['15:0', '87:0', '129:0', '239:0', '247:0',
  '343:0', '631:0', '703:0', '991:0']);
const wrongContent = screen.lines.find(row => row.segment_id === 129 && row.line_index === 0);
assert(wrongContent.candidate_ru.includes('Не открывайте эту дверь.'));
assert(wrongContent.source_zh.includes('列车将在 08:10 出发。'));
assert.equal(wrongContent.proposed_ru, wrongContent.candidate_ru);
console.log('REG-009 archive repair verified: 656 exact-code insertions, 9 unresolved mismatches, cue 129 wrong content retained.');
