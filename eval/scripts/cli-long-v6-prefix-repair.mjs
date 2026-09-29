import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { createReadStream } from 'node:fs';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { digest } from './flores-file-fixture.mjs';
import { longFileFixture } from './long-file-fixture.mjs';
import { runLongFormat } from './run-long-format.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const runtimePath = process.env.AURALIS_TEST_LLAMA_SERVER;
const modelPath = process.env.AURALIS_TEST_GGUF;
const runtimeSha = '6f15be27bd80b6b4d52afefa49094e18fcfab55d5da354d717971f2d2537b2f4';
const modelSha = 'dc5f44fcf1fa496ee7ad725982c0c8c553a4de00259b53af84c4b89fb0c06699';
const fixtureSha = '0527cab3c4ea38aa91ae65c6f4e52103d7e0c5cde1ab778dc7e9da1a46c43986';
const sourceSha = 'e9b760bdcce97de9f29f5fe671dbb927088f5a15119ebe3200e73e0408391bb3';
const profileSha = 'e80c80b0cf1db26d62ce5f644091f30e42fea752d27a0ce201fcab33f29ecb69';
const totalBudgetMs = 2 * 60 * 60_000;
const sceneEndIds = Array.from({ length: 8 }, (_, index) => (index + 1) * 128);
const hashFile = async file => {
  const hash = createHash('sha256');
  for await (const chunk of createReadStream(file)) hash.update(chunk);
  return hash.digest('hex');
};

assert.equal(process.platform, 'win32');
assert(runtimePath && path.isAbsolute(runtimePath));
assert(modelPath && path.isAbsolute(modelPath));
const configBytes = await fs.readFile(path.join(root, 'eval/fixtures/long-file-v1.json'));
assert.equal(digest(configBytes), fixtureSha);
const config = JSON.parse(configBytes);
assert.equal(config.cue_count, 1024);
const fixture = longFileFixture(config, 'srt');
assert.equal(digest(fixture.source), sourceSha);
assert.equal(fixture.line_count, 1280);
const profileBytes = await fs.readFile(path.join(root,
  'models/manifests/hy_mt2_1_8b_q4_k_m.context_v6_prefix_repair.experimental.json'));
assert.equal(digest(profileBytes), profileSha);
const profile = JSON.parse(profileBytes);
assert.equal(profile.prompt_version, 6);
assert.equal(profile.strict_source_identifiers, true);
assert.equal(profile.source_prefix_repair, true);
assert.equal(profile.model_file_sha256, modelSha);
assert.equal(await hashFile(runtimePath), runtimeSha);
assert.equal(await hashFile(modelPath), modelSha);
if (process.argv.includes('--preflight')) {
  console.log('Checked REG-009 long product path: 1024 authored cues, 1280 slots, exact model/runtime/profile/source, 2-hour cap, one interruption and one resume.');
  process.exit(0);
}

const executable = path.join(root, 'target/release/auralis-translation-cli.exe');
assert((await fs.stat(executable)).isFile());
const parent = path.join(root, '.cache/eval/long-v6-prefix-repair-runs');
await fs.mkdir(parent, { recursive: true });
const workspace = await fs.mkdtemp(path.join(parent, 'run-'));
console.log(`REG-009 long CLI workspace: ${workspace}`);
const summaryPath = path.join(workspace, 'summary.json');
const summary = {
  schema_version: 1,
  experiment: 'long-v6-prefix-repair-1024-v1',
  status: 'running',
  started_at: new Date().toISOString(),
  git_head: execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim(),
  git_status: execFileSync('git', ['status', '--short'], { cwd: root, encoding: 'utf8' }).trim(),
  harness_sha256: await hashFile(fileURLToPath(import.meta.url)),
  cli_sha256: await hashFile(executable),
  runtime_sha256: runtimeSha,
  model_sha256: modelSha,
  profile_sha256: profileSha,
  fixture_sha256: fixtureSha,
  source_sha256: sourceSha,
  scene_end_ids: sceneEndIds,
  budget: { wall_ms: totalBudgetMs, translation_attempts: 2, server_starts: 2,
    maximum_chat_requests: fixture.line_count + 1,
    maximum_preflight_requests: (fixture.line_count + 1) * 2,
    model_retries: 0 },
  human_review: 'missing',
  source_group: 'project_authored_repeated_synthetic_development',
  sealed_holdout: false,
};
await fs.writeFile(summaryPath, `${JSON.stringify(summary, null, 2)}\n`);
try {
  await fs.writeFile(path.join(workspace, 'fixture-manifest.json'), configBytes, { flag: 'wx' });
  const report = await runLongFormat({
    root, workspace: path.join(workspace, 'srt'), format: 'srt', config,
    configSha256: fixtureSha, executable, profileBytes,
    serverPath: runtimePath, modelPath, gpuLayers: 99, ramCacheMiB: 0,
    sceneEndIds, totalBudgetMs,
  });
  summary.status = 'structural_pass_meaning_unreviewed';
  summary.report_sha256 = digest(await fs.readFile(path.join(workspace, 'srt/report.json')));
  summary.run_id = report.run_id;
  summary.result_id = report.result_id;
  summary.output_sha256 = report.output_sha256;
  summary.checkpoints = report.planned_blocks;
  summary.code_preserved_cues = report.code_preserved_cues;
  console.log(`REG-009 long CLI result: ${report.code_preserved_cues}/1024 code-preserved cues; no human quality score.`);
} catch (error) {
  summary.status = 'failed_retained';
  summary.error = error.stack ?? error.message;
  throw error;
} finally {
  summary.ended_at = new Date().toISOString();
  await fs.writeFile(summaryPath, `${JSON.stringify(summary, null, 2)}\n`);
}
