import assert from 'node:assert/strict';
import { createHash, randomUUID } from 'node:crypto';
import { createReadStream } from 'node:fs';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { startProcess, stopProcess } from './local-process.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const TIMEOUT_MS = 300_000;
const assetDir = process.env.AURALIS_PACKAGE_PROBE_ASSET_DIR;
assert(assetDir && path.isAbsolute(assetDir), 'Supply an absolute existing verified asset cache');
const executable = path.join(root, 'target/release/auralis-translation-cli.exe');
const manifestPath = path.join(root, 'models/releases/hy_mt2_1_8b_q4_k_m.windows_x64_cpu.experimental.json');
const profilePath = path.join(root, 'models/manifests/hy_mt2_1_8b_q4_k_m.checked.experimental.json');
const manifest = JSON.parse(await fs.readFile(manifestPath, 'utf8'));
const profile = JSON.parse(await fs.readFile(profilePath, 'utf8'));
const variant = manifest.runtime.variants.find((variant) => variant.backend === 'cpu');
assert(variant, 'Pinned CPU variant is missing');
const assets = [manifest.model.file, manifest.model.license.notice, manifest.runtime.license.notice, variant.archive, ...(variant.companions ?? [])];
const workspace = path.join(root, '.cache', 'eval', `cli-package-${randomUUID()}`);
await fs.mkdir(workspace, { recursive: true });

async function hashFile(file) {
  const hash = createHash('sha256');
  for await (const chunk of createReadStream(file)) hash.update(chunk);
  return hash.digest('hex');
}

async function verifyAsset(event, expected, verified, total) {
  assert.equal(event.event, 'asset_cached');
  assert.equal(event.filename, expected.filename);
  assert.equal(event.bytes, expected.bytes);
  assert.equal(event.sha256, expected.sha256);
  assert.equal(event.verified_assets, verified);
  assert.equal(event.total_assets, total);
  assert.equal((await fs.stat(event.path)).size, expected.bytes);
  assert.equal(await hashFile(event.path), expected.sha256);
}

const calls = [];
async function cli(command, extra, mode, expectedExit = 0) {
  const name = `${calls.length + 1}-${command}`;
  const requestPath = path.join(workspace, `${name}.request.json`);
  await fs.writeFile(requestPath, JSON.stringify({ schema_version: 1, request: { command, manifest: manifestPath, profile: profilePath, backend: 'cpu', ...extra } }, null, 2), { flag: 'wx' });
  const child = startProcess(executable, [mode, '--request', requestPath], root);
  let timer;
  try {
    const ended = await Promise.race([child.ended, new Promise((_, reject) => { timer = setTimeout(() => reject(new Error('Package CLI timeout')), TIMEOUT_MS); })]);
    assert.equal(ended.code, expectedExit, `${command}: ${ended.error?.message ?? ended.signal ?? child.stderr}`);
    assert(!child.stdoutTruncated && !child.stderrTruncated, 'Package CLI capture was truncated');
    await fs.writeFile(path.join(workspace, `${name}.stdout`), child.stdout, { flag: 'wx' });
    await fs.writeFile(path.join(workspace, `${name}.stderr`), child.stderr, { flag: 'wx' });
    const output = mode === '--json' ? JSON.parse(child.stdout) : child.stdout.trim().split('\n').map((line) => JSON.parse(line));
    if (Array.isArray(output)) {
      output.forEach((event, index) => { assert.equal(event.schema_version, 1); assert.equal(event.sequence, index + 1); });
      assert.equal(output.filter((event) => ['completed', 'failed'].includes(event.event)).length, 1);
      assert(!output.some((event) => ['run_started', 'model_ready', 'result', 'progress'].includes(event.event)));
    } else {
      assert.equal(output.schema_version, 1);
      assert.equal(output.command, command);
      assert.equal(output.run, null);
      assert.equal(output.model, null);
      assert.equal(output.result, null);
    }
    const started = Array.isArray(output) ? output[0] : output.package;
    assert.equal(started.event, 'package_started');
    assert.equal(started.release_id, manifest.id);
    assert.equal(started.backend, 'cpu');
    assert.equal(started.manifest_sha256, await hashFile(manifestPath));
    assert.equal(started.profile_sha256, await hashFile(profilePath));
    const terminal = Array.isArray(output) ? output.at(-1) : output.terminal;
    assert.equal(terminal.event, expectedExit === 0 ? 'completed' : 'failed');
    if (expectedExit === 0) assert.equal(terminal.exit_code, 0);
    calls.push({ command, mode, expected_exit: expectedExit, request_file: path.basename(requestPath), stdout_file: `${name}.stdout`, terminal });
    return output;
  } finally {
    clearTimeout(timer);
    await stopProcess(child);
  }
}

