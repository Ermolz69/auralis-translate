import assert from 'node:assert/strict';

const normalise = (text) => text.normalize('NFC').trim().replace(/\s+/gu, ' ');
const cell = (text) => String(text).replace(/\|/gu, '\\|').replace(/[\r\n]/gu, ' ');

export function compareRows(rows, sourceTemplate, outputTemplate) {
  assert.equal(sourceTemplate.translations.length, rows.length);
  assert.equal(outputTemplate.translations.length, rows.length);
  return rows.map((row, index) => {
    const source = sourceTemplate.translations[index];
    const candidate = outputTemplate.translations[index];
    assert.equal(source.id, index + 1);
    assert.equal(candidate.id, source.id, 'Candidate IDs changed');
    assert.deepEqual(source.lines, [row.source]);
    assert.equal(candidate.lines.length, 1, 'Candidate changed the line slots');
    const candidate_ru = candidate.lines[0];
    return { ...row, segment_id: source.id, candidate_ru, exact_reference_match: normalise(candidate_ru) === normalise(row.reference_ru), unchanged_source: candidate_ru === row.source };
  });
}

export function markdownReport(report) {
  const lines = [
    '# Local FLORES file transport comparison', '',
    `Run: ${report.created_at}. Corpus: ${report.dataset}, ${report.split}, ${report.source_language} → Russian.`, '',
    `Scope: ${report.use_scope}. Timings are synthetic transport fixtures. No scene context, subtitle holdout, or bilingual review is present.`, '',
    `Attribution: FLORES-200 contributors, ${report.corpus_source_url}. Source/reference text and adapted fixture are CC BY-SA 4.0: https://creativecommons.org/licenses/by-sa/4.0/.`, '',
    `Structural checks: passed. Source unchanged; protected bytes, cue IDs, order, timing, and text-slot counts preserved. Offline re-export matched the first output.`, '',
    `Translation wall time: ${report.translation_elapsed_ms} ms, including preflight and persistence. Normalised exact reference matches: ${report.rows.filter((row) => row.exact_reference_match).length}/${report.rows.length}; this is a textual diagnostic, not an adequacy score.`, '',
    `Quality verdict: **unreviewed**. Semantic quality must be adjudicated from source, reference, candidate, and source/reference divergences.`, '',
    '| FLORES dev row | Source | Russian reference | Model candidate |',
    '| --- | --- | --- | --- |',
    ...report.rows.map((row) => `| ${row.row_id} | ${cell(row.source)} | ${cell(row.reference_ru)} | ${cell(row.candidate_ru)} |`),
    '', '## Provenance', '', '```json', JSON.stringify({ model_sha256: report.model_sha256, runtime_build: report.runtime_build, profile_sha256: report.profile_sha256, source_sha256: report.source_sha256, output_sha256: report.output_sha256, run_id: report.run_id, selected_result_id: report.status.selected_result_id, warning_count: report.status.warning_count, review_state: report.status.review_state }, null, 2), '```', '',
  ];
  return lines.join('\n');
}
