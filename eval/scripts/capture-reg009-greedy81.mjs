import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { gzipSync, gunzipSync } from 'node:zlib';
import { digest } from './flores-file-fixture.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const run = path.join(root, '.cache/eval/reg009-greedy81/run-fjidrT');
const stem = '2026-09-29-reg009-greedy81';
const reports = path.join(root, 'eval/reports');
const archivePath = path.join(reports, `${stem}-archive.json.gz`);
const summaryPath = path.join(reports, `${stem}-summary.json`);
const expectedHead = '89dca653c6ec98ae73b8c839d0be26925ec905e6';
const expectedBaseline = '59444550a646c73d2b354c4e11ee0abbfead55636b98c76978c633a9219275d3';
const ids = value => value.match(/(?<![\p{L}\p{N}_])[A-Z]{2,}-[0-9]{2,8}(?![\p{L}\p{N}_])/gu)?.sort() ?? [];
const numbers = value => value.replace(/(?<![\p{L}\p{N}_])[A-Z]{2,}-[0-9]{2,8}(?![\p{L}\p{N}_])/gu, '')
  .match(/\d{1,2}:\d{2}|\d+/gu)?.sort() ?? [];
const same = (left, right) => JSON.stringify(left) === JSON.stringify(right);
const sha = text => digest(Buffer.from(text));
const baselineBytes = await fs.readFile(path.join(reports,
  '2026-09-29-reg009-live-prefix-repair-requests.jsonl.gz'));
assert.equal(digest(baselineBytes), expectedBaseline);
const baseline = gunzipSync(baselineBytes).toString('utf8').trim().split('\n').map(JSON.parse);

