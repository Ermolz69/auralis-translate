import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { gunzipSync } from 'node:zlib';
import { digest } from '../flores-file-fixture.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const pack = JSON.parse(await fs.readFile(path.join(root,
  'eval/regressions/long-v6-neighbor-content-v1.json')));
const reportBytes = await fs.readFile(path.join(root,
  'eval/reports/2026-09-29-long-v6-postlength-v2-report.json'));
const journalBytes = await fs.readFile(path.join(root,
  'eval/reports/2026-09-29-long-v6-postlength-v2-journal.json.gz'));
const report = JSON.parse(reportBytes);
const journal = JSON.parse(gunzipSync(journalBytes));

assert.equal(pack.id, 'REG-010');
assert.equal(digest(reportBytes), pack.source_report_sha256);
assert.equal(digest(journalBytes), pack.source_journal_sha256);
assert.equal(report.profile_sha256, pack.affected_profile_sha256);
assert.equal(pack.human_review, 'missing');
assert.equal(pack.release_gate, 'open');

function archivedCue(id, requestSha) {
  const rows = journal.requests.filter(row => row.segment_id === id
    && row.line_index === 0 && row.request_kind === 'chat_completion');
  assert.equal(rows.length, 1);
  const row = rows[0];
  assert.equal(row.request_sha256, requestSha);
  assert.equal(row.outcome, 'validated_line');
  const request = JSON.parse(row.rendered_request);
  const prompt = request.messages[0].content;
  const input = JSON.parse(prompt.slice(prompt.indexOf('Input JSON:\n') + 'Input JSON:\n'.length));
  assert.equal(input.target_slots.length, 1);
  assert.equal(input.target_slots[0].segment_id, id);
  assert.equal(input.target_slots[0].line_index, 0);
  assert.equal(input.source_context.length, 1);
  const raw = JSON.parse(row.raw_response);
  assert.equal(raw.choices[0].finish_reason, 'stop');
  const candidate = JSON.parse(raw.choices[0].message.content).translations[0];
  assert.equal(candidate.segment_id, id);
  assert.equal(candidate.line_index, 0);
  assert.equal(candidate.text, row.restored_candidate);
  return { row, input, candidate };
}

const failure = archivedCue(pack.failure.segment_id, pack.failure.request_sha256);
assert.equal(failure.input.target_slots[0].source_original, pack.failure.source_zh);
assert.equal(failure.input.source_context[0].lines[0], pack.failure.next_context_zh);
assert.equal(failure.candidate.text, pack.failure.accepted_ru);
assert(!failure.candidate.text.includes(pack.failure.required_time));
assert(failure.candidate.text.includes('AUR-0130'));
assert(failure.candidate.text.includes('Не открывайте эту дверь'));
assert.equal(failure.row.prompt_tokens, 253);
assert.equal(failure.row.completion_tokens, 46);
assert.equal(failure.row.elapsed_ms, 2531);
const accepted = report.identifier_violations.find(row => row.segment_id === 129);
assert.equal(accepted.candidate_ru, pack.failure.accepted_ru);

for (const control of pack.related_controls.filter(row => row.segment_id)) {
  const observed = archivedCue(control.segment_id, control.request_sha256);
  assert(observed.input.target_slots[0].source_original.includes(control.expected_clock_time));
  assert.equal(observed.input.source_context[0].segment_id, control.segment_id + 1);
  assert(observed.input.source_context[0].lines[0].includes('不要打开这扇门'));
  assert(observed.candidate.text.includes(control.expected_clock_time));
  assert(observed.candidate.text.includes(`AUR-${String(control.segment_id).padStart(4, '0')}`));
  assert(!observed.candidate.text.includes('Не открывайте эту дверь'));
}

const timeValues = text => [...text.matchAll(/(?<![A-Za-z0-9_])([01]?\d|2[0-3]):([0-5]\d)(?![A-Za-z0-9_])/gu)]
  .map(match => `${Number(match[1])}:${match[2]}`).sort();
for (const control of [...pack.related_controls, ...pack.negative_controls]
  .filter(row => row.id)) {
  assert.equal(JSON.stringify(timeValues(control.source_zh)) !==
    JSON.stringify(timeValues(control.candidate_ru)), control.expected_warning, control.id);
}
assert.equal(pack.related_controls.length, 6);
assert.equal(pack.negative_controls.length, 4);
