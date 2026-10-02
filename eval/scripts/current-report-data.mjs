import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { loadDeliveryPlan } from './delivery-progress-section.mjs';
import { loadSourceCandidates } from './source-candidate-section.mjs';
import { loadSethluiFullV6 } from './sethlui-full-v6-section.mjs';
import { loadSethluiRetry } from './sethlui-retry-section.mjs';
import { loadSethluiAudio } from './sethlui-audio-section.mjs';
import { loadApprovedTermDiagnostic } from './term-diagnostic-section.mjs';

export async function loadCurrentReport(root) {
  const [plan, sources, comparison, retry, audio, terms, kirin,
    kirinCaption, kirinMedia, paywall, captionOverlapRaw, packetRaw,
    activityRaw, voaRaw] = await Promise.all([
    loadDeliveryPlan(root), loadSourceCandidates(root), loadSethluiFullV6(root),
    loadSethluiRetry(root), loadSethluiAudio(root), loadApprovedTermDiagnostic(root),
    fs.readFile(path.join(root, 'eval/reports/youtube-geekerwan-kirin-license-v1.json'),
      'utf8').then(JSON.parse),
    fs.readFile(path.join(root, 'eval/reports/youtube-geekerwan-kirin-caption-v1.json'),
      'utf8').then(JSON.parse),
    fs.readFile(path.join(root, 'eval/reports/youtube-geekerwan-kirin-media-failure-v1.json'),
      'utf8').then(JSON.parse),
    fs.readFile(path.join(root, 'eval/reports/paywall-review-seed-v1.json'),
      'utf8').then(JSON.parse),
    fs.readFile(path.join(root, 'eval/reports/source-caption-overlap-v1.json'), 'utf8'),
    fs.readFile(path.join(root,
      'eval/reports/2026-10-02-sethlui-packet-boundary-summary.json'), 'utf8'),
    fs.readFile(path.join(root,
      'eval/reports/2026-10-02-sethlui-source-activity-summary.json'), 'utf8'),
    fs.readFile(path.join(root,
      'eval/reports/voa-mandarin-caption-inventory-2026-10-02.json'), 'utf8'),
  ]);
  const captionOverlap = JSON.parse(captionOverlapRaw);
  const captionOverlapSha256 = createHash('sha256').update(captionOverlapRaw).digest('hex');
  const packet = JSON.parse(packetRaw);
  assert.equal(createHash('sha256').update(packetRaw).digest('hex'),
    'c5cf09d0f341c591bf960c1a377d78596b728455869445537058880227b69e86');
  assert.equal(packet.media_sha256, audio.summary.media_sha256);
  assert.equal(packet.packet_count, audio.summary.audio_packet_count);
  assert.equal(packet.maximum_internal_gap_ms, audio.summary.maximum_packet_gap_ms);
  assert.equal(packet.packet_timeline_continuous, true);
  assert.equal(packet.human_listeners, 0);
  assert.equal(packet.cue_fit_admitted, false);
  const activity = JSON.parse(activityRaw);
  assert.equal(createHash('sha256').update(activityRaw).digest('hex'),
    '162f900618cb006ec2ed2e23dcf3c4f1245e175b5d1b9c50e4a558049f95742d');
  assert.equal(activity.source_srt_sha256, audio.summary.source_srt_sha256);
  assert.equal(activity.source_media_sha256, audio.summary.source_media_sha256);
  assert.equal(activity.cue_count, audio.summary.cue_count);
  assert.equal(activity.cue_window_ms, 598_432);
  assert.equal(activity.cue_silence_overlap_ms, 155);
  assert.equal(activity.review_priority_count, 0);
  assert.equal(activity.interpretation, 'uninformative_for_speech_alignment');
  assert.equal(activity.source_speech_alignment_verified, false);
  assert.equal(activity.human_listening, 'not_performed');
  assert.equal(activity.eligible_cues_added, 0);
  const voa = JSON.parse(voaRaw);
  assert.equal(voa.source_admission, 'rejected_no_chinese_subtitle_track');
  assert.equal(voa.permitted_attempt.candidates.length, 2);
  assert(voa.permitted_attempt.candidates.every(candidate =>
    candidate.original_chinese_subtitle_languages.length === 0
    && candidate.automatic_chinese_caption_languages.length === 0
    && candidate.eligible_cues_added === 0));
  const small = comparison.arms[0];
  const large = retry.second;
  assert.equal(small.model, '1.8B Q4_K_M');
  assert.equal(small.status, 'complete_unreviewed');
  assert.equal(small.checkpoints, comparison.source_cues);
  assert.equal(large.source_sha256, comparison.source_sha256);
  assert.equal(large.checkpoints, comparison.source_cues);
  assert.equal(audio.summary.source_srt_sha256, comparison.source_sha256);
  assert.equal(audio.summary.candidate_ru_srt_sha256, large.output_sha256);
  assert.equal(sources.source_count, 11);
  assert.equal(sources.media_groups, 10);
  assert.equal(sources.inspected_cues, 3243);
  assert.equal(sources.eligible_cues, 0);
  assert.equal(captionOverlap.source_count, sources.source_count);
  assert.equal(captionOverlap.media_group_count, sources.media_groups);
  assert.equal(captionOverlap.compared_pairs, 54);
  assert.deepEqual(captionOverlap.flagged_pairs, []);
  assert.equal(captionOverlap.same_group_pairs.length, 1);
  assert.equal(captionOverlap.same_group_pairs[0].shared_windows, 4010);
  assert.equal(captionOverlap.same_group_pairs[0].smaller_windows, 4176);
  assert.equal(comparison.review.independent_human_cues, 0);
  assert.equal(large.independent_human_reviewed_cues, 0);
  assert.equal(audio.summary.human_listening_review, 'missing');
  assert.equal(kirin.original_video_id, '73XUeYRFsZU');
  assert.equal(kirin.duration_comparison.status, 'duration_discrepancy');
  assert.equal(kirin.duration_comparison.difference_ms, 90_182);
  assert.equal(kirin.source_admission, 'unassigned_unreviewed');
  assert.equal(kirinCaption.strict_cues, 343);
  assert.equal(kirinCaption.cues_beyond_archived_media_end, 39);
  assert.equal(kirinCaption.source_admission, 'unassigned_unreviewed');
  assert.equal(kirinMedia.media_acquired, false);
  assert.deepEqual(kirinMedia.attempts.map(item => item.http_status), [302, 403]);
  assert.equal(paywall.source_id, 'paywall-chinese-4b4ffc0c');
  assert.equal(paywall.source_cues, 12);
  assert.equal(paywall.source_text_slots, 16);
  assert.equal(paywall.model_request_projection_identical, true);
  assert.equal(paywall.source_admission, 'unassigned_unreviewed');
  assert.equal(paywall.independent_human_reviewed_cues, 0);
  assert.equal(paywall.selected_model, null);
  assert.deepEqual(paywall.variants.map(arm => arm.model), ['1b', '7b']);
  return {
    schema_version: 1,
    as_of: '2026-10-02',
    release_decision: 'not_accepted',
    sources: { candidates: sources.source_count, media_groups: sources.media_groups,
      inspected_cues: sources.inspected_cues,
      eligible_cues: sources.eligible_cues },
    caption_overlap: { compared_pairs: captionOverlap.compared_pairs,
      flagged_pairs: captionOverlap.flagged_pairs.length,
      kirin_shared_windows: captionOverlap.same_group_pairs[0].shared_windows,
      kirin_smaller_windows: captionOverlap.same_group_pairs[0].smaller_windows,
      report_sha256: captionOverlapSha256 },
    source_probe: { original_video_id: kirin.original_video_id,
      original_duration_ms: kirin.original_duration_ms,
      local_media_duration_ms: kirin.local_media_duration_ms,
      duration_comparison: kirin.duration_comparison,
      chinese_srt_track_advertised: kirin.chinese_srt_track_advertised,
      original_track_cues: kirinCaption.strict_cues,
      cues_beyond_archived_media_end: kirinCaption.cues_beyond_archived_media_end,
      original_media_acquired: kirinMedia.media_acquired,
      media_http_statuses: kirinMedia.attempts.map(item => item.http_status),
      source_admission: kirin.source_admission },
    translation: {
      source_sha256: comparison.source_sha256,
      source_cues: comparison.source_cues,
      source_duration_ms: comparison.source_duration_ms,
      small: { model: small.model, model_sha256: small.model_sha256,
        profile_sha256: small.profile_sha256, checkpoints: small.checkpoints,
        elapsed_ms: small.translation_command_ms, prompt_tokens: small.prompt_tokens,
        completion_tokens: small.completion_tokens },
      large: { model: '7B Q4_K_M', profile_sha256: large.profile_sha256,
        checkpoints: large.checkpoints, elapsed_ms: large.translation_elapsed_ms,
        prompt_tokens: large.prompt_tokens, completion_tokens: large.completion_tokens,
        chat_requests: large.chat_requests, output_sha256: large.output_sha256 },
      human_reviewed_cues: large.independent_human_reviewed_cues,
      selected_candidate: false,
    },
    term_screen: { report_schema: 2, regression: 'REG-046',
      checked_pairs_in_reproducer: terms.pair_audit.checked_pairs,
      missing_pairs_in_reproducer: terms.pair_audit.missing_pairs,
      human_review: terms.pair_audit.human_review },
    development_screen: {
      source_id: paywall.source_id,
      source_cues: paywall.source_cues,
      source_text_slots: paywall.source_text_slots,
      identical_requests: paywall.model_request_projection_identical,
      film_speech_language: paywall.film_speech_language,
      source_admission: paywall.source_admission,
      human_reviewed_cues: paywall.independent_human_reviewed_cues,
      selected_model: paywall.selected_model,
      variants: paywall.variants.map(arm => ({ model: arm.model,
        accepted_cues: arm.accepted_cues,
        text_slots: arm.text_slots,
        translation_command_ms: arm.translation_command_ms,
        prompt_tokens: arm.prompt_tokens,
        completion_tokens: arm.completion_tokens,
        sampled_process_rss_peak_bytes: arm.sampled_process_rss_peak_bytes,
        source_alias_missing_at_861: arm.source_alias_missing_at_861,
        ambiguous_number_grouping_at_17:
          arm.ambiguous_number_grouping_at_17 })),
    },
    audio: { cue_count: audio.summary.cue_count,
      overrun_count: audio.summary.overrun_count,
      overlap_start_count: audio.summary.overlap_start_count,
      fit_at_most_2x: audio.summary.fit_at_most_2x,
      full_playback_ms: audio.summary.full_playback_ms,
      paired_clips: audio.summary.audition_paired_clips,
      packet_count: packet.packet_count,
      packet_gap_ms: packet.maximum_internal_gap_ms,
      packet_preroll_ms: packet.preroll_ms,
      packet_overshoot_ms: packet.overshoot_ms,
      packet_timeline_continuous: packet.packet_timeline_continuous,
      human_listeners: 0, approved_script: audio.summary.approved_spoken_script },
    source_activity: { cue_count: activity.cue_count,
      silence_interval_count: activity.silence_interval_count,
      cues_with_silence_overlap: activity.cues_with_silence_overlap,
      cue_window_ms: activity.cue_window_ms,
      cue_silence_overlap_ms: activity.cue_silence_overlap_ms,
      review_priority_count: activity.review_priority_count,
      thirds: activity.thirds,
      interpretation: activity.interpretation,
      source_speech_alignment_verified: activity.source_speech_alignment_verified,
      eligible_cues_added: activity.eligible_cues_added },
    voa_source_screen: { tested_sources: voa.permitted_attempt.candidates.length,
      chinese_subtitle_tracks: 0, eligible_cues_added: 0,
      sandbox_failure_retained: true,
      report_sha256: createHash('sha256').update(voaRaw).digest('hex') },
    backlog: { total_tasks: plan.total_tasks, counts: plan.counts },
  };
}
