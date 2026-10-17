import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';

export async function loadYoutubeSourceEvidence(root) {
  const vivoSourceRaw = await fs.readFile(path.join(root,
    'eval/reports/youtube-geekerwan-vivo-caption-v1.json'), 'utf8');
  assert.equal(createHash('sha256').update(vivoSourceRaw).digest('hex'),
    '51a8cfacb56437cb9f87ccff4920a57d9df53c0363752af21da7036882beea3c');
  const vivoSource = JSON.parse(vivoSourceRaw);
  assert.equal(vivoSource.video_id, '_G4e2p1p-is');
  assert.equal(vivoSource.regular_chinese_srt_advertised, true);
  assert.equal(vivoSource.youtube_auto_captions_advertised, false);
  assert.equal(vivoSource.cue_count, 467);
  assert.equal(vivoSource.text_identical_cues, vivoSource.cue_count);
  assert.equal(vivoSource.timing_differences.length, 8);
  assert.equal(vivoSource.cues_past_retained_media, 0);
  assert.equal(vivoSource.speech_alignment, 'not_listened');
  assert.equal(vivoSource.source_admission, 'inspected_candidate_zero_eligible');
  const vivoRestorationRaw = await fs.readFile(path.join(root,
    'eval/reports/2026-10-10-youtube-vivo-caption-restoration-v2.json'), 'utf8');
  assert.equal(createHash('sha256').update(vivoRestorationRaw).digest('hex'),
    'f11fbd64c634f1c814087ed5790258912d0e5b0aec54b62213a596f1f4012834');
  const vivoRestoration = JSON.parse(vivoRestorationRaw);
  assert.equal(vivoRestoration.status, 'restored_exact_previous_youtube_bytes');
  assert.equal(vivoRestoration.caption_http_status, 200);
  assert.equal(vivoRestoration.caption_response_bytes, 33577);
  assert.equal(vivoRestoration.comparison.previous_youtube_byte_identical, true);
  assert.equal(vivoRestoration.comparison.candidate_cues, 467);
  assert.equal(vivoRestoration.comparison.commons_text_identical, true);
  assert.equal(vivoRestoration.comparison.timing_differences.length, 8);
  assert.equal(vivoRestoration.human_speech_reviews, 0);
  assert.equal(vivoRestoration.source_admitted, false);
  const vivoRestoredAsrRaw = await fs.readFile(path.join(root,
    'eval/reports/2026-10-10-vivo-restored-source-asr-link-v1.json'), 'utf8');
  assert.equal(createHash('sha256').update(vivoRestoredAsrRaw).digest('hex'),
    'f9c29515bf28937e6d601fe99a8d7a0e3417f72cf389a1457a3f089e4ba8981d');
  const vivoRestoredAsr = JSON.parse(vivoRestoredAsrRaw);
  const vivoRestoredAsrReviewRaw = await fs.readFile(path.join(root,
    'eval/reports/2026-10-10-vivo-restored-source-asr-link-v1-ai-review.json'), 'utf8');
  assert.equal(createHash('sha256').update(vivoRestoredAsrReviewRaw).digest('hex'),
    '715fd784b3cf62a2f220395d666b9f6b94a6020c963a88019693f20dddc96a05');
  const vivoRestoredAsrReview = JSON.parse(vivoRestoredAsrReviewRaw);
  assert.equal(vivoRestoredAsr.source_sha256, vivoRestoration.caption_response_sha256);
  assert.deepEqual(vivoRestoredAsr.windows.map(row => row.cues_with_normalized_asr_overlap),
    [5, 6, 7]);
  assert.deepEqual(vivoRestoredAsr.windows.map(row => row.normalized_low_recall_ids),
    [[], [], [464]]);
  assert.equal(vivoRestoredAsr.whole_file_temporal_overlap_cues, 467);
  assert.equal(vivoRestoredAsr.new_model_requests, 0);
  assert.equal(vivoRestoredAsr.human_chinese_listeners, 0);
  assert.equal(vivoRestoredAsr.source_admitted, false);
  assert.equal(vivoRestoredAsrReview.machine_report_sha256,
    createHash('sha256').update(vivoRestoredAsrRaw).digest('hex'));
  assert.equal(vivoRestoredAsrReview.human_chinese_listeners, 0);
  const vivoAsrRaw = await fs.readFile(path.join(root,
    'eval/reports/youtube-geekerwan-vivo-audio-asr-v1.json'), 'utf8');
  assert.equal(createHash('sha256').update(vivoAsrRaw).digest('hex'),
    '1df903c97638cfd492728ea7a21931ca8e519ffbd50236c58dcafe90b24c51d4');
  const vivoAsr = JSON.parse(vivoAsrRaw);
  assert.equal(vivoAsr.original_srt_sha256, vivoSource.original_srt_sha256);
  assert.equal(vivoAsr.windows.length, 3);
  assert.equal(vivoAsr.total_asr_audio_seconds, 36);
  assert.equal(vivoAsr.language_setting, 'zh_forced_not_independently_detected');
  assert.equal(vivoAsr.reviewer.human_listeners, 0);
  assert.equal(vivoAsr.reviewer.source_speech_alignment_verified, false);
  assert.equal(vivoAsr.source_admission, 'inspected_candidate_zero_eligible');
  const vivoFullAsrRaw = await fs.readFile(path.join(root,
    'eval/reports/2026-10-10-vivo-full-audio-asr-v2.json'), 'utf8');
  assert.equal(createHash('sha256').update(vivoFullAsrRaw).digest('hex'),
    'e378afc97915eeef133c3df79eb828742c25c35c3472b92bc4e9cd12783d10df');
  const vivoFullAsr = JSON.parse(vivoFullAsrRaw);
  assert.equal(vivoFullAsr.source_sha256, vivoSource.original_srt_sha256);
  assert.equal(vivoFullAsr.media_sha256, vivoSource.retained_media_sha256);
  assert.equal(vivoFullAsr.segment_count, 499);
  assert.equal(vivoFullAsr.alignment.cue_count, 467);
  assert.equal(vivoFullAsr.alignment.cues_with_asr_overlap, 467);
  assert.equal(vivoFullAsr.alignment.low_recall_cues, 30);
  assert.equal(vivoFullAsr.alignment_interpretation.low_recall_is_caption_error, false);
  assert.equal(vivoFullAsr.review.human_listeners, 0);
  assert.equal(vivoFullAsr.review.source_speech_alignment_verified, false);
  const vivoOpenccRaw = await fs.readFile(path.join(root,
    'eval/reports/2026-10-10-vivo-opencc-recall-v1.json'), 'utf8');
  assert.equal(createHash('sha256').update(vivoOpenccRaw).digest('hex'),
    '48e202733c4a67de582ff7b05cf6c43a737e91b3bcd2e8a5645a3c2da8fc1c95');
  const vivoOpencc = JSON.parse(vivoOpenccRaw);
  assert.equal(vivoOpencc.source_sha256, vivoSource.original_srt_sha256);
  assert.equal(vivoOpencc.baseline_report_sha256,
    createHash('sha256').update(vivoFullAsrRaw).digest('hex'));
  assert.equal(vivoOpencc.asr_segments, vivoFullAsr.segment_count);
  assert.equal(vivoOpencc.temporal_overlap_cues, 467);
  assert.equal(vivoOpencc.raw_low_recall_cues, 30);
  assert.equal(vivoOpencc.normalized_low_recall_cues, 5);
  assert.equal(vivoOpencc.review.human_listeners, 0);
  return { vivoSourceRaw, vivoSource, vivoRestorationRaw, vivoRestoration, vivoRestoredAsrRaw, vivoRestoredAsr, vivoAsrRaw, vivoAsr, vivoFullAsr, vivoOpencc };
}

