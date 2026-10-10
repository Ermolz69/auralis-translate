import assert from 'node:assert/strict';

export function normalizedCharacters(text) {
  return Array.from(text.normalize('NFKC').toLowerCase())
    .filter(character => /[\p{L}\p{N}]/u.test(character));
}

export function orderedCharacterRecall(source, hypothesis) {
  const left = normalizedCharacters(source);
  const right = normalizedCharacters(hypothesis);
  if (left.length === 0) return null;
  let previous = new Uint16Array(right.length + 1);
  for (const character of left) {
    const current = new Uint16Array(right.length + 1);
    for (let index = 0; index < right.length; index += 1) {
      current[index + 1] = character === right[index]
        ? previous[index] + 1
        : Math.max(previous[index + 1], current[index]);
    }
    previous = current;
  }
  return previous[right.length] / left.length;
}

export function scoreCue(cue, segments, toleranceMs = 500) {
  assert(cue.endMs > cue.startMs);
  const related = segments.filter(segment =>
    segment.start * 1000 < cue.endMs + toleranceMs &&
    segment.end * 1000 > cue.startMs - toleranceMs);
  const hypothesis = related.map(segment => segment.text).join(' ');
  return { id: cue.id, start_ms: cue.startMs,
    source_characters: normalizedCharacters(cue.text).length,
    overlapping_segments: related.length,
    source_character_recall: related.length
      ? orderedCharacterRecall(cue.text, hypothesis) : 0 };
}

export function summarizeCues(cues, segments, mediaDurationMs) {
  assert(cues.length === 467, 'Selected original-platform cue count changed');
  const rows = cues.map(cue => scoreCue(cue, segments));
  const eligible = rows.filter(row => row.source_characters >= 5);
  const low = eligible.filter(row => row.source_character_recall < 0.40);
  const thirds = [0, 1, 2].map(third => {
    const selected = rows.filter(row =>
      Math.min(2, Math.floor(row.start_ms / (mediaDurationMs / 3))) === third);
    return { third: third + 1, cues: selected.length,
      with_asr_overlap: selected.filter(row => row.overlapping_segments > 0).length,
      low_recall: selected.filter(row => row.source_characters >= 5 &&
        row.source_character_recall < 0.40).length };
  });
  return { cue_count: rows.length,
    cues_with_asr_overlap: rows.filter(row => row.overlapping_segments > 0).length,
    eligible_recall_cues: eligible.length,
    low_recall_cues: low.length,
    low_recall_ids: low.map(row => row.id),
    thirds,
    rows: rows.map(row => ({ ...row,
      source_character_recall: Number(row.source_character_recall.toFixed(3)) })) };
}
