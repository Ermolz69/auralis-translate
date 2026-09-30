import assert from 'node:assert/strict';
import { createHash, randomUUID } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';

const root = resolve('.');
const sourcePath = join(root, '.cache/eval/commons-vivo-979826861/source.zh.srt');
const runDirectory = join(root, '.cache/eval/commons-vivo-full-7b-resume-v1/run-ndCw9w');
const outputPath = join(runDirectory, 'candidate.ru.srt');
const directory = join(root, '.cache/eval/commons-vivo-review', `sample-${randomUUID()}`);
await mkdir(directory, { recursive: true });
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const report = { schema_version: 1, id: 'commons-vivo-source-selected-review-v1',
  source_sha256: '8c41e66f52000a5b67ab27bfc319accd11d89290b60e50fc5c60f4ee8230a000',
  target_sha256: '96f9c31d6feb22a4619ecc528f8c17313caea356103e65707f86904a783c31af',
  model_report_sha256: 'fd8c5b52e2cc229a052812cea353d0b8a0f1c555d773f5c7ffc67a9175808ebe',
  started_at: new Date().toISOString(), status: 'running', fixed_windows: [
    [1, 16], [50, 60], [90, 93], [230, 236], [274, 280], [460, 467] ],
  negation_pattern: '[不没无非]', review_provenance: 'AI source-aware triage pending',
  human_review: 'missing' };
try {
  const sourceBytes = await readFile(sourcePath);
  const targetBytes = await readFile(outputPath);
  const modelReportBytes = await readFile(join(runDirectory, 'report.json'));
  assert.equal(hash(sourceBytes), report.source_sha256);
  assert.equal(hash(targetBytes), report.target_sha256);
  assert.equal(hash(modelReportBytes), report.model_report_sha256);
  const modelReport = JSON.parse(modelReportBytes);
  assert.equal(modelReport.status, 'passed_structural_probe');
  assert.equal(modelReport.offline_reexport, 'byte_identical');
  const parse = bytes => bytes.toString('utf8').trimEnd().split(/\r?\n\r?\n/u).map(block => {
    const lines = block.split(/\r?\n/u);
    assert.equal(lines.length, 3);
    return { id: Number(lines[0]), timing: lines[1], text: lines[2] };
  });
  const source = parse(sourceBytes);
  const target = parse(targetBytes);
  assert.equal(source.length, 467);
  assert.equal(target.length, 467);
  source.forEach((row, index) => {
    assert.equal(row.id, index + 1);
    assert.equal(target[index].id, row.id);
    assert.equal(target[index].timing, row.timing);
  });
  const selected = new Set();
  for (const [start, end] of report.fixed_windows)
    for (let id = start; id <= end; id++) selected.add(id);
  report.negation_focus_ids = [];
  for (const [start, end] of [[1, 155], [156, 311], [312, 467]]) {
    const focus = source.find(row => row.id >= start && row.id <= end
      && !selected.has(row.id) && /[不没无非]/u.test(row.text));
    assert(focus, 'Missing a source-only negation control in a file third');
    report.negation_focus_ids.push(focus.id);
    for (const id of [focus.id - 1, focus.id, focus.id + 1])
      if (id >= 1 && id <= 467) selected.add(id);
  }
  const ids = [...selected].sort((a, b) => a - b);
  const pairs = ids.map(id => ({ id, timing: source[id - 1].timing,
    source: source[id - 1].text, target: target[id - 1].text }));
  const review = { schema_version: 1, id: report.id, source_sha256: report.source_sha256,
    target_sha256: report.target_sha256, fixed_windows: report.fixed_windows,
    negation_focus_ids: report.negation_focus_ids, selected_ids: ids, pairs };
  const bytes = Buffer.from(`${JSON.stringify(review, null, 2)}\n`);
  await writeFile(join(directory, 'private-review.json'), bytes, { flag: 'wx' });
  report.selected_cues = ids.length;
  report.selected_ids = ids;
  report.private_review_sha256 = hash(bytes);
  report.status = 'frozen_unreviewed';
  console.log(JSON.stringify({ directory, selected_cues: ids.length,
    negation_focus_ids: report.negation_focus_ids, sha256: report.private_review_sha256 }));
} catch (error) {
  report.status = 'failed';
  report.error = error.message;
  process.exitCode = 1;
  console.error(error);
} finally {
  report.finished_at = new Date().toISOString();
  await writeFile(join(directory, 'report.json'), `${JSON.stringify(report, null, 2)}\n`, { flag: 'wx' });
  console.log(`Private source-selected review: ${join(directory, 'report.json')}`);
}
