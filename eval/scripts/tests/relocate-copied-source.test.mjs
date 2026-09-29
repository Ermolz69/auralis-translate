import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import test from 'node:test';
import { relocateCopiedSource } from '../relocate-copied-source.mjs';

const bytes = Buffer.from('1\n00:00:00,000 --> 00:00:01,000\n\u4f60\u597d\n');
const hash = createHash('sha256').update(bytes).digest('hex');

async function fixture(t) {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'auralis-source-relocation-'));
  assert.equal(path.dirname(root), os.tmpdir());
  t.after(async () => {
    assert.equal(path.dirname(root), os.tmpdir());
    await fs.rm(root, { recursive: true, force: true });
  });
  const originalStateDir = path.join(root, 'original');
  const copiedStateDir = path.join(root, 'copy');
  await fs.mkdir(path.join(originalStateDir, 'sources'), { recursive: true });
  await fs.mkdir(path.join(copiedStateDir, 'sources'), { recursive: true });
  const name = 'translation-1.srt';
  const originalSource = path.join(originalStateDir, 'sources', name);
  const copiedSource = path.join(copiedStateDir, 'sources', name);
  await fs.writeFile(originalSource, bytes);
  await fs.writeFile(copiedSource, bytes);
  const dbPath = path.join(copiedStateDir, 'state.sqlite');
  const db = new DatabaseSync(dbPath);
  db.exec('CREATE TABLE translations (translation_id TEXT PRIMARY KEY, source_locator TEXT, source_sha256 TEXT, source_format TEXT); CREATE TABLE runs (run_id TEXT PRIMARY KEY, translation_id TEXT, source_sha256 TEXT)');
  db.prepare('INSERT INTO translations VALUES (?, ?, ?, ?)').run('translation-1', await fs.realpath(originalSource), hash, 'srt');
  db.prepare('INSERT INTO runs VALUES (?, ?, ?)').run('run-1', 'translation-1', hash);
  db.close();
  return { dbPath, originalStateDir, copiedStateDir, originalSource, copiedSource };
}

function locator(dbPath) {
  const db = new DatabaseSync(dbPath, { readOnly: true });
  try { return db.prepare('SELECT source_locator FROM translations').get().source_locator; }
  finally { db.close(); }
}

test('REG-005: a verified copied managed source receives only a new locator', async (t) => {
  const f = await fixture(t);
  const original = locator(f.dbPath);
  const result = await relocateCopiedSource({ ...f, runId: 'run-1', expectedSourceSha256: hash });
  assert.equal(result.previousLocator, original);
  assert.equal(locator(f.dbPath), await fs.realpath(f.copiedSource));
  assert.deepEqual(await fs.readFile(f.originalSource), bytes);
});

test('REG-005: altered copied bytes reject relocation without changing the locator', async (t) => {
  const f = await fixture(t);
  const original = locator(f.dbPath);
  await fs.writeFile(f.copiedSource, Buffer.from('changed'));
  await assert.rejects(relocateCopiedSource({ ...f, runId: 'run-1', expectedSourceSha256: hash }));
  assert.equal(locator(f.dbPath), original);
});

test('REG-005: a stored source outside the original managed directory rejects relocation', async (t) => {
  const f = await fixture(t);
  const other = path.join(path.dirname(f.originalStateDir), 'other.srt');
  await fs.writeFile(other, bytes);
  const db = new DatabaseSync(f.dbPath);
  db.prepare('UPDATE translations SET source_locator = ?').run(await fs.realpath(other));
  db.close();
  await assert.rejects(relocateCopiedSource({ ...f, runId: 'run-1', expectedSourceSha256: hash }), /original managed source/u);
  assert.equal(locator(f.dbPath), await fs.realpath(other));
});
