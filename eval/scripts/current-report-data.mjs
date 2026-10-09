import { loadTargetTerms } from './target-terms-section.mjs';
import { loadOccurrenceTerms } from './occurrence-terms-section.mjs';
import { loadNameRegistry } from './name-registry-section.mjs';
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
    activityRaw, voaRaw, batchRaw, salienceRaw, orderRaw, v8Raw, nameRaw,
    crossRaw, largeV8Raw, naturalV8Raw, resumeV8Raw, singleV8Raw,
    riskV8Raw, controlV1Raw, controlV2Raw, instructionRaw,
    provisionalTermsRaw] = await Promise.all([
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
    fs.readFile(path.join(root, 'eval/reports/source-caption-overlap-v2.json'), 'utf8'),
    fs.readFile(path.join(root,
      'eval/reports/2026-10-02-sethlui-packet-boundary-summary.json'), 'utf8'),
    fs.readFile(path.join(root,
      'eval/reports/2026-10-02-sethlui-source-activity-summary.json'), 'utf8'),
    fs.readFile(path.join(root,
      'eval/reports/voa-mandarin-caption-inventory-2026-10-02.json'), 'utf8'),
    fs.readFile(path.join(root,
      'eval/reports/2026-10-02-v7-authored-batch-screen.json'), 'utf8'),
    fs.readFile(path.join(root,
      'eval/reports/2026-10-02-v7-context-salience.json'), 'utf8'),
    fs.readFile(path.join(root,
      'eval/reports/2026-10-02-v7-target-first-order.json'), 'utf8'),
    fs.readFile(path.join(root,
      'eval/reports/2026-10-02-v8-authored-cli.json'), 'utf8'),
    fs.readFile(path.join(root,
      'eval/reports/2026-10-02-reg-052-v8-controls.json'), 'utf8'),
    fs.readFile(path.join(root,
      'eval/reports/2026-10-02-reg-052-cross-model.json'), 'utf8'),
    fs.readFile(path.join(root,
      'eval/reports/2026-10-02-v8-7b-authored-cli.json'), 'utf8'),
    fs.readFile(path.join(root,
      'eval/reports/2026-10-02-v8-asus-natural-long.json'), 'utf8'),
    fs.readFile(path.join(root,
      'eval/reports/2026-10-02-v8-asus-copy-resume.json'), 'utf8'),
    fs.readFile(path.join(root,
      'eval/reports/2026-10-02-v8-asus-single-target.json'), 'utf8'),
    fs.readFile(path.join(root,
      'eval/reports/2026-10-02-v8-asus-single-target-risk-audit.json'), 'utf8'),
    fs.readFile(path.join(root,
      'eval/reports/2026-10-02-reg-058-paired-controls-invalid.json'), 'utf8'),
    fs.readFile(path.join(root,
      'eval/reports/2026-10-02-reg-058-paired-controls-v2.json'), 'utf8'),
    fs.readFile(path.join(root,
      'eval/reports/2026-10-02-reg-058-semantic-instruction-v1.json'), 'utf8'),
    fs.readFile(path.join(root,
      'eval/reports/2026-10-02-reg-058-provisional-terms-v1.json'), 'utf8'),
  ]);
  const captionOverlap = JSON.parse(captionOverlapRaw);
  const salience = JSON.parse(salienceRaw);
  const order = JSON.parse(orderRaw);
  const v8 = JSON.parse(v8Raw);
  const names = JSON.parse(nameRaw);
  const cross = JSON.parse(crossRaw);
  const largeV8 = JSON.parse(largeV8Raw);
  const naturalV8 = JSON.parse(naturalV8Raw);
  const resumeV8 = JSON.parse(resumeV8Raw);
  const singleV8 = JSON.parse(singleV8Raw);
  const riskV8 = JSON.parse(riskV8Raw);
  const controlV1 = JSON.parse(controlV1Raw);
  const controlV2 = JSON.parse(controlV2Raw);
  const instruction = JSON.parse(instructionRaw);
  const provisionalTerms = JSON.parse(provisionalTermsRaw);
  assert.equal(naturalV8.source_cues, 268);
  assert.equal(naturalV8.status, 'completed_with_failure');
  assert.deepEqual(naturalV8.arms.map(arm => arm.covered_prefix_cues), [216, 140]);
  assert(naturalV8.arms.every(arm => arm.published_results === 0
    && arm.output_sha256 === null));
  assert.equal(naturalV8.human_bilingual_review_count, 0);
  assert.deepEqual(resumeV8.arms.map(arm => arm.total_cues), [244, 140]);
  assert.deepEqual(singleV8.arms.map(arm => arm.covered_prefix_cues), [79, 268]);
  assert.equal(singleV8.arms[1].published_results, 1);
  assert.equal(singleV8.arms[0].published_results, 0);
  assert.equal(riskV8.selected_cues, 43);
  assert.equal(riskV8.ai_review.high_confidence_semantic_issue_ids.length, 6);
  assert.equal(riskV8.human_bilingual_review_count, 0);
  assert.equal(controlV1.status, 'invalid_harness_target_fields_disagree');
  assert.equal(controlV1.arms.reduce((total, arm) =>
    total + arm.target_field_mismatches, 0), 24);
  assert.equal(controlV2.paired_case_comparison_valid, true);
  assert.equal(controlV2.population_quality_comparison_valid, false);
  assert.deepEqual(controlV2.arms.map(arm => arm.chats), [12, 12]);
  assert.deepEqual(controlV2.arms.map(arm => arm.preflights), [24, 24]);
  assert.equal(controlV2.arms[1].controls.filter(row => row.leaked_json_syntax).length, 1);
  assert.equal(controlV2.human_bilingual_review_count, 0);
  assert.equal(instruction.status,
    'paired_real_model_prompt_screen_validated_unreviewed_meaning');
  assert.equal(instruction.chats, 36);
  assert.equal(instruction.preflights, 72);
  assert.equal(instruction.rows.length, 36);
  assert.equal(instruction.human_bilingual_review_count, 0);
  assert.equal(provisionalTerms.chats, 20);
  assert.equal(provisionalTerms.preflights, 40);
  assert.equal(provisionalTerms.human_bilingual_review_count, 0);
  assert.equal(provisionalTerms.rows.length, 20);
  assert.equal(createHash('sha256').update(provisionalTermsRaw).digest('hex'),
    '300bc148566f8e7d7cd813863feb7c4b7de2a62311d72b8851aeb43ae0c72ba6');
  for (const variant of ['baseline', 'instruction']) {
    assert(instruction.rows.find(row => row.id === 'multicore_positive' &&
      row.variant === variant).candidate.includes('многопоточную'));
    assert.equal(instruction.rows.find(row => row.id === 'mouse_pad_positive' &&
      row.variant === variant).candidate, 'Мы также продаём подставки для мышей.');
  }
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
  const batch = JSON.parse(batchRaw);
  assert.equal(batch.attempts.length, 3);
  assert.equal(batch.attempts[1].first_cue_outcome,
    'validated_batch_but_wrong_context_money_meaning');
  assert.equal(batch.attempts[2].first_cue_outcome,
    'invalid_candidate_currency_absent_from_target');
  assert.equal(batch.attempts[2].saved_blocks, 0);
  assert.equal(batch.paired_batch_1_vs_4_completed, false);
  const small = comparison.arms[0];
  const large = retry.second;
  assert.equal(small.model, '1.8B Q4_K_M');
  assert.equal(small.status, 'complete_unreviewed');
  assert.equal(small.checkpoints, comparison.source_cues);
  assert.equal(large.source_sha256, comparison.source_sha256);
  assert.equal(large.checkpoints, comparison.source_cues);
  assert.equal(audio.summary.source_srt_sha256, comparison.source_sha256);
  assert.equal(audio.summary.candidate_ru_srt_sha256, large.output_sha256);
  assert.equal(sources.source_count, 12);
  assert.equal(sources.media_groups, 11);
  assert.equal(sources.inspected_cues, 3280);
  assert.equal(sources.lesson_cues, 37);
  assert.equal(sources.lesson_media_duration_ms, 239000);
  assert.equal(sources.eligible_cues, 0);
  assert.equal(captionOverlap.source_count, sources.source_count);
  assert.equal(captionOverlap.media_group_count, sources.media_groups);
  assert.equal(captionOverlap.compared_pairs, 65);
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
  const targetTerms = await loadTargetTerms(root);
  const occurrenceTerms = await loadOccurrenceTerms(root);
  const nameRegistry = await loadNameRegistry(root);
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
  return {
    name_registry:nameRegistry.summary,
    target_terms:targetTerms.summary,
    occurrence_terms:occurrenceTerms.summary,
    schema_version: 1,
    as_of: '2026-10-09',
    release_decision: 'not_accepted',
    sources: { candidates: sources.source_count, media_groups: sources.media_groups,
      inspected_cues: sources.inspected_cues,
      eligible_cues: sources.eligible_cues },
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
    lesson_source: { cues: sources.lesson_cues,
      caption_sha256: sources.lesson_sha256,
      media_duration_ms: sources.lesson_media_duration_ms,
      strict_derivative: true, human_alignment_review: false },
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
    batch_v7: { source_sha256: batch.source_sha256,
      attempt_count: batch.attempts.length,
      first_model_cue_wrong_accepted: true,
      corrected_guard_saved_blocks: batch.attempts[2].saved_blocks,
      corrected_guard_published_results: batch.attempts[2].published_results,
      paired_batch_1_vs_4_completed: batch.paired_batch_1_vs_4_completed,
      human_review_count: batch.human_review_count,
      report_sha256: createHash('sha256').update(batchRaw).digest('hex') },
    context_salience: { pairs: salience.pairs.length,
      context_on_wrong: salience.pairs.filter(pair =>
        pair.context_on.source_aware_ai_classification === 'wrong_neighbor_ticket_content').length,
      context_off_target_sense: salience.pairs.filter(pair =>
        pair.context_off.source_aware_ai_classification === 'target_sense_present_russian_grammar_rough').length,
      human_review_count: salience.attempts[1].human_review_count,
      source_split: salience.source_split,
      report_sha256: createHash('sha256').update(salienceRaw).digest('hex') },
    target_first: { cases: 3, paired_seeds: 2,
      chats: order.chat_requests,
      known_leak_baseline_wrong: order.rows.filter(row => row.case_id === 'known_money_leak'
        && row.order === 'baseline'
        && row.source_aware_ai_classification === 'wrong_neighbor_money_content').length,
      known_leak_target_first_sense: order.rows.filter(row => row.case_id === 'known_money_leak'
        && row.order === 'target_first'
        && row.source_aware_ai_classification === 'target_sense_rough_russian').length,
      human_review_count: order.human_review_count,
      report_sha256: createHash('sha256').update(orderRaw).digest('hex') },
    batch_v8: { arms: v8.arms.map(arm => ({ size: arm.size,
      chat_requests: arm.chat_requests, prompt_tokens: arm.prompt_tokens,
      completion_tokens: arm.completion_tokens, cli_elapsed_ms_rounded: arm.cli_elapsed_ms_rounded,
      checkpoints: arm.checkpoints, result_review_state: arm.review_state })),
      source_sha256: v8.source_sha256, human_review_count: v8.human_bilingual_review_count,
      accepted_language_quality: v8.accepted_language_quality,
      report_sha256: createHash('sha256').update(v8Raw).digest('hex') },
    name_controls: { chats: names.chat_requests,
      preflights: names.template_token_preflight_calls,
      context_on_prompt_tokens: names.context_on_totals.prompt_tokens,
      context_off_prompt_tokens: names.context_off_totals.prompt_tokens,
      payment_intrusions: names.rows.filter(row => row.case_id === 'other_xiao_name_question'
        && row.context === 'on' && row.raw_candidate.startsWith('Заплатил ли')).length,
      human_review_count: names.human_bilingual_review_count,
      report_sha256: createHash('sha256').update(nameRaw).digest('hex') },
    cross_model: { paired_chats: cross.paired_chats,
      small_prompt_tokens: cross.small_totals.prompt_tokens,
      large_prompt_tokens: cross.large_totals.prompt_tokens,
      small_completion_tokens: cross.small_totals.completion_tokens,
      large_completion_tokens: cross.large_totals.completion_tokens,
      small_chat_http_ms: cross.small_totals.chat_http_ms,
      large_chat_http_ms: cross.large_totals.chat_http_ms,
      large_gpu_device_max_observed_mib: cross.large_resource_observation.gpu_device_max_observed_mib,
      human_review_count: cross.human_bilingual_review_count,
      report_sha256: createHash('sha256').update(crossRaw).digest('hex') },
    large_v8_cli: { chats: largeV8.chat_requests,
      checkpoints: largeV8.checkpoints,
      results: largeV8.results,
      review_state: largeV8.review_state,
      prompt_tokens: largeV8.prompt_tokens,
      completion_tokens: largeV8.completion_tokens,
      cli_elapsed_ms_rounded: largeV8.cli_elapsed_ms_rounded,
      output_sha256: largeV8.output_sha256,
      human_review_count: largeV8.human_bilingual_review_count,
      accepted_language_quality: largeV8.accepted_language_quality,
      report_sha256: createHash('sha256').update(largeV8Raw).digest('hex') },
    natural_v8: { source_cues: naturalV8.source_cues,
      status: naturalV8.status,
      arms: naturalV8.arms.map(arm => ({ id: arm.id,
        chats: arm.chat_requests, preflights: arm.template_token_preflight_calls,
        checkpoints: arm.validated_checkpoints,
        covered_prefix_cues: arm.covered_prefix_cues,
        first_failed_target_id: arm.first_failed_target_id,
        published_results: arm.published_results,
        prompt_tokens: arm.prompt_tokens,
        completion_tokens: arm.completion_tokens,
        cli_elapsed_ms: arm.cli_elapsed_ms })),
      human_review_count: naturalV8.human_bilingual_review_count,
      accepted_language_quality: naturalV8.accepted_language_quality,
      report_sha256: createHash('sha256').update(naturalV8Raw).digest('hex') },
    resume_v8: { arms: resumeV8.arms.map(arm => ({ id: arm.id,
      total_cues: arm.total_cues, new_chat_requests: arm.new_chat_requests,
      total_checkpoints: arm.total_checkpoints, result_count: arm.result_count })),
      report_sha256: createHash('sha256').update(resumeV8Raw).digest('hex') },
    single_v8: { source_cues: singleV8.source_cues,
      arms: singleV8.arms.map(arm => ({ id: arm.id, status: arm.status,
        covered_prefix_cues: arm.covered_prefix_cues,
        chat_requests: arm.chat_requests,
        prompt_tokens: arm.prompt_tokens,
        completion_tokens: arm.completion_tokens,
        cli_elapsed_ms: arm.cli_elapsed_ms,
        published_results: arm.published_results,
        output_sha256: arm.output_sha256 })),
      human_review_count: singleV8.human_bilingual_review_count,
      accepted_language_quality: singleV8.accepted_language_quality,
      report_sha256: createHash('sha256').update(singleV8Raw).digest('hex') },
    risk_v8: { selected_cues: riskV8.selected_cues,
      semantic_issue_count: riskV8.ai_review.high_confidence_semantic_issue_ids.length,
      language_issue_count: riskV8.ai_review.russian_language_issue_ids.length,
      machine_warning_count: riskV8.machine_warnings.total,
      human_review_count: riskV8.human_bilingual_review_count,
      report_sha256: createHash('sha256').update(riskV8Raw).digest('hex') },
    reg058_controls: { invalid_v1_target_fields: controlV1.arms.reduce(
      (total, arm) => total + arm.target_field_mismatches, 0),
    chats: controlV2.arms.map(arm => arm.chats),
    preflights: controlV2.arms.map(arm => arm.preflights),
    leaked_json_7b: controlV2.arms[1].controls.filter(row => row.leaked_json_syntax).length,
    human_review_count: controlV2.human_bilingual_review_count,
    invalid_report_sha256: createHash('sha256').update(controlV1Raw).digest('hex'),
    corrected_report_sha256: createHash('sha256').update(controlV2Raw).digest('hex') },
    semantic_instruction: { chats: instruction.chats,
      preflights: instruction.preflights,
      structurally_accepted: instruction.rows.filter(row =>
        row.structural_outcome === 'accepted_structure_unreviewed_meaning').length,
      baseline_prompt_tokens: instruction.rows.filter(row => row.variant === 'baseline')
        .reduce((sum, row) => sum + row.prompt_tokens, 0),
      instruction_prompt_tokens: instruction.rows.filter(row =>
        row.variant === 'instruction').reduce((sum, row) => sum + row.prompt_tokens, 0),
      required_semantic_repairs_passed: false,
      failed_launch_retained: Boolean(instruction.failed_launch_report_sha256),
      human_review_count: instruction.human_bilingual_review_count,
      report_sha256: createHash('sha256').update(instructionRaw).digest('hex') },
    provisional_terms: { chats: provisionalTerms.chats,
      preflights: provisionalTerms.preflights,
      structurally_accepted: provisionalTerms.rows.filter(row =>
        row.structural_outcome === 'accepted_structure_unreviewed_meaning').length,
      baseline_prompt_tokens: provisionalTerms.rows.filter(row =>
        row.variant === 'baseline').reduce((sum, row) => sum + row.prompt_tokens, 0),
      terms_prompt_tokens: provisionalTerms.rows.filter(row =>
        row.variant === 'terms').reduce((sum, row) => sum + row.prompt_tokens, 0),
      known_positive_repaired: 2,
      known_negative_contaminated: 2,
      human_review_count: provisionalTerms.human_bilingual_review_count,
      report_sha256: createHash('sha256').update(provisionalTermsRaw).digest('hex') },
    backlog: { total_tasks: plan.total_tasks, counts: plan.counts },
  };
}
