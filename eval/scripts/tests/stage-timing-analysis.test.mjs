import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { DatabaseSync } from 'node:sqlite';
import { statistics, summarizeDatabase, summarizeTiming } from '../stage-timing-analysis.mjs';

test('keeps missing usage out of timing and length distributions', () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'auralis-stage-timing-'));
  try {
    const file = path.join(directory, 'state.sqlite');
    const db = new DatabaseSync(file);
    db.exec(`CREATE TABLE inference_requests (
      sequence INTEGER PRIMARY KEY, request_kind TEXT, batch_fingerprint TEXT,
      rendered_request BLOB, raw_response BLOB, outcome TEXT,
      prompt_tokens INTEGER, completion_tokens INTEGER, elapsed_ms INTEGER);
      CREATE TABLE block_checkpoints (block_index INTEGER);
      CREATE TABLE results (result_id TEXT);`);
    const insert = db.prepare('INSERT INTO inference_requests VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)');
    const chat = (slots, maxTokens) => Buffer.from(JSON.stringify({
      max_tokens: maxTokens, messages: [{ content: `Input JSON:\n${JSON.stringify({
        target_slots: Array.from({ length: slots }, () => ({ text: 'source' })) })}` }],
    }));
    insert.run(1, 'count_input_tokens', 'a', Buffer.from('{}'), Buffer.from('{"input_tokens":9}'),
      'parsed_preflight_json', null, null, 4);
    insert.run(2, 'chat_completion', 'a', chat(4, 256),
      Buffer.from('{"choices":[{"finish_reason":"stop"}]}'), 'validated_batch', 80, 30, 120);
    insert.run(3, 'chat_completion', 'a', chat(2, 128), null,
      'transport_failure', null, null, 17);
    db.exec('INSERT INTO block_checkpoints VALUES (0)');
    db.close();
    const summary = summarizeDatabase(file);
    assert.equal(summary.chats, 2);
    assert.equal(summary.unique_batches, 1);
    assert.equal(summary.chats_per_batch.max, 2);
    assert.equal(summary.completion_tokens.count, 1);
    assert.equal(summary.completion_tokens.sum, 30);
    assert.equal(summary.completion_reserve_ratio.count, 1);
    assert.equal(summary.finish_reasons.missing, 1);
    assert.equal(summary.preflight_kinds.count_input_tokens, 1);
    assert.equal(summary.checkpoints, 1);
    assert.equal(summary.results, 0);
  } finally {
    fs.rmSync(directory, { recursive: true, force: true });
  }
});

test('defines nearest-rank quantiles and rejects malformed timing records', () => {
  assert.deepEqual(statistics([9, null, 2, 6, 4]),
    { count: 4, sum: 21, p50: 4, p95: 9, max: 9 });
  const timing = summarizeTiming([
    'auralis_eval_timing {"schema_version":1,"phase":"result_commit","elapsed_us":30,"outcome":"ok"}',
    'auralis_eval_timing {"schema_version":1,"phase":"result_commit","elapsed_us":45,"outcome":"failed"}',
  ].join('\n'));
  assert.equal(timing.record_count, 2);
  assert.equal(timing.phases.result_commit.failed, 1);
  assert.equal(timing.phases.result_commit.sum, 75);
  assert.throws(() => summarizeTiming(
    'auralis_eval_timing {"schema_version":1,"phase":"source","elapsed_us":-1,"outcome":"ok"}'));
});