const readRun = async () => {
  const raw = Object.fromEntries(await Promise.all(['report.json', 'requests.jsonl',
    'resources.jsonl', 'server.log'].map(async name =>
    [name, await fs.readFile(path.join(run, name), 'utf8')])));
  return { schema_version: 1,
    raw_sha256: Object.fromEntries(Object.entries(raw).map(([name, value]) =>
      [name, sha(value)])), raw };
};
const verify = async archive => {
  assert.equal(archive.schema_version, 1);
  for (const [name, value] of Object.entries(archive.raw))
    assert.equal(sha(value), archive.raw_sha256[name]);
  const report = JSON.parse(archive.raw['report.json']);
  const rows = archive.raw['requests.jsonl'].trim().split('\n').map(JSON.parse);
  const samples = archive.raw['resources.jsonl'].trim().split('\n').map(JSON.parse);
  assert.equal(report.experiment, 'reg009-greedy81-v1');
  assert.equal(report.status, 'complete_observations_unreviewed');
  assert.equal(report.identity.git_head, expectedHead);
  assert.equal(report.identity.baseline_journal_sha256, expectedBaseline);
  assert.equal(report.identity.runner_sha256, digest(await fs.readFile(path.join(root,
    'eval/scripts/probe-reg009-greedy81.mjs'))));
  assert.equal(report.identity.ordered_request_hashes_sha256,
    '230b44cb198e330b96fd2880bc4442ca8ac92e73138a854867b90084b2d42c36');
  assert.equal(report.budget.requests, 81);
  assert.equal(report.budget.retries, 0);
  assert.equal(report.errors.length, 0);
  assert.equal(report.requests.length, 81);
  assert.equal(rows.length, 81);
  assert.equal(baseline.length, 81);
  assert.deepEqual(samples, report.resources.samples);
  const pairs = [];
  for (const [index, row] of rows.entries()) {
    const old = baseline[index];
    const planned = report.planned_requests[index];
    const observed = report.requests[index];
    assert.equal(row.cue_id, old.cue_id);
    assert.equal(row.seed, old.seed);
    assert.equal(row.source_zh, old.source_zh);
    assert.equal(row.baseline_request_sha256, old.request_sha256);
    assert.equal(row.request_sha256, planned.request_sha256);
    assert.equal(row.request_sha256, sha(row.rendered_request));
    assert.equal(row.prompt_sha256, planned.prompt_sha256);
    assert.equal(row.request_sha256, observed.request_sha256);
    const request = JSON.parse(row.rendered_request);
    assert.equal(request.temperature, 0);
    assert.equal(old.request.temperature, 0.7);
    assert.deepEqual({ ...request, temperature: 0.7 }, old.request);
    assert.equal(sha(request.messages[0].content), row.prompt_sha256);
    assert.doesNotMatch(request.messages[0].content, /\p{Script=Cyrillic}/u);
    const source = JSON.parse(request.messages[0].content.split('Input JSON:\n')[1]);
    assert.equal(source.target_slots[0].source_original, row.source_zh);
    assert.equal(row.http_status, 200);
    assert.equal(row.finish_reason, 'stop');
    assert.equal(row.structural_outcome, 'parsed_target_slot');
    const response = JSON.parse(row.raw_response);
    assert.equal(response.choices[0].message.content, row.raw_candidate);
    assert.equal(JSON.parse(row.raw_candidate).translations[0].text,
      row.restored_candidate);
    assert.equal(row.raw_exact_identifier, same(ids(row.source_zh), ids(row.restored_candidate)));
    assert.equal(old.raw_identifier_preserved, same(ids(old.source_zh), ids(old.restored_candidate)));
    assert.equal(row.raw_exact_numeric, same(numbers(row.source_zh), numbers(row.restored_candidate)));
    assert.equal(row.raw_exact_identifier, observed.raw_exact_identifier);
    assert.equal(row.raw_exact_numeric, observed.raw_exact_numeric);
    assert.equal(row.usage.prompt_tokens, old.usage.prompt_tokens);
    pairs.push({ cue_id: row.cue_id, seed: row.seed,
      old_exact_code: old.raw_identifier_preserved,
      greedy_exact_code: row.raw_exact_identifier,
      old_raw: old.restored_candidate, greedy_raw: row.restored_candidate,
      source_zh: row.source_zh });
  }
  return { report, rows, samples, pairs };
};
const summarize = (archive, { report, rows, samples, pairs }) => {
  const count = predicate => pairs.filter(predicate).length;
  const gpu = samples.map(row => Number(row.gpu_device?.split(',')[1]?.trim()))
    .filter(Number.isFinite);
  const processes = samples.flatMap(row => row.processes ?? []);
  return { schema_version: 1, experiment: report.experiment,
    archive_sha256: digest(gzipSync(Buffer.from(JSON.stringify(archive)))),
    archive_uncompressed_sha256: sha(JSON.stringify(archive)),
    git_head: report.identity.git_head, runner_sha256: report.identity.runner_sha256,
    model_sha256: report.identity.model_sha256,
    runtime_sha256: report.identity.runtime_sha256,
    profile_sha256: report.identity.profile_sha256,
    baseline_journal_sha256: expectedBaseline,
    ordered_request_hashes_sha256: report.identity.ordered_request_hashes_sha256,
    started_at: report.started_at, finished_at: report.finished_at,
    status: report.status, human_review: report.human_review,
    sealed_holdout: report.sealed_holdout,
    request_count: rows.length, retries: report.budget.retries,
    structural_pass: rows.filter(row => row.structural_outcome === 'parsed_target_slot').length,
    baseline_raw_exact_code: count(pair => pair.old_exact_code),
    greedy_raw_exact_code: count(pair => pair.greedy_exact_code),
    improved_code: count(pair => !pair.old_exact_code && pair.greedy_exact_code),
    regressed_code: count(pair => pair.old_exact_code && !pair.greedy_exact_code),
    both_exact_code: count(pair => pair.old_exact_code && pair.greedy_exact_code),
    neither_exact_code: count(pair => !pair.old_exact_code && !pair.greedy_exact_code),
    changed_raw_wording: count(pair => pair.old_raw !== pair.greedy_raw),
    greedy_exact_numeric: rows.filter(row => row.raw_exact_numeric).length,
    greedy_mixed_script_code_like: rows.filter(row => row.mixed_script_code_like).length,
    prompt_tokens: rows.reduce((total, row) => total + row.usage.prompt_tokens, 0),
    completion_tokens: rows.reduce((total, row) => total + row.usage.completion_tokens, 0),
    request_elapsed_sum_ms: rows.reduce((total, row) => total + row.elapsed_ms, 0),
    wall_elapsed_ms: report.wall_elapsed_ms,
    resources: { sample_count: samples.length,
      sample_errors: samples.reduce((total, row) => total + (row.errors?.length ?? 0), 0),
      tracked_working_set_peak_bytes: Math.max(...processes.map(row => row.WorkingSet64)),
      tracked_private_peak_bytes: Math.max(...processes.map(row => row.PrivateMemorySize64)),
      device_wide_gpu_peak_mib: Math.max(...gpu),
      limitations: report.resources.limitations },
    code_changes: pairs.filter(pair => pair.old_exact_code !== pair.greedy_exact_code)
      .map(({ cue_id, seed, old_exact_code, greedy_exact_code }) =>
        ({ cue_id, seed, old_exact_code, greedy_exact_code })),
    wording_changes: pairs.filter(pair => pair.old_raw !== pair.greedy_raw)
      .map(({ cue_id, seed, source_zh, old_raw, greedy_raw }) =>
        ({ cue_id, seed, source_zh, old_raw, greedy_raw })) };
};

