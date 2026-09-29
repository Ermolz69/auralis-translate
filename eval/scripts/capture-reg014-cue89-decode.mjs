import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { gzipSync, gunzipSync } from 'node:zlib';
import { digest } from './flores-file-fixture.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const run = path.join(root, '.cache/eval/reg014-cue89-decode/run-R7T23M');
const stem = '2026-09-29-reg014-cue89-decode';
const archivePath = path.join(root, 'eval/reports', `${stem}-archive.json.gz`);
const summaryPath = path.join(root, 'eval/reports', `${stem}-summary.json`);
const sha = value => digest(Buffer.from(value));
const readRun = async () => {
  const raw = Object.fromEntries(await Promise.all(['report.json', 'requests.jsonl',
    'resources.jsonl', 'server.log'].map(async name =>
    [name, await fs.readFile(path.join(run, name), 'utf8')])));
  return { schema_version: 1, raw_sha256: Object.fromEntries(Object.entries(raw)
    .map(([name, content]) => [name, sha(content)])), raw };
};
const verify = archive => {
  assert.equal(archive.schema_version, 1);
  for (const [name, content] of Object.entries(archive.raw))
    assert.equal(sha(content), archive.raw_sha256[name]);
  const report = JSON.parse(archive.raw['report.json']);
  const entries = archive.raw['requests.jsonl'].trim().split('\n').map(JSON.parse);
  const samples = archive.raw['resources.jsonl'].trim().split('\n').map(JSON.parse);
  assert.equal(report.experiment, 'reg014-cue89-decode-v1');
  assert.equal(report.status, 'complete_observations_unreviewed');
  assert.equal(report.identity.git_head, '942cea34da6d8af81764e477e0541d870e1f9018');
  assert.equal(report.identity.runner_sha256,
    '885159451532afcdee78417df59866d5ff2b7a39adba64a5677fb3cdf6753bc3');
  assert.equal(report.identity.source_sha256,
    'e9b760bdcce97de9f29f5fe671dbb927088f5a15119ebe3200e73e0408391bb3');
  assert.equal(report.budget.request_count, 6);
  assert.equal(report.budget.retries, 0);
  assert.equal(report.errors.length, 0);
  assert.equal(entries.length, 6);
  assert.deepEqual(samples, report.resources.samples);
  for (const [index, entry] of entries.entries()) {
    const planned = report.planned_requests[index];
    const result = report.requests[index];
    assert.equal(entry.seed, planned.seed);
    assert.equal(entry.temperature, planned.temperature);
    assert.equal(sha(entry.rendered_request), planned.request_sha256);
    assert.equal(entry.request_sha256, planned.request_sha256);
    assert.equal(entry.prompt_sha256, planned.prompt_sha256);
    const request = JSON.parse(entry.rendered_request);
    assert.equal(sha(request.messages[0].content), planned.prompt_sha256);
    assert.doesNotMatch(request.messages[0].content, /\p{Script=Cyrillic}/u);
    assert.equal(request.seed, planned.seed);
    assert.equal(request.temperature, planned.temperature);
    const response = JSON.parse(entry.raw_response);
    assert.equal(response.choices[0].message.content, entry.raw_candidate);
    assert.equal(response.choices[0].finish_reason, 'stop');
    assert.equal(entry.http_status, 200);
    assert.equal(entry.structural_outcome, 'parsed_target_slot');
    assert.equal(entry.usage.prompt_tokens, 305);
    assert.equal(entry.restored_candidate,
      JSON.parse(entry.raw_candidate).translations[0].text);
    assert.equal(entry.restored_candidate.includes('AUR-0089'),
      entry.raw_exact_identifier);
    assert.equal(entry.time_preserved, true);
    assert.equal(result.request_sha256, planned.request_sha256);
    assert.equal(result.raw_exact_identifier, entry.raw_exact_identifier);
  }
  assert.equal(entries[0].restored_candidate, 'Поезд отправится в 08:10.');
  assert(entries.slice(1).every(row => row.restored_candidate ===
    'Эксперимент AUR-0089: Поезд отправится в 08:10.'));
  return { report, entries, samples };
};
const summarize = (archive, { report, entries, samples }) => {
  const arm = temperature => {
    const rows = entries.filter(row => row.temperature === temperature);
    return { requests: rows.length,
      parsed_slots: rows.filter(row => row.structural_outcome === 'parsed_target_slot').length,
      exact_ascii_code: rows.filter(row => row.raw_exact_identifier).length,
      omitted_code: rows.filter(row => row.raw_ascii_identifiers.length === 0).length,
      mixed_script_code: rows.filter(row => row.mixed_script_code_like).length,
      time_preserved: rows.filter(row => row.time_preserved).length,
      completion_tokens: rows.reduce((total, row) => total + row.usage.completion_tokens, 0),
      elapsed_ms: rows.reduce((total, row) => total + row.elapsed_ms, 0) };
  };
  const gpuMiB = samples.map(row => Number(row.gpu_device?.split(',')[1]?.trim()))
    .filter(Number.isFinite);
  return { schema_version: 1, experiment: report.experiment,
    archive_sha256: digest(gzipSync(Buffer.from(JSON.stringify(archive)))),
    archive_uncompressed_sha256: sha(JSON.stringify(archive)),
    source_sha256: report.identity.source_sha256,
    git_head: report.identity.git_head,
    runner_sha256: report.identity.runner_sha256,
    started_at: report.started_at, finished_at: report.finished_at,
    status: report.status, human_review: report.human_review,
    sealed_holdout: report.sealed_holdout,
    wall_elapsed_ms: report.wall_elapsed_ms,
    arms: { temperature_0_7: arm(0.7), temperature_0: arm(0) },
    paired: [101, 202, 303].map(seed => ({ seed,
      temperature_0_7_exact_code: entries.find(row => row.seed === seed && row.temperature === 0.7).raw_exact_identifier,
      temperature_0_exact_code: entries.find(row => row.seed === seed && row.temperature === 0).raw_exact_identifier })),
    resources: { sample_count: samples.length,
      sample_errors: samples.reduce((total, row) => total + row.errors.length, 0),
      tracked_working_set_peak_bytes: Math.max(...samples.flatMap(row =>
        row.processes.map(process => process.WorkingSet64))),
      tracked_private_peak_bytes: Math.max(...samples.flatMap(row =>
        row.processes.map(process => process.PrivateMemorySize64))),
      device_wide_gpu_peak_mib: Math.max(...gpuMiB),
      limitation: report.resources.limitations } };
};

