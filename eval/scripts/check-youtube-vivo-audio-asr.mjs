import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const reportPath = path.join(root, 'eval/reports/youtube-geekerwan-vivo-audio-asr-v1.json');
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
async function pinned(relative, expected) {
  const bytes = await fs.readFile(path.join(root, relative));
  assert.equal(sha256(bytes), expected, `${relative} changed`);
  return bytes;
}

const [rawBytes, processBytes, installBytes] = await Promise.all([
  pinned('.cache/eval/vivo-asr-probe/attempt-DCY4ew/raw.json',
    '43ed4372bfa06919cd4e84b8b725236917fdbc5613ef9521c28ae2e113e680eb'),
  pinned('.cache/eval/vivo-asr-probe/attempt-DCY4ew/process.json',
    '360daf4b61ec109766b42b575107d4621e8b802f6c03bfc69c26f870330476fc'),
  pinned('.cache/eval/vivo-asr-install/attempt-HX9UAL/install.json',
    'a5057897264a7c57d1baeeae1d61cddb4f0eefc5290e5bc282d4a97bfb8caa74'),
]);
const raw = JSON.parse(rawBytes);
const processRecord = JSON.parse(processBytes);
const install = JSON.parse(installBytes);
assert.equal(install.outcome.exit_code, 0);
assert.equal(install.outcome.timed_out, false);
assert.equal(processRecord.outcome.exit_code, 0);
assert.equal(processRecord.outcome.timed_out, false);
assert.equal(raw.status, 'ai_transcript_unreviewed');
assert.equal(raw.model_repo, 'Systran/faster-whisper-base');
assert.equal(raw.model_revision, 'ebe41f70d5b6dfa9166e2c581c45c9c0cfc57b66');
assert.equal(raw.compute, 'cpu_int8');
assert.equal(raw.language, 'zh');
assert.equal(raw.beam_size, 5);
assert.deepEqual(raw.packages, {
  'faster-whisper': '1.2.1', ctranslate2: '4.8.2', av: '17.1.0',
  'huggingface-hub': '2.2.0', tokenizers: '0.23.3',
});
const modelHashes = {
  'config.json': '56a6d8110d311f19c8f0471e562832c7527f146b567275bfca59fcf7c184da9a',
  'model.bin': 'd01c3014881c9c6f3133c182f3d2887eb6ca1c789a7538c5c007196857a0a6a9',
  'tokenizer.json': 'fb7b63191e9bb045082c79fd742a3106a12c99513ab30df4a0d47fa6cb6fd0ab',
  'vocabulary.txt': '34ce3fe1c5041027b3f8d42912270993f986dbc4bb34cf27f951e34a1e453913',
};
assert.deepEqual(Object.keys(raw.model_files).sort(), Object.keys(modelHashes).sort());
for (const [name, expected] of Object.entries(modelHashes)) {
  assert.equal(raw.model_files[name].sha256, expected);
  assert.equal(sha256(await fs.readFile(path.join(root, '.cache/eval/vivo-asr-model', name))),
    expected);
}
assert.deepEqual(raw.windows.map(window => window.label), ['start', 'middle', 'end']);
assert.deepEqual(raw.windows.map(window => window.source_start_seconds), [0, 563, 1102]);
assert.deepEqual(raw.windows.map(window => window.overlapping_source_cues.map(cue => cue.id)),
  [[1, 2, 3, 4, 5], [233, 234, 235, 236, 237, 238],
    [461, 462, 463, 464, 465, 466, 467]]);
assert(raw.windows.every(window => window.detected_language === 'zh'
  && window.segments.length > 0));

const summary = {
  schema_version: 1,
  experiment: raw.experiment,
  original_srt_sha256: raw.inputs.source_srt_sha256,
  audio_sha256: raw.inputs.audio_sha256,
  install_report_sha256: sha256(installBytes),
  process_report_sha256: sha256(processBytes),
  private_raw_report_sha256: sha256(rawBytes),
  model_repo: raw.model_repo,
  model_revision: raw.model_revision,
  model_files: raw.model_files,
  package_versions: raw.packages,
  compute: raw.compute,
  language_setting: 'zh_forced_not_independently_detected',
  beam_size: raw.beam_size,
  total_asr_audio_seconds: 36,
  total_elapsed_seconds: raw.total_elapsed_seconds,
  windows: raw.windows.map(window => ({ label: window.label,
    source_start_seconds: window.source_start_seconds,
    overlapping_cue_ids: window.overlapping_source_cues.map(cue => cue.id),
    asr_segments: window.segments.length,
    elapsed_seconds: window.elapsed_seconds })),
  ai_source_comparison: {
    start: 'topic_overlap_with_dongguan_asr_error_and_partial_final_cue',
    middle: 'topic_overlap_with_mediatek_and_disagreement_asr_errors',
    end: 'topic_overlap_with_gratitude_and_future_cooperation_asr_errors',
    conclusion: 'three_sampled_windows_plausibly_align_not_verified_full_media',
  },
  reviewer: { kind: 'ai', human_listeners: 0,
    source_speech_alignment_verified: false, speaker_mapping_verified: false },
  source_admission: 'inspected_candidate_zero_eligible',
};
const serialized = `${JSON.stringify(summary, null, 2)}\n`;
if (process.argv.includes('--capture'))
  await fs.writeFile(reportPath, serialized, { flag: 'wx' });
else
  assert.equal(await fs.readFile(reportPath, 'utf8'), serialized);
console.log('Vivo local ASR evidence checked: three sampled windows, source-topic overlap by AI review, zero human alignment reviews.');
