import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { gunzipSync } from 'node:zlib';
import { digest } from './flores-file-fixture.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const directory = path.join(root, 'eval/reports');
const stem = '2026-09-29-long-v6-code-model-screen';
const summaryBytes = await fs.readFile(path.join(directory, `${stem}-summary.json`));
assert.equal(digest(summaryBytes), '9c4ffca85c62abd3105dc81b73f8aedd397f18d504598016084fa2cb057718d8');
const summary = JSON.parse(summaryBytes);
const reportBytes = await fs.readFile(path.join(directory, summary.report_file));
const requestsGzip = await fs.readFile(path.join(directory, summary.requests_file));
assert.equal(digest(reportBytes), summary.report_sha256);
assert.equal(digest(requestsGzip), summary.requests_gzip_sha256);
const requestBytes = gunzipSync(requestsGzip);
assert.equal(digest(requestBytes), summary.requests_uncompressed_sha256);
const report = JSON.parse(reportBytes);
const entries = requestBytes.toString('utf8').trim().split('\n').map(JSON.parse);
assert.equal(summary.outcome, 'development_model_fact_screen_unreviewed');
assert.equal(summary.model_selection, 'unselected');
assert.equal(summary.release_gate, 'open');
assert.equal(summary.human_review, 'missing');
assert.equal(summary.quality_verdict, 'unreviewed');
assert.equal(summary.sealed_holdout, false);
assert.equal(report.status, 'complete_observations_unreviewed');
assert.equal(report.identity.git_head, '650ef982fbeca8de75bb3fcbcf7274c1c18db970');
assert.equal(report.identity.git_status, 'M docs/architecture/014-result-history-selection.md');
assert.equal(report.identity.harness_sha256,
  digest(await fs.readFile(path.join(root, 'eval/scripts/probe-long-v6-code-model-screen.mjs'))));
assert.equal(report.identity.archive_sha256,
  '4037c071a17ef38ed7b9bc4989601ef8da0784fb39881b9138abb9d008701a8c');
assert.deepEqual(report.budget.models, ['1b', '7b']);
assert.deepEqual(report.budget.seeds, [101, 202, 303]);
assert.equal(report.budget.cue_ids.length, 27);
assert.equal(report.budget.chat_requests, 162);
assert.equal(report.budget.no_retries, true);
assert.equal(report.requests.length, 162);
assert.equal(entries.length, 162);
assert.equal(report.failures.length, 0);
assert(report.wall_elapsed_ms < report.budget.total_wall_ms);
const sourceNumbers = source => source.replace(/AUR-\d{4}/gu, '')
  .match(/\d{1,2}:\d{2}|\d+/gu)?.map(value =>
    /^\d{1,2}:\d{2}$/u.test(value) ? `${Number(value.split(':')[0])}:${value.split(':')[1]}` : value).sort() ?? [];