if (process.argv[2] === '--capture') {
  const archive = await readRun();
  const verified = verify(archive);
  const rawBytes = Buffer.from(JSON.stringify(archive));
  const compressed = gzipSync(rawBytes);
  const summary = summarize(archive, verified);
  assert.equal(digest(compressed), summary.archive_sha256);
  await fs.writeFile(archivePath, compressed, { flag: 'wx' });
  await fs.writeFile(summaryPath, `${JSON.stringify(summary, null, 2)}\n`, { flag: 'wx' });
  console.log(JSON.stringify(summary, null, 2));
} else if (process.argv[2] === '--check') {
  const compressed = await fs.readFile(archivePath);
  const summary = JSON.parse(await fs.readFile(summaryPath));
  assert.equal(digest(compressed), summary.archive_sha256);
  const archive = JSON.parse(gunzipSync(compressed));
  assert.equal(sha(JSON.stringify(archive)), summary.archive_uncompressed_sha256);
  const rebuilt = summarize(archive, verify(archive));
  assert.deepEqual(rebuilt, summary);
  console.log(`REG-014 cue-89 archive verified: ${rebuilt.arms.temperature_0_7.exact_ascii_code}/3 vs ${rebuilt.arms.temperature_0.exact_ascii_code}/3 exact codes; human review missing.`);
} else throw new Error('Use --capture or --check');
