import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { gunzipSync } from 'node:zlib';
import test from 'node:test';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const base = path.join(root, 'eval/reports/2026-09-29-long-v6-relocated-continuation-failure');
const reportBytes = await fs.readFile(`${base}.json`);
const journalCompressed = await fs.readFile(`${base}-journal.json.gz`);
const journalBytes = gunzipSync(journalCompressed);
const report = JSON.parse(reportBytes);
const journal = JSON.parse(journalBytes);
const regression = JSON.parse(await fs.readFile(path.join(root, 'eval/regressions/long-v6-length-repeat-v1.json')));
const hash = bytes => createHash('sha256').update(bytes).digest('hex');

test('REG-006: full raw failed response, accepted prefix and no result remain archived', () => {
  assert.equal(hash(reportBytes), regression.failure_report_sha256);
  assert.equal(hash(journalCompressed), regression.journal_gzip_sha256);
  assert.equal(hash(journalBytes), report.journal_uncompressed_sha256);
  assert.equal(report.saved_blocks, 982);
  assert.equal(journal.checkpoints.length, 982);
  assert.equal(report.original_request_count, 3619);
  assert.equal(report.new_request_count, 69);
  assert.equal(journal.requests.length, 3688);
  assert.equal(journal.run.state, 'failed');
  assert.equal(journal.attempts.at(-1).stop_reason, 'translation failed');
  assert.equal(report.results, 0);
  assert.equal(report.partial_output_present, false);
  const failed = journal.requests.at(-1);
  const raw = JSON.parse(failed.raw_response);
  assert.equal(failed.request_sha256, regression.reproduction.request_sha256);
  assert.equal(failed.segment_id, 983);
  assert.equal(failed.outcome, 'invalid_candidate');
  assert.equal(raw.choices[0].finish_reason, 'length');
  assert.equal(raw.usage.completion_tokens, 256);
  assert.equal(raw.choices[0].message.content, report.failed_request.raw_content);
  assert.match(raw.choices[0].message.content, /СЕСМЕНТ_ИД: 983, ЛИНИЯ_ИНДекс: 0/u);
  assert.match(raw.choices[0].message.content, /Все JSON-текст и контекст/u);
  assert.equal(failed.error_detail, 'llama.cpp did not finish the response');
  assert.equal(hash(Buffer.from(journal.source_srt_utf8)), report.source_sha256);
});

test('REG-006: failed model request has source context only, with no proposed reference', () => {
  const request = JSON.parse(journal.requests.at(-1).rendered_request);
  assert.equal(request.max_tokens, 256);
  assert.equal(request.response_format.schema.properties.translations.items.properties.segment_id.const, 983);
  const input = request.messages[0].content;
  assert(input.includes(regression.reproduction.source_zh));
  assert(input.includes(regression.reproduction.source_context_before_zh));
  for (const line of regression.reproduction.source_context_after_zh) assert(input.includes(line));
  assert.doesNotMatch(input, /\p{Script=Cyrillic}/u);
});

test('REG-006: related and negative source controls change day, speaker and assertion', () => {
  const cases = [regression.reproduction, ...regression.related_cases, regression.negative_control];
  assert.equal(new Set(cases.map(row => row.source_zh)).size, 4);
  assert.equal(regression.related_cases.length, 2);
  assert.match(regression.related_cases[0].source_zh, /后天/u);
  assert.match(regression.related_cases[1].source_zh, /阿华/u);
  assert.match(regression.negative_control.source_zh, /照常在今天举行/u);
});
