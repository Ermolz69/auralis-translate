import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { performance } from 'node:perf_hooks';
import { fileURLToPath } from 'node:url';
import { digest } from './flores-file-fixture.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const reportFile = path.join(root, 'eval/reports/2026-09-29-long-v6-postlength-v2-report.json');
const packFile = path.join(root, 'eval/regressions/long-v6-identifier-loss-v1.json');
const reportBytes = await fs.readFile(reportFile);
const packBytes = await fs.readFile(packFile);
assert.equal(digest(reportBytes), '2795ce22ee0b87f38fc23723dbd9b2802334a48b584c527d3a00f94a32c14fb8');
assert.equal(digest(packBytes), '54e4eccbed99a0158dff67b2a597d0a3bd95fdae53987a7de38a24e5e26489d3');
const source = JSON.parse(reportBytes);
const pack = JSON.parse(packBytes);
assert.equal(source.cue_count, 1024);
assert.equal(source.text_slot_count, 1280);
assert.equal(source.identifier_violation_count, 665);
const started = performance.now();
const identifier = /(?<![\p{L}\p{N}_])[A-Z]{2,}-[0-9]{2,8}(?![\p{L}\p{N}_])/gu;
const cyrillicCodeLike = /[А-ЯЁ]{2,}-[0-9]{2,8}/u;
const ids = text => [...text.matchAll(identifier)].map(match => match[0]).sort();
const same = (first, second) => JSON.stringify(first) === JSON.stringify(second);

function propose(sourceText, candidate) {
  const expected = ids(sourceText);
  const observed = ids(candidate);
  if (same(expected, observed)) return { text: candidate, reason: 'already_exact' };
  if (expected.length !== 1 || observed.length !== 0 || cyrillicCodeLike.test(candidate)
    || candidate.trim().length === 0) {
    return { text: candidate, reason: 'not_repairable' };
  }
  const prefix = sourceText.match(/^[^：\r\n]{0,80}：/u)?.[0];
  if (!prefix || !same(ids(prefix), expected)) {
    return { text: candidate, reason: 'not_repairable' };
  }
  return { text: `${expected[0]}: ${candidate}`, reason: 'prefix_inserted' };
}

const controls = [
  ...pack.related_controls.map(row => ({ ...row, group: 'related' })),
  ...pack.negative_controls.map(row => ({ ...row, group: 'negative' })),
];
for (const control of controls) {
  const proposal = propose(control.source_zh, control.candidate_ru);
  assert.equal(proposal.text, control.candidate_ru, control.id);
}
const lines = [];
for (const cue of source.rows) {
  assert.equal(cue.source_lines.length, cue.candidate_lines.length);
  for (const [lineIndex, sourceText] of cue.source_lines.entries()) {
    const candidate = cue.candidate_lines[lineIndex];
    const proposal = propose(sourceText, candidate);
    const expected = ids(sourceText);
    const before = ids(candidate);
    const after = ids(proposal.text);
    if (proposal.reason === 'prefix_inserted') {
      assert(!same(expected, before));
      assert(same(expected, after));
    } else assert.equal(proposal.text, candidate);
    if (same(expected, before)) assert.equal(proposal.text, candidate);
    lines.push({ segment_id: cue.segment_id, line_index: lineIndex, source_zh: sourceText,
      candidate_ru: candidate, proposed_ru: proposal.text, reason: proposal.reason,
      expected_identifiers: expected, before_identifiers: before,
      after_identifiers: after });
    assert(performance.now() - started < 60_000, 'prefix repair wall budget exhausted');
    assert(process.memoryUsage().rss < 512 * 1024 ** 2, 'prefix repair RSS budget exhausted');
  }
}
assert.equal(lines.length, 1280);
const result = {
  schema_version: 1,
  experiment: 'reg-009-archived-prefix-repair-development-v1',
  split: 'development',
  source_family: 'project_authored_synthetic_long_file',
  baseline_report_sha256: digest(reportBytes),
  regression_pack_sha256: digest(packBytes),
  model_sha256: source.model_sha256,
  profile_sha256: source.profile_sha256,
  proposed_policy: 'single_source_prefix_identifier_insert_only',
  model_requests: 0,
  human_review: 'missing',
  quality_verdict: 'unreviewed',
  baseline_exact_lines: lines.filter(row => same(row.expected_identifiers, row.before_identifiers)).length,
  proposed_exact_lines: lines.filter(row => same(row.expected_identifiers, row.after_identifiers)).length,
  prefix_insertions: lines.filter(row => row.reason === 'prefix_inserted').length,
  remaining_mismatches: lines.filter(row => !same(row.expected_identifiers, row.after_identifiers)).length,
  related_controls_unchanged: pack.related_controls.length,
  negative_controls_unchanged: pack.negative_controls.length,
  elapsed_ms: Math.round(performance.now() - started),
  rss_bytes: process.memoryUsage().rss,
  lines,
};
assert.equal(result.baseline_exact_lines, 615);
assert.equal(result.baseline_exact_lines + source.identifier_violation_count, lines.length);
const destination = path.join(root, 'eval/reports/2026-09-29-reg-009-prefix-repair-screen.json');
await fs.writeFile(destination, `${JSON.stringify(result, null, 2)}\n`);
console.log(`REG-009 prefix repair: ${result.baseline_exact_lines} -> ${result.proposed_exact_lines} exact-code lines; ${result.prefix_insertions} insertions, ${result.remaining_mismatches} mismatches remain; ${result.elapsed_ms} ms, ${result.rss_bytes} RSS bytes.`);
