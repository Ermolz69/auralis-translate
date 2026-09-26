import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildSrt, digest, loadRows, verifyProtectedBytes } from './flores-file-fixture.mjs';
import { compareRows, markdownReport } from './file-comparison-report.mjs';
import { freeLoopbackPort, startProcess, stopProcess, waitForExit, waitForHealthyServer } from './local-process.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const CLI_TIMEOUT_MS = 900_000;
const SERVER_TIMEOUT_MS = 180_000;

export async function runFloresFile({ profileFile = 'models/manifests/hy_mt2_1_8b_q4_k_m.checked.experimental.json', sampleFile = 'eval/corpora/flores200-file-probe-v1.json', destinationRoot, label = 'checked-prompt-v1' } = {}) {
  assert.equal(process.platform, 'win32', 'This real-model probe currently targets Windows');
  const serverPath = process.env.AURALIS_TEST_LLAMA_SERVER;
  const modelPath = process.env.AURALIS_TEST_GGUF;
  assert(serverPath && path.isAbsolute(serverPath), 'Set absolute AURALIS_TEST_LLAMA_SERVER');
  assert(modelPath && path.isAbsolute(modelPath), 'Set absolute AURALIS_TEST_GGUF');
  const gpuLayers = Number(process.env.AURALIS_TEST_GPU_LAYERS ?? '0');
  assert(Number.isInteger(gpuLayers) && gpuLayers >= 0 && gpuLayers <= 999, 'Invalid GPU layer count');
  const executable = path.join(root, 'target/debug/auralis-translation-cli.exe');
  const evaluator = path.join(root, 'target/debug/auralis-translation-eval.exe');
  const profilePath = path.resolve(root, profileFile);
  for (const file of [serverPath, modelPath, executable, evaluator, profilePath]) assert((await fs.stat(file)).isFile(), `Missing ${file}`);
  const readJson = async (file) => JSON.parse(await fs.readFile(file, 'utf8'));
  const samplePath = path.resolve(root, sampleFile);
  const sample = await readJson(samplePath);
  const manifestPath = path.join(root, sample.corpus_manifest);
  const corpus = await readJson(manifestPath);
  const profileBytes = await fs.readFile(profilePath);
  const profile = JSON.parse(profileBytes);
  const verified = await waitForExit(startProcess(evaluator, ['verify-flores', manifestPath, path.join(root, '.cache/eval/flores200_dataset.tar.gz'), path.join(root, '.cache/eval/flores200_dataset')], root), CLI_TIMEOUT_MS);
  assert.equal(JSON.parse(verified.stdout).archive_sha256, corpus.archive.sha256);
  const rows = await loadRows(root, sample, corpus);
  const runParent = destinationRoot ?? path.join(root, '.cache/eval/file-runs');
  await fs.mkdir(runParent, { recursive: true });
  const runRoot = await fs.mkdtemp(path.join(runParent, 'flores-dev-'));
  console.log(`Local comparison workspace: ${runRoot}`);
  const sourcePath = path.join(runRoot, 'source.srt');
  const outputPath = path.join(runRoot, 'candidate.ru.srt');
  const referencePath = path.join(runRoot, 'reference.ru.srt');
  const stateDir = path.join(runRoot, 'state');
  const sourceBytes = buildSrt(rows);
  await fs.writeFile(sourcePath, sourceBytes, { flag: 'wx' });
  await fs.writeFile(referencePath, buildSrt(rows.map((row) => ({ source: row.reference_ru }))), { flag: 'wx' });
  const attribution = `FLORES-200 contributors\n${corpus.source_url}\nCC BY-SA 4.0\nhttps://creativecommons.org/licenses/by-sa/4.0/\nSynthetic SRT transport adaptation, dev rows ${sample.row_ids.join(', ')}.\nNot a subtitle holdout or human-reviewed reference on a real cue grid.\n`;
  await fs.writeFile(path.join(runRoot, 'NOTICE.txt'), attribution, { flag: 'wx' });
  await fs.writeFile(path.join(runRoot, 'profile.json'), profileBytes, { flag: 'wx' });
  const calls = [];
  const cli = async (args, expectedSuccess = true) => {
    const child = startProcess(executable, args, root);
    calls.push({ args, process: child });
    try {
      await waitForExit(child, CLI_TIMEOUT_MS);
      assert(expectedSuccess, 'CLI unexpectedly accepted a conflicting operation');
    } catch (error) {
      if (expectedSuccess || child.child.exitCode !== 1) {
        await stopProcess(child);
        throw error;
      }
    }
    assert(!child.stdoutTruncated, 'CLI output capture truncated: file verification would be incomplete');
    return child;
  };
  let server;
  try {
    const inspection = await cli(['inspect', sourcePath]);
    await cli(['template', sourcePath, path.join(runRoot, 'source-template.json')]);
    const sourceTemplate = await readJson(path.join(runRoot, 'source-template.json'));
    const port = await freeLoopbackPort();
    const url = `http://127.0.0.1:${port}/`;
    server = startProcess(serverPath, ['--model', modelPath, '--alias', profile.model_alias, '--host', '127.0.0.1', '--port', String(port), '-c', String(profile.min_context_tokens), '-ngl', String(gpuLayers), '--jinja'], root);
    const startup = Date.now();
    await waitForHealthyServer(url, server, SERVER_TIMEOUT_MS);
    const serverStartupMs = Date.now() - startup;
    const started = Date.now();
    console.log(`Translating ${rows.length} auxiliary Chinese sentences through the durable file pipeline`);
    const translated = await cli(['translate', sourcePath, stateDir, profilePath, url, outputPath]);
    const elapsedMs = Date.now() - started;
    const runId = translated.stdout.match(/run_id=([0-9a-f-]{36})/u)?.[1];
    assert(runId, 'Translation did not report a run ID');
    const status = JSON.parse((await cli(['status', stateDir, runId])).stdout);
    assert.equal(status.state, 'validated');
    assert.equal(status.completed_blocks, status.total_blocks);
    assert(status.total_blocks > 0);
    const diagnostics = JSON.parse((await cli(['diagnostics', stateDir, runId])).stdout);
    const outputBytes = await fs.readFile(outputPath);
    const outputInspection = await cli(['inspect', outputPath]);
    verifyProtectedBytes(sourceBytes, outputBytes, inspection.stdout, outputInspection.stdout);
    await cli(['template', outputPath, path.join(runRoot, 'candidate-template.json')]);
    const compared = compareRows(rows, sourceTemplate, await readJson(path.join(runRoot, 'candidate-template.json')));
    assert.deepEqual(await fs.readFile(sourcePath), sourceBytes, 'External source changed');
    await cli(['translate', sourcePath, stateDir, profilePath, url, outputPath], false);
    assert.deepEqual(await fs.readFile(outputPath), outputBytes, 'Existing output changed');
    await stopProcess(server);
    const reexport = path.join(runRoot, 'offline-reexport.ru.srt');
    await cli(['resume', stateDir, runId, profilePath, url, reexport]);
    assert.deepEqual(await fs.readFile(reexport), outputBytes, 'Offline re-export differs');
    const report = {
      schema_version: 1, created_at: new Date().toISOString(), dataset: corpus.dataset, label,
      corpus_source_url: corpus.source_url, corpus_license_id: corpus.license_id, corpus_archive_sha256: corpus.archive.sha256,
      split: sample.split, source_language: sample.language, row_ids: sample.row_ids,
      sample_manifest_sha256: digest(await fs.readFile(samplePath)), profile_sha256: digest(profileBytes), model_sha256: profile.model_file_sha256, runtime_build: profile.runtime_build_info,
      profile, source_preservation: 'byte_identical',
      runtime_executable: serverPath, gpu_layers: gpuLayers, server_startup_ms: serverStartupMs, translation_elapsed_ms: elapsedMs,
      source_sha256: digest(sourceBytes), output_sha256: digest(outputBytes), run_id: runId,
      status, diagnostics, rows: compared, structural_checks: 'passed', offline_reexport: 'byte_identical', existing_output_protection: 'passed',
      use_scope: sample.purpose, timings: sample.timings, subtitle_holdout: false, bilingual_reviewed: false, quality_verdict: 'unreviewed',
    };
    await fs.writeFile(path.join(runRoot, 'report.json'), `${JSON.stringify(report, null, 2)}\n`, { flag: 'wx' });
    await fs.writeFile(path.join(runRoot, 'report.md'), markdownReport(report), { flag: 'wx' });
    console.log(`File transport checks passed; translation comparison remains unreviewed. Report: ${path.join(runRoot, 'report.md')}`);
    return { runRoot, report };
  } catch (error) {
    await fs.writeFile(path.join(runRoot, 'failure.json'), `${JSON.stringify({ label, profile_sha256: digest(profileBytes), source_sha256: digest(sourceBytes), error: error.message, created_at: new Date().toISOString() }, null, 2)}\n`, { flag: 'wx' });
    throw error;
  } finally {
    await stopProcess(server);
    if (server) await fs.writeFile(path.join(runRoot, 'model-server.log'), `${server.stdout}\n${server.stderr}`);
    await fs.writeFile(path.join(runRoot, 'translation.log'), calls.map((call) => `${JSON.stringify(call.args)}\n${call.process.stdout}\n${call.process.stderr}`).join('\n'));
  }
}
