import assert from 'node:assert/strict';
import test from 'node:test';
import { validateCrossInventorySourceGroups } from '../cross-inventory-source-groups.mjs';

const source = (id, group_id, split) => ({ id, group_id, split });
const inventory = (...sources) => ({ sources });

test('identical subtitle bytes cannot be assigned to unrelated groups', () => {
  const sha256 = 'a'.repeat(64);
  assert.throws(() => validateCrossInventorySourceGroups([
    inventory({ ...source('version-a', 'group-a', 'development'), sha256 }),
    inventory({ ...source('version-b', 'group-b', 'holdout'), sha256 }),
  ]), /identical subtitle bytes/u);
});

test('identical subtitle bytes cannot inflate one group with a second record', () => {
  const sha256 = 'a'.repeat(64);
  assert.throws(() => validateCrossInventorySourceGroups([
    inventory({ ...source('version-a', 'group-a', 'unassigned'), sha256 }),
    inventory({ ...source('version-b', 'group-a', 'unassigned'), sha256 }),
  ]), /identical subtitle bytes/u);
});

test('one YouTube video cannot hide behind watch and short URLs', () => {
  assert.throws(() => validateCrossInventorySourceGroups([
    inventory({ ...source('original', 'group-a', 'development'),
      media_url: 'https://www.youtube.com/watch?v=73XUeYRFsZU' }),
    inventory({ ...source('derivative', 'group-b', 'holdout'),
      original_media_url: 'https://youtu.be/73XUeYRFsZU' }),
  ]), /same media item/u);
});

test('the same Commons media cannot be split under changed subtitle bytes', () => {
  const media_url = 'https://commons.wikimedia.org/wiki/File:Example.webm';
  assert.throws(() => validateCrossInventorySourceGroups([
    inventory({ ...source('track-a', 'group-a', 'development'), sha256: 'a'.repeat(64), media_url }),
    inventory({ ...source('track-b', 'group-b', 'holdout'), sha256: 'b'.repeat(64), media_url }),
  ]), /same media item/u);
});

test('related revisions may share media and change caption bytes within one group', () => {
  const media_url = 'https://commons.wikimedia.org/wiki/File:Example.webm';
  assert.deepEqual(validateCrossInventorySourceGroups([
    inventory({ ...source('track-a', 'group-a', 'unassigned'), sha256: 'a'.repeat(64), media_url }),
    inventory({ ...source('track-b', 'group-a', 'unassigned'), sha256: 'b'.repeat(64), media_url }),
  ]), { source_count: 2, group_count: 1 });
});

test('distinct media and metadata-only sources remain independent', () => {
  assert.deepEqual(validateCrossInventorySourceGroups([
    inventory({ ...source('a', 'group-a', 'development'), sha256: null,
      media_url: 'https://www.youtube.com/watch?v=73XUeYRFsZU' }),
    inventory({ ...source('b', 'group-b', 'holdout'), sha256: null,
      media_url: 'https://www.youtube.com/watch?v=VQyTbi74bmk' }),
  ]), { source_count: 2, group_count: 2 });
});

test('alternate subtitle versions stay in one unassigned group', () => {
  assert.deepEqual(validateCrossInventorySourceGroups([
    inventory(source('commons-kirin', 'kirin', 'unassigned')),
    inventory(source('youtube-kirin', 'kirin', 'unassigned')),
  ]), { source_count: 2, group_count: 1 });
});

test('related versions cannot cross development and holdout inventories', () => {
  assert.throws(() => validateCrossInventorySourceGroups([
    inventory(source('commons-kirin', 'kirin', 'development')),
    inventory(source('youtube-kirin', 'kirin', 'holdout')),
  ]), /crosses inventory splits/);
});

test('reused source IDs cannot inflate inspected source counts', () => {
  assert.throws(() => validateCrossInventorySourceGroups([
    inventory(source('kirin', 'group-a', 'unassigned')),
    inventory(source('kirin', 'group-b', 'unassigned')),
  ]), /appears in multiple inventories/);
});

test('distinct sources and groups preserve their independent splits', () => {
  assert.deepEqual(validateCrossInventorySourceGroups([
    inventory(source('kirin', 'group-a', 'development')),
    inventory(source('vivo', 'group-b', 'holdout')),
  ]), { source_count: 2, group_count: 2 });
});
