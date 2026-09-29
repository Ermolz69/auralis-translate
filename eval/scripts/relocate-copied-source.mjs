import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';

function sha256(bytes) {
  return createHash('sha256').update(bytes).digest('hex');
}

export async function relocateCopiedSource({ dbPath, runId, originalStateDir, copiedStateDir, expectedSourceSha256 }) {
  const db = new DatabaseSync(dbPath);
  try {
    const row = db.prepare(`SELECT t.translation_id, t.source_locator, t.source_sha256, t.source_format,
      r.source_sha256 AS run_source_sha256 FROM runs r
      JOIN translations t ON t.translation_id = r.translation_id WHERE r.run_id = ?`).get(runId);
    assert(row, 'Frozen run is missing');
    assert.equal(row.source_sha256, expectedSourceSha256);
    assert.equal(row.run_source_sha256, expectedSourceSha256);
    assert.equal(row.source_format, 'srt');
    const expectedName = `${row.translation_id}.${row.source_format}`;
    const originalRoot = await fs.realpath(path.join(originalStateDir, 'sources'));
    const oldSource = await fs.realpath(row.source_locator);
    assert.equal(path.dirname(oldSource).toLowerCase(), originalRoot.toLowerCase(), 'Stored source must be the original managed source');
    assert.equal(path.basename(oldSource), expectedName);
    const copiedRoot = await fs.realpath(path.join(copiedStateDir, 'sources'));
    const newSource = await fs.realpath(path.join(copiedRoot, expectedName));
    assert.equal(path.dirname(newSource).toLowerCase(), copiedRoot.toLowerCase(), 'Copied source escaped managed directory');
    assert.equal(sha256(await fs.readFile(oldSource)), expectedSourceSha256);
    assert.equal(sha256(await fs.readFile(newSource)), expectedSourceSha256);
    db.exec('BEGIN IMMEDIATE');
    try {
      const result = db.prepare('UPDATE translations SET source_locator = ? WHERE translation_id = ? AND source_locator = ?')
        .run(newSource, row.translation_id, row.source_locator);
      assert.equal(result.changes, 1);
      db.exec('COMMIT');
    } catch (error) {
      db.exec('ROLLBACK');
      throw error;
    }
    return { previousLocator: row.source_locator, copiedLocator: newSource, sourceSha256: expectedSourceSha256 };
  } finally {
    db.close();
  }
}
