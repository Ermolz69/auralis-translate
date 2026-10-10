import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { createReadStream } from 'node:fs';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

async function main() {
const mode = process.argv[2];
assert(['--preflight', '--head', '--acquire'].includes(mode));
assert.equal(process.argv.length, 3);

const repo = 'Qwen/Qwen3-8B-GGUF';
const revision = '7c41481f57cb95916b40956ab2f0b139b296d974';
const name = 'Qwen3-8B-Q4_K_M.gguf';
const expectedBytes = 5_027_783_488;
const expectedSha = 'd98cdcbd03e17ce47681435b5150e34c1417f50b5c0019dd560e4882c5745785';
const url = `https://huggingface.co/${repo}/resolve/${revision}/${name}`;
const modelRoot = process.env.AURALIS_MODEL_ASSET_ROOT;
assert(modelRoot && path.isAbsolute(modelRoot),
  'AURALIS_MODEL_ASSET_ROOT must be an absolute private workspace path');
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const planPath = path.join(root,
  'eval/experiments/2026-10-10-qwen3-8b-local-screen-plan.md');
const modelDir = path.join(modelRoot, '.cache/models');
const targetPath = path.join(modelDir, name);
const partialPath = `${targetPath}.part`;
const attemptDir = path.join(root,
  '.cache/eval/qwen3-8b-eval-acquisition');
const reportPath = path.join(attemptDir, 'attempt.json');
const sha = bytes => createHash('sha256').update(bytes).digest('hex');

const plan = await fs.readFile(planPath);
assert(plan.includes(Buffer.from(expectedSha)));
assert(plan.includes(Buffer.from(expectedBytes.toLocaleString('en-US'))));
const planSha = sha(plan);
const existing = await fs.stat(targetPath).catch(error => {
  if (error.code === 'ENOENT') return null;
  throw error;
});
if (existing) {
  assert.equal(existing.size, expectedBytes, 'Existing target size differs');
  const hash = createHash('sha256');
  for await (const chunk of createReadStream(targetPath)) hash.update(chunk);
  assert.equal(hash.digest('hex'), expectedSha, 'Existing target hash differs');
}
const volume = await fs.statfs(modelRoot);
const availableBytes = BigInt(volume.bavail) * BigInt(volume.bsize);
assert(existing || availableBytes > BigInt(expectedBytes * 2),
  'Insufficient free space for the one-attempt download');

if (mode === '--preflight') {
  console.log(JSON.stringify({ repo, revision, name, expectedBytes,
    expectedSha, planSha, existingVerified: Boolean(existing),
    freeGiB: Math.floor(Number(availableBytes) / 2 ** 30) }));
  return;
}

if (mode === '--head') {
  const response = await fetch(url, { method: 'HEAD',
    signal: AbortSignal.timeout(30_000), redirect: 'manual' });
  assert.equal(response.status, 302, 'Unexpected pinned-source redirect');
  assert.equal(response.headers.get('x-repo-commit'), revision);
  assert.equal(Number(response.headers.get('x-linked-size')), expectedBytes);
  assert.equal(response.headers.get('x-linked-etag')?.replaceAll('"', ''),
    expectedSha);
  console.log(JSON.stringify({ status: response.status,
    repoCommit: revision, linkedBytes: expectedBytes, linkedSha: expectedSha }));
  await response.body?.cancel();
  return;
}

assert(!existing, 'Pinned model was already acquired');
assert(!(await fs.stat(partialPath).catch(error => {
  if (error.code === 'ENOENT') return null;
  throw error;
})), 'Prior partial download exists; a new experiment must be declared');
await fs.mkdir(attemptDir, { recursive: true });
await fs.mkdir(modelDir, { recursive: true });
const report = {
  schema_version: 1, experiment: 'qwen3-8b-q4-acquisition-2026-10-10-v1',
  status: 'running', started_at: new Date().toISOString(),
  source_repo: repo, revision, source_url: url, file_name: name,
  expected_bytes: expectedBytes, expected_sha256: expectedSha,
  plan_sha256: planSha, attempt_limit: 1, retry_count: 0,
  timeout_ms: 600_000, received_bytes: 0, received_sha256: null,
  http_status: null, failure: null,
};
const reportFile = await fs.open(reportPath, 'wx');
await reportFile.writeFile(`${JSON.stringify(report, null, 2)}\n`);
await reportFile.sync();
await reportFile.close();
const started = performance.now();
const update = () => fs.writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`);
const hash = createHash('sha256');
let partial;
try {
  partial = await fs.open(partialPath, 'wx');
  const response = await fetch(url, {
    signal: AbortSignal.timeout(report.timeout_ms),
  });
  report.http_status = response.status;
  assert.equal(response.status, 200);
  assert(response.body, 'No response body');
  const declaredLength = Number(response.headers.get('content-length'));
  if (Number.isFinite(declaredLength) && declaredLength > 0)
    assert.equal(declaredLength, expectedBytes);
  let nextProgress = 512 * 2 ** 20;
  for await (const chunk of response.body) {
    report.received_bytes += chunk.length;
    assert(report.received_bytes <= expectedBytes, 'Response exceeded byte cap');
    hash.update(chunk);
    await partial.write(chunk);
    if (report.received_bytes >= nextProgress) {
      console.log(`Qwen3 pinned bytes: ${report.received_bytes}/${expectedBytes}`);
      nextProgress += 512 * 2 ** 20;
    }
  }
  await partial.sync();
  await partial.close();
  partial = null;
  report.received_sha256 = hash.digest('hex');
  assert.equal(report.received_bytes, expectedBytes, 'Response was truncated');
  assert.equal(report.received_sha256, expectedSha, 'Pinned SHA-256 mismatch');
  await fs.rename(partialPath, targetPath);
  report.status = 'acquired_verified_private';
} catch (error) {
  report.status = 'failed_retained';
  report.failure = String(error);
  process.exitCode = 1;
} finally {
  if (partial) await partial.close();
  report.finished_at = new Date().toISOString();
  report.elapsed_ms = Math.round(performance.now() - started);
  await update();
  console.log(JSON.stringify({ status: report.status,
    received_bytes: report.received_bytes,
    elapsed_ms: report.elapsed_ms, failure: report.failure }));
}
}

await main();
