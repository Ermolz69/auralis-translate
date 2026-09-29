import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { gunzipSync } from 'node:zlib';
import { digest } from '../flores-file-fixture.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const pack = JSON.parse(await fs.readFile(path.join(root,
  'eval/regressions/greedy-restart-grammar-v1.json')));
const earlier = JSON.parse(await fs.readFile(path.join(root,
  'eval/regressions/long-v6-restart-grammar-v1.json')));
const summaryBytes = await fs.readFile(path.join(root,
  'eval/reports/2026-09-29-reg009-greedy81-summary.json'));
const archiveBytes = await fs.readFile(path.join(root,
  'eval/reports/2026-09-29-reg009-greedy81-archive.json.gz'));
const archive = JSON.parse(gunzipSync(archiveBytes));
const rows = archive.raw['requests.jsonl'].trim().split('\n').map(JSON.parse);
const baselineBytes = await fs.readFile(path.join(root,
  'eval/reports/2026-09-29-reg009-live-prefix-repair-requests.jsonl.gz'));
const baseline = gunzipSync(baselineBytes).toString('utf8').trim().split('\n').map(JSON.parse);

test('REG-017 retains all three real cue-510 decoding regressions', () => {
  assert.equal(pack.id, 'REG-017');
  assert.equal(digest(summaryBytes), pack.source_summary_sha256);
  assert.equal(digest(archiveBytes), pack.source_archive_sha256);
  assert.equal(pack.failure.raw_candidate_ru,
    earlier.negative_controls.find(row => row.id === 'awkward_double_necessity').candidate_ru);
  for (const [index, seed] of pack.failure.seeds.entries()) {
    const row = rows.find(item => item.cue_id === pack.failure.cue_id && item.seed === seed);
    const old = baseline.find(item => item.cue_id === pack.failure.cue_id && item.seed === seed);
    assert(row && old);
    assert.equal(row.request_sha256, pack.failure.greedy_request_sha256[index]);
    assert.equal(row.source_zh, pack.source_zh);
    assert.equal(row.restored_candidate, pack.failure.raw_candidate_ru);
    assert.notEqual(old.restored_candidate, row.restored_candidate);
    assert.equal(row.raw_exact_identifier, false);
    const request = JSON.parse(row.rendered_request);
    assert.deepEqual({ ...request, temperature: 0.7 }, old.request);
    assert.doesNotMatch(request.messages[0].content, /\p{Script=Cyrillic}/u);
  }
});

test('REG-017 keeps same-source controls and opposed restart meaning distinct', () => {
  assert.equal(pack.related_controls.length, 3);
  assert.equal(pack.negative_controls.length, 3);
  for (const control of pack.related_controls) {
    for (const seed of control.seeds) {
      const row = (control.baseline_expected_fluent ? baseline : rows)
        .find(item => item.cue_id === control.cue_id && item.seed === seed);
      assert(row);
      assert.notEqual(row.restored_candidate, pack.failure.raw_candidate_ru);
    }
  }
  assert.equal(pack.negative_controls.find(row => row.id === 'clear_restart_required')
    .expected_fluency_error, false);
  assert.equal(pack.negative_controls.find(row => row.id === 'awkward_double_necessity')
    .expected_fluency_error, true);
  assert.equal(pack.human_review, 'missing');
  assert.equal(pack.release_gate, 'open');
});
