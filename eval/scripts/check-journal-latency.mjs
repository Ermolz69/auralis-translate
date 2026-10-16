import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { fileURLToPath } from 'node:url';
import { statistics } from './stage-timing-analysis.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const privateDir = path.join(root, '.cache/eval/journal-latency-v1');
const publicPath = path.join(root, 'eval/reports/2026-10-15-inference-journal-latency.json');
const requiredPhases = ['mutex_wait', 'transaction_begin', 'read_validate', 'update', 'commit'];
const real = [];
for (const entry of await fs.readdir(privateDir, { withFileTypes: true })) {
  if (!entry.isDirectory()) continue;
  const file = path.join(privateDir, entry.name, 'report.json');
  const report = await fs.readFile(file, 'utf8').then(JSON.parse).catch(() => null);
  if (!report || report.status === 'running') continue;
  const summary = {
    label: report.label, status: report.status,
    code_commit: report.code_commit, cli_sha256: report.cli_sha256,
    model_sha256: report.model_sha256, runtime_sha256: report.runtime_sha256,
    profile_sha256: report.profile_sha256, source_sha256: report.source_sha256,
    source_after_sha256: report.source_after_sha256 ?? null,
    started_at: report.started_at, finished_at: report.finished_at ?? null,
    cli_exit_code: report.cli_exit_code ?? null,
    cli_wall_ms: report.cli_wall_ms ?? null,
    translation_execute_us: report.timing?.phases?.translation_execute ?? null,
    journal_finish_us: report.timing?.phases?.journal_finish ?? null,
    journal_phases_us: report.journal_phases ?? null,
    journal_share_translation_execute_percent: report.timing?.phases?.translation_execute?.sum
      ? 100 * report.timing.phases.journal_finish.sum
        / report.timing.phases.translation_execute.sum : null,
    sqlite_settings: report.sqlite_settings ?? null,
    wal_salt_changes: report.wal_salt_changes ?? null,
    wal_max_observed_bytes: report.operations?.length
      ? Math.max(...report.operations.flatMap(row => [row.wal_before?.wal_bytes,
        row.wal_after?.wal_bytes].filter(Number.isFinite)), 0) : null,
    chat_requests: report.database?.chats ?? null,
    preflight_requests: report.database?.preflight_kinds ?? null,
    checkpoints: report.database?.checkpoints ?? null,
    results: report.database?.results ?? null,
    output_sha256: report.output_sha256 ?? null,
    offline_reexport_equal: report.reexport_equal ?? null,
  };
  if (report.status === 'completed') {
    assert.equal(summary.source_after_sha256, summary.source_sha256);
    assert.equal(summary.chat_requests, 8);
    assert.equal(summary.checkpoints, 8);
    assert.equal(summary.results, 1);
    assert.equal(summary.journal_finish_us?.count, 16);
    assert.equal(summary.offline_reexport_equal, true);
    for (const phase of requiredPhases) assert.equal(summary.journal_phases_us[phase].count, 16);
    assert(summary.sqlite_settings?.length > 0);
    const db = new DatabaseSync(path.join(privateDir, entry.name, 'state/auralis-translate.sqlite'),
      { readOnly: true });
    try {
      const kinds = db.prepare('SELECT request_kind FROM inference_requests ORDER BY sequence').all()
        .map(row => row.request_kind);
      assert.equal(kinds.length, report.operations.length);
      summary.commit_by_request_kind_us = {};
      for (const kind of new Set(kinds)) {
        summary.commit_by_request_kind_us[kind] = statistics(report.operations
          .filter((_, index) => kinds[index] === kind).map(row => row.phases.commit));
      }
    } finally {
      db.close();
    }
  }
  real.push(summary);
}
real.sort((a, b) => a.label.localeCompare(b.label));
const fixture = [];
for (const label of ['baseline', 'candidate']) {
  const file = path.join(privateDir, `fixture-${label}.log`);
  const content = await fs.readFile(file, 'utf8').catch(() => null);
  if (!content) continue;
  const rows = content.split(/\r?\n/u).filter(line => line.startsWith('PERF03_FIXTURE '))
    .map(line => JSON.parse(line.slice('PERF03_FIXTURE '.length)));
  if (rows.length) {
    assert.equal(rows.length, 3);
    for (const row of rows) assert.equal(row.count, 54);
    const phaseRows = content.split(/\r?\n/u).filter(line => line.startsWith('auralis_eval_journal '))
      .map(line => JSON.parse(line.slice('auralis_eval_journal '.length)));
    const phases_us = Object.fromEntries(requiredPhases.map(phase => [phase,
      statistics(phaseRows.filter(row => row.phase === phase).map(row => row.elapsed_us))]));
    for (const phase of requiredPhases) assert.equal(phases_us[phase].count, 162);
    fixture.push({ label, repetitions: rows, phases_us });
  }
}
const harnessFailures = await fs.readFile(path.join(privateDir, 'harness-failures.json'), 'utf8')
  .then(JSON.parse).catch(() => []);
const published = {
  schema_version: 1, experiment: 'PERF-03',
  baseline_commit: '587789e',
  plan: 'eval/experiments/2026-10-14-inference-journal-latency-plan.md',
  fixture, real, harness_failures: harnessFailures,
  limitations: [
    'Synthetic storage bytes are generated and do not establish real-model latency.',
    'WAL header salt changes suggest reset but do not independently prove checkpoint duration.',
    'Real runs are cold processes; operating-system cache state is uncontrolled.',
  ],
};
const serialized = `${JSON.stringify(published, null, 2)}\n`;
assert(!/[A-Za-z]:\\/u.test(serialized), 'public report contains an absolute Windows path');
assert(!serialized.includes('rendered_request') && !serialized.includes('raw_response'));
if (process.argv.includes('--write')) {
  await fs.writeFile(publicPath, serialized);
} else {
  assert.equal(await fs.readFile(publicPath, 'utf8'), serialized);
}
console.log(JSON.stringify({ fixture_repetitions: fixture.reduce((n, item) => n + item.repetitions.length, 0),
  real_runs: real.length, completed_real: real.filter(item => item.status === 'completed').length }));
