import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { createReadStream } from 'node:fs';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const assetRoot = process.env.AURALIS_EVAL_ASSET_ROOT ?? root;
const capture = process.argv.length === 3 && process.argv[2] === '--capture';
assert(process.argv.length === 2 || capture);
const privateRoot = path.join(root, '.cache/eval/reg066-authored-v8-screen-v1/attempt-LDeHdv');
const publicPath = path.join(root, 'eval/reports/2026-10-09-reg066-authored-v8-screen.json');
const digest = bytes => createHash('sha256').update(bytes).digest('hex');
const hashFile = async file => {
  const hash = createHash('sha256');
  for await (const chunk of createReadStream(file)) hash.update(chunk);
  return hash.digest('hex');
};
const [rawBytes, journalBytes, freezeBytes, packBytes, harnessBytes] = await Promise.all([
  fs.readFile(path.join(privateRoot, 'report.json')),
  fs.readFile(path.join(privateRoot, 'requests.jsonl')),
  fs.readFile(path.join(root,
    'eval/experiments/2026-10-09-reg066-authored-v8-screen-freeze.json')),
  fs.readFile(path.join(root,
    'eval/regressions/reg-066-vivo-v8-cross-model-facts-v1.json')),
  fs.readFile(path.join(root, 'eval/scripts/probe-reg066-authored-v8-screen.mjs')),
]);
const privateSha = '13ad5dba7d6f7811c5989ba0d66e32747af55603d61f0b2300d7f72f04476f9a';
const journalSha = '7ba723de6d16b771e7e3046e96df209025eace21c8a2c4d6a8316bf395d889ba';
assert.equal(digest(rawBytes), privateSha);
assert.equal(digest(journalBytes), journalSha);
const raw = JSON.parse(rawBytes);
const freeze = JSON.parse(freezeBytes);
const pack = JSON.parse(packBytes);
const journal = journalBytes.toString('utf8').trimEnd().split('\n').map(JSON.parse);
assert.equal(raw.experiment, freeze.experiment);
assert.equal(raw.status, 'complete_structural_observations_unreviewed');
assert.equal(raw.git_head, '8fda73b5b5ea57c21e5258100de6ac11d47d4852');
assert.equal(raw.git_status, '');
assert.equal(raw.harness_sha256, digest(harnessBytes));
assert.equal(raw.freeze_sha256, digest(freezeBytes));
assert.equal(raw.pinned.pack, digest(packBytes));
assert.equal(raw.pinned.catalog, await hashFile(path.join(root,
  'eval/regressions/catalog-v46.json')));
assert.equal(raw.pinned.runtime, await hashFile(path.join(assetRoot,
  '.cache/runtime/llama/llama-server.exe')));
assert.equal(raw.limits.retries, 0);
assert.equal(raw.limits.seed, 101);
assert(raw.wall_elapsed_ms <= raw.limits.max_wall_ms);
assert.equal(raw.requests.length, 20);
assert.equal(journal.length, 20);
assert.equal(freeze.requests.length, 20);
assert.deepEqual(raw.failures, []);
for (const model of freeze.models) {
  const filename = model.id === '1_8b' ? 'Hy-MT2-1.8B-Q4_K_M.gguf'
    : 'Hy-MT2-7B-Q4_K_M.gguf';
  assert.equal(await hashFile(path.join(assetRoot, '.cache/models', filename)),
    model.sha256);
}
const controls = [...pack.related_controls, ...pack.negative_controls];
const byId = new Map(controls.map(control => [control.id, control]));
let totalTokens = 0;
const observations = [];
for (const [index, entry] of journal.entries()) {
  const planned = freeze.requests[index];
  const summary = raw.requests[index];
  const control = byId.get(entry.case_id);
  assert(control);
  assert.equal(entry.model, planned.model);
  assert.equal(entry.case_id, planned.case_id);
  assert.equal(entry.kind, planned.kind);
  assert.equal(entry.request_sha256, planned.request_sha256);
  assert.equal(entry.prompt_sha256, planned.prompt_sha256);
  assert.equal(digest(Buffer.from(JSON.stringify(entry.request))), planned.request_sha256);
  assert.equal(summary.request_sha256, planned.request_sha256);
  assert.equal(summary.status, entry.status);
  assert.equal(entry.status, 'valid_unreviewed');
  assert.equal(entry.preflight.length, 2);
  assert.deepEqual(entry.preflight.map(row => row.endpoint),
    ['apply-template', 'tokenize']);
  const prompt = entry.request.messages[0].content;
  const pieces = prompt.split('Input JSON:\n');
  assert.equal(pieces.length, 2);
  assert(!/\p{Script=Cyrillic}/u.test(pieces[1]));
  assert(!prompt.includes(control.expected));
  assert.equal(digest(Buffer.from(prompt)), planned.prompt_sha256);
  const envelope = JSON.parse(pieces[1]);
  assert.equal(envelope.schema_version, 7);
  assert.equal(envelope.target_slots.length, 4);
  assert.deepEqual(envelope.source_context, []);
  assert(envelope.target_slots.every(slot => slot.source_original ===
    slot.source_for_translation && slot.approved_terms.length === 0 &&
    slot.protected_facts.length === 0));
  const focusSlots = envelope.target_slots.filter(slot =>
    planned.focus_segment_ids.includes(slot.segment_id));
  assert.deepEqual(focusSlots.map(slot => slot.source_original),
    control.source_lines ?? [control.source]);
  const template = entry.preflight[0];
  const tokenize = entry.preflight[1];
  assert.equal(template.http_status, 200);
  assert.equal(tokenize.http_status, 200);
  assert.equal(tokenize.request.content, JSON.parse(template.raw_response).prompt);
  const tokens = JSON.parse(tokenize.raw_response).tokens;
  assert.equal(tokens.length, entry.prompt_tokens_preflight);
  assert.equal(tokens.length, entry.usage.prompt_tokens);
  assert(tokens.length <= raw.limits.context_tokens -
    raw.limits.response_tokens - raw.limits.safety_tokens);
  assert.equal(entry.chat.http_status, 200);
  assert.equal(entry.chat.request_sha256, planned.request_sha256);
  const response = JSON.parse(entry.chat.raw_response);
  assert.equal(response.choices[0].finish_reason, 'stop');
  assert.deepEqual(JSON.parse(response.choices[0].message.content).translations,
    entry.translations);
  assert.deepEqual(entry.translations.map(row => row.segment_id),
    envelope.target_slots.map(slot => slot.segment_id));
  assert(entry.translations.every(row => row.line_index === 0 &&
    typeof row.text === 'string' && row.text.trim() &&
    !/[\p{Cc}\p{Cf}]/u.test(row.text)));
  totalTokens += entry.usage.prompt_tokens + entry.usage.completion_tokens;
  observations.push({ model: entry.model, case_id: entry.case_id,
    kind: entry.kind, focus_segment_ids: planned.focus_segment_ids,
    accepted_focus: entry.translations.filter(row =>
      planned.focus_segment_ids.includes(row.segment_id)).map(row => row.text),
    structural_outcome: entry.status,
    prompt_sha256: entry.prompt_sha256,
    request_sha256: entry.request_sha256,
    raw_response_sha256: digest(Buffer.from(entry.chat.raw_response)),
    prompt_tokens: entry.usage.prompt_tokens,
    completion_tokens: entry.usage.completion_tokens,
    chat_elapsed_ms: entry.chat.elapsed_ms });
}
assert.equal(totalTokens, raw.total_tokens);
assert(totalTokens <= raw.limits.max_total_tokens);
for (const id of controls.map(row => row.id)) {
  const rows = observations.filter(row => row.case_id === id);
  assert.deepEqual(rows.map(row => row.model), ['1_8b', '7b']);
  assert.equal(rows[0].prompt_sha256, rows[1].prompt_sha256);
}
const resourceObservation = Object.fromEntries(Object.entries(raw.resources)
  .map(([id, samples]) => {
    const workingSets = samples.samples.flatMap(sample => sample.processes
      .filter(item => sample.tracked_pids.includes(item.Id))
      .map(item => item.WorkingSet64));
    const gpu = samples.samples.map(sample => Number(sample.gpu_device.split(',')[1]));
    assert(workingSets.length > 0 && gpu.length > 0);
    return [id, { samples: samples.samples.length,
      max_tracked_working_set_bytes: Math.max(...workingSets),
      max_whole_device_gpu_mib: Math.max(...gpu),
      limitation: samples.limitations }];
  }));
