import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const mode = process.argv[2];
assert(['--capture', '--check'].includes(mode) && process.argv.length === 3);
const privateRoot = path.join(root,
  '.cache/eval/vivo-focus-slot-v1/attempt-Q1EDOt');
const publicPath = path.join(root,
  'eval/reports/2026-10-10-vivo-focus-slot-v1.json');
const digest = bytes => createHash('sha256').update(bytes).digest('hex');
const pinned = {
  freeze: 'f9783e5df2e62d260995d771427747846422cab7fc3a3f99ab7a8dccd59349d6',
  raw_report: '9f6fb7b80962cd664888e0463ca2177e9cf9f32af528ebc536c1d48e55f32436',
  raw_journal: 'bc6508be55d9e9862a54a60102b36de4db427c3281eb5ff9fb2ba12ee32f4de7',
};
const [freezeBytes, reportBytes, journalBytes, helperBytes, harnessBytes,
  reviewBytes] = await Promise.all([
  fs.readFile(path.join(root,
    'eval/experiments/2026-10-10-vivo-focus-slot-v1-freeze.json')),
  fs.readFile(path.join(privateRoot, 'report.json')),
  fs.readFile(path.join(privateRoot, 'requests.jsonl')),
  fs.readFile(path.join(root, 'eval/scripts/focus-slot-v1.mjs')),
  fs.readFile(path.join(root, 'eval/scripts/probe-vivo-focus-slot-v1.mjs')),
  fs.readFile(path.join(root,
    'eval/reports/2026-10-10-vivo-focus-slot-v1-ai-review.json')),
]);
assert.equal(digest(freezeBytes), pinned.freeze);
assert.equal(digest(reportBytes), pinned.raw_report);
assert.equal(digest(journalBytes), pinned.raw_journal);
const freeze = JSON.parse(freezeBytes);
const raw = JSON.parse(reportBytes);
const journal = journalBytes.toString('utf8').trimEnd()
  .split('\n').map(JSON.parse);
const review = JSON.parse(reviewBytes);
assert.equal(raw.status, 'complete_structural_observations_unreviewed');
assert.equal(raw.experiment, freeze.experiment);
assert.equal(raw.freeze_sha256, pinned.freeze);
assert.equal(raw.harness_sha256, digest(harnessBytes));
assert.equal(raw.helper_sha256, digest(helperBytes));
assert.equal(freeze.pinned.harness, raw.harness_sha256);
assert.equal(freeze.pinned.helper, raw.helper_sha256);
assert.equal(freeze.limits.chats, 20);
assert.equal(freeze.limits.preflights, 40);
assert.equal(freeze.limits.retries, 0);
assert.equal(journal.length, freeze.limits.chats);
assert.equal(raw.requests.length, journal.length);
assert.equal(freeze.requests.length, journal.length);
assert.equal(review.case_reviews.length, freeze.limits.cases);
assert.equal(review.summary.known_relation_errors_repaired, 0);
assert.equal(review.summary.focus_candidate_shortlisted, false);
assert.equal(review.summary.human_bilingual_reviews, 0);

