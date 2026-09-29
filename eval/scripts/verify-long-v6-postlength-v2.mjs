import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { createReadStream } from 'node:fs';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { gzipSync, gunzipSync } from 'node:zlib';
import { DatabaseSync } from 'node:sqlite';
import { digest, verifyProtectedBytes } from './flores-file-fixture.mjs';
import { longFileFixture, compareLongFile } from './long-file-fixture.mjs';
import { assertSavedPrefix, readRunSnapshot } from './cli-run-state.mjs';
import { runCheckedProcess } from './run-checked-process.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const predecessor = path.join(root, '.cache/eval/long-v6-relocated-continuation-runs/continuation-cXUYur');
const workspace = path.join(root, '.cache/eval/long-v6-postlength-resume-runs/postlength-MvMUOK');
const srtDir = path.join(workspace, 'srt');
const stateDir = path.join(srtDir, 'state');
const dbPath = path.join(stateDir, 'auralis-translate.sqlite');
const sourcePath = path.join(srtDir, 'source.srt');
const outputPath = path.join(srtDir, 'candidate.ru.srt');
const profilePath = path.join(srtDir, 'profile.json');
const executable = path.join(root, 'target/release/auralis-translation-cli.exe');
const runId = '86876d9c-bb84-4450-9214-8eb21f7d262c';
const deadline = Date.now() + 5 * 60_000;
const remaining = () => {
  const left = deadline - Date.now();
  if (left <= 0) throw new Error('Offline postflight exceeded its five-minute budget');
  return left;
};
const predecessorHashes = {
  'auralis-translate.sqlite': '26acd2e45baf0fc3175227686a8772db5dc45fd8d6336f28dd0976fbdeaa66af',
  'auralis-translate.sqlite-wal': 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
  'auralis-translate.sqlite-shm': 'fd4c9fda9cd3f9ae7c962b0ddf37232294d55580e1aa165aa06129b8549389eb',
};
const archiveStem = '2026-09-29-long-v6-postlength-v2';
const reportDir = path.join(root, 'eval/reports');
const privateReportPath = path.join(srtDir, 'postflight-v2-report.json');
const archiveNames = [`${archiveStem}-summary.json`, `${archiveStem}-report.json`, `${archiveStem}-journal.json.gz`];
for (const file of [privateReportPath, ...archiveNames.map(name => path.join(reportDir, name))]) {
  assert.equal(await fs.stat(file).catch(() => null), null, `Output already exists: ${file}`);
}

async function hashFile(file) {
  const hash = createHash('sha256');
  for await (const chunk of createReadStream(file)) hash.update(chunk);
  return hash.digest('hex');
}
async function assertPredecessorUnchanged() {
  for (const [name, expected] of Object.entries(predecessorHashes)) {
    assert.equal(await hashFile(path.join(predecessor, 'srt/state', name)), expected,
      `Predecessor failed-run database changed: ${name}`);
  }
}
function readRequests() {
  const db = new DatabaseSync(dbPath, { readOnly: true });
  try {
    return db.prepare('SELECT * FROM inference_requests WHERE run_id = ? ORDER BY sequence').all(runId)
      .map(row => ({ ...row, rendered_request: Buffer.from(row.rendered_request).toString('utf8'),
        raw_response: row.raw_response === null ? null : Buffer.from(row.raw_response).toString('utf8') }));
  } finally { db.close(); }
}

await assertPredecessorUnchanged();
const source = await fs.readFile(sourcePath);
const output = await fs.readFile(outputPath);
const profile = await fs.readFile(profilePath);
const reference = await fs.readFile(path.join(srtDir, 'reference.ru.srt'));
const fixtureBytes = await fs.readFile(path.join(workspace, 'fixture-manifest.json'));
const failureBytes = await fs.readFile(path.join(srtDir, 'postlength-failure.json'));
const v1FailureBytes = await fs.readFile(path.join(reportDir,
  '2026-09-29-long-v6-postflight-v1-failure.json'));