for (const [index, entry] of entries.entries()) {
  const planned = report.planned_requests[index];
  const observed = report.requests[index];
  assert.equal(entry.model, planned.model);
  assert.equal(entry.cue_id, planned.cue_id);
  assert.equal(entry.seed, planned.seed);
  assert.equal(entry.request_sha256, digest(Buffer.from(JSON.stringify(entry.request))));
  assert.equal(entry.request_sha256, planned.request_sha256);
  assert.equal(entry.prompt_sha256, planned.prompt_sha256);
  assert.equal(entry.original_request_sha256, planned.original_request_sha256);
  assert.equal(entry.request_sha256, observed.request_sha256);
  assert.equal(entry.structural_outcome, observed.structural_outcome);
  assert.equal(entry.accepted_candidate ?? null, observed.accepted_candidate);
  assert.equal(entry.identifier_preserved ?? null, observed.identifier_preserved);
  assert.equal(entry.numeric_facts_preserved ?? null, observed.numeric_facts_preserved);
  assert.doesNotMatch(entry.request.messages[0].content, /\p{Script=Cyrillic}/u);
  const prompt = entry.request.messages[0].content;
  const input = JSON.parse(prompt.split('Input JSON:\n')[1]);
  assert.equal(input.target_slots.length, 1);
  assert.equal(input.target_slots[0].segment_id, entry.cue_id);
  assert.equal(input.target_slots[0].line_index, 0);
  assert.equal(input.target_slots[0].source_original, entry.source_zh);
  assert.deepEqual(entry.expected_identifiers,
    [`AUR-${String(entry.cue_id).padStart(4, '0')}`]);
  assert.deepEqual(entry.expected_numeric_facts, sourceNumbers(entry.source_zh));
  if (entry.structural_outcome === 'valid_unreviewed') {
    assert.equal(entry.http_status, 200);
    assert.equal(entry.finish_reason, 'stop');
    const raw = JSON.parse(entry.raw_response);
    const candidate = JSON.parse(raw.choices[0].message.content).translations[0];
    assert.equal(candidate.segment_id, entry.cue_id);
    assert.equal(candidate.line_index, 0);
    assert.equal(candidate.text, entry.accepted_candidate);
  }
}
let codeBetter = 0;
let codeWorse = 0;
let codeSame = 0;
for (const cue of report.budget.cue_ids) for (const seed of report.budget.seeds) {
  const pair = entries.filter(row => row.cue_id === cue && row.seed === seed);
  assert.equal(pair.length, 2);
  const small = pair.find(row => row.model === '1b');
  const large = pair.find(row => row.model === '7b');
  assert(small && large);
  const matched = structuredClone(large.request);
  matched.model = small.request.model;
  assert.deepEqual(matched, small.request);
  assert.equal(small.source_zh, large.source_zh);
  assert.deepEqual(small.expected_identifiers, large.expected_identifiers);
  assert.deepEqual(small.expected_numeric_facts, large.expected_numeric_facts);
  if (small.identifier_preserved === large.identifier_preserved) codeSame++;
  else if (large.identifier_preserved) codeBetter++;
  else codeWorse++;
}
assert.equal(codeBetter + codeWorse + codeSame, 81);
assert.deepEqual([codeBetter, codeWorse, codeSame],
  [summary.paired.code_better_7b, summary.paired.code_worse_7b,
    summary.paired.code_same]);
for (const key of ['1b', '7b']) {
  const rows = report.requests.filter(row => row.model === key);
  const measured = summary.model_summaries[key];
  assert.equal(rows.length, 81);
  assert.equal(measured.requests, 81);
  assert.equal(measured.structurally_valid,
    rows.filter(row => row.structural_outcome === 'valid_unreviewed').length);
  assert.equal(measured.exact_identifier,
    rows.filter(row => row.identifier_preserved).length);
  assert.equal(measured.exact_numeric_facts,
    rows.filter(row => row.numeric_facts_preserved).length);
  assert.equal(measured.prompt_tokens,
    rows.reduce((sum, row) => sum + (row.usage?.prompt_tokens ?? 0), 0));
  assert.equal(measured.completion_tokens,
    rows.reduce((sum, row) => sum + (row.usage?.completion_tokens ?? 0), 0));
  assert.equal(measured.request_elapsed_sum_ms,
    rows.reduce((sum, row) => sum + row.elapsed_ms, 0));
  const resource = summary.resources[key];
  const bytes = await fs.readFile(path.join(directory, resource.file));
  assert.equal(digest(bytes), resource.gzip_sha256);
  const uncompressed = gunzipSync(bytes);
  assert.equal(digest(uncompressed), resource.uncompressed_sha256);
  const samples = uncompressed.toString('utf8').trim().split('\n').map(JSON.parse);
  assert.deepEqual(samples, report.resources[key].samples);
  assert.equal(samples.length, measured.resources.sample_count);
}
console.log(`Long v6 model screen verified: 162 matched raw attempts, 7B code gains ${codeBetter}, regressions ${codeWorse}, model unselected.`);
