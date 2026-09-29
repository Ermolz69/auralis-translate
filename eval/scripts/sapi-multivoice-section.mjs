import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';

const reportPath = 'eval/reports/2026-09-29-sapi-multivoice-pwsh-probe.json';
const expectedHash = 'c229e64c9619548ea4c7174b17b17e1a7a7c1ea625eead2c1b732cdf591bcc45';

export async function loadSapiMultivoice(root) {
  const bytes = await fs.readFile(path.join(root, reportPath));
  const sha256 = createHash('sha256').update(bytes).digest('hex');
  assert.equal(sha256, expectedHash, 'Archived SAPI result changed');
  const report = JSON.parse(bytes);
  assert.equal(report.schema_version, 1);
  assert.equal(report.kind, 'technical_sapi_multivoice_probe');
  assert.equal(report.runtime.sha256, '362a356ce7f0940ec74f73a8fc2c990a2cc24a38a11c90bbd8eca947110ad139');
  assert.equal(report.cue_fit, 'failed');
  assert.equal(report.clipping_check, 'passed');
  assert.equal(report.listening_review, 'not_performed');
  assert.equal(report.video_playback, 'not_performed');
  assert.deepEqual(report.segments.map(segment => segment.voice_id), ['Microsoft Irina Desktop', 'Microsoft Pavel']);
  assert.deepEqual(report.segments.map(segment => segment.exceeds_window_ms), [1164, 1269]);
  assert(report.segments.every(segment => segment.codec === 'pcm_s16le' && segment.clipped_samples === 0));
  return { ...report, report_sha256: sha256 };
}
