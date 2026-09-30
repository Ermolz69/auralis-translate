import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';

const root = path.resolve('.');
const run = path.join(root, '.cache/eval/commons-ying-full-7b-srt-guard-v1/run-Vod8D2');
const digest = bytes => createHash('sha256').update(bytes).digest('hex');
const reportBytes = fs.readFileSync(path.join(run, 'report.json'));
assert.equal(digest(reportBytes), '97d6a0269bd0890e2221a24c8852add2e60b8b065daca3df9913a7a4e68480cc');
const report = JSON.parse(reportBytes);
assert.equal(report.status, 'passed_structural_probe');
assert.equal(report.offline_reexport, 'byte_identical');
assert.equal(report.source_cues, 93);
assert.equal(report.run_status.state, 'validated');
assert.equal(report.requests.length, 282);
const chats = report.requests.filter(row => row.path === '/v1/chat/completions');
assert.equal(chats.length, 93);
const sourceBytes = fs.readFileSync(path.join(root, '.cache/eval/commons-ying-1238607314/source.zh.srt'));
const outputBytes = fs.readFileSync(path.join(run, 'candidate.ru.srt'));
assert.equal(digest(sourceBytes), report.source_sha256);
assert.equal(digest(outputBytes), report.output_sha256);
assert.equal(report.output_sha256, 'a5aa5054ba63f816959552580600c0d5ec40c991a0deaf3a656e879fc68cf18b');
const blocks = bytes => bytes.toString('utf8').trim().split(/\r?\n\r?\n/u);
const source = blocks(sourceBytes);
const output = blocks(outputBytes);
assert.equal(source.length, 93);
assert.equal(output.length, 93);
const windowHash = (rows, start, end) => digest(Buffer.from(rows.slice(start - 1, end).join('\n\n')));
const checkWindow = row => {
  assert(row.cue_start >= 1 && row.cue_end <= 93 && row.cue_start <= row.cue_end);
  assert.equal(windowHash(source, row.cue_start, row.cue_end), row.source_window_sha256);
  assert.equal(windowHash(output, row.cue_start, row.cue_end), row.target_window_sha256);
  if (row.focus_cue !== undefined) {
    const chat = chats[row.focus_cue - 1];
    assert.equal(chat.request_sha256, row.request_sha256);
    assert.equal(digest(Buffer.from(chat.raw_response)), row.raw_response_sha256);
  }
};
for (const file of ['natural-ying-boundary-facts-v1.json', 'natural-ying-negation-v1.json']) {
  const pack = JSON.parse(fs.readFileSync(path.join(root, 'eval/regressions', file)));
  assert.equal(pack.source_sha256, report.source_sha256);
  assert.equal(pack.output_sha256, report.output_sha256);
  assert.equal(pack.private_reproducer.report_sha256, digest(reportBytes));
  for (const row of pack.private_reproducer.windows ?? [pack.private_reproducer]) checkWindow(row);
  if (pack.private_reproducer.same_source_intact_name_control)
    checkWindow(pack.private_reproducer.same_source_intact_name_control);
}
const db = new DatabaseSync(path.join(run, 'state/auralis-translate.sqlite'), { readOnly: true });
try {
  assert.equal(db.prepare('SELECT count(*) AS n FROM block_checkpoints').get().n, 93);
  assert.equal(db.prepare('SELECT count(*) AS n FROM results').get().n, 1);
} finally { db.close(); }
console.log('Ying guarded candidate verified: 93/93 and one result; exact private boundary and polarity reproductions retained; human review missing.');
