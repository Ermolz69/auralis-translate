import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { gunzipSync } from 'node:zlib';
import { digest } from '../flores-file-fixture.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const pack = JSON.parse(await fs.readFile(path.join(root,
  'eval/regressions/long-v6-singular-door-v1.json')));
const reportBytes = await fs.readFile(path.join(root,
  'eval/reports/2026-09-29-long-v6-code-model-screen-report.json'));
const journalBytes = await fs.readFile(path.join(root,
  'eval/reports/2026-09-29-long-v6-code-model-screen-requests.jsonl.gz'));
assert.equal(digest(reportBytes), pack.source_report_sha256);
assert.equal(digest(journalBytes), pack.source_journal_sha256);
const report = JSON.parse(reportBytes);
const journal = gunzipSync(journalBytes).toString('utf8').trim().split('\n').map(JSON.parse);
assert.equal(pack.id, 'REG-011');
assert.equal(pack.human_review, 'missing');
assert.equal(pack.release_gate, 'open');
assert.equal(report.identity.models.find(row => row.key === '7b').model_sha256,
  pack.affected_model_sha256);
assert.equal(journal.length, 162);

function archivedCue(model, cueId, seed) {
  const rows = journal.filter(row => row.model === model && row.cue_id === cueId
    && row.seed === seed);
  assert.equal(rows.length, 1);
  const row = rows[0];
  assert.equal(digest(Buffer.from(JSON.stringify(row.request))), row.request_sha256);
  const prompt = row.request.messages[0].content;
  const input = JSON.parse(prompt.slice(prompt.indexOf('Input JSON:\n') +
    'Input JSON:\n'.length));
  assert.equal(input.target_slots[0].source_original, row.source_zh);
  assert.equal(input.target_slots[0].segment_id, cueId);
  assert.equal(input.target_slots[0].line_index, 0);
  const raw = JSON.parse(row.raw_response);
  const candidate = JSON.parse(raw.choices[0].message.content).translations[0];
  assert.equal(candidate.segment_id, cueId);
  assert.equal(candidate.line_index, 0);
  assert.equal(candidate.text, row.accepted_candidate);
  assert.equal(row.structural_outcome, 'valid_unreviewed');
  assert.equal(row.http_status, 200);
  return row;
}

const cases = [pack.failure, ...pack.related_controls];
assert.equal(cases.length, 12);
assert.equal(new Set(cases.map(row => `${row.cue_id}:${row.seed}`)).size, 12);
assert.deepEqual([...new Set(cases.map(row => row.cue_id))].sort((a, b) => a - b),
  [2, 130, 506, 1018]);
assert.deepEqual([...new Set(cases.map(row => row.seed))], [101, 202, 303]);
for (const item of cases) {
  const large = archivedCue('7b', item.cue_id, item.seed);
  const small = archivedCue('1b', item.cue_id, item.seed);
  assert.equal(large.source_zh, small.source_zh);
  const matched = structuredClone(large.request);
  matched.model = small.request.model;
  assert.deepEqual(matched, small.request);
  assert(large.source_zh.includes('这扇门'));
  assert(!large.source_zh.includes('这些门'));
  assert.match(large.accepted_candidate, /эти двери/iu);
  assert.doesNotMatch(large.accepted_candidate, /эту дверь/iu);
  assert.match(small.accepted_candidate, /эту дверь/iu);
  assert.doesNotMatch(small.accepted_candidate, /эти двери/iu);
}
const failure = archivedCue('7b', pack.failure.cue_id, pack.failure.seed);
assert.equal(failure.request_sha256, pack.failure.request_sha256);
assert.equal(failure.source_zh, pack.failure.source_zh);
assert.equal(failure.accepted_candidate, pack.failure.accepted_ru);

const fixturePluralError = row => row.source_zh.includes('这扇门') &&
  /эти двери/iu.test(row.candidate_ru);
for (const control of pack.negative_controls) {
  assert.equal(fixturePluralError(control), control.expected_plural_error, control.id);
}
assert.equal(pack.negative_controls.length, 4);
console.log('REG-011 verified: 12 archived 7B plural failures, 12 matched 1.8B singular controls and 4 fixture controls.');
