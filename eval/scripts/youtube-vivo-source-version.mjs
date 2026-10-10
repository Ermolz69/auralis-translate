import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';

export const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');

export function parseStrictSrt(bytes) {
  const raw = bytes.toString('utf8');
  assert(!raw.includes('\r'), 'Unexpected CR in pinned SRT');
  const blocks = raw.trimEnd().split(/\n\n+/u);
  return blocks.map((block, index) => {
    const [label, timing, ...lines] = block.split('\n');
    assert.equal(Number(label), index + 1, `Cue ID differs at ${index + 1}`);
    assert(lines.length > 0 && lines.every(line => line.length > 0));
    const match = /^(\d{2}):(\d{2}):(\d{2}),(\d{3}) --> (\d{2}):(\d{2}):(\d{2}),(\d{3})$/u.exec(timing);
    assert(match, `Invalid timing at cue ${index + 1}`);
    const ms = offset => Number(match[offset]) * 3_600_000 +
      Number(match[offset + 1]) * 60_000 + Number(match[offset + 2]) * 1000 +
      Number(match[offset + 3]);
    const startMs = ms(1);
    const endMs = ms(5);
    assert(startMs < endMs, `Nonpositive cue duration at ${index + 1}`);
    return { id: index + 1, startMs, endMs, text: lines.join('\n') };
  });
}

export function compareSrtVersions(candidateBytes, commonsBytes, mediaDurationMs,
  previousYoutubeSha256) {
  const candidate = parseStrictSrt(candidateBytes);
  const commons = parseStrictSrt(commonsBytes);
  assert.equal(commons.length, 467, 'Pinned Commons cue count changed');
  const timingDifferences = [];
  const textDifferenceIds = [];
  const cuesPastMedia = [];
  for (let index = 0; index < candidate.length; index++) {
    const cue = candidate[index];
    const baseline = commons[index];
    if (!baseline || cue.text !== baseline.text) textDifferenceIds.push(cue.id);
    if (baseline) {
      const startDeltaMs = cue.startMs - baseline.startMs;
      const endDeltaMs = cue.endMs - baseline.endMs;
      if (startDeltaMs || endDeltaMs) {
        timingDifferences.push({ cue_id: cue.id, start_delta_ms: startDeltaMs,
          end_delta_ms: endDeltaMs });
      }
    }
    if (cue.endMs > mediaDurationMs) cuesPastMedia.push(cue.id);
  }
  const digest = sha256(candidateBytes);
  return {
    candidate_sha256: digest,
    candidate_bytes: candidateBytes.length,
    previous_youtube_byte_identical: digest === previousYoutubeSha256,
    candidate_cues: candidate.length,
    commons_cues: commons.length,
    commons_text_identical: candidate.length === commons.length &&
      textDifferenceIds.length === 0,
    text_difference_ids: textDifferenceIds,
    timing_differences: timingDifferences,
    cues_past_media: cuesPastMedia,
    first_cue: candidate.length ? { start_ms: candidate[0].startMs,
      end_ms: candidate[0].endMs } : null,
    last_cue: candidate.length ? { start_ms: candidate.at(-1).startMs,
      end_ms: candidate.at(-1).endMs } : null,
  };
}
