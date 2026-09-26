import assert from 'node:assert/strict';
import test from 'node:test';
import { buildSrt, verifyProtectedBytes } from '../flores-file-fixture.mjs';
import { compareRows } from '../file-comparison-report.mjs';

test('the file probe rejects modified timing and protected separators', () => {
  const source = Buffer.from('1\n00:00:01,000 --> 00:00:02,000\nhello\n');
  const inspection = 'format=srt cues=1\nid=1 label=1 start_ms=1000 end_ms=2000\nprotected_bytes=0..32\nprotected_bytes=37..38\n';
  const output = Buffer.from('1\n00:00:01,000 --> 00:00:02,000\nworld\n');
  verifyProtectedBytes(source, output, inspection, inspection);
  const changed = Buffer.from('1\n00:00:01,000 --> 00:00:03,000\nworld\n');
  assert.throws(() => verifyProtectedBytes(source, changed, inspection, inspection), /Protected bytes changed/u);
  assert.throws(() => verifyProtectedBytes(source, output, inspection, inspection.replace('end_ms=2000', 'end_ms=3000')), /timing changed/u);
});

test('the comparison never silently drops or reorders candidate IDs', () => {
  const rows = [{ row_id: 1, source: '你好。', reference_ru: 'Привет.' }, { row_id: 2, source: '谢谢。', reference_ru: 'Спасибо.' }];
  const original = { translations: rows.map((row, index) => ({ id: index + 1, lines: [row.source] })) };
  const candidate = { translations: rows.map((row, index) => ({ id: index + 1, lines: [row.reference_ru] })) };
  assert.equal(compareRows(rows, original, candidate).length, 2);
  assert.throws(() => compareRows(rows, original, { translations: candidate.translations.slice(0, 1) }));
  assert.throws(() => compareRows(rows, original, { translations: [...candidate.translations].reverse() }), /IDs changed/u);
});

test('a multiline sentence cannot create extra fixture cues', () => {
  assert.throws(() => buildSrt([{ source: 'line one\nline two' }]), /exactly one text line/u);
});
