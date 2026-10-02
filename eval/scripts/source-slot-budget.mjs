import assert from 'node:assert/strict';

export function countSourceTextSlots(blocks) {
  assert(Array.isArray(blocks) && blocks.length > 0);
  let slots = 0;
  for (const block of blocks) {
    const lines = block.replace(/\r\n/gu, '\n').replace(/\n+$/u, '').split('\n');
    assert(lines.length >= 3 && /^\d+$/u.test(lines[0])
      && /-->/.test(lines[1]), 'Expected an SRT cue block');
    assert(lines.slice(2).every(line => line.trim().length > 0),
      'Every target text slot must be nonempty');
    slots += lines.length - 2;
  }
  return { cues: blocks.length, text_slots: slots };
}
