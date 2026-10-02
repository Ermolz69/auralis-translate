import assert from 'node:assert/strict';

const timing = /^(\d{2}:\d{2}:\d{2}),(\d{1,3}) --> (\d{2}:\d{2}:\d{2}),(\d{1,3})$/u;

export function normalizeSrtMilliseconds(source) {
  assert.equal(typeof source, 'string');
  const newline = source.includes('\r\n') ? '\r\n' : '\n';
  assert(!source.replaceAll('\r\n', '').includes('\r'), 'mixed or CR line endings');
  const finalNewline = source.endsWith(newline) ? newline : '';
  const blocks = source.slice(0, source.length - finalNewline.length)
    .split(newline + newline);
  assert(blocks.length > 0, 'empty SRT');
  const mapping = [];
  const normalized = blocks.map((block, index) => {
    const lines = block.split(newline);
    assert.equal(lines[0], String(index + 1), `cue ${index + 1} ID`);
    const match = timing.exec(lines[1] ?? '');
    assert(match, `cue ${index + 1} timing syntax`);
    assert(lines.length >= 3 && lines.slice(2).some(line => line.length > 0),
      `cue ${index + 1} text`);
    const millis = [match[2], match[4]].map(field => {
      const value = Number(field);
      assert(Number.isSafeInteger(value) && value <= 999);
      return field.padStart(3, '0');
    });
    const normalizedTiming = `${match[1]},${millis[0]} --> ${match[3]},${millis[1]}`;
    mapping.push({ cue_id: index + 1, original_timing: lines[1],
      derived_timing: normalizedTiming, text: lines.slice(2).join(newline) });
    lines[1] = normalizedTiming;
    return lines.join(newline);
  });
  return { srt: normalized.join(newline + newline) + finalNewline, mapping };
}