const cliLog = await fs.readFile(path.join(srtDir, 'postlength-cli.log'));
const serverLog = await fs.readFile(path.join(srtDir, 'postlength-server.log'));
const resourceBytes = await fs.readFile(path.join(srtDir, 'postlength-resources.jsonl'));
const failure = JSON.parse(failureBytes);
const v1Failure = JSON.parse(v1FailureBytes);
assert.match(failure.error, /ReferenceError: Cannot access 'process' before initialization/u);
assert.equal(v1Failure.outcome, 'failed_identifier_preservation_assertion');
assert.equal(v1Failure.read_only_followup_observed_nonmatching_lines, 665);
assert.equal(digest(source), 'e9b760bdcce97de9f29f5fe671dbb927088f5a15119ebe3200e73e0408391bb3');
assert.equal(digest(output), 'cc2f4b3c88433cf59223bb35cfc95cdfeeed0c079c068106e7ef485369bd2e2b');
assert.equal(digest(profile), 'b30546f228ba230364ba79edae55456d62e7d7c5010e56fef38464c3531089c5');
assert.equal(digest(fixtureBytes), '0527cab3c4ea38aa91ae65c6f4e52103d7e0c5cde1ab778dc7e9da1a46c43986');
assert.equal(await hashFile(executable), '76ab2844996a3d68e9be96035f22f32bfcad79e085a5eacdecddbfa27626452a');
assert.equal(await hashFile(path.join(root, '.cache/models/Hy-MT2-1.8B-Q4_K_M.gguf')),
  'dc5f44fcf1fa496ee7ad725982c0c8c553a4de00259b53af84c4b89fb0c06699');
assert.equal(await hashFile(path.join(root, '.cache/runtime/llama/llama-server.exe')),
  '6f15be27bd80b6b4d52afefa49094e18fcfab55d5da354d717971f2d2537b2f4');
const fixture = longFileFixture(JSON.parse(fixtureBytes), 'srt');
assert.deepEqual(source, fixture.source);
assert.deepEqual(reference, fixture.reference);

const preceding = readRunSnapshot(path.join(predecessor, 'srt/state/auralis-translate.sqlite'), runId);
const before = readRunSnapshot(dbPath, runId);
assert.equal(preceding.run.state, 'failed');
assert.equal(preceding.checkpoints.length, 982);
assert.equal(preceding.results.length, 0);
assert.equal(before.run.state, 'validated');
assert.equal(before.checkpoints.length, 1024);
assert.equal(before.attempts.length, 4);
assert.equal(before.results.length, 1);
assert.equal(before.results[0].review_state, 'needs_review');
assert.equal(before.results[0].output_sha256, digest(output));
assertSavedPrefix(preceding, before);
const managedSource = await fs.realpath(before.source.source_locator);
assert.equal(path.dirname(managedSource).toLowerCase(),
  (await fs.realpath(path.join(stateDir, 'sources'))).toLowerCase());
assert.deepEqual(await fs.readFile(managedSource), source);

const priorArchive = await fs.readFile(path.join(reportDir,
  '2026-09-29-long-v6-relocated-continuation-failure-journal.json.gz'));
assert.equal(digest(priorArchive), '09944a0cefd47eb124fa780157bf6fc5d27bec1db4c7c19612500ec7bd49c388');
const priorJournal = JSON.parse(gunzipSync(priorArchive));
const requests = readRequests();
assert.equal(requests.length, 3847);
assert.deepEqual(requests.slice(0, priorJournal.requests.length).map(row => row.request_id),
  priorJournal.requests.map(row => row.request_id));
assert(requests.every((request, index) =>
  (index === 0 || request.sequence > requests[index - 1].sequence)
    && request.request_sha256 === digest(Buffer.from(request.rendered_request))));
const newRequests = requests.filter(request => request.attempt_id === 4);
assert(newRequests.length > 0);
assert(newRequests.every(request => request.outcome !== 'pending'));
const beforeRequestDigest = digest(Buffer.from(JSON.stringify(requests)));

const started = Date.now();
const commands = [];
const callCli = async (args) => {
  const stdout = await runCheckedProcess({ command: executable, args, cwd: root,
    env: process.env, timeoutMs: Math.min(60_000, remaining()) });
  commands.push({ command: args[0], stdout_sha256: digest(Buffer.from(stdout)) });
  return stdout;
};
const sourceInspection = await callCli(['inspect', sourcePath]);
const outputInspection = await callCli(['inspect', outputPath]);
verifyProtectedBytes(source, output, sourceInspection, outputInspection);
const sourceTemplatePath = path.join(srtDir, 'postflight-v2-source-template.json');
const outputTemplatePath = path.join(srtDir, 'postflight-v2-output-template.json');
await callCli(['template', sourcePath, sourceTemplatePath]);
await callCli(['template', outputPath, outputTemplatePath]);
const rows = compareLongFile(fixture.rows,
  JSON.parse(await fs.readFile(sourceTemplatePath)),
  JSON.parse(await fs.readFile(outputTemplatePath)));
