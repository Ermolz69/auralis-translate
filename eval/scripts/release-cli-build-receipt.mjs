import assert from 'node:assert/strict';
import { createHash, randomUUID } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateReleaseCliReceipt } from './release-cli-receipt-contract.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const mode = process.argv[2];
assert(['record', 'check'].includes(mode) && process.argv.length === 3,
  'Use record or check');
const sourcePaths = ['Cargo.toml', 'Cargo.lock', 'Taskfile.yml', 'crates', 'models'];
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const sourceFiles = [];
async function visit(relative) {
  const file = path.join(root, relative);
  const stat = await fs.lstat(file);
  assert(!stat.isSymbolicLink(), `Unexpected source symlink: ${relative}`);
  if (stat.isDirectory()) {
    for (const name of (await fs.readdir(file)).sort()) await visit(path.join(relative, name));
  } else {
    assert(stat.isFile(), `Unexpected source entry: ${relative}`);
    sourceFiles.push([relative.replaceAll('\\', '/'), sha(await fs.readFile(file))]);
  }
}
for (const sourcePath of sourcePaths) await visit(sourcePath);
assert(sourceFiles.some(([name]) => name ===
  'crates/auralis-translation-llamacpp/src/target_text_json_tail.rs'));
const sourceTreeSha256 = sha(Buffer.from(sourceFiles
  .map(([name, hash]) => `${name}\0${hash}\n`).join(''), 'utf8'));
const gitHead = (await fs.readFile(path.join(root, '.git/HEAD'), 'utf8')).trim();
assert(gitHead.startsWith('ref: refs/heads/'), 'Expected a named local branch');
const commit = (await fs.readFile(path.join(root, '.git', gitHead.slice(5)), 'utf8')).trim();
assert(/^[0-9a-f]{40}$/u.test(commit));
const binary = path.join(root, 'target/release/auralis-translation-cli.exe');
const binarySha256 = sha(await fs.readFile(binary));
const parent = path.join(root, '.cache/eval/release-cli-build-receipts');
if (mode === 'record') {
  await fs.mkdir(parent, { recursive: true });
  const file = `receipt-${randomUUID()}.json`;
  const receipt = {
    schema_version: 1,
    recorded_at: new Date().toISOString(),
    build_task: 'task build:release',
    guard_task: 'task test:context-v6',
    source_commit: commit,
    source_tree_sha256: sourceTreeSha256,
    source_file_count: sourceFiles.length,
    binary_sha256: binarySha256,
  };
  const bytes = Buffer.from(`${JSON.stringify(receipt, null, 2)}\n`);
  await fs.writeFile(path.join(parent, file), bytes, { flag: 'wx' });
  await fs.writeFile(path.join(parent, 'latest.txt'), `${file}\n`);
  console.log(JSON.stringify({ receipt: path.join(parent, file),
    receipt_sha256: sha(bytes), source_commit: receipt.source_commit,
    source_tree_sha256: sourceTreeSha256, source_file_count: sourceFiles.length,
    binary_sha256: binarySha256 }, null, 2));
} else {
  const name = (await fs.readFile(path.join(parent, 'latest.txt'), 'utf8')).trim();
  assert(/^receipt-[0-9a-f-]+\.json$/u.test(name), 'Invalid build receipt locator');
  const bytes = await fs.readFile(path.join(parent, name));
  const receipt = JSON.parse(bytes);
  validateReleaseCliReceipt(receipt, { source_tree_sha256: sourceTreeSha256,
    source_file_count: sourceFiles.length, binary_sha256: binarySha256 });
  console.log(JSON.stringify({ receipt: path.join(parent, name),
    receipt_sha256: sha(bytes), source_commit: receipt.source_commit,
    source_tree_sha256: sourceTreeSha256, source_file_count: sourceFiles.length,
    binary_sha256: binarySha256 }, null, 2));
}
