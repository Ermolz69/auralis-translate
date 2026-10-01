import assert from 'node:assert/strict';

export function validateReleaseCliReceipt(receipt, current) {
  assert.equal(receipt.schema_version, 1);
  assert.equal(receipt.build_task, 'task build:release');
  assert.equal(receipt.guard_task, 'task test:context-v6');
  assert.equal(receipt.source_tree_sha256, current.source_tree_sha256,
    'Source file tree differs from the recorded build');
  assert.equal(receipt.source_file_count, current.source_file_count,
    'Source file count differs from the recorded build');
  assert.equal(receipt.binary_sha256, current.binary_sha256,
    'Release CLI differs from the recorded build');
}