if (process.argv[2] === '--capture') {
  const archive = await readRun();
  const verified = await verify(archive);
  const compressed = gzipSync(Buffer.from(JSON.stringify(archive)));
  const summary = summarize(archive, verified);
  assert.equal(digest(compressed), summary.archive_sha256);
  await fs.writeFile(archivePath, compressed, { flag: 'wx' });
  await fs.writeFile(summaryPath, `${JSON.stringify(summary, null, 2)}\n`, { flag: 'wx' });
  console.log(JSON.stringify({ request_count: summary.request_count,
    baseline_exact: summary.baseline_raw_exact_code,
    greedy_exact: summary.greedy_raw_exact_code,
    improved: summary.improved_code, regressed: summary.regressed_code,
    changed_wording: summary.changed_raw_wording,
    archive_sha256: summary.archive_sha256 }, null, 2));
} else if (process.argv[2] === '--check') {
  const compressed = await fs.readFile(archivePath);
  const summary = JSON.parse(await fs.readFile(summaryPath));
  assert.equal(digest(compressed), summary.archive_sha256);
  const archive = JSON.parse(gunzipSync(compressed));
  assert.equal(sha(JSON.stringify(archive)), summary.archive_uncompressed_sha256);
  assert.deepEqual(summarize(archive, await verify(archive)), summary);
  console.log(`REG-009 greedy paired archive verified: ${summary.baseline_raw_exact_code}/81 vs ${summary.greedy_raw_exact_code}/81 raw codes; ${summary.improved_code} improvements, ${summary.regressed_code} regressions.`);
} else if (process.argv[2] === '--inspect') {
  const archive = JSON.parse(gunzipSync(await fs.readFile(archivePath)));
  const { pairs } = await verify(archive);
  const cueIds = [...new Set(pairs.map(pair => pair.cue_id))];
  const uniqueGreedyByCue = Object.fromEntries(cueIds.map(cue => [cue,
    new Set(pairs.filter(pair => pair.cue_id === cue)
      .map(pair => pair.greedy_raw)).size]));
  console.log(JSON.stringify({ unique_greedy_by_cue: uniqueGreedyByCue,
    risk_pairs: pairs.filter(pair => [3, 6, 129, 510, 1022].includes(pair.cue_id)) }, null, 2));
} else throw new Error('Use --capture or --check');
