import assert from 'node:assert/strict';
import test from 'node:test';
import { normalizeSrtMilliseconds } from '../normalize-srt-millisecond-fields.mjs';

test('pads integer milliseconds while preserving text, IDs and CRLF', () => {
  const source = '1\r\n00:00:01,0 --> 00:00:02,40\r\n文字 00:00:03,7 --> x\r\n\r\n2\r\n00:00:02,400 --> 00:00:03,999\r\n第二行\r\n';
  const { srt, mapping } = normalizeSrtMilliseconds(source);
  assert.equal(srt, source.replace('01,0 --> 00:00:02,40',
    '01,000 --> 00:00:02,040'));
  assert.deepEqual(mapping.map(cue => cue.cue_id), [1, 2]);
  assert.equal(mapping[0].text, '文字 00:00:03,7 --> x');
});

test('rejects unsupported timing rather than silently changing it', () => {
  for (const value of ['1\n00:00:01,1000 --> 00:00:02,40\nx\n',
    '1\n00:00:01,4 --> 00:00:02,40 align:start\nx\n',
    '1\n00:00:01,4 --> 00:00:02,40\n\n']) {
    assert.throws(() => normalizeSrtMilliseconds(value));
  }
});
