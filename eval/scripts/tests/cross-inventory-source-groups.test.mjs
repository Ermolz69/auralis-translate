import assert from 'node:assert/strict';
import test from 'node:test';
import { validateCrossInventorySourceGroups } from '../cross-inventory-source-groups.mjs';

const source = (id, group_id, split) => ({ id, group_id, split });
const inventory = (...sources) => ({ sources });

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