async function verifyInstallation(receipt, installRoot) {
  assert.equal(receipt.event, 'package_installed');
  const expectedRoot = path.join(installRoot, manifest.id, 'cpu');
  assert.equal(path.resolve(receipt.root), expectedRoot);
  assert.equal(path.resolve(receipt.model_file), path.join(expectedRoot, 'model', manifest.model.file.filename));
  assert.equal(path.resolve(receipt.executable), path.join(expectedRoot, 'runtime', 'llama-server.exe'));
  assert.equal(path.resolve(receipt.profile_file), path.join(expectedRoot, 'profile.json'));
  assert.equal(await hashFile(receipt.model_file), profile.model_file_sha256);
  assert.equal((await fs.stat(receipt.model_file)).size, manifest.model.file.bytes);
  assert.equal(await hashFile(receipt.profile_file), await hashFile(profilePath));
  assert.equal(await hashFile(path.join(expectedRoot, 'release.json')), await hashFile(manifestPath));
  assert((await fs.stat(receipt.executable)).size > 0);
  for (const asset of [manifest.model.license.notice, manifest.runtime.license.notice]) {
    assert.equal(await hashFile(path.join(expectedRoot, 'notices', asset.filename)), asset.sha256);
  }
  assert.equal(await hashFile(path.join(expectedRoot, 'assets', variant.archive.filename)), variant.archive.sha256);
  return { root: expectedRoot, model_sha256: profile.model_file_sha256, executable_sha256: await hashFile(receipt.executable) };
}

try {
  for (const asset of assets) {
    const file = path.join(assetDir, asset.filename);
    assert.equal((await fs.stat(file)).size, asset.bytes);
    assert.equal(await hashFile(file), asset.sha256);
  }
  const fetched = await cli('fetch-release', { cache_dir: assetDir }, '--jsonl');
  const receipts = fetched.filter((event) => event.event === 'asset_cached');
  assert.equal(receipts.length, assets.length);
  for (let index = 0; index < assets.length; index++) await verifyAsset(receipts[index], assets[index], index + 1, assets.length);
  const selected = await cli('fetch-asset', { cache_dir: assetDir, filename: manifest.model.license.notice.filename }, '--json');
  await verifyAsset(selected.asset, manifest.model.license.notice, 1, 1);
  const offlineRoot = path.join(workspace, 'offline-packages');
  const offline = await cli('install-offline', { source_dir: assetDir, install_root: offlineRoot }, '--json');
  const offlinePackage = await verifyInstallation(offline.installation, offlineRoot);
  const onlineRoot = path.join(workspace, 'online-packages');
  const online = await cli('install-online', { cache_dir: assetDir, install_root: onlineRoot }, '--jsonl');
  const onlineReceipts = online.filter((event) => event.event === 'asset_cached');
  assert.equal(onlineReceipts.length, assets.length);
  for (let index = 0; index < assets.length; index++) await verifyAsset(onlineReceipts[index], assets[index], index + 1, assets.length);
  assert.equal(online.at(-2).event, 'package_installed');
  const onlinePackage = await verifyInstallation(online.at(-2), onlineRoot);
  const conflict = await cli('install-online', { cache_dir: assetDir, install_root: onlineRoot }, '--jsonl', 7);
  assert.equal(conflict.at(-1).code, 'conflict');
  assert.equal(conflict.filter((event) => event.event === 'asset_cached').length, assets.length);
  assert(!conflict.some((event) => event.event === 'package_installed'));
  assert.deepEqual(await verifyInstallation(online.at(-2), onlineRoot), onlinePackage);
  let noticeDownloaded = false;
  if (process.env.AURALIS_PACKAGE_PROBE_FETCH_NOTICE === '1') {
    const freshCache = path.join(workspace, 'fresh-notice-cache');
    const downloaded = await cli('fetch-asset', { cache_dir: freshCache, filename: manifest.model.license.notice.filename }, '--jsonl');
    assert.equal(downloaded.length, 3);
    await verifyAsset(downloaded[1], manifest.model.license.notice, 1, 1);
    assert(!(await fs.readdir(freshCache)).some((file) => file.includes('.part.')));
    noticeDownloaded = true;
  }
  const report = { schema_version: 1, created_at: new Date().toISOString(), workspace, cli_sha256: await hashFile(executable), manifest_sha256: await hashFile(manifestPath), profile_sha256: await hashFile(profilePath), model_sha256: profile.model_file_sha256, reused_verified_cache: true, upstream_notice_downloaded: noticeDownloaded, offline_package: offlinePackage, online_package: onlinePackage, calls, inference_started: false, clean_machine: false, quality_verdict: 'not_assessed' };
  await fs.writeFile(path.join(workspace, 'report.json'), JSON.stringify(report, null, 2), { flag: 'wx' });
  console.log(`Package machine protocol passed; retained evidence at ${workspace}`);
} catch (error) {
  await fs.writeFile(path.join(workspace, 'failure.json'), JSON.stringify({ created_at: new Date().toISOString(), message: error.message, calls }, null, 2));
  throw error;
}
