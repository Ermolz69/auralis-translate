import assert from 'node:assert/strict';

const cell = (text) => String(text).replace(/\|/gu, '\\|').replace(/[\r\n]/gu, ' ');
const IDENTITY_FIELDS = ['corpus_archive_sha256', 'sample_manifest_sha256', 'source_sha256', 'model_sha256', 'runtime_build', 'gpu_layers', 'split', 'source_language'];

export function compareProfiles(entries, matrixSha256) {
  assert(entries.length >= 2);
  assert.equal(new Set(entries.map((entry) => entry.id)).size, entries.length, 'Duplicate comparison entry');
  const successful = entries.filter((entry) => entry.report);
  const baseline = successful[0]?.report;
  for (const { report } of successful) {
    for (const key of IDENTITY_FIELDS) {
      assert.notEqual(report[key], undefined, `Missing ${key}`);
      assert.deepEqual(report[key], baseline[key], `Comparison identity differs: ${key}`);
    }
    assert.equal(report.split, 'dev');
    assert.equal(report.subtitle_holdout, false);
    assert.equal(report.bilingual_reviewed, false);
    assert.equal(report.quality_verdict, 'unreviewed');
    assert.equal(report.structural_checks, 'passed');
    assert.equal(report.source_preservation, 'byte_identical');
    assert.equal(report.offline_reexport, 'byte_identical');
    assert.equal(report.existing_output_protection, 'passed');
    assert.equal(report.status.state, 'validated');
    assert.equal(report.status.completed_blocks, report.status.total_blocks);
    assert(report.status.total_blocks > 0);
    assert.equal(report.status.source_sha256, report.source_sha256);
    assert.equal(report.status.run_id, report.run_id);
    assert.equal(typeof report.status.selected_result_id, 'string');
    assert(report.status.selected_result_id.length > 0, 'Missing durable result identity');
    assert.equal(report.profile.target_segments_per_block, 1);
    assert.equal(report.profile.model_file_sha256, report.model_sha256);
    assert.deepEqual(report.row_ids, baseline.row_ids);
    assert.equal(report.rows.length, baseline.row_ids.length);
    report.rows.forEach((row, index) => {
      assert.equal(row.row_id, baseline.row_ids[index], 'Compared row order changed');
      for (const key of ['source', 'reference_ru', 'segment_id']) assert.equal(row[key], baseline.rows[index][key], `Compared ${key} changed`);
      assert(typeof row.candidate_ru === 'string' && row.candidate_ru.trim().length > 0);
    });
  }
  assert.equal(new Set(successful.map((entry) => entry.report.run_id)).size, successful.length, 'Variants reused durable run state');
  for (const entry of entries) assert(Boolean(entry.report) !== Boolean(entry.error), 'Every variant must have exactly one report or error');
  return {
    schema_version: 1, created_at: new Date().toISOString(), matrix_sha256: matrixSha256,
    quality_verdict: 'unreviewed', winner: null, subtitle_holdout: false, bilingual_reviewed: false,
    successful_variants: successful.length, total_variants: entries.length,
    all_transport_checks_passed: successful.length === entries.length,
    entries,
    rows: baseline?.rows.map((row, index) => ({
      row_id: row.row_id, source: row.source, reference_ru: row.reference_ru,
      candidates: entries.map((entry) => ({ id: entry.id, candidate_ru: entry.report?.rows[index].candidate_ru ?? null })),
    })) ?? [],
  };
}

export function profileComparisonMarkdown(comparison) {
  const lines = [
    '# Local decoding and prompt comparison', '',
    `Created: ${comparison.created_at}. Successful file transport variants: ${comparison.successful_variants}/${comparison.total_variants}.`, '',
    'FLORES-200 contributors; CC BY-SA 4.0. Source, reference and synthetic timed-text adaptation retain attribution in each run NOTICE.txt. This is development sentence data with artificial timing, not a subtitle holdout.', '',
    'All successful variants use identical source, reference, checked model/runtime, requested offload setting and one-target block planning. Each has separate durable state and output. There is one run per variant. Sampling is unseeded; zero temperature does not guarantee reproducibility across hardware/backends.', '',
    '**Quality is unreviewed; no winner is selected.** Exact matches and changed wording are textual diagnostics. Review source meaning, Russian grammar, names, numbers, negation and source/reference discrepancies. Run wall time includes hash preflight and persistence and is not an isolated throughput benchmark.', '',
    '| Variant | Prompt version | Temperature | Committed blocks | Heuristic warnings | Exact reference matches | Run time (ms) |',
    '| --- | --- | --- | --- | --- | --- | --- |',
  ];
  for (const entry of comparison.entries) {
    if (!entry.report) { lines.push(`| ${cell(entry.id)} | failed: ${cell(entry.error)} | — | — | — | — | — |`); continue; }
    const report = entry.report;
    lines.push(`| ${entry.id} | ${report.profile.prompt_version} | ${report.profile.temperature} | ${report.status.completed_blocks}/${report.status.total_blocks} | ${report.status.warning_count} | ${report.rows.filter((row) => row.exact_reference_match).length}/${report.rows.length} | ${report.translation_elapsed_ms} |`);
  }
  lines.push('', `| Dev row | Chinese source | Russian reference | ${comparison.entries.map((entry) => cell(entry.id)).join(' | ')} |`, `| --- | --- | --- | ${comparison.entries.map(() => '---').join(' | ')} |`);
  for (const row of comparison.rows) lines.push(`| ${row.row_id} | ${cell(row.source)} | ${cell(row.reference_ru)} | ${row.candidates.map((candidate) => cell(candidate.candidate_ru ?? 'No validated result')).join(' | ')} |`);
  lines.push('', '## Reproduction', '', '```json', JSON.stringify({ matrix_sha256: comparison.matrix_sha256, profiles: comparison.entries.map((entry) => ({ id: entry.id, workspace: entry.workspace, profile_sha256: entry.report?.profile_sha256, run_id: entry.report?.run_id, output_sha256: entry.report?.output_sha256, error: entry.error })) }, null, 2), '```', '');
  return lines.join('\n');
}
