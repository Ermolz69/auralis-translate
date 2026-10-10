import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { createReadStream } from 'node:fs';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parsePinnedSrt } from './cross-source-relation-screen.mjs';
import { summarizeCues } from './vivo-full-audio-alignment.mjs';
import { scoreAudioWindow } from './source-asr-window-score.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const sourceRoot = process.env.AURALIS_SOURCE_ROOT;
const mode = process.argv[2];
assert(['--preflight', '--report', '--check'].includes(mode)
  && process.argv.length === 3);
assert(sourceRoot && path.isAbsolute(sourceRoot));
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const expected = {
  plan: 'c76df197cabea05f9056da1d9a2839eae1bb8aa85bca3d5226bb81c8135d71b4',
  source: 'b100803367b95fa55fc638b1ff39a0abfa0d5b8183ebe58d58b1a87242d9d8c4',
  media: '7ad0484b31a6788c31632616649c51e6aaf6cdcdd7d90083d88e1d5ee66e1507',
  raw: 'a1f92de3e5d2a84baf070851e8248e6455ad432f1e63241749e543865f10d78e',
  conversion: '3001a246c8d2ac66d41e07d2a49a3f47730daf5ec2a8eed41f3376c41d601a6f',
  baseline: 'e378afc97915eeef133c3df79eb828742c25c35c3472b92bc4e9cd12783d10df',
  opencc_report: '48e202733c4a67de582ff7b05cf6c43a737e91b3bcd2e8a5645a3c2da8fc1c95',
};
const sourcePath = path.join(root,
  '.cache/eval/youtube-vivo-caption-restoration-v2/caption/attempt-LHmA6o/source.zh.srt');
const mediaPath = path.join(sourceRoot,
  '.cache/eval/commons-vivo-media/media-46745446-cc07-4cff-b5e3-f98fe08262f0/source.240p.webm');
const reportPath = path.join(root,
  'eval/reports/2026-10-10-vivo-restored-source-asr-link-v1.json');

async function pinned(relative, digest) {
  const bytes = await fs.readFile(path.join(root, relative));
  assert.equal(sha(bytes), digest, `${relative} changed`);
  return bytes;
}

async function hashFile(file) {
  const hash = createHash('sha256');
  for await (const chunk of createReadStream(file)) hash.update(chunk);
  return hash.digest('hex');
}

const [planBytes, sourceBytes, rawBytes, conversionBytes, baselineBytes,
  openccBytes, mediaHash] = await Promise.all([
  pinned('eval/experiments/2026-10-10-vivo-restored-source-asr-link-v1-plan.md',
    expected.plan),
  fs.readFile(sourcePath),
  pinned('.cache/eval/vivo-full-audio-asr-v1/attempt-AdDOL7/raw.json',
    expected.raw),
  pinned('.cache/eval/vivo-opencc-conversion-v1/converted.json',
    expected.conversion),
  pinned('eval/reports/2026-10-10-vivo-full-audio-asr-v2.json',
    expected.baseline),
  pinned('eval/reports/2026-10-10-vivo-opencc-recall-v1.json',
    expected.opencc_report),
  hashFile(mediaPath),
]);
assert.equal(sha(sourceBytes), expected.source);
assert.equal(mediaHash, expected.media);
const raw = JSON.parse(rawBytes);
const conversion = JSON.parse(conversionBytes);
const baseline = JSON.parse(baselineBytes);
const opencc = JSON.parse(openccBytes);
assert.equal(raw.status, 'complete_ai_unreviewed');
assert.equal(raw.media_sha256, expected.media);
assert.equal(raw.model_revision,
  'ebe41f70d5b6dfa9166e2c581c45c9c0cfc57b66');
assert.equal(raw.compute, 'cpu_int8');
assert.equal(raw.language, 'zh_forced');
assert.equal(raw.beam_size, 5);
assert.equal(raw.vad_filter, false);
assert.equal(raw.condition_on_previous_text, false);
assert.equal(raw.segments.length, 499);
assert.equal(conversion.raw_asr_sha256, expected.raw);
assert.equal(conversion.status, 'converted_unreviewed');
assert.equal(conversion.opencc_version, '1.4.2');
assert.equal(conversion.config, 't2s.json');
assert.equal(conversion.segments.length, raw.segments.length);
for (let index = 0; index < raw.segments.length; index++) {
  assert.equal(conversion.segments[index].start, raw.segments[index].start);
  assert.equal(conversion.segments[index].end, raw.segments[index].end);
}
assert.equal(baseline.source_sha256, expected.source);
assert.equal(opencc.source_sha256, expected.source);

if (mode === '--preflight') {
  console.log(JSON.stringify({ experiment:
    'DATA-03-vivo-restored-source-full-asr-link-2026-10-10-v1',
  plan_sha256: sha(planBytes), source_sha256: sha(sourceBytes),
  media_sha256: mediaHash, raw_asr_sha256: sha(rawBytes),
  converted_asr_sha256: sha(conversionBytes),
  windows_seconds: [0, 563, 1102], model_requests: 0 }, null, 2));
  process.exit(0);
}

const cues = parsePinnedSrt(sourceBytes);
assert.equal(cues.length, 467);
const rawScore = summarizeCues(cues, raw.segments, 1_115_570);
assert.deepEqual(rawScore, baseline.alignment);
const normalizedScore = summarizeCues(cues, conversion.segments, 1_115_570);
assert.equal(normalizedScore.cues_with_asr_overlap, opencc.temporal_overlap_cues);
assert.equal(normalizedScore.low_recall_cues, opencc.normalized_low_recall_cues);
assert.deepEqual(normalizedScore.low_recall_ids, opencc.normalized_low_recall_ids);
const windows = [
  { label: 'start', startMs: 0 },
  { label: 'middle', startMs: 563_000 },
  { label: 'end', startMs: 1_102_000 },
].map(({ label, startMs }) => ({ label,
  ...scoreAudioWindow(cues, raw.segments, conversion.segments, startMs) }));
const report = { schema_version: 1,
  experiment: 'DATA-03-vivo-restored-source-full-asr-link-2026-10-10-v1',
  plan_sha256: sha(planBytes), source_sha256: sha(sourceBytes),
  media_sha256: mediaHash, raw_asr_sha256: sha(rawBytes),
  converted_asr_sha256: sha(conversionBytes),
  baseline_report_sha256: sha(baselineBytes),
  opencc_report_sha256: sha(openccBytes),
  model_repo: raw.model_repo, model_revision: raw.model_revision,
  compute: raw.compute, language_setting: raw.language,
  asr_segments: raw.segments.length,
  whole_file_cues: rawScore.cue_count,
  whole_file_temporal_overlap_cues: rawScore.cues_with_asr_overlap,
  raw_low_recall_cues: rawScore.low_recall_cues,
  normalized_low_recall_cues: normalizedScore.low_recall_cues,
  windows, new_model_requests: 0, new_audio_decodes: 0,
  human_chinese_listeners: 0, speech_words_verified: false,
  speakers_verified: false, rights_verified: false,
  source_admitted: false };
const serialized = `${JSON.stringify(report, null, 2)}\n`;
if (mode === '--report') await fs.writeFile(reportPath, serialized, { flag: 'wx' });
else assert.equal(await fs.readFile(reportPath, 'utf8'), serialized);
console.log(JSON.stringify({ mode, source_sha256: report.source_sha256,
  asr_segments: report.asr_segments,
  window_cue_ids: windows.map(item => item.cue_ids),
  window_overlap: windows.map(item => item.cues_with_normalized_asr_overlap),
  human_listeners: 0, source_admitted: false }));