assert.equal(rows.length, 1024);
const identifierViolations = rows.flatMap(row => row.candidate_lines.flatMap((line, lineIndex) => {
  const observed = line.match(/[A-Z]+-\d{4}/gu) ?? [];
  if (observed.length === 1 && observed[0] === row.code) return [];
  const localized = line.match(/АУР-\d{4}/gu) ?? [];
  const category = observed.length > 0 ? 'wrong_or_duplicate_ascii'
    : localized.length > 0 ? 'localized_cyrillic' : 'missing';
  return [{ segment_id: row.segment_id, line_index: lineIndex,
    expected_identifier: row.code, observed_ascii_identifiers: observed,
    localized_identifiers: localized, category,
    source_zh: row.source_lines[lineIndex], candidate_ru: line }];
}));
assert.equal(identifierViolations.length, 665);
assert(identifierViolations.some(row => row.segment_id === 2 && row.expected_identifier === 'AUR-0002'
  && row.candidate_ru === 'Не открывайте эту дверь.'));
const identifierViolationCounts = Object.entries(Object.groupBy(identifierViolations, row => row.category))
  .map(([category, group]) => ({ category, count: group.length }));
const reexportPath = path.join(srtDir, 'postflight-v2-offline-reexport.ru.srt');
await callCli(['resume', stateDir, runId, profilePath, 'http://127.0.0.1:9/', reexportPath]);
assert.deepEqual(await fs.readFile(reexportPath), output);
const after = readRunSnapshot(dbPath, runId);
assert.deepEqual(after, before);
assert.equal(digest(Buffer.from(JSON.stringify(readRequests()))), beforeRequestDigest);
await assertPredecessorUnchanged();

const samples = resourceBytes.toString('utf8').trim().split(/\r?\n/u).map(line => JSON.parse(line));
assert(samples.length > 0);
const peak = field => Math.max(...samples.map(sample =>
  sample.processes.reduce((sum, processSample) => sum + (processSample[field] ?? 0), 0)));
const gpu = samples.map(sample => Number(sample.gpu_device?.split(',')[1]?.trim()))
  .filter(Number.isFinite);
const chats = newRequests.filter(request => request.request_kind === 'chat_completion');
const sum = field => chats.reduce((total, request) => total + (request[field] ?? 0), 0);
const report = {
  schema_version: 1, experiment: 'long-v6-postlength-postflight-1024-v2',
  outcome: 'passed_structural_with_identifier_loss_after_harness_failure',
  verified_at: new Date().toISOString(), source_sha256: digest(source),
  output_sha256: digest(output), reference_sha256: digest(reference),
  profile_sha256: digest(profile), fixture_manifest_sha256: digest(fixtureBytes),
  model_sha256: 'dc5f44fcf1fa496ee7ad725982c0c8c553a4de00259b53af84c4b89fb0c06699',
  cli_sha256: await hashFile(executable),
  server_sha256: '6f15be27bd80b6b4d52afefa49094e18fcfab55d5da354d717971f2d2537b2f4',
  run_id: runId, result_id: before.results[0].result_id,
  initial_task_exit: 1, initial_task_error: failure.error.split('\n')[0],
  first_postflight_verifier_exit: 1, first_postflight_failure_sha256: digest(v1FailureBytes),
  checkpoints_before: preceding.checkpoints.length,
  checkpoints_after: before.checkpoints.length, saved_prefix_preserved: true,
  attempts: before.attempts.length, result_count: before.results.length,
  cue_count: 1024, text_slot_count: fixture.line_count,
  code_preserved_cues: rows.filter(row => row.code_preserved).length,
  identifier_violation_count: identifierViolations.length,
  identifier_violation_counts: identifierViolationCounts,
  identifier_violations: identifierViolations,
  exact_draft_matches: rows.filter(row => row.exact_draft_match).length,
  prior_request_count: priorJournal.requests.length, new_request_count: newRequests.length,
  total_request_count: requests.length,
  new_requests_by_kind_outcome: Object.entries(Object.groupBy(newRequests,
    request => `${request.request_kind}:${request.outcome}`))
    .map(([key, group]) => ({ key, count: group.length })),
  new_chat_count: chats.length, new_chat_prompt_tokens: sum('prompt_tokens'),
  new_chat_completion_tokens: sum('completion_tokens'),
  new_chat_elapsed_sum_ms: sum('elapsed_ms'),
  postflight_elapsed_ms: Date.now() - started, postflight_commands: commands,
  offline_reexport: 'byte_identical', request_journal_unchanged_after_postflight: true,
  resources: { sample_count: samples.length,
    sampling_errors: samples.reduce((total, sample) => total + sample.errors.length, 0),
    peak_tracked_working_set_bytes: peak('WorkingSet64'),
    peak_tracked_private_bytes: peak('PrivateMemorySize64'),
    peak_device_gpu_mib: gpu.length ? Math.max(...gpu) : null,
    first_sample_at: samples[0].created_at, last_sample_at: samples.at(-1).created_at },
  initial_failure_sha256: digest(failureBytes), cli_log_sha256: digest(cliLog),
  server_log_sha256: digest(serverLog), resources_sha256: digest(resourceBytes),
  subtitle_holdout: false, bilingual_reviewed: false,
  quality_verdict: 'failed_identifier_preservation_unreviewed',
  rows,
};
const reportBytes = Buffer.from(`${JSON.stringify(report, null, 2)}\n`);
const journalBytes = Buffer.from(`${JSON.stringify({ schema_version: 1, run_id: runId,
  run: before.run, attempts: before.attempts, checkpoints: before.checkpoints,
  result: before.results[0], requests, source_srt_utf8: source.toString('utf8'),
  output_srt_utf8: output.toString('utf8'),
  reference_srt_utf8: reference.toString('utf8') }, null, 2)}\n`);
