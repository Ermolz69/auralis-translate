import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { checkCueMediaCoverage } from './cue-media-coverage.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const directory = path.join(root,
  '.cache/eval/youtube-geekerwan-kirin-original-caption/attempt-QbgkVq');
const publicReport = path.join(root,
  'eval/reports/youtube-geekerwan-kirin-caption-v1.json');
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
async function pinned(file, expected) {
  const bytes = await fs.readFile(file);
  assert.equal(sha256(bytes), expected, `${file} changed`);
  return JSON.parse(bytes.toString('utf8'));
}

const [acquisition, failed, succeeded, previous] = await Promise.all([
  pinned(path.join(directory, 'acquisition.json'),
    'bb7570d9be85b99e8e8f6b4e81c5d26a57b989d1cee5706e287869fa998722d5'),
  pinned(path.join(directory, 'strict-inspection/inspection.json'),
    '0ee004f54b3dd5d9681a9f4c55b3fea823c879d0b4248ba8c85b6bd8c21cfd43'),
  pinned(path.join(directory, 'strict-inspection-retry/inspection.json'),
    '90873c7f9206003b42d450f2adffa171394ffbff1b9e6933982059458ca67578'),
  pinned(path.join(root, 'eval/reports/youtube-geekerwan-kirin-license-v1.json'),
    'bff4d4226a84f81532e67706b3d9e8ab964263797522759775e9f3ddd60b8aa8'),
]);
assert.equal(acquisition.experiment,
  'DATA-03-youtube-geekerwan-kirin-original-caption-2026-10-02-v1');
assert.deepEqual(acquisition.limits, { requests: 1, timeout_ms: 60_000,
  response_bytes: 1024 * 1024, retries: 0, redirects: 0 });
assert.equal(acquisition.outcome, 'acquired_private_unreviewed');
assert.equal(acquisition.http_status, 200);
assert.equal(acquisition.response_bytes, 25_112);
assert.equal(acquisition.matches_archived_bytes, false);
const source = await fs.readFile(path.join(directory, 'source.zh.srt'));
assert.equal(source.length, acquisition.response_bytes);
assert.equal(sha256(source), acquisition.response_sha256);
assert.equal(sha256(source),
  'c2a5fa3ae5139fe90b2be0b4b48b10ddd20d9b42103f4dd8401e1426d1b3eae5');
assert.equal(failed.outcome, 'inspection_error');
assert.match(failed.process_error, / EPERM$/);
assert.equal(failed.stdout_bytes, 0);
assert.equal(failed.stderr_bytes, 0);
assert.equal(succeeded.outcome, 'strict_inspected_private_unreviewed');
assert.equal(succeeded.exit_code, 0);
assert.equal(succeeded.process_error, null);
assert.equal(succeeded.source_sha256, acquisition.response_sha256);
assert.equal(succeeded.cli_sha256, failed.cli_sha256);
const [stdout, stderr] = await Promise.all([
  fs.readFile(path.join(directory, 'strict-inspection-retry/cli-stdout.json')),
  fs.readFile(path.join(directory, 'strict-inspection-retry/cli-stderr.txt')),
]);
assert.equal(stdout.length, succeeded.stdout_bytes);
assert.equal(sha256(stdout), succeeded.stdout_sha256);
assert.equal(stderr.length, 0);
assert.equal(sha256(stderr), succeeded.stderr_sha256);
const envelope = JSON.parse(stdout.toString('utf8'));
assert.equal(envelope.command, 'inspect');
assert.equal(envelope.terminal?.event, 'completed');
const report = envelope.report?.report;
assert.equal(report?.format, 'srt');
assert.equal(report.source_sha256, succeeded.source_sha256);
const cues = report.segments;
assert.equal(cues.length, 343);
assert(cues.every((cue, index) => cue.id === index + 1));
assert.deepEqual({ id: cues[0].id, start_ms: cues[0].start_ms,
  end_ms: cues[0].end_ms }, succeeded.first_cue);
assert.deepEqual({ id: cues.at(-1).id, start_ms: cues.at(-1).start_ms,
  end_ms: cues.at(-1).end_ms }, succeeded.last_cue);
assert.equal(succeeded.overlap_pairs, 0);
const archivedCoverage = checkCueMediaCoverage(cues, previous.local_media_duration_ms);
const originalClockCoverage = checkCueMediaCoverage(cues, previous.original_duration_ms);
assert.equal(archivedCoverage.overrun_count, 39);
assert.equal(archivedCoverage.first_overrun.cue_id, 305);
assert.equal(originalClockCoverage.overrun_count, 0);
assert.equal(originalClockCoverage.max_end_ms, 849_160);
assert.equal(succeeded.cues_beyond_archived_media_end, archivedCoverage.overrun_count);
assert.equal(succeeded.cues_beyond_current_metadata_end,
  originalClockCoverage.overrun_count);

const summary = {
  schema_version: 1,
  experiment: acquisition.experiment,
  acquired_at: acquisition.finished_at,
  video_id: acquisition.video_id,
  subtitle_language_label: acquisition.language,
  source_srt_sha256: acquisition.response_sha256,
  source_bytes: acquisition.response_bytes,
  previous_archived_srt_sha256: acquisition.archived_srt_sha256,
  matches_archived_bytes: false,
  strict_cli_sha256: succeeded.cli_sha256,
  strict_cues: cues.length,
  first_cue: succeeded.first_cue,
  last_cue: succeeded.last_cue,
  overlap_pairs: succeeded.overlap_pairs,
  archived_media_duration_ms: archivedCoverage.media_duration_ms,
  cues_beyond_archived_media_end: archivedCoverage.overrun_count,
  first_cue_beyond_archived_media_end: archivedCoverage.first_overrun.cue_id,
  original_platform_metadata_duration_ms: originalClockCoverage.media_duration_ms,
  cues_beyond_original_metadata_end: originalClockCoverage.overrun_count,
  first_inspection_attempt: 'spawn_eperm_retained',
  offline_retry_attempt: 'strict_inspected',
  caption_rights_verified: false,
  human_speech_alignment_verified: false,
  source_admission: 'unassigned_unreviewed',
};
const serialized = `${JSON.stringify(summary, null, 2)}\n`;
if (process.argv.includes('--capture')) {
  await fs.writeFile(publicReport, serialized, { flag: 'wx' });
} else {
  assert.equal(await fs.readFile(publicReport, 'utf8'), serialized,
    'Public caption summary changed');
}
console.log('Kirin current SRT verified: 343 strict cues, 39 extend past archived media, zero human review.');
