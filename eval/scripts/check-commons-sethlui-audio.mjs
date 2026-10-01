import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';

const root = resolve('.');
const directory = join(root,
  '.cache/eval/commons-sethlui-audio/window-51d40a84-f804-4f5c-8dd3-de108fa20def');
const original = join(root,
  '.cache/eval/commons-sethlui-caption/caption-Cgsmq4/source.zh.srt');
const mappingPath = join(root,
  '.cache/eval/commons-sethlui-media/derived-1e655c9c-f93e-4b03-938c-f2510640fa2b/derivation.json');
const expected = [
  { label: 'start', start_ms: 8000, end_ms: 20000,
    ids: [1, 2, 3, 4, 5, 6],
    sha256: '7d63ed5414f838fc35ea16f7ea829f6184c986f5b784255cf3a5c9a6ad12c95a' },
  { label: 'middle', start_ms: 360000, end_ms: 372000,
    ids: [123, 124, 125, 126, 127, 128, 129],
    sha256: '351b896351e8c11da0d4de0552d0bb935d61dab156185de330e4c5dcbdd4395f' },
  { label: 'end', start_ms: 725000, end_ms: 737000,
    ids: [260, 261, 262, 263],
    sha256: '9b29dd83e230c0c10f2277daf133ad4c0aacf20dddb584d1095db29700948ac6' },
];
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
const recordBytes = await readFile(join(directory, 'review-packet.json'));
assert.equal(sha256(recordBytes),
  '48d643d85fd4209020cbc5ec15bad8eef6029c061689482b36640673f3a3b68a');
const report = JSON.parse(recordBytes.toString('utf8'));
assert.equal(report.status, 'decoded_unlistened');
assert.equal(report.speech_language_reviewed, false);
assert.equal(report.alignment_reviewed, false);
assert.equal(report.human_listening_count, 0);
assert.equal(report.network_requests, 0);
assert.equal(report.model_requests, 0);
assert.equal(report.windows.length, 3);
const sourceBytes = await readFile(original);
assert.equal(sha256(sourceBytes), report.expected.source);
const derivationBytes = await readFile(mappingPath);
assert.equal(sha256(derivationBytes), report.expected.derivation);
const mapping = JSON.parse(derivationBytes.toString('utf8')).mapping;
const sourceText = new TextDecoder('utf-8', { fatal: true }).decode(sourceBytes);
const newline = sourceText.includes('\r\n') ? '\r\n' : '\n';
const blocks = sourceText.replace(/(?:\r?\n)+$/u, '').split(newline + newline);
assert.equal(blocks.length, 271);
for (const [index, window] of expected.entries()) {
  const actual = report.windows[index];
  assert.equal(actual.label, window.label);
  assert.equal(actual.start_ms, window.start_ms);
  assert.equal(actual.end_ms, window.end_ms);
  assert.equal(actual.requested_duration_ms, 12000);
  assert.equal(actual.status, 'decoded_unlistened');
  assert.deepEqual(actual.source_cues.map(cue => cue.original_cue_id), window.ids);
  const overlapping = mapping.filter(cue => cue.derived_cue_id !== null
    && cue.end_ms > window.start_ms && cue.start_ms < window.end_ms);
  assert.deepEqual(overlapping.map(cue => cue.original_cue_id), window.ids);
  for (const cue of actual.source_cues) {
    const pinned = mapping[cue.original_cue_id - 1];
    assert.equal(cue.start_ms, pinned.start_ms);
    assert.equal(cue.end_ms, pinned.end_ms);
    assert.equal(cue.text,
      blocks[cue.original_cue_id - 1].split(newline).slice(2).join(newline));
  }
  const bytes = await readFile(join(directory, `${window.label}.wav`));
  assert.equal(sha256(bytes), window.sha256);
  assert.equal(actual.wav_sha256, window.sha256);
  assert.equal(actual.wav_bytes, bytes.length);
  assert.equal(bytes.toString('ascii', 0, 4), 'RIFF');
  assert.equal(bytes.toString('ascii', 8, 12), 'WAVE');
  assert.equal(actual.pcm.codec_id, 1);
  assert.equal(actual.pcm.channels, 1);
  assert.equal(actual.pcm.sample_rate, 16000);
  assert.equal(actual.pcm.bit_depth, 16);
  assert.equal(actual.pcm.pcm_bytes, 384000);
  assert.equal(actual.pcm.decoded_duration_ms, 12000);
  assert(actual.pcm.nonzero_samples > 0);
}
console.log(JSON.stringify({ packet_sha256: sha256(recordBytes),
  sample_count: report.windows.length, cue_counts: expected.map(window => window.ids.length),
  clip_sha256: expected.map(window => window.sha256),
  human_listening_count: 0, speech_and_alignment_reviewed: false }, null, 2));
