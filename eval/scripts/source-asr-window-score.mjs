import assert from 'node:assert/strict';
import { scoreCue } from './vivo-full-audio-alignment.mjs';

export function scoreAudioWindow(cues, rawSegments, convertedSegments,
  startMs, durationMs = 12_000) {
  assert(startMs >= 0 && durationMs > 0);
  const endMs = startMs + durationMs;
  const selectedCues = cues.filter(cue =>
    cue.startMs < endMs && cue.endMs > startMs);
  const within = segments => segments.filter(segment =>
    segment.start * 1000 < endMs && segment.end * 1000 > startMs);
  const raw = within(rawSegments);
  const converted = within(convertedSegments);
  const rows = selectedCues.map(cue => {
    const rawRow = scoreCue(cue, raw);
    const convertedRow = scoreCue(cue, converted);
    return { id: cue.id, raw_segments: rawRow.overlapping_segments,
      normalized_segments: convertedRow.overlapping_segments,
      source_characters: rawRow.source_characters,
      raw_recall: Number(rawRow.source_character_recall.toFixed(3)),
      normalized_recall: Number(convertedRow.source_character_recall.toFixed(3)) };
  });
  return { start_ms: startMs, end_ms: endMs,
    cue_ids: selectedCues.map(cue => cue.id),
    raw_segments: raw.length, normalized_segments: converted.length,
    cues_with_raw_asr_overlap: rows.filter(row => row.raw_segments > 0).length,
    cues_with_normalized_asr_overlap: rows.filter(row => row.normalized_segments > 0).length,
    raw_low_recall_ids: rows.filter(row => row.source_characters >= 5 &&
      row.raw_recall < 0.40).map(row => row.id),
    normalized_low_recall_ids: rows.filter(row => row.source_characters >= 5 &&
      row.normalized_recall < 0.40).map(row => row.id),
    rows };
}
