import assert from 'node:assert/strict';

function timestamp(milliseconds, format) {
  const seconds = Math.floor(milliseconds / 1000);
  return `${String(Math.floor(seconds / 3600)).padStart(2, '0')}:${String(Math.floor(seconds / 60) % 60).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}${format === 'srt' ? ',' : '.'}${String(milliseconds % 1000).padStart(3, '0')}`;
}

export function longFileFixture(config, format) {
  assert.equal(config.schema_version, 1);
  assert.equal(config.purpose, 'synthetic_long_file_recovery_probe');
  assert.equal(config.subtitle_holdout, false);
  assert.equal(config.bilingual_reviewed, false);
  assert(['srt', 'vtt'].includes(format));
  for (const key of ['cue_count', 'cue_interval_ms', 'cue_duration_ms', 'multiline_every', 'repeated_srt_label_every', 'missing_vtt_label_every', 'code_width', 'crash_after_blocks']) assert(Number.isInteger(config[key]) && config[key] > 0, `Invalid ${key}`);
  assert(config.cue_count >= 1024 && config.cue_count <= 4096, 'This load fixture requires at least 1024 cues');
  assert(config.cue_duration_ms < config.cue_interval_ms);
  assert(/^[A-Z]+-$/u.test(config.code_prefix) && config.code_width === 4);
  assert(config.templates.length > 1);
  const rows = Array.from({ length: config.cue_count }, (_, index) => {
    const code = `${config.code_prefix}${String(index + 1).padStart(config.code_width, '0')}`;
    const parts = [config.templates[index % config.templates.length]];
    if ((index + 1) % config.multiline_every === 0) parts.push(config.second_line);
    for (const part of parts) {
      for (const key of ['source', 'reference_ru']) assert(typeof part[key] === 'string' && part[key].length > 0 && !/[\r\n]/u.test(part[key]), 'A fixture slot must be one nonempty line');
    }
    return {
      segment_id: index + 1, code,
      start_ms: index * config.cue_interval_ms + 1000,
      end_ms: index * config.cue_interval_ms + 1000 + config.cue_duration_ms,
      source_lines: parts.map((part) => `工程 ${code}：${part.source}`),
      reference_lines: parts.map((part) => `Проект ${code}: ${part.reference_ru}`),
    };
  });
  const render = (key) => {
    const header = format === 'vtt' ? '\uFEFFWEBVTT\r\n\r\nNOTE synthetic recovery probe\r\nNo human subtitle quality claim.\r\n\r\n' : '\uFEFF';
    const cues = rows.map((row, index) => {
      const label = format === 'srt' ? String(index > 0 && index % config.repeated_srt_label_every === 0 ? index : index + 1)
        : (index % config.missing_vtt_label_every === 0 ? null : `cue-${index + 1}`);
      return `${label === null ? '' : `${label}\r\n`}${timestamp(row.start_ms, format)} --> ${timestamp(row.end_ms, format)}\r\n${row[key].join('\r\n')}\r\n\r\n`;
    }).join('');
    return Buffer.from(`${header}${cues}`);
  };
  return { rows, source: render('source_lines'), reference: render('reference_lines'), duration_ms: rows.at(-1).end_ms, line_count: rows.reduce((sum, row) => sum + row.source_lines.length, 0) };
}

export function compareLongFile(rows, sourceTemplate, candidateTemplate) {
  assert.equal(sourceTemplate.translations.length, rows.length);
  assert.equal(candidateTemplate.translations.length, rows.length);
  return rows.map((row, index) => {
    const source = sourceTemplate.translations[index];
    const candidate = candidateTemplate.translations[index];
    assert.equal(source.id, row.segment_id);
    assert.equal(candidate.id, row.segment_id, 'Candidate slot identity changed');
    assert.deepEqual(source.lines, row.source_lines);
    assert.equal(candidate.lines.length, row.source_lines.length, 'Candidate line slots changed');
    return { ...row, candidate_lines: candidate.lines, code_preserved: candidate.lines.every((line) => {
      const codes = line.match(/[A-Z]+-\d{4}/gu) ?? [];
      return codes.length === 1 && codes[0] === row.code;
    }), exact_draft_match: candidate.lines.every((line, lineIndex) => line.normalize('NFC').trim() === row.reference_lines[lineIndex].normalize('NFC').trim()) };
  });
}
