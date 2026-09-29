import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { gunzipSync } from 'node:zlib';
import { digest } from '../flores-file-fixture.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const reports = path.join(root, 'eval/reports');
const regressions = path.join(root, 'eval/regressions');
const archiveBytes = await fs.readFile(path.join(reports,
  '2026-09-29-reg009-live-prefix-repair-requests.jsonl.gz'));
const entries = gunzipSync(archiveBytes).toString('utf8').trim().split('\n').map(JSON.parse);

for (const [file, sourceBody, changedActorOrGrammar] of [
  ['long-v6-first-person-loss-v1.json', '我们还需要 3 个箱子。', 'Им'],
  ['long-v6-restart-grammar-v1.json', '设备已经关闭，不需要重新启动。', 'необходимо перезапускать не нужно'],
]) {
  test(`${file} retains the minimal failure and related model controls`, async () => {
    const pack = JSON.parse(await fs.readFile(path.join(regressions, file)));
    assert.equal(pack.schema_version, 1);
    assert.equal(pack.status.startsWith('open_'), true);
    assert.equal(pack.human_review, 'missing');
    assert.equal(pack.source_journal_sha256, digest(archiveBytes));
    const failure = entries.find(row => row.cue_id === pack.failure.cue_id &&
      row.seed === pack.failure.seed);
    assert(failure);
    assert.equal(failure.request_sha256, pack.failure.request_sha256);
    assert.equal(failure.source_zh, pack.failure.source_zh);
    assert.equal(failure.accepted_candidate, pack.failure.accepted_ru);
    assert(failure.source_zh.includes(sourceBody));
    assert(failure.accepted_candidate.includes(changedActorOrGrammar));
    for (const related of pack.related_controls) {
      const row = entries.find(candidate => candidate.cue_id === related.cue_id &&
        candidate.seed === related.seed);
      assert(row, `missing related ${related.cue_id}/${related.seed}`);
      assert(row.source_zh.includes(sourceBody));
    }
    assert.equal(new Set(pack.related_controls.map(row => `${row.cue_id}/${row.seed}`)).size,
      pack.related_controls.length);
    assert(pack.negative_controls.some(row =>
      row.expected_actor_error === true || row.expected_fluency_error === true));
    assert(pack.negative_controls.some(row =>
      row.expected_actor_error === false || row.expected_fluency_error === false));
    assert.equal(new Set(pack.negative_controls.map(row => row.id)).size,
      pack.negative_controls.length);
  });
}

test('code-only insertion preserves the first-person and grammar failures', () => {
  for (const [cue, seeds, wrong] of [
    [3, [101, 202], 'Им также нужно 3 коробки.'],
    [1019, [202], 'Им также нужно 3 коробки.'],
    [1022, [101, 202], 'необходимо перезапускать не нужно'],
  ]) for (const seed of seeds) {
    const row = entries.find(entry => entry.cue_id === cue && entry.seed === seed);
    assert(row);
    assert(row.accepted_candidate.includes(wrong));
    if (row.review_flag) assert.equal(row.accepted_candidate,
      `AUR-${String(cue).padStart(4, '0')}: ${row.restored_candidate}`);
  }
});
