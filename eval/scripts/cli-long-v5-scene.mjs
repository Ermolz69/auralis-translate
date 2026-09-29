import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { digest } from './flores-file-fixture.mjs';
import { runLongFormat } from './run-long-format.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const serverPath = process.env.AURALIS_TEST_LLAMA_SERVER;
const modelPath = process.env.AURALIS_TEST_GGUF;
assert.equal(process.platform, 'win32');
assert(serverPath && path.isAbsolute(serverPath));
assert(modelPath && path.isAbsolute(modelPath));
const executable = path.join(root, 'target/release/auralis-translation-cli.exe');
const profilePath = path.join(root, 'models/manifests/hy_mt2_1_8b_q4_k_m.context_v5_scene.experimental.json');
const configBytes = await fs.readFile(path.join(root, 'eval/fixtures/long-file-v1.json'));
const config = JSON.parse(configBytes);
assert.equal(config.cue_count, 1024);
const profileBytes = await fs.readFile(profilePath);
for (const file of [serverPath, modelPath, executable, profilePath]) assert((await fs.stat(file)).isFile(), `Missing ${file}`);
const parent = path.join(root, '.cache/eval/long-v5-scene-runs');
await fs.mkdir(parent, { recursive: true });
const workspace = await fs.mkdtemp(path.join(parent, 'recovery-'));
await fs.writeFile(path.join(workspace, 'fixture-manifest.json'), configBytes, { flag: 'wx' });
console.log(`Local v5 long-scene workspace: ${workspace}`);
const sceneEndIds = Array.from({ length: 8 }, (_, index) => (index + 1) * 128);
const report = await runLongFormat({
  root, workspace: path.join(workspace, 'srt'), format: 'srt', config,
  configSha256: digest(configBytes), executable, profileBytes,
  serverPath, modelPath, gpuLayers: 99, ramCacheMiB: 0,
  sceneEndIds, totalBudgetMs: 1_800_000,
});
await fs.writeFile(path.join(workspace, 'summary.json'), `${JSON.stringify({
  schema_version: 1, created_at: new Date().toISOString(), experiment: 'long-v5-scene-1024-v1',
  report_sha256: digest(await fs.readFile(path.join(workspace, 'srt/report.json'))),
  source_sha256: report.source_sha256, output_sha256: report.output_sha256,
  scene_map_sha256: report.scene_map_sha256, profile_sha256: report.profile_sha256,
  cue_count: report.cue_count, text_slot_count: report.text_slot_count,
  interrupted_blocks: report.interrupted_blocks, planned_blocks: report.planned_blocks,
  quality_verdict: 'unreviewed', subtitle_holdout: false,
}, null, 2)}\n`, { flag: 'wx' });
console.log(`V5 1,024-cue recovery probe passed; report: ${path.join(workspace, 'srt/report.json')}`);
