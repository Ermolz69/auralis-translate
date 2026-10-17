import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';

export async function loadVivoAudioEvidence(root, sourceSha256, sourceCueCount, draftSha256) {
  const vivoAudioRaw = await fs.readFile(path.join(root,
    'eval/reports/2026-10-10-vivo-real-sapi-technical.json'), 'utf8');
  assert.equal(createHash('sha256').update(vivoAudioRaw).digest('hex'),
    '4ee168db1054927a3bb91eec98021cfe3862b5d1d6beca0d67f38432e3d0e8f0');
  const vivoAudio = JSON.parse(vivoAudioRaw);
  assert.equal(vivoAudio.status, 'technical_media_complete_quality_rejected');
  assert.equal(vivoAudio.source.original_srt_sha256, sourceSha256);
  assert.equal(vivoAudio.source.russian_draft_sha256, draftSha256);
  assert.equal(vivoAudio.tts.generated_cues, sourceCueCount);
  assert.equal(vivoAudio.tts.overrun_cues, 465);
  assert.equal(vivoAudio.tts.overlapping_starts, 464);
  assert.equal(vivoAudio.fit.at_most_tempo['1.5'], 50);
  assert.equal(vivoAudio.media.playback_status, 'player_process_completed');
  assert.equal(vivoAudio.media.video_tail_gap_ms, 1258);
  assert.equal(vivoAudio.review.human_audio_listeners, 0);
  assert.equal(vivoAudio.review.audio_gates_admitted, false);
  const vivoGroupRaw = await fs.readFile(path.join(root,
    'eval/reports/2026-10-10-vivo-group-fit-v1.json'), 'utf8');
  assert.equal(createHash('sha256').update(vivoGroupRaw).digest('hex'),
    'a6f47b89268f6658ff9432262cb2a9bc9afababf71d24e2fdc0e0263537ad05d');
  const vivoGroup = JSON.parse(vivoGroupRaw);
  assert.equal(vivoGroup.status, 'grouping_only_rejected');
  assert.equal(vivoGroup.cue_count, vivoAudio.tts.generated_cues);
  assert.equal(vivoGroup.tts_report_sha256, vivoAudio.tts.report_sha256);
  assert.equal(vivoGroup.total_wav_ms, 2291610);
  assert.equal(vivoGroup.source_span_ms, 1114363);
  assert.equal(vivoGroup.duration_reduction_needed_for_1_5x_ms, 620178);
  assert.equal(vivoGroup.at_most_1_5_cues_by_group_size['467'], 0);
  assert.equal(vivoGroup.new_tts_requests, 0);
  assert.equal(vivoGroup.human_audio_listeners, 0);
  assert.equal(vivoGroup.audio_gates_admitted, false);
  const vivoEdgeRaw = await fs.readFile(path.join(root,
    'eval/reports/2026-10-10-vivo-edge-silence-v1.json'), 'utf8');
  assert.equal(createHash('sha256').update(vivoEdgeRaw).digest('hex'),
    '03d64bbaf1954c0b74d9a13dd0f842963e61c794f418d153aa1ac81321b9d535');
  const vivoEdge = JSON.parse(vivoEdgeRaw);
  assert.equal(vivoEdge.status, 'edge_only_rejected');
  assert.equal(vivoEdge.cue_count, vivoGroup.cue_count);
  assert.equal(vivoEdge.tts_report_sha256, vivoGroup.tts_report_sha256);
  assert.equal(vivoEdge.total_wav_ms, vivoGroup.total_wav_ms);
  assert.equal(vivoEdge.source_span_ms, vivoGroup.source_span_ms);
  assert.equal(vivoEdge.deficit_at_1_5x_ms,
    vivoGroup.duration_reduction_needed_for_1_5x_ms);
  assert.equal(vivoEdge.thresholds['328'].potential_edge_ms, 432905);
  assert.equal(vivoEdge.thresholds['328'].remaining_deficit_ms, 187273);
  assert.equal(vivoEdge.new_tts_requests, 0);
  assert.equal(vivoEdge.human_audio_listeners, 0);
  assert.equal(vivoEdge.approved_trim, false);
  assert.equal(vivoEdge.audio_gates_admitted, false);
  const vivoVoiceRaw = await fs.readFile(path.join(root,
    'eval/reports/2026-10-10-vivo-sapi-voice-contrast-v1.json'), 'utf8');
  assert.equal(createHash('sha256').update(vivoVoiceRaw).digest('hex'),
    '24cbef54cf06bab3e1594ae60d945aa6fd7fa66e63de4eda05d36160f7923c86');
  const vivoVoice = JSON.parse(vivoVoiceRaw);
  assert.equal(vivoVoice.source_sha256, sourceSha256);
  assert.equal(vivoVoice.real_wav_count, 108);
  assert.equal(vivoVoice.voices['Microsoft Pavel'].eligible_for_full_technical_screen, false);
  assert.equal(vivoVoice.human_audio_listeners, 0);
  assert.equal(vivoVoice.audio_gates_admitted, false);
  const vivoRateRaw = await fs.readFile(path.join(root,
    'eval/reports/2026-10-10-vivo-sapi-rate-v1.json'), 'utf8');
  assert.equal(createHash('sha256').update(vivoRateRaw).digest('hex'),
    'fb53146e7ebd01ecb4f559fcf41f222996736deb6459817b1c3bd794db5c908f');
  const vivoRate = JSON.parse(vivoRateRaw);
  assert.equal(vivoRate.source_srt_sha256, sourceSha256);
  assert.equal(vivoRate.russian_draft_sha256, draftSha256);
  assert.equal(vivoRate.rates['0'].sum_duration_ms,
    vivoVoice.voices['Microsoft Irina Desktop'].sum_median_duration_ms);
  assert.equal(vivoRate.real_wav_count, 36);
  assert.equal(vivoRate.signal_present_wav_count, 36);
  assert.equal(vivoRate.clipped_samples, 0);
  assert.equal(vivoRate.advanced_to_private_audition_only, true);
  assert.equal(vivoRate.human_audio_listeners, 0);
  assert.equal(vivoRate.audio_gates_admitted, false);
  const vivoAuditionRaw = await fs.readFile(path.join(root,
    'eval/reports/2026-10-10-vivo-rate-audition-v1.json'), 'utf8');
  assert.equal(createHash('sha256').update(vivoAuditionRaw).digest('hex'),
    '22c10be7bd34b693a3210f6748d06c9df40034e66033e8551e06e7fcded5b96f');
  const vivoAudition = JSON.parse(vivoAuditionRaw);
  assert.equal(vivoAudition.source_srt_sha256, vivoRate.source_srt_sha256);
  assert.equal(vivoAudition.russian_draft_sha256, vivoRate.russian_draft_sha256);
  assert.equal(vivoAudition.tts_report_sha256, vivoRate.tts_report_sha256);
  assert.equal(vivoAudition.tts_analysis_sha256, vivoRate.analysis_sha256);
  assert.deepEqual(vivoAudition.cue_ids, [1, 233, 466]);
  assert.deepEqual(vivoAudition.sapi_rates, [0, 5, 10]);
  assert.equal(vivoAudition.copied_real_wav_count, 9);
  assert.equal(vivoAudition.decoded_and_byte_matched_wav_count, 9);
  assert.equal(vivoAudition.new_tts_requests, 0);
  assert.equal(vivoAudition.human_audio_listeners, 0);
  assert.equal(vivoAudition.audio_gates_admitted, false);
  return { vivoAudioRaw, vivoAudio, vivoGroupRaw, vivoGroup, vivoEdgeRaw, vivoEdge, vivoVoiceRaw, vivoVoice, vivoRateRaw, vivoRate, vivoAuditionRaw, vivoAudition };
}

