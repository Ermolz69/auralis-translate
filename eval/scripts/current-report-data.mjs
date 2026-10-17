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

import { loadVivoAudioEvidence, projectVivoAudioEvidence } from './vivo-audio-report.mjs';
import { loadYoutubeSourceEvidence, projectYoutubeSourceEvidence } from './youtube-source-report.mjs';
import { loadSourceRelationEvidence, projectSourceRelationEvidence } from './source-relation-report.mjs';
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
  const youtubeSourceEvidence = await loadYoutubeSourceEvidence(root);
  const { vivoSource } = youtubeSourceEvidence;
  const vivoV8Raw = await fs.readFile(path.join(root,
    'eval/reports/2026-10-09-v8-vivo-original-long.json'), 'utf8');
  assert.equal(createHash('sha256').update(vivoV8Raw).digest('hex'),
    'd83a4f518065cacd3de54d2de3716d5a488b4aa23e0c96a4bc31053f8c2ab089');
  const vivoV8 = JSON.parse(vivoV8Raw);
  assert.equal(vivoV8.source_sha256, vivoSource.original_srt_sha256);
  assert.deepEqual(vivoV8.arms.map(arm => arm.id), ['1_8b', '7b']);
  assert.equal(vivoV8.arms[0].covered_prefix_cues, 112);
  assert.equal(vivoV8.arms[0].published_results, 0);
  assert.equal(vivoV8.arms[1].covered_prefix_cues, 467);
  assert.equal(vivoV8.arms[1].review_state, 'needs_review');
  assert.equal(vivoV8.offline_export.output_sha256, vivoV8.arms[1].output_sha256);
  assert.equal(vivoV8.human_bilingual_reviews, 0);
  assert.equal(vivoV8.accepted_language_quality, false);
  const vivoRecoveryRaw = await fs.readFile(path.join(root,
    'eval/reports/2026-10-09-reg065-vivo-copy-recovery.json'), 'utf8');
  assert.equal(createHash('sha256').update(vivoRecoveryRaw).digest('hex'),
    '1b8c1f0d7761386aef4a5039af94e3092eacbc86bcc30fdb0bfe02eca63b69cd');
  const vivoRecovery = JSON.parse(vivoRecoveryRaw);
  assert.equal(vivoRecovery.source_sha256, vivoV8.source_sha256);
  assert.equal(vivoRecovery.original_report_sha256, vivoV8.private_report_sha256);
  assert.equal(vivoRecovery.status, 'completed');
  assert.equal(vivoRecovery.total_checkpoints, 117);
  assert.equal(vivoRecovery.review_state, 'needs_review');
  assert.equal(vivoRecovery.human_bilingual_reviews, 0);
  assert.equal(vivoRecovery.accepted_language_quality, false);
  const reg066Raw = await fs.readFile(path.join(root,
    'eval/reports/2026-10-09-reg066-authored-v8-screen.json'), 'utf8');
  assert.equal(createHash('sha256').update(reg066Raw).digest('hex'),
    'ac02b59ed3da899c6f253c21ee00106fa6c615615457487a41916ddbf489154d');
  const reg066 = JSON.parse(reg066Raw);
  const reg066ReviewRaw = await fs.readFile(path.join(root,
    'eval/reports/2026-10-09-reg066-authored-v8-screen-ai-review.json'), 'utf8');
  assert.equal(createHash('sha256').update(reg066ReviewRaw).digest('hex'),
    '99df8aaa4cb7f967d3d07e1a764182fbd5d305b302b152f8b8371f0a29e50c40');
  const reg066Review = JSON.parse(reg066ReviewRaw);
  assert.equal(reg066.chat_requests, 20);
  assert.equal(reg066.template_token_preflights, 40);
  assert.equal(reg066Review.machine_report_sha256,
    createHash('sha256').update(reg066Raw).digest('hex'));
  assert.equal(reg066Review.summary['1_8b'].fact_preserved, 8);
  assert.equal(reg066Review.summary['7b'].fact_preserved, 8);
  assert.equal(reg066Review.summary.human_bilingual_reviews, 0);
  assert.equal(reg066Review.summary.natural_file_errors_resolved, false);
  const seamsRaw = await fs.readFile(path.join(root,
    'eval/reports/2026-10-09-reg066-natural-seams.json'), 'utf8');
  assert.equal(createHash('sha256').update(seamsRaw).digest('hex'),
    '91399791c61f9daa8fc3f6e1adc9457871f86a7ea5641179524209b7f3dbb6ef');
  const seams = JSON.parse(seamsRaw);
  const seamsReviewRaw = await fs.readFile(path.join(root,
    'eval/reports/2026-10-09-reg066-natural-seams-ai-review.json'), 'utf8');
  assert.equal(createHash('sha256').update(seamsReviewRaw).digest('hex'),
    '970eeb289978bf498eea2cbe72c64f9bc600cd3bb340028a21bf182cea8c25a5');
  const seamsReview = JSON.parse(seamsReviewRaw);
  assert.equal(seamsReview.machine_report_sha256,
    createHash('sha256').update(seamsRaw).digest('hex'));
  assert.equal(seams.chat_requests, 30);
  assert.equal(seams.template_token_preflights, 60);
  assert.equal(seams.structurally_valid, 28);
  assert.equal(seams.structurally_invalid, 2);
  assert.equal(seamsReview.summary.observed_7b_time_repairs, 1);
  assert.equal(seamsReview.summary.new_mixed_script_observations, 1);
  assert.equal(seamsReview.summary.new_tail_id_omissions, 2);
  assert.equal(seamsReview.summary.shifted_candidate_promoted, false);
  const sourceRelationEvidence = await loadSourceRelationEvidence(root,
    vivoSource.original_srt_sha256, vivoV8.arms[1].output_sha256);
  const postEditRaw = await fs.readFile(path.join(root,
    'eval/reports/2026-10-10-vivo-scene-post-edit-v1.json'), 'utf8');
  assert.equal(createHash('sha256').update(postEditRaw).digest('hex'),
    'ea135459148721da5819e616a0a691af0c9ffe6f1fd9d6a683636ec1b3069e51');
  const postEdit = JSON.parse(postEditRaw);
  assert.equal(postEdit.chats, 10);
  assert.equal(postEdit.preflights, 20);
  assert.equal(postEdit.ai_triage.known_primary_relations_confirmed_repaired, 0);
  assert.equal(postEdit.ai_triage.new_major_errors, 1);
  assert.equal(postEdit.product_profile_changed, false);
  const catalogV51Raw = await fs.readFile(path.join(root,
    'eval/regressions/catalog-v51.json'), 'utf8');
  assert.equal(createHash('sha256').update(catalogV51Raw).digest('hex'),
    '9e8c9990164e0ebe49bd639704df792bf47d9daef1a1989e8a7e2ee299ea2004');
  assert.equal(JSON.parse(catalogV51Raw).entries.at(-1).id, 'REG-072');
  const blindspotRaw = await fs.readFile(path.join(root,
    'eval/reports/2026-10-10-vivo-stratified-blindspot-v1.json'), 'utf8');
  assert.equal(createHash('sha256').update(blindspotRaw).digest('hex'),
    '94ed2dce1bf48b4eef4b71fa34c12cbd50ad60834599dcdfba6741e02ec4b396');
  const blindspot = JSON.parse(blindspotRaw);
  const blindspotReviewRaw = await fs.readFile(path.join(root,
    'eval/reports/2026-10-10-vivo-stratified-blindspot-v1-ai-review.json'), 'utf8');
  assert.equal(createHash('sha256').update(blindspotReviewRaw).digest('hex'),
    '2c8e7bc4088b9e0d584173b605a2f352154f868e5c3b49f43988684f278eb77e');
  const blindspotReview = JSON.parse(blindspotReviewRaw);
  const catalogV52Raw = await fs.readFile(path.join(root,
    'eval/regressions/catalog-v52.json'), 'utf8');
  assert.equal(JSON.parse(catalogV52Raw).entries.at(-1).id, 'REG-073');
  assert.equal(blindspot.selected_windows, 15);
  assert.equal(blindspot.source_target_pairs, 90);
  assert.equal(blindspotReview.summary.clear_major_windows_ai_only, 6);
  assert.equal(blindspotReview.summary.human_bilingual_reviews, 0);
  const quantityV1Raw = await fs.readFile(path.join(root,
    'eval/reports/2026-10-10-vivo-source-quantity-feature-v1.json'), 'utf8');
  assert.equal(createHash('sha256').update(quantityV1Raw).digest('hex'),
    'f13d6efcd08e0a166055551050d110a2b8b81c9f42e62b12d210a764477d64ec');
  const quantityV1 = JSON.parse(quantityV1Raw);
  const quantityV2Raw = await fs.readFile(path.join(root,
    'eval/reports/2026-10-10-vivo-source-quantity-feature-v2.json'), 'utf8');
  assert.equal(createHash('sha256').update(quantityV2Raw).digest('hex'),
    '4fa3ca708ddce06e63f496610669930050ab09440ae8296318b70b2b7bfa51ad');
  const quantityV2 = JSON.parse(quantityV2Raw);
  const catalogV53Raw = await fs.readFile(path.join(root,
    'eval/regressions/catalog-v53.json'), 'utf8');
  assert.equal(createHash('sha256').update(catalogV53Raw).digest('hex'),
    '4bfc790f8f4bef116381631f8d95316e62bcc5d5d50ae36e6abf2475ce192378');
  assert.equal(JSON.parse(catalogV53Raw).entries.at(-1).id, 'REG-074');
  assert.equal(quantityV2.v1_report_sha256,
    createHash('sha256').update(quantityV1Raw).digest('hex'));
  assert.deepEqual(quantityV2.removed_ids, [85, 236, 283, 306, 415]);
  assert.deepEqual(quantityV2.added_ids, []);
  const sensesRaw = await fs.readFile(path.join(root,
    'eval/reports/2026-10-10-vivo-technical-senses-v2.json'), 'utf8');
  assert.equal(createHash('sha256').update(sensesRaw).digest('hex'),
    '2c962bb859e2ffa585853e13370d0eda8bdc597d7ae02d952201fc68df003043');
  const senses = JSON.parse(sensesRaw);
  const sensesReviewRaw = await fs.readFile(path.join(root,
    'eval/reports/2026-10-10-vivo-technical-senses-v2-ai-review.json'), 'utf8');
  assert.equal(createHash('sha256').update(sensesReviewRaw).digest('hex'),
    'c7a1afdc0ae7bb0e0529c10c0a5b4f582b41e96baf9ab5dba2fffbf7e1d2de7d');
  const sensesReview = JSON.parse(sensesReviewRaw);
  const catalogV54Raw = await fs.readFile(path.join(root,
    'eval/regressions/catalog-v54.json'), 'utf8');
  assert.equal(createHash('sha256').update(catalogV54Raw).digest('hex'),
    '28198d3f355607718673b45d3f0fbfc5a43dfe7ae86f571289a2a796b7f394dc');
  assert.equal(JSON.parse(catalogV54Raw).entries.at(-1).id, 'REG-076');
  assert.equal(senses.chats, 28);
  assert.equal(sensesReview.summary.candidate_shortlisted, false);
  assert.equal(sensesReview.summary.human_bilingual_reviews, 0);
  const reg076V3Raw = await fs.readFile(path.join(root,
    'eval/reports/2026-10-10-reg076-v3.json'), 'utf8');
  assert.equal(createHash('sha256').update(reg076V3Raw).digest('hex'),
    'f16cea2e2840d87e3f1230ae9cf85e2fd80901fc3e6bb90df738ce75bc63cecb');
  const reg076V3 = JSON.parse(reg076V3Raw);
  const reg076V3ReviewRaw = await fs.readFile(path.join(root,
    'eval/reports/2026-10-10-reg076-v3-ai-review.json'), 'utf8');
  assert.equal(createHash('sha256').update(reg076V3ReviewRaw).digest('hex'),
    '313760eb3c19d82bf6d4f23c8b95c115e1b3805b0623d1667d837537a642434e');
  const reg076V3Review = JSON.parse(reg076V3ReviewRaw);
  const catalogV55Raw = await fs.readFile(path.join(root,
    'eval/regressions/catalog-v55.json'), 'utf8');
  assert.equal(createHash('sha256').update(catalogV55Raw).digest('hex'),
    '0263e59b32325215e705a3fcc4e96625f809a5be1df45c16c972f1e21555b342');
  assert.equal(JSON.parse(catalogV55Raw).entries.at(-1).id, 'REG-078');
  assert.equal(reg076V3.chats, 120);
  assert.equal(reg076V3Review.summary.candidate_shortlisted, false);
  assert.equal(reg076V3Review.summary.human_bilingual_reviews, 0);
  const reg077V4Raw = await fs.readFile(path.join(root,
    'eval/reports/2026-10-10-reg077-v4.json'), 'utf8');
  assert.equal(createHash('sha256').update(reg077V4Raw).digest('hex'),
    '1cd09c57dcad44e7eadcc1357faaa6cb1d901a620a129fdc845ed6bb6e17e8ae');
  const reg077V4 = JSON.parse(reg077V4Raw);
  const reg077V4ReviewRaw = await fs.readFile(path.join(root,
    'eval/reports/2026-10-10-reg077-v4-ai-review.json'), 'utf8');
  assert.equal(createHash('sha256').update(reg077V4ReviewRaw).digest('hex'),
    '299ef270b466f79f66e3a720c006026e28c4ff8679e08a7ed978d087cb09206d');
  const reg077V4Review = JSON.parse(reg077V4ReviewRaw);
  const catalogV56Raw = await fs.readFile(path.join(root,
    'eval/regressions/catalog-v56.json'), 'utf8');
  assert.equal(createHash('sha256').update(catalogV56Raw).digest('hex'),
    'a5273bd232c9d327a37d0c5a1d18cdf976fcc02c46afb0aa9c6f9e9ef4cd0245');
  assert.equal(JSON.parse(catalogV56Raw).entries.at(-1).id, 'REG-080');
  assert.equal(reg077V4.chats, 192);
  assert.equal(reg077V4Review.summary.candidate_shortlisted, false);
  assert.equal(reg077V4Review.summary.human_bilingual_reviews, 0);
  const chipCoreWarningRaw = await fs.readFile(path.join(root,
    'eval/reports/2026-10-10-chip-core-warning-v1.json'), 'utf8');
  assert.equal(createHash('sha256').update(chipCoreWarningRaw).digest('hex'),
    '35e174e18982cf05a24769e1a42fb7b233f4f2e623ba47e1af68e8891a4a27aa');
  const chipCoreWarning = JSON.parse(chipCoreWarningRaw);
  assert.equal(chipCoreWarning.summary.selected_reply_cells, 192);
  assert.equal(chipCoreWarning.summary.complete_draft_pairs, 1728);
  assert.equal(chipCoreWarning.summary.semantic_known_error_hits, 13);
  assert.equal(chipCoreWarning.summary.grammar_known_error_hits, 18);
  assert.equal(chipCoreWarning.summary.product_rule_admitted, false);
  assert(chipCoreWarning.source_groups.every(group =>
    group.source_trigger_cue_ids.length === 0 &&
    group.drafts.every(draft => draft.warning_count === 0)));
  const qwenRaw = await fs.readFile(path.join(root,
    'eval/reports/2026-10-10-qwen3-8b-local-screen-v1.json'), 'utf8');
  assert.equal(createHash('sha256').update(qwenRaw).digest('hex'),
    'b7928d632474da5e7da2c9272aacc050c444dd4bf17343141df871dce93889c5');
  const qwen = JSON.parse(qwenRaw);
  const qwenReviewRaw = await fs.readFile(path.join(root,
    'eval/reports/2026-10-10-qwen3-8b-local-screen-ai-review.json'), 'utf8');
  assert.equal(createHash('sha256').update(qwenReviewRaw).digest('hex'),
    '392092dfdfa2f19d8b4fa2c56b3a960c604453e3f2000bd3db4be82410094b84');
  const qwenReview = JSON.parse(qwenReviewRaw);
  const catalogV57Raw = await fs.readFile(path.join(root,
    'eval/regressions/catalog-v57.json'), 'utf8');
  assert.equal(createHash('sha256').update(catalogV57Raw).digest('hex'),
    '8ec4426556630e447a78c151c5619556f6701acd635ae7ee0a7d6f6ba4add146');
  assert.equal(JSON.parse(catalogV57Raw).entries.at(-1).id, 'REG-082');
  assert.equal(qwen.request_count, 36);
  assert.equal(qwen.failure_count, 0);
  assert.equal(qwenReview.machine_report_sha256,
    createHash('sha256').update(qwenRaw).digest('hex'));
  assert.equal(qwenReview.decision,
    'reject_candidate_before_cross_source_or_full_file');
  assert.equal(qwenReview.human_bilingual_reviews, 0);
  const asusRelationsRaw = await fs.readFile(path.join(root,
    'eval/reports/2026-10-10-asus-source-relations-v3.json'), 'utf8');
  assert.equal(createHash('sha256').update(asusRelationsRaw).digest('hex'),
    '8d3eb1020f660fb3c72aa4cc369cc8ca57b394e2089f63e3d7715686f4db8468');
  const asusRelations = JSON.parse(asusRelationsRaw);
  const asusRelationsReviewRaw = await fs.readFile(path.join(root,
    'eval/reports/2026-10-10-asus-source-relations-v3-ai-review.json'), 'utf8');
  assert.equal(createHash('sha256').update(asusRelationsReviewRaw).digest('hex'),
    '4855a22304ee3caf88e62c6e26ba38034c440daadcc1455589db5d2259f3dead');
  const asusRelationsReview = JSON.parse(asusRelationsReviewRaw);
  const catalogV58Raw = await fs.readFile(path.join(root,
    'eval/regressions/catalog-v58.json'), 'utf8');
  assert.equal(createHash('sha256').update(catalogV58Raw).digest('hex'),
    '5a0e1f9fcbfb194e37e1ed65620a1b33ecf268cae47dfa5b42e7cce36f31cfed');
  assert.equal(JSON.parse(catalogV58Raw).entries.at(-1).id, 'REG-083');
  assert.equal(asusRelations.observations.source_cues, 268);
  assert.equal(asusRelations.observations.recognized_new_fact_count, 3);
  assert.equal(asusRelations.observations.warning_count, 0);
  assert.equal(asusRelationsReview.machine_report_sha256,
    createHash('sha256').update(asusRelationsRaw).digest('hex'));
  assert.equal(asusRelationsReview.cases[0].ai_judgment,
    'major_technical_term_substitution');
  assert.equal(asusRelationsReview.human_bilingual_reviews, 0);
  const asusHallV4Raw = await fs.readFile(path.join(root,
    'eval/reports/2026-10-10-reg083-hall-v4.json'), 'utf8');
  assert.equal(createHash('sha256').update(asusHallV4Raw).digest('hex'),
    '73fcf6706d96f7284a69598585973fa3cd0676c8ee70869609e65aefc707ddea');
  const asusHallV4 = JSON.parse(asusHallV4Raw);
  const asusHallV4ReviewRaw = await fs.readFile(path.join(root,
    'eval/reports/2026-10-10-reg083-hall-v4-ai-review.json'), 'utf8');
  assert.equal(createHash('sha256').update(asusHallV4ReviewRaw).digest('hex'),
    '0b61204bf1c7a35e78b16f3383f93602e7084ebe78d0233b7534c24a25a797ef');
  const asusHallV4Review = JSON.parse(asusHallV4ReviewRaw);
  assert.equal(asusHallV4.observations.source_cues, 268);
  assert.deepEqual(asusHallV4.observations.source_trigger_ids, [24]);
  assert.equal(asusHallV4.observations.v3_warning_count, 0);
  assert.equal(asusHallV4.observations.v4_new_warning_count, 1);
  assert.equal(asusHallV4.observations.known_reg083_warning, true);
  assert.equal(asusHallV4.observations.product_rule_admitted, false);
  assert.equal(asusHallV4Review.machine_report_sha256,
    createHash('sha256').update(asusHallV4Raw).digest('hex'));
  assert.deepEqual(asusHallV4Review.warning_ids_reviewed, [24]);
  assert.equal(asusHallV4Review.human_bilingual_reviews, 0);
  const catalogV59Raw = await fs.readFile(path.join(root,
    'eval/regressions/catalog-v59.json'), 'utf8');
  assert.equal(createHash('sha256').update(catalogV59Raw).digest('hex'),
    '7ae83cb5ea69ee812bacce9914d452e7faea4dce034a82ba29ecaf6f346b7ad7');
  const catalogV59 = JSON.parse(catalogV59Raw);
  assert.equal(catalogV59.schema_version, 59);
  assert.equal(catalogV59.entries.at(-1).id, 'REG-083');
  assert.equal(catalogV59.entries.at(-1).product_rule_admitted, false);
  const catalogV60Raw = await fs.readFile(path.join(root,
    'eval/regressions/catalog-v60.json'), 'utf8');
  assert.equal(createHash('sha256').update(catalogV60Raw).digest('hex'),
    'e64b5aef5624e2e8079092e38200c13f5cf7c40e0f9ae3bc352711a9a006f48e');
  assert.equal(JSON.parse(catalogV60Raw).entries.at(-1).id, 'REG-084');
  const vivoAudioEvidence = await loadVivoAudioEvidence(root,
    vivoSource.original_srt_sha256, vivoSource.cue_count, vivoV8.arms[1].output_sha256);
  const officialReferenceRaw = await fs.readFile(path.join(root,
    'eval/reports/2026-10-10-official-reference-v2.json'), 'utf8');
  assert.equal(createHash('sha256').update(officialReferenceRaw).digest('hex'),
    '3ae81fcf37ed49579c7c47be4f2184b9d355547e108b6b88295d12ec71f83859');
  const officialReference = JSON.parse(officialReferenceRaw);
  assert.equal(officialReference.source_cases, 6);
  assert.equal(officialReference.complete_answers, 6);
  assert.equal(officialReference.human_model_output_reviews, 0);
  assert.equal(officialReference.previous_policy_answer_byte_identical, true);
  const temporalControlsRaw = await fs.readFile(path.join(root,
    'eval/reports/2026-10-10-reg085-temporal-controls-v1.json'), 'utf8');
  assert.equal(createHash('sha256').update(temporalControlsRaw).digest('hex'),
    'f3b72032716dee53dd72bb5212168efa5157551797f6cd1585243e1a42c65728');
  const temporalControls = JSON.parse(temporalControlsRaw);
  const temporalReviewRaw = await fs.readFile(path.join(root,
    'eval/reports/2026-10-10-reg085-temporal-controls-v1-ai-review.json'), 'utf8');
  assert.equal(createHash('sha256').update(temporalReviewRaw).digest('hex'),
    '2cefc5d00a73a215cb11c0d517377d4f74bf77274bfa0007f2501cadaf76099e');
  const temporalReview = JSON.parse(temporalReviewRaw);
  assert.equal(temporalControls.complete_answers, 6);
  assert.equal(temporalReview.clear_temporal_matches_ai_only, 5);
  assert.equal(temporalReview.uncertain_cases, 1);
  assert.equal(temporalReview.human_reviews_of_model_output, 0);
  return {
    name_registry:nameRegistry.summary,
    target_terms:targetTerms.summary,
    occurrence_terms:occurrenceTerms.summary,
    schema_version: 1,
    as_of: '2026-10-10',
    release_decision: 'not_accepted',
    official_reference: {
      source_cases: officialReference.source_cases,
      complete_answers: officialReference.complete_answers,
      preflights: officialReference.preflights,
      reported_total_tokens: officialReference.reported_total_tokens,
      wall_ms: officialReference.wall_ms,
      human_model_output_reviews: officialReference.human_model_output_reviews,
      previous_policy_answer_byte_identical:
        officialReference.previous_policy_answer_byte_identical,
      report_sha256: createHash('sha256').update(officialReferenceRaw).digest('hex') },
    temporal_controls: {
      complete_answers: temporalControls.complete_answers,
      preflights: temporalControls.preflights,
      reported_total_tokens: temporalControls.reported_total_tokens,
      wall_ms: temporalControls.wall_ms,
      clear_temporal_matches_ai_only:
        temporalReview.clear_temporal_matches_ai_only,
      uncertain_cases: temporalReview.uncertain_cases,
      human_model_output_reviews:
        temporalReview.human_reviews_of_model_output,
      report_sha256: createHash('sha256').update(temporalControlsRaw).digest('hex') },
    sources: { candidates: sources.source_count, media_groups: sources.media_groups,
      inspected_cues: sources.inspected_cues,
      eligible_cues: sources.eligible_cues },
    ...projectYoutubeSourceEvidence(youtubeSourceEvidence),
    ...projectVivoAudioEvidence(vivoAudioEvidence),
    ...projectSourceRelationEvidence(sourceRelationEvidence),
    vivo_technical_senses: { chats: senses.chats,
      preflights: senses.preflights,
      total_tokens: senses.total_tokens,
      wall_elapsed_ms: senses.wall_elapsed_ms,
      natural_repairs: sensesReview.summary.natural_technical_fact_repairs,
      natural_cases: sensesReview.summary.natural_technical_fact_cases,
      related_positive_facts:
        sensesReview.summary.related_positive_fact_preserved_candidate,
      negative_facts:
        sensesReview.summary.negative_and_absence_fact_preserved_candidate,
      negative_cases: sensesReview.summary.negative_and_absence_cases,
      shared_major_control_errors:
        sensesReview.summary.shared_major_control_errors,
      candidate_shortlisted: sensesReview.summary.candidate_shortlisted,
      human_bilingual_reviews: sensesReview.summary.human_bilingual_reviews,
      machine_report_sha256: createHash('sha256').update(sensesRaw).digest('hex'),
      ai_review_sha256: createHash('sha256').update(sensesReviewRaw).digest('hex'),
      catalog_sha256: createHash('sha256').update(catalogV54Raw).digest('hex') },
    reg076_v3: { chats: reg076V3.chats,
      preflights: reg076V3.preflights,
      total_tokens: reg076V3.total_tokens,
      wall_elapsed_ms: reg076V3.wall_elapsed_ms,
      identical_candidate_requests: reg076V3.rows.filter(row =>
        row.arm === 'candidate' && row.baseline_identical).length,
      baseline_major_fact_errors: reg076V3Review.summary.baseline_major_fact_errors,
      candidate_major_fact_errors: reg076V3Review.summary.candidate_major_fact_errors,
      candidate_new_control_fact_passes:
        reg076V3Review.summary.candidate_new_reg076_control_fact_passes,
      candidate_new_control_cells:
        reg076V3Review.summary.candidate_new_reg076_control_cells,
      shared_grammar_error_cells:
        reg076V3Review.summary.shared_grammar_error_cells,
      candidate_shortlisted: reg076V3Review.summary.candidate_shortlisted,
      human_bilingual_reviews: reg076V3Review.summary.human_bilingual_reviews,
      machine_report_sha256: createHash('sha256').update(reg076V3Raw).digest('hex'),
      ai_review_sha256: createHash('sha256').update(reg076V3ReviewRaw).digest('hex'),
      catalog_sha256: createHash('sha256').update(catalogV55Raw).digest('hex') },
    reg077_v4: { chats: reg077V4.chats,
      preflights: reg077V4.preflights,
      total_tokens: reg077V4.total_tokens,
      wall_elapsed_ms: reg077V4.wall_elapsed_ms,
      identical_prior_requests_and_outputs:
        reg077V4.identical_prior_requests_and_outputs,
      baseline_major_fact_errors:
        reg077V4Review.summary.baseline_major_fact_errors_selected_set,
      candidate_major_fact_errors:
        reg077V4Review.summary.candidate_major_fact_errors_selected_set,
      targeted_fact_passes:
        reg077V4Review.summary.targeted_relation_card_fact_passes,
      targeted_cells: reg077V4Review.summary.targeted_relation_card_cells,
      candidate_new_control_fact_passes:
        reg077V4Review.summary.candidate_new_control_fact_passes,
      candidate_new_control_cells:
        reg077V4Review.summary.candidate_new_control_cells,
      shared_grammar_error_cells:
        reg077V4Review.summary.shared_grammar_error_cells,
      candidate_shortlisted: reg077V4Review.summary.candidate_shortlisted,
      human_bilingual_reviews:
        reg077V4Review.summary.human_bilingual_reviews,
      machine_report_sha256: createHash('sha256').update(reg077V4Raw).digest('hex'),
      ai_review_sha256: createHash('sha256').update(reg077V4ReviewRaw).digest('hex'),
      catalog_sha256: createHash('sha256').update(catalogV56Raw).digest('hex') },
    chip_core_warning: { selected_reply_cells:
        chipCoreWarning.summary.selected_reply_cells,
      complete_draft_pairs: chipCoreWarning.summary.complete_draft_pairs,
      source_groups: chipCoreWarning.source_groups.length,
      full_source_cues: chipCoreWarning.source_groups.reduce(
        (sum, group) => sum + group.source_cues, 0),
      full_source_triggers: chipCoreWarning.source_groups.reduce(
        (sum, group) => sum + group.source_trigger_cue_ids.length, 0),
      full_draft_warnings: chipCoreWarning.source_groups.reduce(
        (sum, group) => sum + group.drafts.reduce(
          (count, draft) => count + draft.warning_count, 0), 0),
      semantic_error_hits: chipCoreWarning.summary.semantic_known_error_hits,
      semantic_error_cells: chipCoreWarning.summary.semantic_known_error_cells,
      grammar_error_hits: chipCoreWarning.summary.grammar_known_error_hits,
      grammar_error_cells: chipCoreWarning.summary.grammar_known_error_cells,
      human_bilingual_reviews: chipCoreWarning.summary.human_bilingual_reviews,
      product_rule_admitted: chipCoreWarning.summary.product_rule_admitted,
      report_sha256: createHash('sha256').update(chipCoreWarningRaw).digest('hex') },
    qwen3_screen: { chats: qwen.request_count,
      preflights: qwen.preflight_count,
      tokens: qwen.total_tokens,
      candidate_chip_core_fact_passes:
        qwenReview.cases[3].candidate_fact_passes +
        qwenReview.cases[4].candidate_fact_passes,
      chip_core_contrast_cells: 6,
      all_big_core_candidate_fact_passes:
        qwenReview.cases[1].candidate_fact_passes,
      all_big_core_cells: 3,
      candidate_grammar_issue_cells:
        qwenReview.cases[3].candidate_language_issue_cells +
        qwenReview.cases[5].candidate_language_issue_cells,
      human_bilingual_reviews: qwenReview.human_bilingual_reviews,
      candidate_shortlisted: false,
      catalog_sha256: createHash('sha256').update(catalogV57Raw).digest('hex') },
    asus_source_relations_v3: {
      source_cues: asusRelations.observations.source_cues,
      aligned_pairs: asusRelations.observations.aligned_source_target_pairs,
      recognized_facts: asusRelations.observations.recognized_new_fact_count,
      warnings: asusRelations.observations.warning_count,
      ai_major_misses:
        asusRelationsReview.ai_identified_major_errors_in_three_selected_cues,
      human_reviews: asusRelationsReview.human_bilingual_reviews,
      product_admitted: asusRelations.observations.product_rule_admitted,
      report_sha256: createHash('sha256').update(asusRelationsRaw).digest('hex'),
      catalog_sha256: createHash('sha256').update(catalogV58Raw).digest('hex') },
    asus_hall_v4: {
      aligned_pairs: asusHallV4.observations.aligned_pairs,
      source_trigger_count: asusHallV4.observations.source_trigger_ids.length,
      v3_warnings: asusHallV4.observations.v3_warning_count,
      v4_warnings: asusHallV4.observations.v4_new_warning_count,
      known_error_caught: asusHallV4.observations.known_reg083_warning,
      human_reviews: asusHallV4Review.human_bilingual_reviews,
      product_admitted: asusHallV4.observations.product_rule_admitted,
      report_sha256: createHash('sha256').update(asusHallV4Raw).digest('hex') },
    vivo_source_quantity: { source_cues: quantityV2.source_cues,
      v1_matched_cues: quantityV1.matched_cues,
      v2_matched_cues: quantityV2.v2_matched_cues,
      known_false_positives_removed: quantityV2.removed_ids.length,
      added_ids: quantityV2.added_ids.length,
      model_requests: quantityV2.model_requests,
      human_bilingual_reviews: quantityV2.human_bilingual_reviews,
      v1_report_sha256: createHash('sha256').update(quantityV1Raw).digest('hex'),
      v2_report_sha256: createHash('sha256').update(quantityV2Raw).digest('hex'),
      catalog_sha256: createHash('sha256').update(catalogV53Raw).digest('hex') },
    vivo_blindspot: { selected_windows: blindspot.selected_windows,
      unique_source_cues: blindspot.unique_source_cues,
      source_target_pairs: blindspot.source_target_pairs,
      major_windows_ai_only: blindspotReview.summary.clear_major_windows_ai_only,
      one_b_major_windows_ai_only:
        blindspotReview.summary.clear_major_one_b_windows_ai_only,
      seven_b_major_windows_ai_only:
        blindspotReview.summary.clear_major_seven_b_windows_ai_only,
      human_bilingual_reviews: blindspotReview.summary.human_bilingual_reviews,
      model_requests: blindspot.model_requests,
      machine_report_sha256: createHash('sha256').update(blindspotRaw).digest('hex'),
      ai_review_sha256: createHash('sha256').update(blindspotReviewRaw).digest('hex'),
      catalog_sha256: createHash('sha256').update(catalogV52Raw).digest('hex') },
    vivo_scene_post_edit: { chats: postEdit.chats,
      preflights: postEdit.preflights,
      total_tokens: postEdit.total_tokens,
      wall_elapsed_ms: postEdit.wall_elapsed_ms,
      primary_repairs: postEdit.ai_triage.known_primary_relations_confirmed_repaired,
      new_major_errors: postEdit.ai_triage.new_major_errors,
      negative_primary_facts_preserved:
        postEdit.ai_triage.negative_controls_with_primary_fact_preserved,
      human_bilingual_reviews: postEdit.human_bilingual_reviews,
      full_file_rerun: postEdit.full_file_rerun,
      product_profile_changed: postEdit.product_profile_changed,
      report_sha256: createHash('sha256').update(postEditRaw).digest('hex') },
    youtube_v8_long: { source_cues: vivoV8.source_cues,
      small_prefix_cues: vivoV8.arms[0].covered_prefix_cues,
      large_complete_cues: vivoV8.arms[1].covered_prefix_cues,
      large_review_state: vivoV8.arms[1].review_state,
      offline_reexport_identical: vivoV8.offline_export.output_sha256 ===
        vivoV8.arms[1].output_sha256,
      human_bilingual_reviews: vivoV8.human_bilingual_reviews,
      accepted_language_quality: vivoV8.accepted_language_quality,
      report_sha256: createHash('sha256').update(vivoV8Raw).digest('hex') },
    youtube_v8_recovery: { source_cues: vivoRecovery.source_cues,
      covered_cues: vivoRecovery.total_checkpoints * 4 > vivoRecovery.source_cues
        ? vivoRecovery.source_cues : vivoRecovery.total_checkpoints * 4,
      new_chats: vivoRecovery.new_chat_requests,
      new_preflights: vivoRecovery.new_preflight_requests,
      review_state: vivoRecovery.review_state,
      human_bilingual_reviews: vivoRecovery.human_bilingual_reviews,
      accepted_language_quality: vivoRecovery.accepted_language_quality,
      report_sha256: createHash('sha256').update(vivoRecoveryRaw).digest('hex') },
    reg066_screen: { chats: reg066.chat_requests,
      preflights: reg066.template_token_preflights,
      small_fact_preserved: reg066Review.summary['1_8b'].fact_preserved,
      large_fact_preserved: reg066Review.summary['7b'].fact_preserved,
      cases_per_model: reg066Review.cases.length,
      human_bilingual_reviews: reg066Review.summary.human_bilingual_reviews,
      natural_errors_resolved: reg066Review.summary.natural_file_errors_resolved,
      report_sha256: createHash('sha256').update(reg066Raw).digest('hex'),
      ai_review_sha256: createHash('sha256').update(reg066ReviewRaw).digest('hex') },
    reg066_seams: { chats: seams.chat_requests,
      preflights: seams.template_token_preflights,
      valid: seams.structurally_valid,
      invalid: seams.structurally_invalid,
      seven_b_time_repairs: seamsReview.summary.observed_7b_time_repairs,
      mixed_script: seamsReview.summary.new_mixed_script_observations,
      tail_id_omissions: seamsReview.summary.new_tail_id_omissions,
      candidate_promoted: seamsReview.summary.shifted_candidate_promoted,
      human_bilingual_reviews: seamsReview.human_bilingual_reviews,
      report_sha256: createHash('sha256').update(seamsRaw).digest('hex'),
      ai_review_sha256: createHash('sha256').update(seamsReviewRaw).digest('hex') },
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
