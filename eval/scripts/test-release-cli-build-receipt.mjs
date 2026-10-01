import assert from 'node:assert/strict';
import { validateReleaseCliReceipt } from './release-cli-receipt-contract.mjs';

const receipt = { schema_version: 1, build_task: 'task build:release',
  guard_task: 'task test:context-v6', source_tree_sha256: 'source-a',
  source_file_count: 2,
  binary_sha256: 'binary-a' };
const current = { source_tree_sha256: 'source-a', source_file_count: 2,
  binary_sha256: 'binary-a' };
validateReleaseCliReceipt(receipt, current);
assert.throws(() => validateReleaseCliReceipt(receipt,
  { ...current, source_tree_sha256: 'source-b' }), /Source file tree differs/u);
assert.throws(() => validateReleaseCliReceipt(receipt,
  { ...current, source_file_count: 3 }), /Source file count differs/u);
assert.throws(() => validateReleaseCliReceipt(receipt,
  { ...current, binary_sha256: 'binary-b' }), /Release CLI differs/u);
assert.throws(() => validateReleaseCliReceipt({ ...receipt, guard_task: 'none' }, current),
  /Expected values to be strictly equal/u);
console.log('Release CLI receipt accepts matching identities and rejects source drift, changed source count, binary drift, and missing guard task.');
