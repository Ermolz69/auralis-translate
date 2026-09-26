import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';

export function readRunSnapshot(dbPath, runId) {
  const db = new DatabaseSync(dbPath, { readOnly: true });
  try {
    db.exec('BEGIN');
    return {
      run: db.prepare('SELECT * FROM runs WHERE run_id = ?').get(runId),
      checkpoints: db.prepare('SELECT block_index, input_fingerprint, accepted_json, diagnostics_json, attempt_count, committed_at FROM block_checkpoints WHERE run_id = ? ORDER BY block_index').all(runId),
      attempts: db.prepare('SELECT attempt_id, ended_at, stop_reason FROM run_attempts WHERE run_id = ? ORDER BY attempt_id').all(runId),
      results: db.prepare('SELECT result_id, revision, output_sha256, review_state FROM results WHERE run_id = ? ORDER BY revision').all(runId),
      source: db.prepare('SELECT source_locator, source_sha256 FROM translations WHERE translation_id = (SELECT translation_id FROM runs WHERE run_id = ?)').get(runId),
    };
  } finally {
    db.close();
  }
}

export function assertSavedPrefix(before, after) {
  assert(after.checkpoints.length >= before.checkpoints.length, 'Saved progress went backwards');
  before.checkpoints.forEach((checkpoint, index) => {
    assert.equal(checkpoint.block_index, index, 'Committed checkpoints are not a contiguous prefix');
    assert.deepEqual(after.checkpoints[index], checkpoint, `Saved checkpoint ${index} was replaced`);
  });
}