const journalArchive = gzipSync(journalBytes, { mtime: 0 });
const summary = {
  schema_version: 1, experiment: report.experiment, outcome: report.outcome,
  run_id: runId, result_id: report.result_id, initial_task_exit: 1,
  reg_id: 'REG-008', source_sha256: report.source_sha256,
  output_sha256: report.output_sha256, profile_sha256: report.profile_sha256,
  model_sha256: report.model_sha256, cli_sha256: report.cli_sha256,
  cue_count: report.cue_count, text_slot_count: report.text_slot_count,
  checkpoints_before: report.checkpoints_before,
  checkpoints_after: report.checkpoints_after,
  saved_prefix_preserved: true, attempts: report.attempts,
  result_count: report.result_count, code_preserved_cues: report.code_preserved_cues,
  identifier_violation_count: report.identifier_violation_count,
  identifier_violation_counts: report.identifier_violation_counts,
  first_postflight_failure_sha256: report.first_postflight_failure_sha256,
  offline_reexport: report.offline_reexport,
  request_journal_unchanged_after_postflight: true,
  prior_request_count: report.prior_request_count,
  new_request_count: report.new_request_count,
  total_request_count: report.total_request_count,
  new_chat_count: report.new_chat_count,
  new_chat_prompt_tokens: report.new_chat_prompt_tokens,
  new_chat_completion_tokens: report.new_chat_completion_tokens,
  new_chat_elapsed_sum_ms: report.new_chat_elapsed_sum_ms,
  resources: report.resources, postflight_elapsed_ms: report.postflight_elapsed_ms,
  initial_failure_sha256: report.initial_failure_sha256,
  report_file: `${archiveStem}-report.json`, report_sha256: digest(reportBytes),
  journal_file: `${archiveStem}-journal.json.gz`,
  journal_gzip_sha256: digest(journalArchive),
  journal_uncompressed_sha256: digest(journalBytes),
  subtitle_holdout: false, bilingual_reviewed: false,
  quality_verdict: 'failed_identifier_preservation_unreviewed',
};
remaining();
await fs.writeFile(privateReportPath, reportBytes, { flag: 'wx' });
await fs.writeFile(path.join(reportDir, summary.report_file), reportBytes, { flag: 'wx' });
await fs.writeFile(path.join(reportDir, summary.journal_file), journalArchive, { flag: 'wx' });
await fs.writeFile(path.join(reportDir, `${archiveStem}-summary.json`),
  `${JSON.stringify(summary, null, 2)}\n`, { flag: 'wx' });
console.log(`Offline postflight verified: 1024/1024 checkpoints, ${fixture.line_count} slots, ${requests.length} raw requests; initial harness task failed, quality unreviewed.`);
