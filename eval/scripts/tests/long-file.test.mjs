import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import test from 'node:test';
import { longFileFixture, compareLongFile } from '../long-file-fixture.mjs';
import { assertSavedPrefix } from '../cli-run-state.mjs';

const config = JSON.parse(await fs.readFile(new URL('../../fixtures/long-file-v1.json', import.meta.url)));

test('long fixtures span an hour with multiline cues and distinct per-cue content markers', () => {
  for (const format of ['srt', 'vtt']) {
    const fixture = longFileFixture(config, format);
    assert.equal(fixture.rows.length, 1024);
    assert.equal(fixture.line_count, 1280);
    assert(fixture.duration_ms > 3_600_000);
    assert.equal(new Set(fixture.rows.map((row) => row.code)).size, 1024);
    assert(fixture.source.toString('utf8').includes(format === 'srt' ? '01:42:19,000' : '01:42:19.000'));
  }
  assert.throws(() => longFileFixture({ ...config, cue_count: 3 }, 'srt'), /at least 1024/u);
});

test('comparison rejects dropped, reordered and reflowed slots and flags altered content codes', () => {
  const fixture = longFileFixture(config, 'srt');
  const original = { translations: fixture.rows.map((row) => ({ id: row.segment_id, lines: row.source_lines })) };
  const candidate = { translations: fixture.rows.map((row) => ({ id: row.segment_id, lines: row.reference_lines })) };
  assert(compareLongFile(fixture.rows, original, candidate).every((row) => row.code_preserved));
  const wrongCode = structuredClone(candidate);
  wrongCode.translations[0].lines[0] = wrongCode.translations[1].lines[0];
  assert.equal(compareLongFile(fixture.rows, original, wrongCode)[0].code_preserved, false);
  assert.throws(() => compareLongFile(fixture.rows, original, { translations: candidate.translations.slice(1) }));
  assert.throws(() => compareLongFile(fixture.rows, original, { translations: candidate.translations.toReversed() }), /identity changed/u);
  const reflow = structuredClone(candidate);
  reflow.translations[3].lines = [reflow.translations[3].lines.join(' ')];
  assert.throws(() => compareLongFile(fixture.rows, original, reflow), /line slots changed/u);
});

test('saved checkpoints must retain payload, fingerprint, diagnostics, attempt count and commit time', () => {
  const before = { checkpoints: [{ block_index: 0, input_fingerprint: 'input', accepted_json: 'payload', diagnostics_json: '[]', attempt_count: 1, committed_at: 100 }] };
  const after = { checkpoints: [...structuredClone(before.checkpoints), { block_index: 1 }] };
  assertSavedPrefix(before, after);
  for (const key of ['accepted_json', 'input_fingerprint', 'diagnostics_json', 'attempt_count', 'committed_at']) {
    const changed = structuredClone(after);
    changed.checkpoints[0][key] = 'changed';
    assert.throws(() => assertSavedPrefix(before, changed), /was replaced/u);
  }
  assert.throws(() => assertSavedPrefix(before, { checkpoints: [] }), /went backwards/u);
});