export function projectYoutubeSourceEvidence({ vivoSourceRaw, vivoSource, vivoRestorationRaw, vivoRestoration, vivoRestoredAsrRaw, vivoRestoredAsr, vivoAsrRaw, vivoAsr, vivoFullAsr, vivoOpencc }) {
  return {
    youtube_source: { video_id: vivoSource.video_id,
      duration_ms: vivoSource.metadata_duration_ms,
      cue_count: vivoSource.cue_count,
      text_identical_cues: vivoSource.text_identical_cues,
      timing_difference_rows: vivoSource.timing_differences.length,
      cues_past_retained_media: vivoSource.cues_past_retained_media,
      regular_chinese_srt_advertised: vivoSource.regular_chinese_srt_advertised,
      auto_captions_advertised: vivoSource.youtube_auto_captions_advertised,
      speech_alignment: vivoSource.speech_alignment,
      source_admission: vivoSource.source_admission,
      report_sha256: createHash('sha256').update(vivoSourceRaw).digest('hex') },
    youtube_restoration: { status: vivoRestoration.status,
      cue_count: vivoRestoration.comparison.candidate_cues,
      byte_identical: vivoRestoration.comparison.previous_youtube_byte_identical,
      timing_difference_rows: vivoRestoration.comparison.timing_differences.length,
      human_speech_reviews: vivoRestoration.human_speech_reviews,
      source_admitted: vivoRestoration.source_admitted,
      report_sha256: createHash('sha256').update(vivoRestorationRaw).digest('hex') },
    youtube_restored_asr: {
      window_cue_counts: vivoRestoredAsr.windows.map(row => row.cue_ids.length),
      window_overlap_counts: vivoRestoredAsr.windows.map(row =>
        row.cues_with_normalized_asr_overlap),
      normalized_low_window_ids: vivoRestoredAsr.windows.flatMap(row =>
        row.normalized_low_recall_ids),
      full_overlap_cues: vivoRestoredAsr.whole_file_temporal_overlap_cues,
      new_model_requests: vivoRestoredAsr.new_model_requests,
      human_listeners: vivoRestoredAsr.human_chinese_listeners,
      source_admitted: vivoRestoredAsr.source_admitted,
      report_sha256: createHash('sha256').update(vivoRestoredAsrRaw).digest('hex') },
    youtube_asr: { windows: vivoAsr.windows.length,
      audio_seconds: vivoAsr.total_asr_audio_seconds,
      elapsed_seconds: vivoAsr.total_elapsed_seconds,
      language_setting: vivoAsr.language_setting,
      source_comparison: vivoAsr.ai_source_comparison.conclusion,
      human_listeners: vivoAsr.reviewer.human_listeners,
      source_speech_alignment_verified: vivoAsr.reviewer.source_speech_alignment_verified,
      report_sha256: createHash('sha256').update(vivoAsrRaw).digest('hex') },
    youtube_full_asr: { segments: vivoFullAsr.segment_count,
      elapsed_seconds: vivoFullAsr.elapsed_seconds,
      cue_count: vivoFullAsr.alignment.cue_count,
      temporal_overlap_cues: vivoFullAsr.alignment.cues_with_asr_overlap,
      raw_low_recall_cues: vivoFullAsr.alignment.low_recall_cues,
      raw_low_recall_is_caption_error:
        vivoFullAsr.alignment_interpretation.low_recall_is_caption_error,
      human_listeners: vivoFullAsr.review.human_listeners,
      source_admission: vivoFullAsr.review.source_admission },
    youtube_opencc: { changed_segments: vivoOpencc.changed_segments,
      raw_low_recall_cues: vivoOpencc.raw_low_recall_cues,
      normalized_low_recall_cues: vivoOpencc.normalized_low_recall_cues,
      improved_cues: vivoOpencc.improved_cues,
      worsened_cues: vivoOpencc.worsened_cues,
      human_listeners: vivoOpencc.review.human_listeners },
  };
}
