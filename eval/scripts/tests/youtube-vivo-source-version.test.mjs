import assert from 'node:assert/strict';
import test from 'node:test';
import { compareSrtVersions, parseStrictSrt, sha256 } from '../youtube-vivo-source-version.mjs';

const cue = (id, start, end, text) => `${id}\n00:00:${start} --> 00:00:${end}\n${text}\n`;
const baseline = Buffer.from(Array.from({ length: 467 }, (_, index) =>
  cue(index + 1, '00,000', '00,001', `字${index + 1}`)).join('\n'));

test('identical old YouTube bytes and complete text/timing are separate facts', () => {
  const result = compareSrtVersions(baseline, baseline, 1000, sha256(baseline));
  assert.equal(result.previous_youtube_byte_identical, true);
  assert.equal(result.commons_text_identical, true);
  assert.equal(result.timing_differences.length, 0);
  assert.equal(result.cues_past_media.length, 0);
});

test('same text with changed timing is a distinct version', () => {
  const changed = Buffer.from(baseline.toString('utf8').replace(
    '00:00:00,000 --> 00:00:00,001', '00:00:00,002 --> 00:00:00,003'));
  const result = compareSrtVersions(changed, baseline, 1000, sha256(baseline));
  assert.equal(result.previous_youtube_byte_identical, false);
  assert.equal(result.commons_text_identical, true);
  assert.deepEqual(result.timing_differences.map(row => row.cue_id), [1]);
});

test('changed words, missing cues and cues beyond media remain explicit', () => {
  const changed = Buffer.from(baseline.toString('utf8').replace('字1', '别')
    .replace('00:00:00,001', '00:00:02,001'));
  const result = compareSrtVersions(changed, baseline, 1000, sha256(baseline));
  assert.equal(result.commons_text_identical, false);
  assert.deepEqual(result.text_difference_ids, [1]);
  assert.deepEqual(result.cues_past_media, [1]);
  const shortened = Buffer.from(baseline.toString('utf8').replace(/\n467\n00:00:00,000 --> 00:00:00,001\n字467\n$/u, ''));
  const missing = compareSrtVersions(shortened, baseline, 1000, sha256(baseline));
  assert.equal(missing.candidate_cues, 466);
  assert.equal(missing.commons_text_identical, false);
  assert.throws(() => parseStrictSrt(Buffer.from('1\n00:00:00,000 --> 00:00:00,001\n')), /assertion|false/i);
});