const publicReport = { schema_version: 1, experiment: raw.experiment,
  task_ids: ['EVAL-04', 'CTX-03'],
  split: 'known_authored_development_not_holdout',
  frozen_requests_sha256: digest(freezeBytes),
  control_pack_sha256: digest(packBytes),
  private_report_sha256: privateSha,
  private_journal_sha256: journalSha,
  code_commit: raw.git_head, runtime_sha256: raw.pinned.runtime,
  model_identities: freeze.models,
  status: raw.status, chat_requests: raw.requests.length,
  template_token_preflights: raw.requests.length * 2,
  prompt_tokens: observations.reduce((sum, row) => sum + row.prompt_tokens, 0),
  completion_tokens: observations.reduce((sum, row) => sum + row.completion_tokens, 0),
  wall_elapsed_ms: raw.wall_elapsed_ms,
  human_bilingual_reviews: 0, accepted_language_quality: false,
  resource_observation: resourceObservation, observations,
  release_gate: 'open' };
const output = `${JSON.stringify(publicReport, null, 2)}\n`;
if (capture) await fs.writeFile(publicPath, output);
else assert.equal(await fs.readFile(publicPath, 'utf8'), output);
const review = JSON.parse(await fs.readFile(path.join(root,
  'eval/reports/2026-10-09-reg066-authored-v8-screen-ai-review.json'), 'utf8'));
assert.equal(review.machine_report_sha256, digest(Buffer.from(output)));
assert.equal(review.control_pack_sha256, digest(packBytes));
assert.equal(review.reviewer_type, 'ai_assistant_source_aware_not_independent_human');
assert.equal(review.cases.length, controls.length);
assert.deepEqual(review.cases.map(row => row.id), controls.map(row => row.id));
for (const model of ['1_8b', '7b']) {
  const facts = review.cases.map(row => row[model].fact);
  assert.equal(facts.filter(value => value === 'fact_preserved').length,
    review.summary[model].fact_preserved);
  assert.equal(facts.filter(value => value === 'needs_review').length,
    review.summary[model].needs_review);
  assert.equal(facts.filter(value => value === 'major_fact_error').length,
    review.summary[model].major_fact_error);
  assert.equal(review.cases.filter(row => row[model].russian_form === 'awkward').length,
    review.summary[model].awkward_russian);
  assert(review.cases.every(row => row[model].note &&
    observations.some(observation => observation.model === model &&
      observation.case_id === row.id)));
}
assert.equal(review.summary.human_bilingual_reviews, 0);
assert.equal(review.summary.natural_file_errors_resolved, false);
assert.equal(review.summary.model_promoted, false);
console.log(`REG-066 authored v8 screen checked: ${observations.length} raw chats, 40 preflights; no human score.`);
