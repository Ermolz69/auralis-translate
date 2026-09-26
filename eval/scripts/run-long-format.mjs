import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import { digest, verifyProtectedBytes } from './flores-file-fixture.mjs';
import { longFileFixture, compareLongFile } from './long-file-fixture.mjs';
import { readRunSnapshot, assertSavedPrefix } from './cli-run-state.mjs';
import { freeLoopbackPort, startProcess, stopProcess, waitForExit, waitForHealthyServer } from './local-process.mjs';
import { runtimeSampler } from './runtime-sampler.mjs';

const TRANSLATION_TIMEOUT_MS = 3_600_000;
const SERVER_TIMEOUT_MS = 180_000;
const POLL_INTERVAL_MS = 200;
const INSPECTION_CAPTURE_CHARACTERS = 4 * 1024 * 1024;
const SERVER_CAPTURE_CHARACTERS = 8 * 1024 * 1024;

async function waitUntil(check, process, timeoutMs, description) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const value = await check();
    if (value) return value;
    if (process.child.exitCode !== null || process.child.signalCode !== null) throw new Error(`${description}: process exited\n${process.stderr}`);
    await delay(POLL_INTERVAL_MS);
  }
  throw new Error(`${description}: timed out\n${process.stderr}`);
}

export async function runLongFormat({ root, workspace, format, config, configSha256, executable, profileBytes, serverPath, modelPath, gpuLayers, ramCacheMiB }) {
  await fs.mkdir(workspace);
  const fixture = longFileFixture(config, format);
  const sourcePath = path.join(workspace, `source.${format}`);
  const outputPath = path.join(workspace, `candidate.ru.${format}`);
  const stateDir = path.join(workspace, 'state');
  const dbPath = path.join(stateDir, 'auralis-translate.sqlite');
  const profilePath = path.join(workspace, 'profile.json');
  const profile = JSON.parse(profileBytes);
  for (const [file, bytes] of [[sourcePath, fixture.source], [path.join(workspace, `reference.ru.${format}`), fixture.reference], [profilePath, profileBytes]]) await fs.writeFile(file, bytes, { flag: 'wx' });
  const exists = async (file) => Boolean(await fs.stat(file).catch(() => null));
  const calls = [];
  const servers = [];
  let activeCli;
  let server;
  let sampler;
  let resourceReport;
  const started = Date.now();
  const cli = async (args, expectSuccess = true) => {
    const child = startProcess(executable, args, root, process.env, { maxCaptureCharacters: INSPECTION_CAPTURE_CHARACTERS });
    calls.push({ args, process: child });
    try {
      await waitForExit(child, TRANSLATION_TIMEOUT_MS);
      assert(expectSuccess, 'CLI accepted a conflicting operation');
    } catch (error) {
      if (expectSuccess || child.child.exitCode !== 1) { await stopProcess(child); throw error; }
    }
    assert(!child.stdoutTruncated, 'CLI output capture truncated: file verification would be incomplete');
    return child;
  };
  const startServer = async () => {
    const port = await freeLoopbackPort();
    const url = `http://127.0.0.1:${port}/`;
    const args = ['--model', modelPath, '--alias', profile.model_alias, '--host', '127.0.0.1', '--port', String(port), '-c', String(profile.min_context_tokens), '-ngl', String(gpuLayers), '--parallel', '1', '--jinja'];
    if (ramCacheMiB !== undefined) args.push('--cache-ram', String(ramCacheMiB));
    server = startProcess(serverPath, args, root, process.env, { maxCaptureCharacters: SERVER_CAPTURE_CHARACTERS });
    servers.push(server);
    await waitForHealthyServer(url, server, SERVER_TIMEOUT_MS);
    return url;
  };
  try {
    const inspectCommand = format === 'srt' ? 'inspect' : 'inspect-vtt';
    const templateCommand = format === 'srt' ? 'template' : 'template-vtt';
    const sourceInspection = (await cli([inspectCommand, sourcePath])).stdout;
    await cli([templateCommand, sourcePath, path.join(workspace, 'source-template.json')]);
    const sourceTemplate = JSON.parse(await fs.readFile(path.join(workspace, 'source-template.json')));
    assert.equal(sourceTemplate.translations.length, config.cue_count);
    console.log(`${format}: inspected ${config.cue_count} cues and ${fixture.line_count} text slots; synthetic duration ${fixture.duration_ms} ms`);
    const url = await startServer();
    sampler = runtimeSampler(path.join(workspace, 'resources.jsonl'), root, () => [server, activeCli].filter((child) => child && child.child.exitCode === null && child.child.signalCode === null).map((child) => child.child.pid));
    const initialStarted = Date.now();
    activeCli = startProcess(executable, [format === 'srt' ? 'translate' : 'translate-vtt', sourcePath, stateDir, profilePath, url, outputPath], root);
    const initial = activeCli;
    calls.push({ args: ['initial-translation'], process: initial });
    const runId = await waitUntil(() => initial.stdout.match(/run_id=([0-9a-f-]{36})/u)?.[1], initial, TRANSLATION_TIMEOUT_MS, 'durable run identity');
    const observed = await waitUntil(() => {
      const snapshot = readRunSnapshot(dbPath, runId);
      return snapshot.checkpoints.length >= config.crash_after_blocks ? snapshot : undefined;
    }, initial, TRANSLATION_TIMEOUT_MS, 'saved-block injection point');
    await stopProcess(initial);
    const interrupted = readRunSnapshot(dbPath, runId);
    const plannedBlocks = JSON.parse(interrupted.run.block_plan_json).length;
    assert.equal(interrupted.run.state, 'running');
    assert(interrupted.checkpoints.length >= config.crash_after_blocks && interrupted.checkpoints.length < plannedBlocks, 'Injection did not interrupt incomplete work');
    assertSavedPrefix(observed, interrupted);
    assert.equal(interrupted.attempts.length, 1);
    assert.equal(interrupted.attempts[0].ended_at, null);
    assert.equal(interrupted.results.length, 0, 'Partial run published a result');
    assert.equal(await exists(outputPath), false, 'Partial output was exposed');
    assert.deepEqual(await fs.readFile(sourcePath), fixture.source);
    assert.deepEqual(await fs.readFile(interrupted.source.source_locator), fixture.source);
    const interruptionElapsedMs = Date.now() - initialStarted;
    await fs.writeFile(path.join(workspace, 'interrupted-snapshot.json'), `${JSON.stringify(interrupted, null, 2)}\n`, { flag: 'wx' });
    console.log(`${format}: killed CLI after ${interrupted.checkpoints.length}/${plannedBlocks} committed blocks; no partial result/output`);
    await stopProcess(server);
    const restartUrl = await startServer();
    const changedProfilePath = path.join(workspace, 'changed-profile.json');
    await fs.writeFile(changedProfilePath, JSON.stringify({ ...profile, temperature: profile.temperature === 0 ? 0.7 : 0 }));
    await cli(['resume', stateDir, runId, changedProfilePath, restartUrl, path.join(workspace, `rejected.${format}`)], false);
    assert.deepEqual(readRunSnapshot(dbPath, runId), interrupted, 'Rejected profile resume changed durable state');
    assert.equal(await exists(path.join(workspace, `rejected.${format}`)), false);
    const resumeStarted = Date.now();
    activeCli = startProcess(executable, ['resume', stateDir, runId, profilePath, restartUrl, outputPath], root);
    const resume = activeCli;
    calls.push({ args: ['resume', runId], process: resume });
    let lastReported = -1;
    const progressTimer = setInterval(() => {
      const saved = [...resume.stderr.matchAll(/saved_blocks=(\d+)\/\d+/gu)].at(-1)?.[1];
      if (saved && Number(saved) !== lastReported) { lastReported = Number(saved); console.log(`${format}: resumed progress ${saved}/${plannedBlocks}`); }
    }, 10_000);
    try { await waitForExit(resume, TRANSLATION_TIMEOUT_MS); }
    finally { clearInterval(progressTimer); }
    const resumeElapsedMs = Date.now() - resumeStarted;
    const completed = readRunSnapshot(dbPath, runId);
    assert.equal(completed.run.state, 'validated');
    assert.equal(completed.run.run_id, runId);
    assert.equal(completed.checkpoints.length, plannedBlocks);
    assertSavedPrefix(interrupted, completed);
    assert.equal(completed.attempts.length, 2);
    assert(completed.attempts.every((attempt) => attempt.ended_at !== null));
    assert.equal(completed.results.length, 1);
    assert.equal(completed.results[0].review_state, 'needs_review');
    assert(resume.stderr.includes(`saved_blocks=${interrupted.checkpoints.length}/${plannedBlocks}`), 'Resume did not report loading saved progress');
    const outputBytes = await fs.readFile(outputPath);
    assert.equal(digest(outputBytes), completed.results[0].output_sha256);
    const outputInspection = (await cli([inspectCommand, outputPath])).stdout;
    verifyProtectedBytes(fixture.source, outputBytes, sourceInspection, outputInspection);
    await cli([templateCommand, outputPath, path.join(workspace, 'candidate-template.json')]);
    const rows = compareLongFile(fixture.rows, sourceTemplate, JSON.parse(await fs.readFile(path.join(workspace, 'candidate-template.json'))));
    assert.deepEqual(await fs.readFile(sourcePath), fixture.source);
    assert.deepEqual(await fs.readFile(completed.source.source_locator), fixture.source);
    const status = JSON.parse((await cli(['status', stateDir, runId])).stdout);
    const diagnostics = JSON.parse((await cli(['diagnostics', stateDir, runId])).stdout);
    await cli(['resume', stateDir, runId, profilePath, restartUrl, outputPath], false);
    assert.deepEqual(await fs.readFile(outputPath), outputBytes);
    await stopProcess(server);
    const reexportPath = path.join(workspace, `offline-reexport.ru.${format}`);
    await cli(['resume', stateDir, runId, profilePath, restartUrl, reexportPath]);
    assert.deepEqual(await fs.readFile(reexportPath), outputBytes);
    resourceReport = await sampler.stop();
    const report = {
      schema_version: 1, created_at: new Date().toISOString(), format, cue_count: config.cue_count, text_slot_count: fixture.line_count,
      duration_ms: fixture.duration_ms, origin: config.origin, fixture_manifest_sha256: configSha256,
      source_sha256: digest(fixture.source), output_sha256: digest(outputBytes), profile_sha256: digest(profileBytes),
      cli_executable_sha256: digest(await fs.readFile(executable)), build_profile: 'release', model_sha256: profile.model_file_sha256,
      runtime_build: profile.runtime_build_info, runtime_executable: serverPath, requested_gpu_layers: gpuLayers,
      ram_cache_mib: ramCacheMiB ?? null, ram_cache_policy: ramCacheMiB === undefined ? 'upstream_default' : 'explicit', server_slots: 1,
      run_id: runId, result_id: completed.results[0].result_id, status, diagnostics,
      interrupted_blocks: interrupted.checkpoints.length, planned_blocks: plannedBlocks, checkpoint_preservation: 'exact_saved_prefix', attempts: completed.attempts,
      partial_output: 'absent', partial_result: 'absent', profile_mismatch_rejected: true, external_original: 'byte_identical', managed_original: 'byte_identical',
      structural_checks: 'passed', offline_reexport: 'byte_identical', existing_output_protection: 'passed',
      interruption_elapsed_ms: interruptionElapsedMs, resume_elapsed_ms: resumeElapsedMs, full_elapsed_ms: Date.now() - started,
      code_preserved_cues: rows.filter((row) => row.code_preserved).length, exact_draft_matches: rows.filter((row) => row.exact_draft_match).length,
      subtitle_holdout: false, bilingual_reviewed: false, quality_verdict: 'unreviewed', resources: resourceReport, rows,
    };
    await fs.writeFile(path.join(workspace, 'completed-snapshot.json'), `${JSON.stringify(completed, null, 2)}\n`, { flag: 'wx' });
    await fs.writeFile(path.join(workspace, 'report.json'), `${JSON.stringify(report, null, 2)}\n`, { flag: 'wx' });
    const cell = (text) => text.replace(/\|/gu, '\\|').replace(/[\r\n]/gu, ' ');
    const markdown = [
      `# Long ${format.toUpperCase()} local recovery comparison`, '',
      `${config.cue_count} cues; ${fixture.line_count} text slots; synthetic timing. References are project-authored unreviewed drafts. This is a repeated synthetic load/recovery probe, not a subtitle holdout.`, '',
      `Saved ${interrupted.checkpoints.length}/${plannedBlocks} blocks at forced CLI termination. A fresh model server and CLI resumed the same run; every saved checkpoint field remained identical. No partial result/file was exposed.`, '',
      `All structural/source/output checks passed. Code markers retained in ${report.code_preserved_cues}/${config.cue_count} cues. Exact draft matches: ${report.exact_draft_matches}/${config.cue_count}; not an adequacy score. Quality remains unreviewed.`, '',
      `Interrupted attempt ${interruptionElapsedMs} ms; resume ${resumeElapsedMs} ms, including checked preflight and persistence. Resource sampling is approximate and device-wide GPU use includes other applications. No release SLA or hardware gate is claimed.`, '',
      '| Cue | Chinese source | Draft Russian reference | Model candidate | Code retained |', '| --- | --- | --- | --- | --- |',
      ...rows.map((row) => `| ${row.segment_id} | ${row.source_lines.map(cell).join('<br>')} | ${row.reference_lines.map(cell).join('<br>')} | ${row.candidate_lines.map(cell).join('<br>')} | ${row.code_preserved} |`), '',
    ].join('\n');
    await fs.writeFile(path.join(workspace, 'report.md'), markdown, { flag: 'wx' });
    console.log(`${format}: long-file recovery and transport checks passed; code markers ${report.code_preserved_cues}/${config.cue_count}; report ${path.join(workspace, 'report.md')}`);
    return report;
  } catch (error) {
    await fs.writeFile(path.join(workspace, 'failure.json'), `${JSON.stringify({ created_at: new Date().toISOString(), format, error: error.stack ?? error.message }, null, 2)}\n`);
    throw error;
  } finally {
    await stopProcess(activeCli);
    for (const child of calls) await stopProcess(child.process);
    for (const child of servers) await stopProcess(child);
    if (sampler && !resourceReport) await sampler.stop();
    await fs.writeFile(path.join(workspace, 'cli.log'), calls.map((call) => `${JSON.stringify(call.args)}\n${call.process.stdout}\n${call.process.stderr}`).join('\n'));
    for (const [index, child] of servers.entries()) await fs.writeFile(path.join(workspace, `server-${index + 1}.log`), `${child.stdout}\n${child.stderr}\nstdout_truncated=${child.stdoutTruncated} stderr_truncated=${child.stderrTruncated}\n`);
  }
}
