import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parsePinnedSrt } from './cross-source-relation-screen.mjs';
import { summarizeCues } from './vivo-full-audio-alignment.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const assetRoot = process.env.AURALIS_VIVO_ASSET_ROOT;
const mode = process.argv[2];
assert(['--capture', '--check'].includes(mode) && process.argv.length === 3);
assert(assetRoot && path.isAbsolute(assetRoot));
const sourcePath = path.join(assetRoot,
  '.cache/eval/youtube-geekerwan-vivo-original-caption/attempt-LQWxgw/source.zh.srt');
const rawPath = path.join(root,
  '.cache/eval/vivo-full-audio-asr-v1/attempt-AdDOL7/raw.json');
const conversionPath = path.join(root,
  '.cache/eval/vivo-opencc-conversion-v1/converted.json');
const baselinePath = path.join(root,
  'eval/reports/2026-10-10-vivo-full-audio-asr-v2.json');
const reportPath = path.join(root,
  'eval/reports/2026-10-10-vivo-opencc-recall-v1.json');
const digest = bytes => createHash('sha256').update(bytes).digest('hex');
const [sourceBytes, rawBytes, conversionBytes, baselineBytes] =
  await Promise.all([sourcePath, rawPath, conversionPath, baselinePath]
    .map(file => fs.readFile(file)));
assert.equal(digest(sourceBytes),
  'b100803367b95fa55fc638b1ff39a0abfa0d5b8183ebe58d58b1a87242d9d8c4');
assert.equal(digest(rawBytes),
  'a1f92de3e5d2a84baf070851e8248e6455ad432f1e63241749e543865f10d78e');
assert.equal(digest(baselineBytes),
  'e378afc97915eeef133c3df79eb828742c25c35c3472b92bc4e9cd12783d10df');
const raw = JSON.parse(rawBytes);
const converted = JSON.parse(conversionBytes);
const baseline = JSON.parse(baselineBytes);
assert.equal(converted.status, 'converted_unreviewed');
assert.equal(converted.raw_asr_sha256, digest(rawBytes));
assert.equal(converted.wheel_sha256,
  'b2af32959214ba7fd475991aaf2476e1f775061708c154cd39782485365dc781');
assert.equal(converted.opencc_version, '1.4.2');
assert.equal(converted.config, 't2s.json');
assert.equal(converted.segments.length, raw.segments.length);
assert.equal(converted.segments.length, 499);
for (let index = 0; index < 499; index += 1) {
  assert.equal(converted.segments[index].start, raw.segments[index].start);
  assert.equal(converted.segments[index].end, raw.segments[index].end);
}
const source = parsePinnedSrt(sourceBytes);
const score = summarizeCues(source, converted.segments, 1115570);
assert.equal(score.cue_count, baseline.alignment.cue_count);
assert.equal(score.cues_with_asr_overlap,
  baseline.alignment.cues_with_asr_overlap);
const baselineById = new Map(baseline.alignment.rows.map(row => [row.id, row]));
const improved = score.rows.filter(row =>
  row.source_character_recall > baselineById.get(row.id).source_character_recall);
const worsened = score.rows.filter(row =>
  row.source_character_recall < baselineById.get(row.id).source_character_recall);
const report = { schema_version: 1, experiment: converted.experiment,
  source_sha256: digest(sourceBytes), raw_asr_sha256: digest(rawBytes),
  baseline_report_sha256: digest(baselineBytes),
  private_conversion_sha256: digest(conversionBytes),
  wheel_sha256: converted.wheel_sha256,
  opencc_version: converted.opencc_version, config: converted.config,
  conversion_seconds: converted.elapsed_seconds,
  asr_segments: raw.segments.length,
  changed_segments: converted.changed_segments,
  temporal_overlap_cues: score.cues_with_asr_overlap,
  scorable_cues: score.eligible_recall_cues,
  raw_low_recall_cues: baseline.alignment.low_recall_cues,
  normalized_low_recall_cues: score.low_recall_cues,
  normalized_low_recall_ids: score.low_recall_ids,
  improved_cues: improved.length, worsened_cues: worsened.length,
  unchanged_cues: score.cue_count - improved.length - worsened.length,
  thirds: score.thirds,
  review: { kind: 'ai_diagnostic', human_listeners: 0,
    caption_error_count: null, caption_error_count_reason: 'no_human_listening_or_adjudication',
    source_admission: 'inspected_candidate_zero_eligible' } };
const serialized = `${JSON.stringify(report, null, 2)}\n`;
if (mode === '--capture')
  await fs.writeFile(reportPath, serialized, { flag: 'wx' });
else assert.equal(await fs.readFile(reportPath, 'utf8'), serialized);
console.log(JSON.stringify({ mode, changed_segments: report.changed_segments,
  raw_low: report.raw_low_recall_cues,
  normalized_low: report.normalized_low_recall_cues,
  human_listeners: 0 }));
