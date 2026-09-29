import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { gunzipSync } from 'node:zlib';
import { digest } from './flores-file-fixture.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const outputDir = path.join(root, 'eval/reports');
const stem = '2026-09-29-long-v6-scene';
const summary = JSON.parse(await fs.readFile(path.join(outputDir, `${stem}.json`)));
const reportBytes = await fs.readFile(path.join(outputDir, summary.report_file));
const journalGzip = await fs.readFile(path.join(outputDir, summary.journal_file));
assert.equal(digest(reportBytes), summary.report_sha256);
assert.equal(digest(journalGzip), summary.journal_gzip_sha256);
const report = JSON.parse(reportBytes);
const journal = JSON.parse(gunzipSync(journalGzip));
const ids = new Set();
for (const [first, last] of [[1, 8], [505, 512], [1017, 1024],
  [127, 129], [255, 257], [383, 385], [511, 513],
  [639, 641], [767, 769], [895, 897]]) {
  for (let id = first; id <= last; id += 1) ids.add(id);
}
assert.equal(ids.size, 43);
const rows = [...ids].sort((a, b) => a - b).map((id) => {
  const row = report.rows[id - 1];
  assert.equal(row.segment_id, id);
  const chats = journal.requests.filter((request) =>
    request.request_kind === 'chat_completion' && request.segment_id === id);
  for (const lineIndex of row.source_lines.keys()) {
    assert(chats.some((request) => request.line_index === lineIndex &&
      request.outcome === 'validated_line'), `No accepted chat for cue ${id} line ${lineIndex}`);
  }
  return {
    ...row,
    chat_attempts: chats.map((request) => ({
      sequence: request.sequence, request_id: request.request_id,
      line_index: request.line_index, outcome: request.outcome,
      rendered_request: request.rendered_request, raw_response: request.raw_response,
      restored_candidate: request.restored_candidate,
      prompt_tokens: request.prompt_tokens, completion_tokens: request.completion_tokens,
      elapsed_ms: request.elapsed_ms, error_detail: request.error_detail,
    })),
  };
});
const output = {
  schema_version: 1, experiment: summary.experiment,
  selection_plan: 'eval/experiments/2026-09-29-v6-editorial-sample-plan.md',
  selection_basis: 'fixed_source_position_and_scene_seams_before_model_output',
  reviewer_type: 'assistant_editorial_pending', human_review: 'missing',
  source_sha256: summary.source_sha256, output_sha256: summary.output_sha256,
  report_sha256: summary.report_sha256, journal_gzip_sha256: summary.journal_gzip_sha256,
  cue_count: rows.length, line_count: rows.reduce((sum, row) => sum + row.source_lines.length, 0),
  rows,
};
const destination = path.join(outputDir, '2026-09-29-long-v6-editorial-sample.json');
await fs.writeFile(destination, `${JSON.stringify(output, null, 2)}\n`, { flag: 'wx' });
console.log(`Extracted ${rows.length} frozen cues and ${output.line_count} lines with all raw chat attempts; no review verdict assigned`);