export function projectVivoAudioEvidence({ vivoAudioRaw, vivoAudio, vivoGroupRaw, vivoGroup, vivoEdgeRaw, vivoEdge, vivoVoiceRaw, vivoVoice, vivoRateRaw, vivoRate, vivoAuditionRaw, vivoAudition }) {
  return {
    vivo_technical_audio: { generated_cues: vivoAudio.tts.generated_cues,
      overrun_cues: vivoAudio.tts.overrun_cues,
      overlapping_starts: vivoAudio.tts.overlapping_starts,
      fit_at_most_1_5: vivoAudio.fit.at_most_tempo['1.5'],
      median_required_tempo: vivoAudio.fit.median_required_tempo,
      media_output_bytes: vivoAudio.media.output_bytes,
      video_tail_gap_ms: vivoAudio.media.video_tail_gap_ms,
      playback_status: vivoAudio.media.playback_status,
      human_audio_listeners: vivoAudio.review.human_audio_listeners,
      audio_gates_admitted: vivoAudio.review.audio_gates_admitted,
      report_sha256: createHash('sha256').update(vivoAudioRaw).digest('hex') },
    vivo_group_fit: { cue_count: vivoGroup.cue_count,
      total_wav_ms: vivoGroup.total_wav_ms,
      source_span_ms: vivoGroup.source_span_ms,
      ideal_whole_file_tempo: vivoGroup.ideal_whole_file_tempo,
      needed_reduction_ms: vivoGroup.duration_reduction_needed_for_1_5x_ms,
      at_most_1_5_whole_file: vivoGroup.at_most_1_5_cues_by_group_size['467'],
      new_tts_requests: vivoGroup.new_tts_requests,
      human_audio_listeners: vivoGroup.human_audio_listeners,
      audio_gates_admitted: vivoGroup.audio_gates_admitted,
      report_sha256: createHash('sha256').update(vivoGroupRaw).digest('hex') },
    vivo_edge_silence: { cue_count: vivoEdge.cue_count,
      conservative_edge_ms: vivoEdge.thresholds['33'].potential_edge_ms,
      broad_edge_ms: vivoEdge.thresholds['328'].potential_edge_ms,
      broad_remaining_deficit_ms: vivoEdge.thresholds['328'].remaining_deficit_ms,
      broad_ideal_tempo: vivoEdge.thresholds['328'].ideal_tempo_after_edge_removal,
      new_tts_requests: vivoEdge.new_tts_requests,
      human_audio_listeners: vivoEdge.human_audio_listeners,
      approved_trim: vivoEdge.approved_trim,
      audio_gates_admitted: vivoEdge.audio_gates_admitted,
      report_sha256: createHash('sha256').update(vivoEdgeRaw).digest('hex') },
    vivo_voice_contrast: { selected_cues: vivoVoice.selected_cue_ids.length,
      repetitions_per_voice: vivoVoice.repetitions_per_voice,
      real_wav_count: vivoVoice.real_wav_count,
      clipped_samples: vivoVoice.clipped_samples,
      desktop_sum_median_ms: vivoVoice.voices['Microsoft Irina Desktop'].sum_median_duration_ms,
      pavel_sum_median_ms: vivoVoice.voices['Microsoft Pavel'].sum_median_duration_ms,
      pavel_shorter_cues: vivoVoice.voices['Microsoft Pavel'].shorter_cues,
      pavel_paired_median_ratio: vivoVoice.voices['Microsoft Pavel'].paired_median_ratio,
      pavel_fits_at_1_5x: vivoVoice.voices['Microsoft Pavel'].fit_at_most_1_5_cues,
      screen_ratio_limit: vivoVoice.screen_ratio_limit,
      alternative_advanced: Object.entries(vivoVoice.voices).some(([name, voice]) =>
        name !== 'Microsoft Irina Desktop' && voice.eligible_for_full_technical_screen),
      human_audio_listeners: vivoVoice.human_audio_listeners,
      audio_gates_admitted: vivoVoice.audio_gates_admitted,
      report_sha256: createHash('sha256').update(vivoVoiceRaw).digest('hex') },
    vivo_sapi_rate: { selected_cues: vivoRate.cue_ids.length,
      real_wav_count: vivoRate.real_wav_count,
      elapsed_ms: vivoRate.tts_elapsed_ms,
      default_duration_ms: vivoRate.rates['0'].sum_duration_ms,
      mid_duration_ms: vivoRate.rates['5'].sum_duration_ms,
      max_duration_ms: vivoRate.rates['10'].sum_duration_ms,
      default_fits: vivoRate.rates['0'].fits_at_most_1_5,
      mid_fits: vivoRate.rates['5'].fits_at_most_1_5,
      max_fits: vivoRate.rates['10'].fits_at_most_1_5,
      max_ratio: vivoRate.rates['10'].sum_ratio_to_zero,
      signal_present_wavs: vivoRate.signal_present_wav_count,
      clipped_samples: vivoRate.clipped_samples,
      audition_only: vivoRate.advanced_to_private_audition_only,
      human_audio_listeners: vivoRate.human_audio_listeners,
      audio_gates_admitted: vivoRate.audio_gates_admitted,
      report_sha256: createHash('sha256').update(vivoRateRaw).digest('hex') },
    vivo_rate_audition: { selected_cues: vivoAudition.cue_ids.length,
      copied_real_wavs: vivoAudition.copied_real_wav_count,
      human_audio_listeners: vivoAudition.human_audio_listeners,
      new_tts_requests: vivoAudition.new_tts_requests,
      audio_gates_admitted: vivoAudition.audio_gates_admitted,
      report_sha256: createHash('sha256').update(vivoAuditionRaw).digest('hex') },
  };
}
