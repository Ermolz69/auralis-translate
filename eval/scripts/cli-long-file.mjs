import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { digest } from './flores-file-fixture.mjs';
import { runLongFormat } from './run-long-format.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

async function main() {
  assert.equal(process.platform, 'win32', 'This checked load probe currently targets Windows');
  const serverPath = process.env.AURALIS_TEST_LLAMA_SERVER;
  const modelPath = process.env.AURALIS_TEST_GGUF;
  assert(serverPath && path.isAbsolute(serverPath), 'Set absolute AURALIS_TEST_LLAMA_SERVER');
  assert(modelPath && path.isAbsolute(modelPath), 'Set absolute AURALIS_TEST_GGUF');
  const gpuLayers = Number(process.env.AURALIS_TEST_GPU_LAYERS ?? '0');
  assert(Number.isInteger(gpuLayers) && gpuLayers >= 0 && gpuLayers <= 999);
  const ramCacheMiB = process.env.AURALIS_TEST_RAM_CACHE_MIB === undefined ? undefined : Number(process.env.AURALIS_TEST_RAM_CACHE_MIB);
  assert(ramCacheMiB === undefined || (Number.isInteger(ramCacheMiB) && ramCacheMiB >= 0 && ramCacheMiB <= 512), 'RAM cache must be absent (upstream default) or 0–512 MiB');
  const executable = path.join(root, 'target/release/auralis-translation-cli.exe');
  const profilePath = path.join(root, 'models/manifests/hy_mt2_1_8b_q4_k_m.checked.experimental.json');
  for (const file of [serverPath, modelPath, executable, profilePath]) assert((await fs.stat(file)).isFile(), `Missing ${file}`);
  const profileBytes = await fs.readFile(profilePath);
  const configBytes = await fs.readFile(path.join(root, 'eval/fixtures/long-file-v1.json'));
  const config = JSON.parse(configBytes);
  const parent = path.join(root, '.cache/eval/long-file-runs');
  await fs.mkdir(parent, { recursive: true });
  const workspace = await fs.mkdtemp(path.join(parent, 'recovery-'));
  console.log(`Local long-file workspace: ${workspace}`);
  await fs.writeFile(path.join(workspace, 'fixture-manifest.json'), configBytes, { flag: 'wx' });
  const reports = [];
  for (const format of ['srt', 'vtt']) reports.push(await runLongFormat({ root, workspace: path.join(workspace, format), format, config, configSha256: digest(configBytes), executable, profileBytes, serverPath, modelPath, gpuLayers, ramCacheMiB }));
  await fs.writeFile(path.join(workspace, 'summary.json'), `${JSON.stringify({ schema_version: 1, created_at: new Date().toISOString(), reports: reports.map(({ rows, resources, ...report }) => ({ ...report, resource_samples: resources.samples.length })), quality_verdict: 'unreviewed', subtitle_holdout: false }, null, 2)}\n`, { flag: 'wx' });
  console.log(`Both long-file recovery probes passed. Full source/reference/candidate and resource reports remain local at ${workspace}`);
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
