import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
const expectedSource = '42109fc054cba93b0ef343853628b6a248b31664786d579bdefa415ccaacf9ee';
const raw = await fs.readFile(path.join(root, '.cache/eval/youtube-mingfay/caption-Vb3TuT/source.zh.srt'));
assert.equal(sha256(raw), 'a875c0a84ab0c3a9b44a1b5a2be0c6f3d5b885ed82d241d386057c0dbd5ab436');
const rawBlocks = raw.toString('utf8').replaceAll('\r\n', '\n').trimEnd().split(/\n\n+/);
const excludedLines = new Map(rawBlocks.map(block => {
  const [label, , pinyin, , english] = block.split('\n');
  return [Number(label), [pinyin, english]];
}));
const derived = JSON.parse(await fs.readFile(path.join(root,
  '.cache/eval/youtube-mingfay/derived-krjB0X/derivation.json'), 'utf8'));
const mapping = new Map(derived.mapping.map(cue => [cue.derived_label, cue.original_label]));
const variants = [];
for (const variant of ['1b', '7b']) {
  const parent = path.join(root, `.cache/eval/mingfay-natural-${variant}-v1`);
  const workspace = (await fs.readFile(path.join(parent, 'latest.txt'), 'utf8')).trim();
  const reportBytes = await fs.readFile(path.join(workspace, 'report.json'));
  const report = JSON.parse(reportBytes);
  const journalBytes = await fs.readFile(path.join(workspace, 'journal-check.json'));
  const journal = JSON.parse(journalBytes);
  assert.equal(report.status, 'passed_structural_probe');
  assert.equal(report.source_sha256, expectedSource);
  assert.equal(report.model_variant, variant);
  assert.equal(report.cases.length, 4);
  assert.equal(journal.status, 'passed');
  assert.equal(journal.report_sha256, sha256(reportBytes));
  assert.equal(journal.checked.length, 4);
  const caseIds = ['start', 'middle', 'seam', 'end'];
  const sourceWindows = [];
  const resultWindows = [];
  for (const [index, row] of report.cases.entries()) {
    assert.equal(row.id, caseIds[index]);
    assert.equal(row.arms.length, 1);
    assert.equal(row.arms[0].accepted_lines.length, 4);
    assert.equal(row.arms[0].offline_reexport, 'byte_identical');
    assert.equal(sha256(await fs.readFile(row.source_path)), row.source_sha256);
    const output = path.join(workspace, row.id, 'scene', 'candidate.ru.srt');
    assert.equal(sha256(await fs.readFile(output)), row.arms[0].output_sha256);
    sourceWindows.push({ id: row.id, cue_ids: row.original_cue_ids,
      source_sha256: row.source_sha256 });
    resultWindows.push({ id: row.id, output_sha256: row.arms[0].output_sha256 });
  }
  const chats = report.requests.filter(entry => entry.path === '/v1/chat/completions');
  const preflights = report.requests.filter(entry => ['/apply-template', '/tokenize'].includes(entry.path));
  assert.equal(chats.length, 16);
  assert.equal(preflights.length, 32);
  assert.equal(report.requests.filter(entry => entry.error).length, 0);
  assert.equal(journal.checked.reduce((sum, row) => sum + row.chats, 0), 16);
  assert.equal(journal.checked.reduce((sum, row) => sum + row.preflights, 0), 32);
  const selectedIds = report.cases.flatMap(row => row.original_cue_ids);
  const excluded = selectedIds.flatMap(id => excludedLines.get(mapping.get(id)) ?? []);
  const prompts = chats.map(entry => entry.request.messages.map(message => message.content).join('\n'));
  const sideLineHits = excluded.filter(line => line && prompts.some(prompt => prompt.includes(line)));
  const promptTokens = chats.reduce((sum, entry) => sum + (entry.usage?.prompt_tokens ?? 0), 0);
  const completionTokens = chats.reduce((sum, entry) => sum + (entry.usage?.completion_tokens ?? 0), 0);
  const chatHttpMs = chats.reduce((sum, entry) => sum + entry.elapsed_ms, 0);
  const samples = report.resource_samples.filter(sample => Number.isSafeInteger(sample.working_set_bytes));
  const gpuMiB = report.resource_samples.map(sample => Number.parseInt(String(sample.gpu ?? '').split(',')[0], 10))
    .filter(Number.isFinite);
  variants.push({ model: variant, model_sha256: report.model_sha256_verified_by_doctor,
    profile_sha256: report.profile_sha256, report_sha256: sha256(reportBytes),
    journal_check_sha256: sha256(journalBytes), cli_sha256: report.cli_sha256,
    runtime_sha256: report.runtime_sha256, model_revision: report.model_revision,
    source_windows: sourceWindows, result_windows: resultWindows,
    cases: report.cases.length, accepted_cues: 16, chats: chats.length,
    preflights: preflights.length, all_http: report.requests.length,
    side_line_hits_in_chats: sideLineHits.length,
    prompt_tokens: promptTokens, completion_tokens: completionTokens,
    chat_http_ms: chatHttpMs,
    run_wall_ms: Date.parse(report.finished_at) - Date.parse(report.started_at),
    sampled_working_set_peak_bytes: Math.max(...samples.map(sample => sample.working_set_bytes)),
    sampled_device_gpu_used_peak_mib: Math.max(...gpuMiB),
    failure_count: report.failures.length, human_review: 'not_performed' });
}
assert.deepEqual(variants[0].source_windows, variants[1].source_windows);
assert.equal(variants[0].cli_sha256, variants[1].cli_sha256);
assert.equal(variants[0].runtime_sha256, variants[1].runtime_sha256);
assert.equal(variants[0].side_line_hits_in_chats, 0);
assert.equal(variants[1].side_line_hits_in_chats, 0);
const summary = { schema_version: 1, experiment: 'mingfay-natural-matched-2026-09-29-v1',
  candidate_source_sha256: expectedSource, source_rights: 'unknown',
  release_denominator: 0, human_review: 'not_performed',
  same_source_windows: variants[0].source_windows, variants };
const destination = path.join(root, '.cache/eval/youtube-mingfay/natural-model-screen-summary.json');
await fs.writeFile(destination, `${JSON.stringify(summary, null, 2)}\n`);
console.log(`Matched natural-source screen verified: 16/16 cues per model, 16 chats and 32 preflights each; redacted summary sha256=${sha256(await fs.readFile(destination))}`);
