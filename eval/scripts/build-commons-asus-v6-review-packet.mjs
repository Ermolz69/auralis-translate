import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { digest } from './flores-file-fixture.mjs';

const root = path.resolve('.');
const workspace = path.join(root, '.cache/eval/commons-asus-full-v6-slot-v1/run-7XjHrR');
const sampleBytes = await fs.readFile(path.join(workspace, 'source-only-review-sample.json'));
assert.equal(digest(sampleBytes), '0e170fc7565291313b148fa7b8d74468ed48d6f1dce94a7ccbd2c745f98a0d83');
const sample = JSON.parse(sampleBytes);
const reportBytes = await fs.readFile(path.join(workspace, 'report.json'));
assert.equal(digest(reportBytes), '1d8addf0860cb88f0161ac6eeed3fc45351ab9912aaf0eff2b39a76772a26413');
const report = JSON.parse(reportBytes);
assert.equal(sample.source_sha256, report.source_sha256);
assert.equal(sample.candidate_sha256_for_later_review, report.output_sha256);
const chats = report.requests.filter(row => row.path === '/v1/chat/completions');
assert.equal(chats.length, 268);
const rows = sample.selected.map(item => {
  const chat = chats[item.id - 1];
  const envelope = JSON.parse(chat.request.messages[0].content.split('Input JSON:\n')[1]);
  assert.equal(envelope.target_slots[0].segment_id, item.id);
  assert.equal(envelope.target_slots[0].source_original, item.source_text);
  const raw = JSON.parse(chat.raw_candidate).translations[0];
  assert.equal(raw.segment_id, item.id);
  const accepted = report.accepted_lines[item.id - 1];
  return { id: item.id, tags: item.tags,
    source_text: item.source_text, source_text_sha256: item.source_text_sha256,
    context: envelope.source_context,
    raw_candidate: raw.text, raw_candidate_sha256: digest(Buffer.from(raw.text)),
    accepted_text: accepted, accepted_text_sha256: digest(Buffer.from(accepted)),
    request_sha256: chat.request_sha256,
    raw_response_sha256: digest(Buffer.from(chat.raw_response)),
    raw_envelope_sha256: digest(Buffer.from(chat.raw_candidate)),
    prompt_tokens: chat.usage.prompt_tokens,
    completion_tokens: chat.usage.completion_tokens,
    elapsed_ms: chat.elapsed_ms,
    expected_meaning: null, ai_review: null, human_review: null };
});
const packet = { schema_version: 1, id: 'commons-asus-v6-source-selected-review-v1',
  source_sha256: report.source_sha256, candidate_sha256: report.output_sha256,
  source_sample_sha256: digest(sampleBytes), full_run_report_sha256: digest(reportBytes),
  sample_count: rows.length, selected_ids: sample.selected_ids,
  scope: 'inspected_development_source', human_review_count: 0,
  rows };
const outputPath = path.join(workspace, 'review-packet.json');
await fs.writeFile(outputPath, `${JSON.stringify(packet, null, 2)}\n`, { flag: 'wx' });
console.log(`ASUS v6 private review packet: ${rows.length}/268 source-selected cues; SHA-256 ${digest(await fs.readFile(outputPath))}`);