const rows = [];
let totalTokens = 0;
let preflights = 0;
for (let i = 0; i < journal.length; i += 1) {
  const entry = journal[i];
  const planned = freeze.requests[i];
  const observed = raw.requests[i];
  assert.equal(entry.status, 'valid_unreviewed');
  assert.equal(observed.status, entry.status);
  assert.equal(entry.case_id, planned.case_id);
  assert.equal(entry.arm, planned.arm);
  assert.equal(entry.focus_id, planned.focus_id);
  assert.deepEqual(entry.target_ids, planned.target_ids);
  assert.equal(digest(Buffer.from(JSON.stringify(entry.request))),
    planned.request_sha256);
  assert.equal(entry.request_sha256, planned.request_sha256);
  assert.equal(entry.prompt_sha256, planned.prompt_sha256);
  assert.equal(digest(Buffer.from(entry.request.messages[0].content)),
    planned.prompt_sha256);
  assert.equal(entry.chat.request_sha256, planned.request_sha256);
  assert.equal(entry.chat.http_status, 200);
  assert.equal(entry.finish_reason, 'stop');
  assert.equal(entry.preflight.length, 2);
  assert.deepEqual(entry.preflight.map(item => item.endpoint),
    ['apply-template', 'tokenize']);
  assert(entry.preflight.every(item => item.http_status === 200));
  assert(entry.prompt_tokens_preflight > 0);
  const parsed = JSON.parse(entry.chat.raw_response);
  assert.deepEqual(JSON.parse(parsed.choices[0].message.content).translations,
    entry.translations);
  assert.deepEqual(entry.translations.map(item => item.segment_id),
    planned.target_ids);
  assert.deepEqual(observed.translations, entry.translations);
  assert.equal(entry.usage.prompt_tokens, observed.usage.prompt_tokens);
  assert.equal(entry.usage.completion_tokens, observed.usage.completion_tokens);
  totalTokens += entry.usage.prompt_tokens + entry.usage.completion_tokens;
  preflights += entry.preflight.length;
  const focus = entry.translations.find(item =>
    item.segment_id === planned.focus_id && item.line_index === 0);
  assert(focus && focus.text.trim());
  rows.push({ case_id: entry.case_id, family: entry.family,
    focus_id: entry.focus_id, arm: entry.arm,
    target_count: entry.target_ids.length,
    request_sha256: entry.request_sha256,
    prompt_sha256: entry.prompt_sha256,
    raw_http_sha256: digest(Buffer.from(entry.chat.raw_response)),
    focus_text_sha256: digest(Buffer.from(focus.text)),
    prompt_tokens_preflight: entry.prompt_tokens_preflight,
    prompt_tokens: entry.usage.prompt_tokens,
    completion_tokens: entry.usage.completion_tokens,
    chat_elapsed_ms: entry.chat.elapsed_ms });
}
assert.equal(preflights, freeze.limits.preflights);
assert.equal(totalTokens, raw.total_tokens);
assert(totalTokens <= freeze.limits.max_total_tokens);
assert(raw.wall_elapsed_ms <= freeze.limits.max_wall_ms);
for (const [caseId, focusId] of review.case_reviews.map(row =>
  [row.case_id, row.focus_id])) {
  assert.equal(rows.filter(row => row.case_id === caseId &&
    row.focus_id === focusId).length, 2);
}
const samples = raw.resources.model_7b.samples;
assert(samples.length > 0);
const workingSet = samples.flatMap(sample => sample.processes ?? [])
  .map(process => process.WorkingSet64 ?? 0);
const gpuUsed = samples.map(sample => {
  const match = /,\s*(\d+),/u.exec(sample.gpu_device ?? '');
  return match ? Number(match[1]) : 0;
});
const arms = Object.fromEntries(['batch', 'focus'].map(arm => {
  const subset = rows.filter(row => row.arm === arm);
  assert.equal(subset.length, freeze.limits.cases);
  return [arm, { chats: subset.length,
    prompt_tokens: subset.reduce((sum, row) => sum + row.prompt_tokens, 0),
    completion_tokens: subset.reduce((sum, row) =>
      sum + row.completion_tokens, 0),
    summed_chat_elapsed_ms: subset.reduce((sum, row) =>
      sum + row.chat_elapsed_ms, 0) }];
}));
const report = {
  schema_version: 1, experiment: freeze.experiment,
  split: freeze.split, source_sha256: freeze.pinned.source,
  model_sha256: freeze.pinned.model,
  manifest_sha256: freeze.pinned.manifest,
  runtime_sha256: freeze.pinned.runtime,
  freeze_sha256: pinned.freeze,
  harness_sha256: raw.harness_sha256,
  helper_sha256: raw.helper_sha256,
  private_report_sha256: pinned.raw_report,
  private_journal_sha256: pinned.raw_journal,
  ai_review_sha256: digest(reviewBytes),
  chats: rows.length, preflights, total_tokens: totalTokens,
  wall_elapsed_ms: raw.wall_elapsed_ms,
  resource_samples: samples.length,
  peak_tracked_working_set_bytes: Math.max(...workingSet),
  peak_device_gpu_mib: Math.max(...gpuUsed),
  resource_sample_errors: samples.flatMap(sample => sample.errors ?? []).length,
  arms, responses: rows,
  ai_triage: review.summary,
  decision: 'focus_candidate_rejected_v8_unchanged',
};
if (mode === '--capture')
  await fs.writeFile(publicPath, `${JSON.stringify(report, null, 2)}\n`);
else assert.deepEqual(JSON.parse(await fs.readFile(publicPath, 'utf8')),
  report);
console.log(JSON.stringify({ chats: rows.length, preflights, totalTokens,
  relationRepairs: review.summary.known_relation_errors_repaired,
  shortlisted: review.summary.focus_candidate_shortlisted,
  publicPath }));
