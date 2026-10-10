import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { createReadStream } from 'node:fs';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { captureBoundedProcess } from './bounded-process-capture.mjs';
import { parsePinnedSrt } from './cross-source-relation-screen.mjs';
import { summarizeCues } from './vivo-full-audio-alignment.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const assetRoot = process.env.AURALIS_VIVO_ASSET_ROOT;
const mode = process.argv[2];
assert(['--preflight', '--probe', '--capture', '--check'].includes(mode)
  && process.argv.length === 3);
assert(assetRoot && path.isAbsolute(assetRoot),
  'AURALIS_VIVO_ASSET_ROOT must be an absolute private workspace path');
const sourcePath = path.join(assetRoot,
  '.cache/eval/youtube-geekerwan-vivo-original-caption/attempt-LQWxgw/source.zh.srt');
const mediaPath = path.join(assetRoot,
  '.cache/eval/commons-vivo-media/media-46745446-cc07-4cff-b5e3-f98fe08262f0/source.240p.webm');
const modelRoot = path.join(assetRoot, '.cache/eval/vivo-asr-model');
const packagesRoot = path.join(assetRoot, '.cache/eval/vivo-asr-packages');
const attemptRoot = path.join(root, '.cache/eval/vivo-full-audio-asr-v1');
const reportPath = path.join(root,
  'eval/reports/2026-10-10-vivo-full-audio-asr-v2.json');
