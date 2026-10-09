import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { createReadStream } from 'node:fs';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { startProcess, waitForExit } from './local-process.mjs';
import { relocateCopiedSource } from './relocate-copied-source.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
assert.equal(process.argv.length, 2);
const experimentRoot = path.join(root, '.cache/eval/v8-vivo-original-long-v1');
const original = path.join(experimentRoot, 'attempt-MAaX5T');
const target = path.join(experimentRoot, 'offline-export-v2');
const cli = path.join(root, 'target/release/auralis-translation-cli.exe');
const manifest = path.join(root,
  'models/manifests/hy_mt2_7b_q4_k_m.context_v8_target_first_batch4.experimental.json');
const hashFile = async file => {
  const hash = createHash('sha256');
  for await (const chunk of createReadStream(file)) hash.update(chunk);
  return hash.digest('hex');
};
const rawBytes = await fs.readFile(path.join(original, 'report.json'));
assert.equal(createHash('sha256').update(rawBytes).digest('hex'),
  '84a737e1cc8c7b468ea66718f2507882929344f259d7824d9071953d24c1a5b5');
const run = JSON.parse(rawBytes).arms[1];
assert.equal(run.id, '7b');
assert.equal(run.status, 'completed');
assert.equal(run.results.length, 1);
assert.equal(await hashFile(cli),
  '5cb2a5a7187944f685bb16656a4dd65f29f166bdd5745f0693e59739998e8ed8');
assert.equal(await hashFile(manifest), run.manifest_sha256);
const originalState = path.join(original, '7b/state');
const originalDb = path.join(originalState, 'auralis-translate.sqlite');
const originalDbSha = await hashFile(originalDb);
assert.equal(await fs.stat(target).catch(() => null), null,
  'The one-shot offline export directory already exists');
await fs.mkdir(target, { recursive: false });
const stateCopy = path.join(target, 'state');
await fs.cp(originalState, stateCopy, { recursive: true, force: false,
  errorOnExist: true });
const copiedDbSha = await hashFile(path.join(stateCopy, 'auralis-translate.sqlite'));
assert.equal(copiedDbSha, originalDbSha);
const relocated = await relocateCopiedSource({
  dbPath: path.join(stateCopy, 'auralis-translate.sqlite'),
  runId: run.run.run_id, originalStateDir: originalState,
  copiedStateDir: stateCopy,
  expectedSourceSha256: 'b100803367b95fa55fc638b1ff39a0abfa0d5b8183ebe58d58b1a87242d9d8c4',
});
const output = path.join(target, 'reexport.ru.srt');
const args = ['resume', stateCopy, run.run.run_id, manifest,
  'http://127.0.0.1:1/', output];
const began = performance.now();
const report = { schema_version: 1,
  experiment: 'LONG-04-vivo-original-v8-offline-export-2026-10-09-v1',
  source_run_report_sha256: createHash('sha256').update(rawBytes).digest('hex'),
  original_db_sha256: originalDbSha, copied_db_sha256: copiedDbSha,
  copied_source_relocated: true,
  copied_source_sha256: relocated.sourceSha256,
  expected_output_sha256: run.output_sha256, run_id: run.run.run_id,
  model_requests: 0, status: 'running', started_at: new Date().toISOString() };
const reportPath = path.join(target, 'report.json');
const save = () => fs.writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`);
await save();
let child;
try {
  child = startProcess(cli, args, root, process.env,
    { maxCaptureCharacters: 1024 * 1024 });
  await waitForExit(child, 60_000);
  report.exit_code = child.child.exitCode;
  report.stdout = child.stdout;
  report.stderr = child.stderr;
  report.output_sha256 = await hashFile(output);
  assert.equal(report.output_sha256, run.output_sha256);
  assert.equal(await hashFile(originalDb), originalDbSha);
  report.copied_db_after_sha256 = await hashFile(path.join(stateCopy,
    'auralis-translate.sqlite'));
  report.status = 'passed';
} catch (error) {
  report.status = 'failed';
  report.error = String(error);
  process.exitCode = 1;
} finally {
  report.finished_at = new Date().toISOString();
  report.elapsed_ms = Math.round(performance.now() - began);
  await save();
  console.log(`Vivo offline export ${report.status}: ${reportPath}`);
}
