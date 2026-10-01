export function checkCueMediaCoverage(segments, mediaDurationMs) {
  if (!Number.isSafeInteger(mediaDurationMs) || mediaDurationMs < 1) {
    throw new Error('media duration must be a positive integer in milliseconds');
  }
  if (!Array.isArray(segments) || segments.length === 0) {
    throw new Error('media coverage requires inspected cue timing');
  }
  let maxEndMs = 0;
  let firstOverrun = null;
  let overrunCount = 0;
  for (const [index, segment] of segments.entries()) {
    if (!Number.isSafeInteger(segment.start_ms) || !Number.isSafeInteger(segment.end_ms)
        || segment.start_ms < 0 || segment.end_ms <= segment.start_ms) {
      throw new Error(`cue ${index + 1} has invalid inspected timing`);
    }
    maxEndMs = Math.max(maxEndMs, segment.end_ms);
    if (segment.end_ms > mediaDurationMs) {
      firstOverrun ??= { cue_id: segment.id ?? index + 1,
        start_ms: segment.start_ms, end_ms: segment.end_ms };
      overrunCount += 1;
    }
  }
  return { cue_count: segments.length, media_duration_ms: mediaDurationMs,
    max_end_ms: maxEndMs, overrun_count: overrunCount, first_overrun: firstOverrun,
    covers_media: overrunCount === 0 };
}