const expected = {
  source: 'b100803367b95fa55fc638b1ff39a0abfa0d5b8183ebe58d58b1a87242d9d8c4',
  media: '7ad0484b31a6788c31632616649c51e6aaf6cdcdd7d90083d88e1d5ee66e1507',
  model: {
    'config.json': '56a6d8110d311f19c8f0471e562832c7527f146b567275bfca59fcf7c184da9a',
    'model.bin': 'd01c3014881c9c6f3133c182f3d2887eb6ca1c789a7538c5c007196857a0a6a9',
    'tokenizer.json': 'fb7b63191e9bb045082c79fd742a3106a12c99513ab30df4a0d47fa6cb6fd0ab',
    'vocabulary.txt': '34ce3fe1c5041027b3f8d42912270993f986dbc4bb34cf27f951e34a1e453913',
  },
};
const digest = bytes => createHash('sha256').update(bytes).digest('hex');
async function fileDigest(file) {
  const hash = createHash('sha256');
  for await (const chunk of createReadStream(file)) hash.update(chunk);
  return hash.digest('hex');
}
async function preflight() {
  const [source, media, ...model] = await Promise.all([
    fileDigest(sourcePath), fileDigest(mediaPath),
    ...Object.keys(expected.model).map(name => fileDigest(path.join(modelRoot, name))),
  ]);
  assert.equal(source, expected.source, 'Original-platform SRT changed');
  assert.equal(media, expected.media, 'Matched WebM changed');
  Object.entries(expected.model).forEach(([name, hash], index) =>
    assert.equal(model[index], hash, `ASR model ${name} changed`));
  assert((await fs.stat(packagesRoot)).isDirectory(), 'Cached ASR package missing');
  const cues = parsePinnedSrt(await fs.readFile(sourcePath));
  assert.equal(cues.length, 467);
  return { source_sha256: source, media_sha256: media,
    model_files_sha256: expected.model, source_cues: cues.length,
    media_duration_ms: 1115570, maximum_attempts: 1,
    process_timeout_ms: 900000, segment_cap: 2000 };
}
async function oneAttempt() {
  const prior = await fs.readdir(attemptRoot).catch(error => {
    if (error.code === 'ENOENT') return [];
    throw error;
  });
  assert.equal(prior.length, 0, 'One full-audio ASR attempt already consumed');
  await fs.mkdir(attemptRoot, { recursive: true });
  const attempt = await fs.mkdtemp(path.join(attemptRoot, 'attempt-'));
  const startedAt = new Date().toISOString();
  const { outcome, timedOut, outputLimitExceeded, stdout, stderr } =
    await captureBoundedProcess({ command: 'python',
      args: [path.join(root, 'eval/scripts/probe-vivo-full-audio-asr.py')],
      cwd: root,
      env: { ...process.env, AURALIS_ASR_ATTEMPT_DIR: attempt,
        HF_HUB_OFFLINE: '1' },
      timeoutMs: 900000, maxOutputBytes: 1048576 });
  await Promise.all([
    fs.writeFile(path.join(attempt, 'python-stdout.txt'), stdout, { flag: 'wx' }),
    fs.writeFile(path.join(attempt, 'python-stderr.txt'), stderr, { flag: 'wx' }),
  ]);
  const record = { schema_version: 1,
    experiment: 'DATA-03-vivo-full-audio-asr-2026-10-10-v1',
    started_at: startedAt, finished_at: new Date().toISOString(),
    timeout_ms: 900000, output_cap_bytes: 1048576,
    outcome: { ...outcome, timed_out: timedOut,
      output_limit_exceeded: outputLimitExceeded,
      stdout_bytes: stdout.length, stderr_bytes: stderr.length,
      stdout_sha256: digest(stdout), stderr_sha256: digest(stderr) } };
  await fs.writeFile(path.join(attempt, 'process.json'),
    `${JSON.stringify(record, null, 2)}\n`, { flag: 'wx' });
  console.log(`Private full-audio ASR attempt: ${attempt}`);
  console.log(JSON.stringify(record.outcome));
  if (outcome.exit_code !== 0 || timedOut || outputLimitExceeded)
    process.exitCode = 1;
}
async function summary(inputs) {
  const attempts = await fs.readdir(attemptRoot);
  assert.equal(attempts.length, 1, 'Expected the single retained ASR attempt');
  const attempt = path.join(attemptRoot, attempts[0]);
  const [rawBytes, processBytes] = await Promise.all([
    fs.readFile(path.join(attempt, 'raw.json')),
    fs.readFile(path.join(attempt, 'process.json')),
  ]);
  const raw = JSON.parse(rawBytes);
  const processRecord = JSON.parse(processBytes);
  assert.equal(raw.status, 'complete_ai_unreviewed');
  assert.equal(raw.experiment, processRecord.experiment);
  assert.equal(raw.media_sha256, expected.media);
  assert.equal(raw.model_revision, 'ebe41f70d5b6dfa9166e2c581c45c9c0cfc57b66');
  assert.equal(raw.compute, 'cpu_int8');
  assert.equal(raw.language, 'zh_forced');
  assert.equal(raw.beam_size, 5);
  assert.equal(raw.vad_filter, false);
  assert.equal(raw.condition_on_previous_text, false);
  assert.deepEqual(raw.packages, {
    'faster-whisper': '1.2.1', ctranslate2: '4.8.2', av: '17.1.0',
    'huggingface-hub': '2.2.0', tokenizers: '0.23.3',
  });
  assert.equal(processRecord.outcome.exit_code, 0);
  assert.equal(processRecord.outcome.timed_out, false);
  assert.equal(processRecord.outcome.output_limit_exceeded, false);
  assert(raw.segments.length > 0 && raw.segments.length <= 2000);
  assert(raw.segments.every(segment => Number.isFinite(segment.start)
    && Number.isFinite(segment.end) && segment.end >= segment.start
    && segment.start >= 0 && typeof segment.text === 'string'));
  const cues = parsePinnedSrt(await fs.readFile(sourcePath));
  const alignment = summarizeCues(cues, raw.segments, inputs.media_duration_ms);
  const first = raw.segments[0];
  const last = raw.segments.at(-1);
  return { schema_version: 2, experiment: raw.experiment,
    source_sha256: inputs.source_sha256, media_sha256: inputs.media_sha256,
    model_repo: raw.model_repo, model_revision: raw.model_revision,
    model_files_sha256: inputs.model_files_sha256,
    package_versions: raw.packages,
    compute: raw.compute, language_setting: raw.language,
    beam_size: raw.beam_size, vad_filter: raw.vad_filter,
    condition_on_previous_text: raw.condition_on_previous_text,
    private_raw_sha256: digest(rawBytes),
    private_process_sha256: digest(processBytes),
    elapsed_seconds: raw.elapsed_seconds,
    segment_count: raw.segments.length,
    first_asr_second: first.start, last_asr_second: last.end,
    alignment,
    alignment_interpretation: {
      method: 'raw_unicode_ordered_character_recall_v1',
      script_conversion_applied: false,
      low_recall_is_caption_error: false,
      limitation: 'Traditional ASR and simplified captions yield false low-recall flags; raw scores are review priorities only',
    },
    review: { kind: 'ai_diagnostic', human_listeners: 0,
      source_speech_alignment_verified: false,
      caption_rights_verified: false,
      source_admission: 'inspected_candidate_zero_eligible' } };
}

const inputs = await preflight();
if (mode === '--preflight') console.log(JSON.stringify(inputs, null, 2));
else if (mode === '--probe') await oneAttempt();
else {
  const report = await summary(inputs);
  const serialized = `${JSON.stringify(report, null, 2)}\n`;
  if (mode === '--capture')
    await fs.writeFile(reportPath, serialized, { flag: 'wx' });
  else assert.equal(await fs.readFile(reportPath, 'utf8'), serialized,
    'Pinned public summary changed');
  console.log(JSON.stringify({ mode, asr_segments: report.segment_count,
    cue_overlap: report.alignment.cues_with_asr_overlap,
    low_recall: report.alignment.low_recall_cues,
    human_listeners: 0 }));
}
