import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { digest } from './flores-file-fixture.mjs';
import { startProcess, waitForExit } from './local-process.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const parent = path.join(root, '.cache/eval/model-size');
await fs.mkdir(parent, { recursive: true });
const workspace = await fs.mkdtemp(path.join(parent, 'run-'));
const server = process.env.AURALIS_TEST_LLAMA_SERVER ?? path.join(root, '.cache/runtime/llama/llama-server.exe');
const models = {
  small: { profile: 'models/manifests/hy_mt2_1_8b_q4_k_m.fidelity.experimental.json', file: process.env.AURALIS_SMALL_GGUF ?? path.join(root, '.cache/models/Hy-MT2-1.8B-Q4_K_M.gguf') },
  large: { profile: 'models/manifests/hy_mt2_7b_q4_k_m.fidelity.experimental.json', file: process.env.AURALIS_LARGE_GGUF ?? path.join(root, '.cache/models/Hy-MT2-7B-Q4_K_M.gguf') },
};
const identityKeys = ['model_repo', 'model_revision', 'model_file_sha256', 'model_file_bytes', 'model_alias'];
const configs = await Promise.all(Object.values(models).map(async model => {
  const profile = JSON.parse(await fs.readFile(path.join(root, model.profile)));
  identityKeys.forEach(key => delete profile[key]);
  return profile;
}));
assert.deepEqual(configs[0], configs[1], 'Only model identity may change');
const report = { schema_version: 1, started_at: new Date().toISOString(), protocol: 'Same v4 prompts, sampling, runtime, 2048-token context, full GPU offload request and sequential CLI; three fresh states per case. No cold-cache or isolated-machine claim. Alternate model order across the two frozen development sets. This is a model-size comparison within Q4_K_M, not a quantization ablation or held-out language gate.', cases: [], failures: [] };
const cases = [
  ['demo-small', 'small', 'eval/corpora/public-demo-v1.json'],
  ['demo-large', 'large', 'eval/corpora/public-demo-v1.json'],
  ['controls-large', 'large', 'eval/corpora/currency-controls-v1.json'],
  ['controls-small', 'small', 'eval/corpora/currency-controls-v1.json'],
];
for (const [id, modelKey, dataset] of cases) {
  const model = models[modelKey];
  console.log(`Starting ${id}`);
  const env = { ...process.env, AURALIS_DEMO_PROFILE: model.profile, AURALIS_DEMO_DATASET: dataset, AURALIS_TEST_LLAMA_SERVER: server, AURALIS_TEST_GGUF: model.file, PATH: `${path.dirname(server)};${path.join(root, '.cache/runtime/cudart')};${process.env.PATH}` };
  const child = startProcess(process.execPath, [path.join(root, 'eval/scripts/public-demo-benchmark.mjs')], root, env, { maxCaptureCharacters: 4 * 1024 * 1024 });
  let failure;
  try { await waitForExit(child, 1_800_000); } catch (error) { failure = error.message; }
  await fs.writeFile(path.join(workspace, `${id}.log`), `${child.stdout}\n${child.stderr}`);
  const location = child.stdout.match(/Retained report: (.+)/)?.[1]?.trim();
  if (location) {
    const bytes = await fs.readFile(location);
    const benchmark = JSON.parse(bytes);
    assert.equal(benchmark.profile_sha256, digest(await fs.readFile(path.join(root, model.profile))));
    assert.equal(benchmark.dataset_sha256, digest(await fs.readFile(path.join(root, dataset))));
    const filename = `${id}.json`;
    await fs.writeFile(path.join(workspace, filename), bytes);
    report.cases.push({ id, model: modelKey, dataset, report_file: filename, report_sha256: digest(bytes), benchmark });
  }
  if (failure) report.failures.push({ id, message: failure });
  console.log(child.stdout.trim());
  if (failure) console.error(failure);
}
report.result = report.failures.length === 0 && report.cases.length === 4 ? 'passed' : 'failed';
report.finished_at = new Date().toISOString();
await fs.writeFile(path.join(workspace, 'comparison.json'), JSON.stringify(report, null, 2));
await fs.writeFile(path.join(parent, 'latest.txt'), workspace);
console.log(`Retained comparison: ${workspace}`);
if (report.result !== 'passed') process.exitCode = 1;
