export function compareSourceDurations(originalMs, localMs, toleranceMs = 2_000) {
  if (!Number.isFinite(originalMs) || originalMs <= 0
    || !Number.isFinite(localMs) || localMs <= 0
    || !Number.isFinite(toleranceMs) || toleranceMs < 0) {
    return { status: 'unknown', difference_ms: null, alignment_verified: false };
  }
  const differenceMs = Math.abs(originalMs - localMs);
  return {
    status: differenceMs > toleranceMs
      ? 'duration_discrepancy' : 'duration_compatible_unverified',
    difference_ms: differenceMs,
    alignment_verified: false,
  };
}
