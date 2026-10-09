import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { createReadStream } from 'node:fs';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const privateAttempt = path.join(root,
  '.cache/eval/youtube-geekerwan-vivo-original-caption/attempt-LQWxgw');
const mediaFolder = path.join(root,
  '.cache/eval/commons-vivo-media/media-46745446-cc07-4cff-b5e3-f98fe08262f0');
const reportPath = path.join(root, 'eval/reports/youtube-geekerwan-vivo-caption-v1.json');
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
async function pinned(file, expected) {
  const bytes = await fs.readFile(file);
  assert.equal(sha256(bytes), expected, `${file} changed`);
  return bytes;
}
async function fileSha256(file) {
  const hash = createHash('sha256');
  for await (const chunk of createReadStream(file)) hash.update(chunk);
  return hash.digest('hex');
}
function parseSrt(bytes) {
  const raw = bytes.toString('utf8');
  assert(!raw.includes('\r'), 'Only pinned LF source is expected');
  return raw.trimEnd().split(/\n\n+/u).map((block, index) => {
    const [label, timing, ...text] = block.split('\n');
    assert.equal(Number(label), index + 1);
    assert(text.length > 0 && text.every(line => line.length > 0));
    const match = /^(\d{2}):(\d{2}):(\d{2}),(\d{3}) --> (\d{2}):(\d{2}):(\d{2}),(\d{3})$/u.exec(timing);
    assert(match, `Invalid time syntax at cue ${index + 1}`);
    const ms = offset => Number(match[offset]) * 3_600_000 +
      Number(match[offset + 1]) * 60_000 + Number(match[offset + 2]) * 1000 +
      Number(match[offset + 3]);
    const startMs = ms(1);
    const endMs = ms(5);
    assert(startMs < endMs);
    return { id: index + 1, startMs, endMs, text: text.join('\n') };
  });
}

const [metadataBytes, acquisitionBytes, originalBytes, archivedBytes,
  streamCheckBytes, ffprobeBytes] = await Promise.all([
  pinned(path.join(root,
    '.cache/eval/youtube-geekerwan-vivo-license/attempt-3gjBqC/extractor-stdout.json'),
  '66624027735c409eb650ab218560836e630653855e90c858bf832ab3886ba329'),
  pinned(path.join(privateAttempt, 'acquisition.json'),
    '1bb3961f318f821f0e20f98dcd685c2f2e3145b253f2bc58f0aeae6c72e2bceb'),
  pinned(path.join(privateAttempt, 'source.zh.srt'),
    'b100803367b95fa55fc638b1ff39a0abfa0d5b8183ebe58d58b1a87242d9d8c4'),
  pinned(path.join(root, '.cache/eval/commons-vivo-979826861/source.zh.srt'),
    '8c41e66f52000a5b67ab27bfc319accd11d89290b60e50fc5c60f4ee8230a000'),
  pinned(path.join(mediaFolder, 'stream-check-2cb54a0e-5581-4abd-ae1d-4104c2b38ee9.json'),
    '43cb66f78b5e4c6159d82afe5504be9bbe090188a7eea8cb9221a1c8601ef2bc'),
  pinned(path.join(mediaFolder, 'ffprobe-2cb54a0e-5581-4abd-ae1d-4104c2b38ee9.json'),
    '6ac4624d5b3f4ea47b143ca4d7634401cb09f5b625b948e97a24384c6591dda8'),
]);
const metadata = JSON.parse(metadataBytes);
const acquisition = JSON.parse(acquisitionBytes);
const streamCheck = JSON.parse(streamCheckBytes);
assert.equal(metadata.id, '_G4e2p1p-is');
assert.equal(metadata.channel_id, 'UCeUJO1H3TEXu2syfAAPjYKQ');
assert.equal(metadata.duration, 1116);
assert.equal(metadata.license, 'Creative Commons Attribution license (reuse allowed)');
assert((metadata.subtitles?.['zh-CN'] ?? []).some(track => track.ext === 'srt'));
assert.equal(Object.keys(metadata.automatic_captions ?? {}).length, 0);
assert.equal(acquisition.outcome, 'acquired_private_unreviewed');
assert.equal(acquisition.http_status, 200);
assert.equal(acquisition.response_bytes, originalBytes.length);
assert.equal(acquisition.response_sha256, sha256(originalBytes));
assert.equal(acquisition.matches_archived_bytes, false);
assert.equal(streamCheck.ffprobe_output_sha256, sha256(ffprobeBytes));
assert.equal(streamCheck.duration_ms, 1_115_570);
assert.equal(await fileSha256(path.join(mediaFolder, 'source.240p.webm')),
  streamCheck.media_sha256);

const original = parseSrt(originalBytes);
const archived = parseSrt(archivedBytes);
assert.equal(original.length, 467);
assert.equal(archived.length, original.length);
const timingDifferences = [];
for (let index = 0; index < original.length; index++) {
  const current = original[index];
  const previous = archived[index];
  assert.equal(current.text, previous.text, `Text differs at cue ${current.id}`);
  const startDeltaMs = current.startMs - previous.startMs;
  const endDeltaMs = current.endMs - previous.endMs;
  assert(Math.abs(startDeltaMs) <= 1 && Math.abs(endDeltaMs) <= 1,
    `Timing differs by over 1 ms at cue ${current.id}`);
  if (startDeltaMs || endDeltaMs) {
    timingDifferences.push({ cue_id: current.id, start_delta_ms: startDeltaMs,
      end_delta_ms: endDeltaMs });
  }
  assert(current.endMs <= streamCheck.duration_ms,
    `Cue ${current.id} ends after retained media`);
}
assert.equal(timingDifferences.length, 8);
const report = {
  schema_version: 1,
  experiment: acquisition.experiment,
  video_id: metadata.id,
  youtube_url: 'https://www.youtube.com/watch?v=_G4e2p1p-is',
  creator_channel_id: metadata.channel_id,
  upload_date: metadata.upload_date,
  youtube_video_license_field: metadata.license,
  regular_chinese_srt_advertised: true,
  youtube_auto_captions_advertised: false,
  caption_authorship_verified: false,
  metadata_sha256: sha256(metadataBytes),
  metadata_duration_ms: metadata.duration * 1000,
  retained_media_sha256: streamCheck.media_sha256,
  retained_media_duration_ms: streamCheck.duration_ms,
  original_srt_sha256: sha256(originalBytes),
  original_srt_bytes: originalBytes.length,
  archived_srt_sha256: sha256(archivedBytes),
  cue_count: original.length,
  text_identical_cues: original.length,
  timing_differences: timingDifferences,
  first_cue: { start_ms: original[0].startMs, end_ms: original[0].endMs },
  last_cue: { start_ms: original.at(-1).startMs, end_ms: original.at(-1).endMs },
  cues_past_retained_media: 0,
  rights: { video: 'metadata_cc_attribution_unreviewed',
    subtitles: 'unknown', audio: 'unknown' },
  speech_alignment: 'not_listened',
  source_admission: 'inspected_candidate_zero_eligible',
};
const serialized = `${JSON.stringify(report, null, 2)}\n`;
if (process.argv.includes('--capture')) {
  await fs.writeFile(reportPath, serialized, { flag: 'wx' });
} else {
  assert.equal(await fs.readFile(reportPath, 'utf8'), serialized);
}
console.log('Vivo caption version: 467 identical texts, eight <=1 ms timing differences, zero cues beyond media; speech remains unverified.');
