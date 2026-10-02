const TIMING = /^\d{2}:\d{2}:\d{2},\d{3} --> \d{2}:\d{2}:\d{2},\d{3}$/u;
export const CAPTION_WINDOW_CODEPOINTS = 32;
export const MIN_SHARED_WINDOWS = 64;
export const MIN_SMALLER_SHARE = 0.02;

export function parseSrtText(raw) {
  if (typeof raw !== 'string') throw new Error('SRT must be UTF-8 text');
  const blocks = raw.replace(/^\uFEFF/u, '').replace(/\r\n/gu, '\n').trimEnd().split(/\n\n+/u);
  const text = [];
  for (const [index, block] of blocks.entries()) {
    const lines = block.split('\n');
    if (lines[0] !== String(index + 1) || !TIMING.test(lines[1] ?? '')) {
      throw new Error(`SRT cue ${index + 1} has invalid identity or timing`);
    }
    if (lines.length < 3 || lines.slice(2).some(line => !line.trim())) {
      throw new Error(`SRT cue ${index + 1} has missing text`);
    }
    text.push(lines.slice(2).join(''));
  }
  return { cue_count: text.length, text: text.join('') };
}

function windows(text) {
  const normalized = Array.from(text.normalize('NFC').toLowerCase().replace(/[^\p{L}\p{N}]/gu, ''));
  const result = new Set();
  for (let index = 0; index <= normalized.length - CAPTION_WINDOW_CODEPOINTS; index += 1) {
    result.add(normalized.slice(index, index + CAPTION_WINDOW_CODEPOINTS).join(''));
  }
  return { normalized_codepoints: normalized.length, windows: result };
}

export function screenCrossGroupCaptionOverlap(sources) {
  const prepared = sources.map(source => ({ ...source, ...windows(source.text) }));
  const flagged_pairs = [];
  const same_group_pairs = [];
  let compared_pairs = 0;
  for (let left = 0; left < prepared.length; left += 1) {
    for (let right = left + 1; right < prepared.length; right += 1) {
      const a = prepared[left];
      const b = prepared[right];
      const [smaller, larger] = a.windows.size <= b.windows.size ? [a, b] : [b, a];
      let shared = 0;
      for (const window of smaller.windows) if (larger.windows.has(window)) shared += 1;
      if (a.group_id === b.group_id) {
        same_group_pairs.push({ left_id: a.id, right_id: b.id, shared_windows: shared,
          smaller_windows: smaller.windows.size });
        continue;
      }
      compared_pairs += 1;
      if (shared >= MIN_SHARED_WINDOWS && shared / smaller.windows.size >= MIN_SMALLER_SHARE) {
        flagged_pairs.push({ left_id: a.id, right_id: b.id, shared_windows: shared,
          smaller_windows: smaller.windows.size });
      }
    }
  }
  return { compared_pairs, flagged_pairs, same_group_pairs,
    sources: prepared.map(({ id, group_id, normalized_codepoints, windows: set }) =>
    ({ id, group_id, normalized_codepoints, unique_windows: set.size })) };
}
