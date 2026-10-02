import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { compareSourceDurations } from './source-duration-compatibility.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const privateAttempt = path.join(root,
  '.cache/eval/youtube-geekerwan-kirin-license/attempt-w7pIGY');
const mediaCheck = path.join(root,
  '.cache/eval/commons-geekerwan-two-media/huawei-kirin-9010-8b5d98b9-25ac-42bd-a32a-ac318a97a1c2/check-80102f0f-30d9-40fa-8102-568e5628f20b/report.json');
const publicReport = path.join(root,
  'eval/reports/youtube-geekerwan-kirin-license-v1.json');
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
const readPinned = async (file, expected) => {
  const bytes = await fs.readFile(file);
  assert.equal(sha256(bytes), expected, `${file} changed`);
  return JSON.parse(bytes.toString('utf8'));
};

const attempt = await readPinned(path.join(privateAttempt, 'inventory.json'),
  'b669bc11bdcebd61e79000938b2ea76cd1d6ca7d90ba0db512029423d19c5546');
assert.equal(attempt.schema_version, 1);
assert.equal(attempt.experiment,
  'DATA-03-youtube-geekerwan-kirin-license-2026-10-02-v1');
assert.equal(attempt.video_id, '73XUeYRFsZU');
assert.equal(attempt.source_srt_sha256,
  '57dfd9feb3bfe6381421c4142820b780af341e195e52ee81d58e8f9f12858feb');
assert.equal(attempt.matched_media_sha256,
  '2911c8a14b6da9fa62d46235aa09a1b240ee1409ec8e28336edc7ed90c9af586');
assert.equal(attempt.executable_sha256,
  '52fe3c26dcf71fbdc85b528589020bb0b8e383155cfa81b64dd447bbe35e24b8');
assert.deepEqual(attempt.budget, { extractor_invocations: 1, timeout_ms: 90_000,
  max_output_bytes: 12 * 1024 * 1024, downloads: 0, retries: 0 });
assert.deepEqual(attempt.args, ['--dump-single-json', '--skip-download',
  '--no-playlist', '--no-warnings', '--retries', '0', attempt.url]);
assert.equal(attempt.outcome.exit_code, 0);
assert.equal(attempt.outcome.timed_out, false);
assert.equal(attempt.outcome.output_limit_exceeded, false);
const [raw, stderr] = await Promise.all([
  fs.readFile(path.join(privateAttempt, 'extractor-stdout.json')),
  fs.readFile(path.join(privateAttempt, 'extractor-stderr.txt')),
]);
assert.equal(raw.length, attempt.outcome.stdout_bytes);
assert.equal(stderr.length, attempt.outcome.stderr_bytes);
assert.equal(sha256(raw), attempt.outcome.stdout_sha256);
assert.equal(sha256(stderr), attempt.outcome.stderr_sha256);
const metadata = JSON.parse(raw.toString('utf8'));
assert.equal(metadata.id, attempt.video_id);
assert.equal(metadata.duration, 852);
assert.equal(metadata.upload_date, '20240428');
assert.equal(metadata.license, 'Creative Commons Attribution license (reuse allowed)');
assert.deepEqual(Object.keys(metadata.subtitles ?? {}).sort(), ['en', 'zh-CN']);
assert.deepEqual(Object.keys(metadata.automatic_captions ?? {}), []);
assert((metadata.subtitles['zh-CN'] ?? []).some(track => track.ext === 'srt'));
assert.equal(attempt.metadata.duration_seconds, metadata.duration);
assert.equal(attempt.metadata.license, metadata.license);
assert.deepEqual(attempt.metadata.subtitle_languages,
  Object.keys(metadata.subtitles).sort());

const media = await readPinned(mediaCheck,
  'af3e6699478be47d03412722e0501687a9046618018c1c99bc1eebc24f440211');
assert.equal(media.id, 'huawei-kirin-9010');
assert.equal(media.status, 'decoded_unlistened');
assert.equal(media.source_srt_sha256, attempt.source_srt_sha256);
assert.equal(media.media_sha256, attempt.matched_media_sha256);
assert.equal(media.duration_ms, 761_818);
const duration = compareSourceDurations(metadata.duration * 1000,
  media.duration_ms);
assert.deepEqual(duration, { status: 'duration_discrepancy',
  difference_ms: 90_182, alignment_verified: false });

const summary = {
  schema_version: 1,
  experiment: attempt.experiment,
  observed_at: attempt.finished_at,
  original_video_id: attempt.video_id,
  original_upload_date: metadata.upload_date,
  original_duration_ms: metadata.duration * 1000,
  local_media_duration_ms: media.duration_ms,
  duration_comparison: duration,
  original_platform_license_field: metadata.license,
  original_caption_languages: attempt.metadata.subtitle_languages,
  chinese_srt_track_advertised: true,
  original_srt_sha256: attempt.source_srt_sha256,
  local_media_sha256: attempt.matched_media_sha256,
  metadata_stdout_sha256: attempt.outcome.stdout_sha256,
  source_admission: 'unassigned_unreviewed',
  caption_authorship_verified: false,
  commons_license_review_complete: false,
  human_speech_alignment_verified: false,
};
const serialized = `${JSON.stringify(summary, null, 2)}\n`;
if (process.argv.includes('--capture')) {
  await fs.writeFile(publicReport, serialized, { flag: 'wx' });
} else {
  assert.equal(await fs.readFile(publicReport, 'utf8'), serialized,
    'Public metadata summary changed');
}
console.log(`Kirin metadata verified: ${duration.difference_ms} ms duration discrepancy; source not admitted.`);
